/**
 * DropboxService: Handles Dropbox API interactions with retry and async job support.
 */
class DropboxService {
    constructor(dbx) {
        this.dbx = dbx;
    }

    async retryWithBackoff(fn, maxRetries = 4, baseDelay = 100) {
        let attempt = 0;
        while (true) {
            try {
                return await fn();
            } catch (e) {
                if (e.status !== 429 || attempt >= maxRetries) throw e;
                await sleep(Math.pow(2, attempt) * baseDelay);
                attempt++;
            }
        }
    }

    async pollAsyncJob(checkFn, jobIdObj, interval = 300) {
        let response;
        do {
            await sleep(interval);
            response = await checkFn(jobIdObj);
        } while (response.result['.tag'] === 'in_progress');
        if (response.result['.tag'] === 'failed') {
            throw new Error(response.result['.tag']);
        }
        return response;
    }

    async call(fn, asyncCheckFn) {
        const response = await this.retryWithBackoff(fn);
        if (response.result?.['.tag'] === 'async_job_id' && asyncCheckFn) {
            return await this.pollAsyncJob(asyncCheckFn, response.result, 300);
        }
        if (response.result?.['.tag'] === 'failed') {
            throw new Error(response.result['.tag']);
        }
        return response;
    }
}

/**
 * FolderPathBuilder: Responsible for constructing folder paths and ensuring required fields.
 */
class FolderPathBuilder {
    constructor(tableNum) {
        this.tableNum = tableNum;
    }

    async appendFields(record, fields) {
        fields = [].concat(fields);

        // Construct FolderPath if missing
        if (fields.includes(FLD[this.tableNum].FolderPath) && !(FLD[this.tableNum].FolderPath in record)) {
            let folderRoot = this.tableNum === TBL.Companies ? '/' : record?.[FLD[this.tableNum].FolderRoot];
            if (!folderRoot && FLD.Projects.Archived in record) {
                folderRoot = FLD.Projects.Archived === 'yes' || FLD.Projects.Archived ? '/Miscellaneous/Archives/' : '/';
            }
            const folderName = record?.[FLD[this.tableNum].Name];
            const folderNumber = record?.[FLD[this.tableNum].Number];
            if (folderRoot && folderName && folderNumber) {
                record[FLD[this.tableNum].FolderPath] = `${folderRoot}${folderName} - ${folderNumber}`;
            }
        }

        // Construct Shared field if missing (for Projects)
        if (this.tableNum === TBL.Projects) {
            const fldStatus = FLD[this.tableNum].Status;
            const fldArchived = FLD[this.tableNum].Archived;
            const fldExists = FLD[this.tableNum].Status;
            const fldShared = FLD[this.tableNum].Shared;
            if (fields.includes(fldShared) && !(fldShared in record)) {
                if (fldStatus in record && fldArchived in record && fldExists in record) {
                    record[fldShared] =
                        record[fldStatus] === 'Installing' &&
                        record[fldArchived] === true &&
                        record[fldExists] === 1;
                }
            }
        }

        // Fetch from DB if any requested fields are still missing
        const lookup = fields.some(field => !(field in record));
        if (lookup) {
            record = await db(this.tableNum)
                .key(record.id)
                .get()
                .then(r => r.data[0]);
        }
        return record;
    }
}

/**
 * ProjectFolderManager: High-level operations for project folders.
 */
class ProjectFolderManager {
    constructor(view) {
        this.tableNum = view.source.object;
        this.tableName = TBL[this.tableNum].attributes.inflections.singular;
        this.dbxDB = new DropboxService(new Dropbox.Dropbox({ accessToken: 'Jj0IQHXz0okAAAAAAAAAAek7sDqDrcs_8BC4Cn3-cEZWIXyorxqYTCz8SWx6W6kw' }));
        this.dbxSH = new DropboxService(new Dropbox.Dropbox({ accessToken: 'VRSTu6aWlyQAAAAAAAAAAX6SKQ19GXwbXtKifriVgrYpXMy57eVSouhsLu11HSAD' }));
        this.pathBuilder = new FolderPathBuilder(this.tableNum);
    }

    async handleError(operation, error) {
        Knack.hideSpinner();
        await MsgBox(`There was an error ${operation} the ${this.tableName} folder!`, error.message || String(error));
        return error;
    }

    async createFolder(record) {
        try {
            Knack.showSpinner();
            record = await this.pathBuilder.appendFields(record, FLD[this.tableNum].FolderPath);

            const fldPath = record[FLD[ this.tableNum ].FolderPath];
            const subNames = {
                [TBL.Companies]: ['Bills', 'Payments', 'Receipts'],
                [TBL.Projects]: [
                    'Billing', 'Contracts', 'Estimating', 'Installation', 'Installation/Photos',
                    'Payroll', 'Plans', 'Plans/Full Set', 'Submittals', 'Submittals/Drawings'
                ]
            };
            const subPaths = subNames[this.tableNum].map(subPath => `${fldPath}/${subPath}`);
            const fldPaths = [fldPath, ...subPaths];

            let response = await this.dbxDB.call(
                this.dbxDB.dbx.filesCreateFolderBatch.bind(this.dbxDB.dbx, {
                    paths: fldPaths,
                    autorename: false
                }),
                this.dbxDB.dbx.filesCreateFolderBatchCheck.bind(this.dbxDB.dbx)
            );

            Knack.hideSpinner();
            return response;
        } catch (err) {
            await this.handleError('creating', err);
        }
    }

