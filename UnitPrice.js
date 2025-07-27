/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
//  METHOD     : setUnitPrice                                                                                          //
//  PARAMETERS :                                                                                                       //
//  RETURNS    :                                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function setUnitPrice(newRecord, oldRecord, view) {

    try {

        // INITIALIZE
        Knack.showSpinner();
        const table            = view.source.object;
        const fldUnitPrice     = FLD[table].UnitPrice;
        const fldCostUnit      = FLD[table].CostUnit;
        const fldCostUnitPrice = FLD[table].CostUnitPrice;

        // UNIT PRICE WAS MANUALLY CHANGED...EXIT FUNCTION
        if (newRecord[fldUnitPrice] != oldRecord[fldUnitPrice]) return;

        // COST UNIT WAS NOT CHANGED...EXIT FUNCTION
        if (newRecord[fldCostUnit] == oldRecord[fldCostUnit]) return;

        // UPDATE THE UNIT PRICE
        let update = await db(table).key(newRecord.id).update({ [fldUnitPrice]: newRecord[fldCostUnitPrice] });

        // CLEANUP & RETURN
        Knack.hideSpinner();
        return update;

    } catch (error) {

        // NOTIFY ERROR
        await MsgBox(`There was an error updating the unit price!`, error);
        return error;

    } finally {

        // REFRESH THE PAGE
        navBack(0);
    
    }

}