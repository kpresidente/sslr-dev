var uniqueNum = new function(tableNum) {

    // PUBLIC METHODS
    return {
        createRecord,
        getNumber,
        setNumber
    }



	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//                                                                                                                       //
	//  FUNCTION   : getNumber                                                                                               //
	//  PARAMETERS :                                                                                                         //
	//  RETURNS    :                                                                                                         //
	//                                                                                                                       //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	async function getNumber(tableNum) {

        try {

            // INITIALIZE
            let records = { length: true }

            // LOOP WHILE NUMBER IS NOT UNIQUE
            for (var trial = 1; trial <= 10 && records.length; trial++) {

                // GET A RANDOM 6-DIGIT NUMBER
                var randomNum = String(Math.floor(Math.random()*(999999-100000+1)+100000));

                console.log(randomNum);

                // LOOKUP THE NUMBER IN THE TABLE
                records = await db(tableNum)
                    .filter(FLD[tableNum].Number, `is`, randomNum)
                    .filter(FLD[tableNum].Exists, `is`, 1)
                    .get()
                    .then(r => r.data);
            }

            // UNIQUE NUMBER NOT FOUND
            if (trial > 10 && records.length) throw `Too many trials!`;
            
            // RETURN THE NUMBER 
            return randomNum;

        } catch(error) { 
            
            return Promise.reject(error); 
        
        }

	}


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//                                                                                                                       //
	//  FUNCTION   : setNumber                                                                                               //
	//  PARAMETERS :                                                                                                         //
	//  RETURNS    :                                                                                                         //
	//                                                                                                                       //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	async function setNumber(view) {

        try {

            // INITIALIZE
            Knack.showSpinner();
            const tableNum = view.source.object;
            const fieldNum = FLD[tableNum].Number;

            // GET A UNIQUE RANDOM 6-DIGIT NUMBER
            const randomNum = await getNumber(tableNum);

            // SET THE NUMBER FIELD
            const response = dv(view).setValue(fieldNum, randomNum)

            // CLEANUP & RETURN
            Knack.hideSpinner();
            return response;
		
        } catch(error) {

            // NOTIFY ERROR
			const recordName = TBL[view.source.object].attributes.inflections.singular;
			MsgBox(`Error setting the ${recordName} Number!`, error);
		
        } 

	}


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//                                                                                                                       //
	//  FUNCTION   : createRecord                                                                                            //
	//  PARAMETERS :                                                                                                         //
	//  RETURNS    :                                                                                                         //
	//                                                                                                                       //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	async function createRecord(data) {

        try {

            // INITIALIZE
            Knack.showSpinner();

            // GET A UNIQUE RANDOM 6-DIGIT NUMBER
            const randomNum = await getNumber(tableNum);

            // ADD THE RECORD NUMBER TO THE DATA
            data[FLD[tableNum].Number] = randomNum;

            // CREATE THE NEW RECORD
            const response = await db(tableNum)
                .create(data);
            
            // CLEANUP & RETURN
            Knack.hideSpinner();
            return response;

		} catch(error) {

			// HANDLE ERRORS
			const recordName = TBL[view.source.object].attributes.inflections.singular;
			MsgBox(`Error creating the ${recordName}!`, error);
		
        }
        
    }
    
}

