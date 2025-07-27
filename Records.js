///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTION   : sub                                                                                                     //
// PARAMETERS : record, field, subfield, subfieldIndex                                                                 //
// DESCRIPTION: Extracts a subfield value from a record.                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function sub(record, field, subfield, subfieldIndex = 0) {
    try {
        field = field.replace('_raw', '') + '_raw';
        field = [].concat(record[field]);
        return field[subfieldIndex][subfield];
    } catch (e) {
        return undefined;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MODULE     : dbLock                                                                                                  //
// DESCRIPTION: Handles throttling to avoid exceeding API rate limits.                                                 //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.dbLock = {
    count: 0,
    reset: 0,
    async ready() {
        const curTime = Date.now();
        if (curTime > this.reset) {
            this.count = 1;
            this.reset = curTime + 1000;
        } else {
            this.count++;
            if (this.count % 9 === 0) this.reset += 1000;
            if (this.count >= 9) await new Promise(r => setTimeout(r, this.reset - curTime));
        }
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MODULE     : db                                                                                                      //
// DESCRIPTION: Provides methods for interacting with Knack API records.                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.db = function (tableView) {
    let url = `${Knack.api_dev}/`;
    const parameters = {};
    const recordset = { filter, filters, format, match, page, rows, sort };
    const methods = {
        create: createRecord,
        delete: deleteRecord,
        get: getRecords,
        update: updateRecord
    };

    if (tableView.startsWith('object_')) {
        url += `objects/${tableView}/records`;
    } else if (tableView.startsWith('view_')) {
        methods.displayed = displayed;
        url += `pages/${VW[tableView].attributes.scene.key}/views/${tableView}/records`;
    }

    return { key, ...methods, ...recordset };

    function key(key) {
        url += `/${key}`;
        return { format, ...methods };
    }

    function filter(field, operator, value = '') {
        const rule = { field, operator, value };
        return filters([rule]);
    }

    function filters(filterRules) {
        parameters.filters = parameters.filters ? JSON.parse(parameters.filters) : { rules: [], match: 'and' };
        parameters.filters.rules.push(...filterRules);
        parameters.filters = JSON.stringify(parameters.filters);
        return { get: getRecords, ...recordset };
    }

    function format(formatType) {
        parameters.format = formatType;
        return { get: getRecords, ...recordset };
    }

    function match(matchType) {
        parameters.filter.match = matchType;
        return { get: getRecords, ...recordset };
    }

    function page(pageNumber) {
        parameters.page = pageNumber;
        return { get: getRecords, ...recordset };
    }

    function rows(rowsPerPage) {
        parameters.rows_per_page = rowsPerPage;
        return { get: getRecords, ...recordset };
    }

    function sort(field, order) {
        parameters.sort_field = field;
        parameters.sort_order = order;
        return { get: getRecords, ...recordset };
    }

    async function getRecords() {
        if (!parameters.rows_per_page) parameters.rows_per_page = 1000;

        const initialResponse = await sendRequest('GET');
        if (parameters.page) return initialResponse;

        const remainingResponses = await fetchRemainingPages(initialResponse.pages);
        const records = remainingResponses
            .sort((a, b) => a.page - b.page)
            .flatMap(response => response.data);

        return {
            status: 200,
            statusText: 'OK',
            data: records
        };
    }

    async function fetchRemainingPages(totalPages) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
            parameters.page = page;
            promises.push(sendRequest('GET'));
        }
        return Promise.all(promises);
    }

    async function createRecord(data) {
        return sendRequest('POST', data);
    }

    async function deleteRecord() {
        return sendRequest('DELETE');
    }

    async function updateRecord(data) {
        return sendRequest('PUT', data);
    }

    async function sendRequest(method, data) {
        await dbLock.ready();

        if (Object.keys(parameters).length) {
            url += `?${new URLSearchParams(parameters).toString()}`;
        }

        const options = {
            method,
            headers: new Headers({
                'X-Knack-Application-Id': Knack.application_id,
                'X-Knack-REST-API-Key': 'e9299eb0-9304-11e6-805f-fdc50f60d512'
            })
        };

        if (data) {
            options.headers.append('Content-Type', 'application/json');
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (response.ok) {
                return parseResponse(response);
            } else if (response.status === 429) {
                dbLock.reset += 1000;
                return sendRequest(method, data);
            } else {
                throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error in sendRequest: ${error.message}`);
            return { status: 500, statusText: 'Internal Server Error', data: null };
        }
    }

    async function parseResponse(response) {
        const result = {
            status: response.status,
            statusText: response.statusText,
            data: await response.json()
        };

        if (result.data.total_pages) {
            result.pages = result.data.total_pages;
            result.page = result.data.current_page;
            result.data = [].concat(result.data.records);
        } else {
            result.data = [].concat(result.data);
        }

        return result;
    }
};