var dv = (view) => {

    // PUBLIC METHODS
    return {
        getData,
        getDisplayed,
        getLabels,
        setData,
        setValue,
        stripHTML
    };


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                       //
    //  FUNCTION   : getData                                                                                                 //
    //  PARAMETERS :                                                                                                         //
    //  RETURNS    :                                                                                                         //
    //                                                                                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function getData(format = `both`) {

        // INITIALIZE
        format = format.toLowerCase();

        // GET THE RECORD MODELS
        const models = (Knack.views[view.key].model?.data.models || [Knack.views[view.key].model]).map(model => {

            // CONVERT DATA TO ARRAY
            let entries = Object.entries(model.attributes);

            // GET FORMAT
            if (format == `raw`) {

                // GET RAW DATA ONLY
                entries = entries.filter(([key, val]) => key.indexOf(`_raw`) !== -1);

                // REMOVE _RAW FROM FIELD NAMES
                entries = entries.map(([key, val]) => [key.replace(`_raw`, ``), val]);

                // CONVERT NEGATIVE NUMBERS FROM STRING TO NUMBER
                entries = entries.map(([key, val]) => {
                    const type = FLD[key].attributes.type;
                    if (type == `number` || type == `currency`) val = val * 1;
                    return [key, val];
                });

            } else if (format == `html`) {

                // GET HTML DATA ONLY
                entries = entries.filter(([key, val]) => key.indexOf(`_raw`) !== -1);

            }

            // CONVERT BACK TO OBJECT
            return Object.fromEntries(entries);

        });

        // RETURN
        return models;

    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                       //
    //  FUNCTION   : getLabels                                                                                               //
    //  PARAMETERS :                                                                                                         //
    //  RETURNS    :                                                                                                         //
    //                                                                                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function getLabels(includeRaw = false) {

        const labels = {};
        const columns = Knack.views[view.key].model.view.columns;

        // DETAIL & LIST VIEWS
        if (view.type == `details` || view.type == `list`) {
            columns.forEach(col => {
                return col.groups.forEach(group => {
                    return group.columns.forEach(groupcol => {
                        return groupcol.filter(field => `key` in field).forEach(field => {
                            field.name = field.name.replace(/ /g, ``);
                            labels[field.key] = field.name;
                            if (includeRaw) labels[`${field.key}_raw`] = `${field.name}_raw`;
                        });
                    });
                });
            });
        }


        // TABLE VIEWS
        else if (view.type == `table`) {
            columns.forEach(col => {
                col.header = col.header.replace(/ /g, `_`);
                labels[col.field.key] = col.header;
                if (includeRaw) labels[`${col.field.key}_raw`] = `${col.header}_raw`;
            });
        }

        return labels;

    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                       //
    //  FUNCTION   : getDisplayed                                                                                            //
    //  PARAMETERS :                                                                                                         //
    //  RETURNS    :                                                                                                         //
    //                                                                                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function getDisplayed() {

        // GET THE VIEW'S LABELS
        const labels = getLabels();

        // RETURN THE LABEL/VALUE RECORDS
        const model = Knack.views[view.key].model;
        const models = (`data` in model ? model.data.models : [model]).map(model => {

            const entries = Object.entries(model.attributes)

                // REMOVE DATA THAT DOESN'T HAVE A LABEL
                .filter(([fieldNum, val]) => !!labels[fieldNum])

                // REPLACE FIELD NUMBER WITH LABEL
                .map(([fieldNum, val]) => [labels[fieldNum], val]);

            return Object.fromEntries(entries);

        });

        // RETURN
        return models;

    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                       //
    //  FUNCTION   : setData                                                                                                 //
    //  PARAMETERS :                                                                                                         //
    //  RETURNS    :                                                                                                         //
    //                                                                                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function setData(fieldData, overwrite = true) {

        const setValues = Object.entries(fieldData).map(([key, val]) => setValue(key, val, overwrite));
        return Promise.allSettled(setValues);

    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                       //
    //  FUNCTION   : setValue                                                                                                //
    //  PARAMETERS :                                                                                                         //
    //  RETURNS    :                                                                                                         //
    //                                                                                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function setValue(fieldNum, value) {

        // GET THE CONTROL AND INPUT ELEMENTS
        const eControl = document.getElementById(`kn-input-${fieldNum}`);
        let eInput;

        // FIND THE SPECIFIC FIELD TYPE
        switch (FLD[fieldNum].attributes.type) {

            case `boolean`:

                switch (FLD[fieldNum].attributes.format.input) {
                    case `checkbox`:
                        eInput = eControl.getQuerySelector(`input`);
                        if (eInput.value != value) eInput.click();
                        break;
                    case `radios`:
                        eControl.getQuerySelector(`input[value="${value}"]`).click();
                        break;
                    case `dropbown`:
                        eInput = document.getElementById(fieldNum);
                        eInput.value = value;
                        break;
                }
                return;

            case `multiple_choice`:

                switch (FLD[fieldNum].attributes.format.type) {
                    case `checkboxes`:
                        eControl.getQuerySelectorAll(`input`).forEach(el => {
                            const toCheck = value.indexOf(el.value);
                            const checked = el.getAttribute(`checked`);
                            if ((toCheck && !checked) || (!toCheck && checked)) el.click()
                        });
                        break;
                    case `radios`:
                        eControl.getQuerySelector(`input[value="${value}"]`).click();
                        break;
                    case `single`:
                        eInput = document.getElementById(fieldNum);
                        eInput.value = value;
                        break;
                    case `multi`:
                        eInput = document.getElementById(`${view.key}-${fieldNum}`);
                        eInput.value = value;
                        eInput.dispatchEvent(new Event(`liszt:updated`));
                        break;
                }
                return;

            case `connection`:
                eInput = document.getElementById(`${view.key}-${fieldNum}`);
                eInput.value = value;
                eInput.dispatchEvent(new Event(`liszt:updated`));
                return;

            case `currency`:
            case `email`:
            case `link`:
            case `number`:
            case `paragraph_text`:
            case `phone`:
            case `short_text`:
            case `address`:
            case `date_time`:
            case `name`:
            case `timer`:

                if (typeof value === `object`) {
                    Object.entries(value).map(([key, val]) => eControl.getQuerySelector(`[name="${key}"]`).value = val);
                } else {
                    eInput = document.getElementById(fieldNum).value = value;
                }
                return;

            case `rating`:

                eControl.getQuerySelector(`.rateit-selected`).css(`width`, `${value * 19}px`);
                eControl.getQuerySelector(`.rateit-hover`).css(`width`, `${value * 19}px`);
                return;

            case `file`:
                eInput = document.getElementById(`${fieldNum}_upload`);
                // value = file_id
                eInput.value = value;
                return;

            case `rich_text`:

                eInput = eControl.getQuerySelector(`.redactor-editor`);
                if (overwrite) eInput.empty();
                eInput.append(value);
                return;

            default:

                return `Sorry don't support that control type`;

        }



    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                       //
    //  METHOD     : stripHTML                                                                                               //
    //  PARAMETERS :                                                                                                         //
    //  RETURNS    :                                                                                                         //
    //                                                                                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function stripHTML(records) {

        return records.map(record => {

            // STRIP THE HTML
            const entries = Object.entries(record).map(([key, val]) => {
                val = val.replace(/<br\s*\/?>/gi, `\n`);
                val = val.replace(/<\/?[^>]+(>|$)/g, ``);
                return [key, val];
            });

            // CONVERT BACK TO OBJECT
            return Object.fromEntries(entries);

        });

    }

}