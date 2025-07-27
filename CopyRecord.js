///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  MODULE     : CopyRecord                                                                                              //
//  PARAMETERS :                                                                                                         //
//  RETURNS    :                                                                                                         //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const copyRecord = async (view, newRecord) => {

    // REMOVE ID FIELD AND FIX CONNECTION FIELDS
    const recordData = record => {
        if (`id` in record) delete record.id;
        for (field in record) {
            if (FLD[field].attributes.type == `connection`) {
                record[field] = [].concat(val).map(val => val.id);
            }
        }
        return record;
    }

    try {

        // INITIALIZE
        Knack.showSpinner();

        // UPDATE THE NEW RECORD WITH THE DATA FROM THE OLD RECORD
        const update = view.scene.views
            .find(vw => vw.name === `Record Details`)
            .map(oldView => {
                const oldTable = oldView.source.object;
                const oldRecord = recordData(dv(view).getData(`raw`)[0]);
                return db(oldTable).key(newRecord.id).update(oldRecord);
            });

        // ADD NEW RECORDS FOR THE RELATED ITEMS
        const creations = view.scene.views
            .filter(vw => vw.name === `Record Items`)
            .flatMap(itemsView => {
                const itemsTable = itemsView.source.object;
                const foreignFld = itemsView.source.connection_key;
                return dv(itemsView).getData(`raw`).map(itemsRecord => {
                    itemsRecord = recordData(itemsRecord);
                    itemsRecord[foreignFld] = [newRecord.id];
                    return db(itemsTable).create(itemsRecord);
                });
            });

        // HANDLE REJECTIONS
        const failures = await Promise.allSettled([...update, ...creations])
            .filter(r => r.status == `rejected`)
            .map(r => r.reason.toString())
            .join(`<br>`);
        if (failures.length) throw Error(failures);

        // CLEANUP & REFRESH
        document.getElementsByClassName(`close-modal`)[0]?.click();
        Knack.router.scene_view.model.views.models
            .map(model => Knack.views[model.id].model)
            .filter(model => `data` in model)
            .forEach(model => model.fetch());
        Knack.hideSpinner();

	} catch(err) {

		// HANDLE ANY ERRORS
        await MsgBox(`There was an error copying the record!`, `${err.name}: ${err.message}`);

    }

}