    async createShared(record) {
        try {
            Knack.showSpinner();
            record = await this.pathBuilder.appendFields(record, [FLD[this.tableNum].FolderPath, FLD[this.tableNum].Shared, FLD.Projects.Status]);
            if (record[FLD.Projects.Status] !== 'Installing') return 'Status Not Set to Installing';

            const fldPath = record[FLD.Projects.FolderPath];
            await this.dbxSH.call(
                this.dbxSH.dbx.filesCreateFolder.bind(this.dbxSH.dbx, {
                    path: fldPath,
                    autorename: false
                })
            ).catch(e => {
                if (!e?.error?.error?.path?.conflict) throw e;
            });

            const insShare = await this.shareFolder(`${fldPath}/Installation`, 'editor');
            const plnShare = await this.shareFolder(`${fldPath}/Plans`, 'viewer');
            const subShare = await this.shareFolder(`${fldPath}/Submittals`, 'viewer');
            const response = { insShare, plnShare, subShare };

            Knack.hideSpinner();
            return response;
        } catch (err) {
            await this.handleError('sharing', err);
        }
    }

    async deleteShared(record) {
        try {
            Knack.showSpinner();
            record = await this.pathBuilder.appendFields(record, [
                FLD[this.tableNum].FolderPath,
                FLD[this.tableNum].Shared,
                FLD.Projects.Status
            ]);
            const folderPath = record[FLD.Projects.FolderPath];
            const insUnshare = await this.unshareFolder(`${folderPath}/Installation`);
            const plnUnshare = await this.unshareFolder(`${folderPath}/Plans`);
            const subUnshare = await this.unshareFolder(`${folderPath}/Submittals`);

            const fldDeletion = await this.dbxSH.call(
                this.dbxSH.dbx.filesDelete.bind(this.dbxSH.dbx, {
                    path: folderPath
                })
            ).catch(e => {
                if (!e?.error?.error?.path?.conflict) throw e;
            });
            const response = [insUnshare, plnUnshare, subUnshare, fldDeletion];

            Knack.hideSpinner();
            return response;
        } catch (err) {
            await this.handleError('unsharing', err);
        }
    }

    async deleteFolder(record) {
        try {
            Knack.showSpinner();
            record = await this.pathBuilder.appendFields(record, [FLD[this.tableNum].FolderPath]);
            const response = await this.dbxDB.call(
                this.dbxDB.dbx.filesDelete.bind(this.dbxDB.dbx, {
                    path: record[FLD[ this.tableNum ].FolderPath]
                })
            );
            Knack.hideSpinner();
            return response;
        } catch (err) {
            await this.handleError('deleting', err);
        }
    }

    async shareFolder(folderPath, access = 'editor', account = 'installation@sslr.net') {
        let share;
        try {
            share = await this.dbxDB.call(
                this.dbxDB.dbx.sharingShareFolder.bind(this.dbxDB.dbx, {
                    path: folderPath,
                    force_async: false,
                    access_inheritance: { ['.tag']: 'inherit' }
                })
            );
        } catch (e) {
            const badPath = e?.error?.error?.bad_path || {};
            if (badPath['.tag'] !== 'already_shared') throw e;
            share = { result: badPath };
        }
        const sharedID = share.result.shared_folder_id;

        await this.dbxDB.call(
            this.dbxDB.dbx.sharingAddFolderMember.bind(this.dbxDB.dbx, {
                shared_folder_id: sharedID,
                quiet: true,
                members: [{
                    member: { email: account, ['.tag']: 'email' },
                    access_level: { ['.tag']: access }
                }]
            })
        );

        // Mount the folder in the installer's Dropbox
        let mount;
        try {
            mount = await this.dbxSH.call(
                this.dbxSH.dbx.sharingMountFolder.bind(this.dbxSH.dbx, {
                    shared_folder_id: sharedID
                })
            );
        } catch (e) {
            if (e?.error?.error?.['.tag'] === 'already_mounted') {
                mount = await this.dbxSH.call(
                    this.dbxSH.dbx.sharingGetFolderMetadata.bind(this.dbxSH.dbx, {
                        shared_folder_id: sharedID
                    })
                );
            } else {
                throw e;
            }
        }
        const mountPath = mount.result.path_lower;
        if (mountPath === folderPath.toLowerCase()) return mountPath;

        // Move the shared folder to the project folder
        const rename = await this.dbxSH.call(
            this.dbxSH.dbx.filesMove.bind(this.dbxSH.dbx, {
                from_path: mountPath,
                to_path: folderPath,
                autorename: true
            })
        );
        return rename.result.path_lower;
    }

