/**
 * Class to handle API rate-limiting logic.
 */
class RateLimiter {
    constructor(limit = 9, interval = 1000) {
        this.count = 0;
        this.resetTime = 0;
        this.limit = limit;
        this.interval = interval;
    }

    async ready() {
        const currentTime = Date.now();
        if (currentTime > this.resetTime) {
            this.count = 1;
            this.resetTime = currentTime + this.interval;
        } else {
            this.count++;
            if (this.count % this.limit === 0) this.resetTime += this.interval;
            if (this.count >= this.limit) {
                const waitTime = this.resetTime - currentTime;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
}

/**
 * Class to handle API communication.
 */
class KnackAPI {
    constructor(baseURL, applicationId, apiKey, rateLimiter) {
        this.baseURL = baseURL;
        this.applicationId = applicationId;
        this.apiKey = apiKey;
        this.rateLimiter = rateLimiter;
        this.parameters = {};
    }

    setParameter(key, value) {
        this.parameters[key] = value;
    }

    getParameter(key) {
        return this.parameters[key];
    }

    async sendRequest(method, endpoint, data = null) {
        await this.rateLimiter.ready();

        const url = this.buildURL(endpoint);
        const options = this.buildOptions(method, data);

        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return this.parseResponse(response);
            } else if (response.status === 429) {
                this.rateLimiter.resetTime += 1000;
                return this.sendRequest(method, endpoint, data);
            } else {
                throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error in sendRequest: ${error.message}`);
            return { status: 500, statusText: 'Internal Server Error', data: null };
        }
    }

    buildURL(endpoint) {
        const queryString = new URLSearchParams(this.parameters).toString();
        return queryString ? `${this.baseURL}/${endpoint}?${queryString}` : `${this.baseURL}/${endpoint}`;
    }

    buildOptions(method, data) {
        const headers = new Headers({
            'X-Knack-Application-Id': this.applicationId,
            'X-Knack-REST-API-Key': this.apiKey
        });

        if (data) {
            headers.append('Content-Type', 'application/json');
        }

        return {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        };
    }

    async parseResponse(response) {
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
}

/**
 * Class to handle database operations.
 */
class KnackDB {
    constructor(apiInstance, tableView) {
        this.api = apiInstance;
        this.tableView = tableView;
        this.endpoint = this.determineEndpoint();
    }

    determineEndpoint() {
        if (this.tableView.startsWith('object_')) {
            return `objects/${this.tableView}/records`;
        } else if (this.tableView.startsWith('view_')) {
            const sceneKey = VW[this.tableView].attributes.scene.key;
            return `pages/${sceneKey}/views/${this.tableView}/records`;
        }
        throw new Error('Invalid tableView format');
    }

    async createRecord(data) {
        return this.api.sendRequest('POST', this.endpoint, data);
    }

    async deleteRecord(recordId) {
        const endpoint = `${this.endpoint}/${recordId}`;
        return this.api.sendRequest('DELETE', endpoint);
    }

    async updateRecord(recordId, data) {
        const endpoint = `${this.endpoint}/${recordId}`;
        return this.api.sendRequest('PUT', endpoint, data);
    }

    async getRecords() {
        if (!this.api.getParameter('rows_per_page')) {
            this.api.setParameter('rows_per_page', 1000);
        }

        const initialResponse = await this.api.sendRequest('GET', this.endpoint);
        if (this.api.getParameter('page')) {
            return initialResponse;
        }

        const allResponses = await this.fetchAllPages(initialResponse.pages);
        const records = allResponses
            .sort((a, b) => a.page - b.page)
            .flatMap(response => response.data);

        return {
            status: 200,
            statusText: 'OK',
            data: records
        };
    }

    async fetchAllPages(totalPages) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
            this.api.setParameter('page', page);
            promises.push(this.api.sendRequest('GET', this.endpoint));
        }
        return Promise.all(promises);
    }

    setFilter(field, operator, value = '') {
        const rule = { field, operator, value };
        this.addFilters([rule]);
    }

    addFilters(filterRules) {
        const filters = this.api.getParameter('filters') 
            ? JSON.parse(this.api.getParameter('filters')) 
            : { rules: [], match: 'and' };
        filters.rules.push(...filterRules);
        this.api.setParameter('filters', JSON.stringify(filters));
    }

    setSort(field, order) {
        this.api.setParameter('sort_field', field);
        this.api.setParameter('sort_order', order);
    }

    setPagination(pageNumber, rowsPerPage) {
        this.api.setParameter('page', pageNumber);
        this.api.setParameter('rows_per_page', rowsPerPage);
    }
}

/**
 * Utility function to extract subfield values from a record.
 */
class RecordUtils {
    static extractSubfield(record, field, subfield, subfieldIndex = 0) {
        try {
            field = field.replace('_raw', '') + '_raw';
            field = [].concat(record[field]);
            return field[subfieldIndex][subfield];
        } catch (e) {
            return undefined;
        }
    }
}

// Usage Example
const rateLimiter = new RateLimiter();
const knackAPI = new KnackAPI(Knack.api_dev, Knack.application_id, 'e9299eb0-9304-11e6-805f-fdc50f60d512', rateLimiter);
const db = new KnackDB(knackAPI, 'object_1');
db.setPagination(1, 100);
db.setSort('name', 'asc');
db.setFilter('status', 'equals', 'active');
db.getRecords().then(console.log);