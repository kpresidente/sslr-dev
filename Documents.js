///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   : getBase64                                                                                               //
//  PARAMETERS : blob =                                                                                                  //
//  RETURNS    : the file in base64 format                                                                               //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

globalThis.previewURL = null;

async function getBase64(blob) {

    // CONVERT BLOB TO BASE64
	return new Promise((resolve, reject) => {
		var fr = new window.FileReader();
		fr.readAsDataURL(blob);
		fr.onloadend = () => resolve(fr.result);
		fr.onerror = () => reject(error);
    });
    
}

async function getBlob(base64) {

    // CONVERT BASE64 TO BLOB
    if (!base64.startsWith(`data`)) base64 = `data:image/jpeg;base64,${base64}`;
    const blob = await fetch(base64).blob();
    return blob;

}



var doc = (view) => {

    const dbxOptions = { accessToken : `bYsAjnjg6cQAAAAAAAA4iN2lniNH91qM_98WNh8_iTuT8L9gZT_u-oApgv4GlBcs` }

	return {
		create  : createDoc,
		rename  : renameDoc,
		delete  : deleteDoc,
        fields  : templateFields,
        preview : previewDoc
    }


    async function displayedData() {

        // GET THE DISPLAYED PAGE'S DATA
        let pageData = view.scene.views.flatMap(view => {

            // GET EACH DISPLAYED VIEW'S DATA
            let viewData = dv(view).getDisplayed();
            viewData = dv(view).stripHTML(viewData);
            viewData = viewData.flatMap((record, i) => {

                // REMOVE EMPTY FIELDS
                let entries = Object.entries(record).filter(([key, val]) => !!val)

                // ADD INDEX TO FIELD NAME
                if (view.type == `table`) entries = entries.map(([key, val]) => [`${key}${i}`, val]);
                
                return entries;
            
            });
            return viewData;
        
        });

        // RETURN FIELD DATA
        return Object.fromEntries(pageData);

    }


    async function templateFields(tempPath) {

        // GET TEMPLATE PDF AS ARRAY BUFFER
        let tempFile = await fetch(tempPath);
        let tempBuff = await tempFile.arrayBuffer();

        // RETURN THE FIELDS FROM THE PDF
        return pdfform().list_fields(tempBuff);

    }


    async function documentBlob(tempPath, fieldData) {

        // CONVERT DATA VALUES TO ARRAYS FOR PDFFORM
        fieldData = Object.entries(fieldData).map(([key, val]) => [key, [val]]);
        fieldData = Object.fromEntries(fieldData);

        // GET TEMPLATE PDF AS ARRAY BUFFER
        let tempFile = await fetch(tempPath);
        let tempBuff = await tempFile.arrayBuffer();

        // FORM FILL THE PDF
        let docBuff = pdfform().transform(tempBuff, fieldData);

        // CONVERT ARRAY BUFFER TO BLOB
        return new Blob([docBuff], { type: "application/pdf" });

    }

/*
    async function createDocFree() {

        // INITIALIZE
        Knack.showSpinner();
        const docxpresso = {
            apiKey: `d95bba0d763fb12a02f2b2125abda1f4`,
            generateAccessToken: `https://api.docxpresso.cloud/generateAccessToken`,
            generateDocument: `https://api.docxpresso.cloud/generateDocument`,
            convertDocument: `https://api.docxpresso.cloud/convertDocument`,
            getToken: async () => {
                let token = localStorage.getItem(`docxpresso_token`);
                if ((Date.now() / 1000) > (token?.expires || 0)) {
                    token = fetch(docxpresso.generateAccessToken, { 
                        method: `GET`, 
                        headers: { 'X-Api-Key': docxpresso.apiKey }
                    }).then(response => {
                        return response.json();
                    }).then(tokenJSON => {
                        const tokenObj = JSON.parse(tokenJSON);
                        localStorage.setItem(`docxpresso_token`, tokenObj);
                        return tokenObj;
                    });
                }
                return token.accessToken;
            }
        }

        // GET THE DISPLAYED PAGE'S DATA
        let fieldData = view.scene.views.flatMap(vw => {
            const vwData = dv(vw).getDisplayed();
            return dv().stripHTML(vwData);
        });
        fieldData = Object.entries(fieldData).map(([key, val]) => ({ var: key, value: val }));
        fieldData = JSON.stringifiy({ vars: fieldData });

        // GET TEMPLATE FILE
        const template = db(TBL.Templates)
            .filter(FLD.Templates2.Name,`is`,`Commercial`)
            .get()
            .then(response => response.data[FLD.Templates.Base64]);

        // GET API KEY
        const token = docxpresso.getToken();

        // GET DOCUMENT
        await Promise.all(template, token);
        const docRequest = await fetch(docxpresso.generateDocument, {
            method: `POST`,
            headers: { 'Authorization': `Bearer ${token}` },
            template: template,
            output: `pdf`,
            body: fieldData
        });
        const docJSON = await response.json();
        const document = docJSON.document;

        // RETURN DOCUMENT AS FILE OBJECT
        const blob = await getBlob(document);
        const file = new File(blob, "filename");
        Knack.hideSpinner();
        return file;

    }
*/

	async function createDoc() {

        try {

            // INITIALIZE
            Knack.showSpinner();

            // GET THE DISPLAYED DATA
            const fieldData = await displayedData();

            // FORM FILL THE PDF
            const docBlob = await documentBlob(fieldData.TemplatePath, fieldData);

            // SAVE THE FILLED PDF
            const dbx = new window.Dropbox.Dropbox(dbxOptions);
			reponse = await dbx.filesUpload({contents: docBlob, path: fieldData.FilePath, mode: `overwrite`});

            // NOTIFY SUCCESS
            response = await MsgBox(`The PDF was created successfully!`);
            return response;
            
        } catch(error) {
    
            // NOTIFY ERROR
            await MsgBox(`There was an error creating the PDF!`, error);
            return error;

        }

	}


	async function deleteDoc(record) {

        try {

            // INITIALIZE
            Knack.showSpinner();

            // DELETE THE DOCUMENT
            const tableNum = view.source.object;
            const filePath = record[FLD[tableNum].FilePath].replace(`www.dropbox.com/home`,``);
            const dbx      = new window.Dropbox.Dropbox(dbxOptions);
            response = await dbx.filesDelete({path: filePath});

            // CLEANUP & RETURN
            Knack.hideSpinner()
            return response;
        
        } catch(error) {
        
            // NOTIFY ERROR
            await MsgBox(`There was an error deleting the PDF!`, error);
            return error;

        }

	}


    async function previewDoc() {

        try {

            // INITIALIZE
            Knack.showSpinner();
            URL.revokeObjectURL(globalThis.previewURL);

            // GET THE DISPLAYED DATA
            const fieldData = await displayedData();

            // FORM FILL THE PDF
            const docBlob = await documentBlob(fieldData.TemplatePath, fieldData);

            // CREATE URL OBJECT
            globalThis.previewURL = URL.createObjectURL(docBlob);

        } catch(error) {

            // NOTIFY ERROR
            await MsgBox(`There was an error getting the PDF Preview!`, error);
            return error;

        } finally {

            // CLEANUP
            Knack.hideSpinner();
            
        }

    }

    
    async function renameDoc(newRecord, oldRecord) {

        try {

            // INITIALIZE
            Knack.showSpinner();

            // RENAME THE DOCUMENT
            const tableNum = view.source.object;
            const newPath  = newRecord[FLD[tableNum].FilePath].replace(`www.dropbox.com/home`,``);
            const oldPath  = oldRecord[FLD[tableNum].FilePath].replace(`www.dropbox.com/home`,``);
            if (newPath == oldPath) return `The document path was not changed.`;
            const dbx      = new window.Dropbox.Dropbox(dbxOptions);
			response = await dbx.filesMove({from_path: oldPath, to_path: newPath, autorename: true});

            // CLEANUP & RETURN
            Knack.hideSpinner();
            return response;

        } catch(error) {

            // NOTIFY ERROR
            await MsgBox(`There was an error renaming the PDF!`, error);
            return error;
 
        }

    }


    async function viewDoc(record) {

        const path = record[FLD[tableNum].FilePath].replace(`www.dropbox.com/home`,``);
        const response = dbx.filesDownload({path: path});

    }

    

	/*async function emailPDF(messageView, messageRec, attachView, attachRecs) {

        try {

            // DOWNLOAD THE ATTACHMENT FILES
            let dbx       = new window.Dropbox.Dropbox(dbxOptions);
            let dbxParams = { path: attachRec[FLD[attachView.source.object].FilePath] }
            let files     = attachRecs.map(attachRec => dbx.filesDownload(dbxParams));
            files         = await Promise.allSettled(files);
            let fileNames = files.map((file, i) => [`FileName${i}`, file.name]);
            fileNames     = Object.fromEntries(fileNames);

            // CONVERT THE FILES TO BASE64
            let b64Files    = files.map(file => getBase64(file.fileBlob));
            b64Files        = await Promise.allSettled(b64Files);
            let attachments = b64Files.map((b64, i) => [`Attachment${i}`, b64]);
            attachments     = Object.fromEntries(attachments);

            // CREATE TEMPLATE' FROM EMAIL KEY/VALS
            let messageTable  = messageView.source.object;
            let messagefields = {
                From     : Knack.getUserAttributes().email,
                FromName : Knack.getUserAttributes().name,
                Mobile   : Knack.getUserAttributes().values[FLD.Users.PhoneNumber].formatted,
                To       : messageRec[FLD[messageTable].EmailTo + "_raw"].email,
                Subject  : messageRec[FLD[messageTable].EmailSubject],
                Greeting : messageRec[FLD[messageTable].EmailGreeting],
                Message  : messageRec[FLD[messageTable].EmailMessage]
            }

            // SEND THE EMAIL
            const userID   = `user_zuZ0qAByBr8IHwJQvN6Ai`;
            const service  = Knack.getUserAttributes().values[FLD.Users.Email].email.split("@")[0];
            const template = `database`;
            const fields   = { ...messageFields, ...fileNames, ...attachments }
            await emailjs.send(service, template, fields, userID);

			// HANDLE SUCCESS
            MsgBox(`Email sent successfully!`);
            Knack.hideSpinner();

		} catch(error => {

			// HANDLE ANY ERRORS
			MsgBox(`Error sending email!`, error);

		}

	}*/

}