    async unshareFolder(folderPath, sharedID) {
        let metaData;
        if (!sharedID) {
            metaData = await this.dbxDB.call(
                this.dbxDB.dbx.filesGetMetaData.bind(this.dbxDB.dbx, {
                    path: folderPath,
                    include_media_info: false,
                    include_deleted: true,
                    include_has_explicit_shared_members: false
                })
            );
            sharedID = metaData.result.sharing_info.shared_folder_id;
        }
        const unshare = await this.dbxDB.call(
            this.dbxDB.dbx.sharingUnshareFolder.bind(this.dbxDB.dbx, {
                shared_folder_id: sharedID,
                leave_a_copy: false
            })
        );
        return { metaData, unshare };
    }

    async updateFolder(newRecord, oldRecord) {
        try {
            Knack.showSpinner();
            newRecord = await this.pathBuilder.appendFields(newRecord, FLD[this.tableNum].FolderPath);
            const oldPath = oldRecord[FLD.Projects.FolderPath];
            const newPath = newRecord[FLD.Projects.FolderPath];
            let response;

            if (newPath !== oldPath) {
                try {
                    response = await this.dbxDB.call(
                        this.dbxDB.dbx.filesMove.bind(this.dbxDB.dbx, {
                            from_path: oldPath,
                            to_path: newPath,
                            autorename: true
                        })
                    );
                } catch (e) {
                    const tag = e?.error?.error?.['.tag'];
                    if (tag === 'duplicated_or_nested_paths') {
                        // New folder already exists
                    } else if (tag === 'from_lookup') {
                        response = await this.createFolder(newRecord);
                    } else {
                        throw e;
                    }
                }
            } else {
                response = 'The folder path was not changed.';
            }
            Knack.hideSpinner();
            return response;
        } catch (err) {
            await this.handleError('updating', err);
        }
    }

    async updateShared(newRecord, oldRecord) {
        try {
            Knack.showSpinner();
            newRecord = await this.pathBuilder.appendFields(newRecord, [
                FLD[this.tableNum].FolderPath,
                FLD[this.tableNum].Shared
            ]);
            oldRecord = await this.pathBuilder.appendFields(oldRecord, [
                FLD[this.tableNum].FolderPath,
                FLD[this.tableNum].Shared
            ]);
            const oldPath = oldRecord[FLD.Projects.FolderPath];
            const newPath = newRecord[FLD.Projects.FolderPath];
            const newShared = (newRecord[FLD.Projects.Shared] === 'Yes');
            const oldShared = (oldRecord[FLD.Projects.Shared] === 'Yes');
            let response;

            if (oldShared && !newShared) {
                response = await this.deleteShared(newRecord);
            } else if (newShared && !oldShared) {
                response = await this.createShared(newRecord);
            } else if (oldPath !== newPath) {
                try {
                    response = await this.dbxSH.call(
                        this.dbxSH.dbx.filesMove.bind(this.dbxSH.dbx, {
                            from_path: oldPath,
                            to_path: newPath,
                            autorename: true
                        })
                    );
                } catch (e) {
                    const tag = e?.error?.error?.['.tag'];
                    if (tag === 'duplicated_or_nested_paths') {
                        // New folder already exists
                    } else if (tag === 'from_lookup') {
                        response = await this.createShared(newRecord);
                    } else {
                        throw e;
                    }
                }
            } else {
                response = 'No changes were made to the shared folder';
            }
            Knack.hideSpinner();
            return response;
        } catch (err) {
            await this.handleError('sharing', err);
        }
    }
}

// Factory function for backward compatibility with existing code
const pf = (view) => {
    const mgr = new ProjectFolderManager(view);
    return {
        appendFields: mgr.pathBuilder.appendFields.bind(mgr.pathBuilder),
        createFolder: mgr.createFolder.bind(mgr),
        createShared: mgr.createShared.bind(mgr),
        deleteFolder: mgr.deleteFolder.bind(mgr),
        deleteShared: mgr.deleteShared.bind(mgr),
        updateFolder: mgr.updateFolder.bind(mgr),
        updateShared: mgr.updateShared.bind(mgr),
        unshareFolder: mgr.unshareFolder.bind(mgr),
        shareFolder: mgr.shareFolder.bind(mgr),
    };
};

/**
 * Batch creates shared folders for all eligible projects.
 */
async function createAllShares(autoConfirm = false) {
    try {
        const failures = [];
        const successes = [];
        const records = await db(TBL.Projects)
            .filter(FLD.Projects.Status, "is", "Installing")
            .filter(FLD.Projects.Exists, "is", 1)
            .filter(FLD.Projects.Archived, "is", false)
            .get()
            .then(r => r.data);
        console.log("count = " + records.length);
        for (let record of records) {
            const confirmed = autoConfirm || confirm(`Create shared folder for ${record[FLD.Projects.Name]} - ${record[FLD.Projects.Number]}?`);
            if (!confirmed) continue;
            await pf({ source: { object: TBL.Projects } })
                .createShared(record)
                .then(() => successes.push(record.id))
                .catch(() => failures.push(record.id));
        }
        console.log('successes = ', successes);
        console.log('failures = ', failures);
    } catch (e) {
        console.error(e);
    }
}
