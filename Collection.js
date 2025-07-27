///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   : insertCollections                                                                                       //
//  PARAMETERS :                                                                                                         //
//  RETURNS    :                                                                                                         //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const insertCollections = async (view) => {

    try {

        // INITIALIZE
        Knack.showSpinner();
        debugger;
        const foreignView = view.scene.views.find(view => view.name == `Foreign Costs`);
        const foreignTable = foreignView.source.object;
        const foreignField = foreignView.source.connection_key;
        const foreignKey = view.scene.scene_id;
        const collectionsView = view.scene.views.find(view => view.name == `Select Collections`);

        // GET THE SELECTED COLLECTIONS
        const collections = getChecked(collectionsView);

        // GET THE COLLECTION COSTS
        const costsRequests = collections.map(collection => {
            return dp(TBL.CollectionCosts)
                .filter(FLD.CollectionCosts.Collection, `is`, collection)
                .filter(FLD.CollectionCosts.Exists, `is`, 1)
                .getRecords();
        });
        const costsResults = await Promise.allSettled(costsRequests);
        const collectionCosts = costsResults
            .filter(r => r.status == `fulfilled`)
            .flatMap(r => r.value.data);

        // CREATE THE NEW ITEMS
        const itemsRequests = collectionCosts.map(cost => {
            return dp(foreignTable).create({
                [foreignField]                : foreignKey,
                [FLD[foreignTable].Category]  : sub(cost, FLD.CollectionCosts.Category, `id`),
                [FLD[foreignTable].Metal]     : sub(cost, FLD.CollectionCosts.Metal, `id`),
                [FLD[foreignTable].CostItem]  : sub(cost, FLD.CollectionCosts.CostItem, `id`),
                [FLD[foreignTable].CostUnit]  : sub(cost, FLD.CollectionCosts.CostUnit, `id`),
                [FLD[foreignTable].UnitPrice] : cost[FLD.CollectionCosts.UnitPrice]
            });
        });
        const itemsResults = await Promise.allSettled(itemsRequests);

        // HANDLE REJECTIONS
        const failures = itemsResults
            .concat(costsResults)
            .filter(r => r.status == `rejected`)
            .map(r => r.reason.toString())
            .join(`<br>`);
        if (failures.length) throw new Error(failures);

        // CLEANUP & REFRESH
        document.getElementsByClassName(`close-modal`)[0]?.click();
        Knack.router.scene_view.model.views.models
            .map(model => Knack.views[model.id].model)
            .filter(model => `data` in model)
            .forEach(model => model.fetch());
        Knack.hideSpinner();

    } catch(err) {

        console.error(err);
        MsgBox(`There was an error adding the collection costs!`, `${err.name}, ${err.message}`);

    }

}