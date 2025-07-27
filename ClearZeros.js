///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   : clearZeros                                                                                              //
//  PARAMETERS :                                                                                                         //
//  RETURNS    :                                                                                                         //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const clearZeros = async (view, records) => {

    try {

        // INITIALIZE
        Knack.showSpinner();

        // DELETE ZERO QUANTITY ITEMS
        const requests = records.map(record => db(view.source.object).key(record.id).delete());
        const results = await Promise.allSettled(requests);

        // HANDLE REJECTIONS
        const failures = results
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

        // NOTIFY ERROR
        console.error(err);
        await MsgBox(`There was an error clearing the records!`, `${err.name}: ${err.message}`);

    }

}
