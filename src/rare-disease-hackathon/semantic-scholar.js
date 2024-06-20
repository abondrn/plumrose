const axios = require('axios');

const PAPER_FIELDS = 'title,publicationVenue,journal,references,citations,authors,tldr,embedding.specter_v2,year,authors,externalIds,abstract,influentialCitationCount,openAccessPdf,publicationTypes,publicationDate';


// Can only process 500 paper ids at a time.
// Can only return up to 10 MB of data at a time.
async function multiplePaperDetails(paperIds) {
    return await axios.post('https://api.semanticscholar.org/graph/v1/paper/batch',
        {
            ids: paperIds,
        },
        {
            params: {
                fields: PAPER_FIELDS
            },
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: 'json',
        }
    );
}


// https://api.semanticscholar.org/api-docs/graph#tag/Paper-Data/operation/get_graph_get_paper
async function paperDetails(paperId) {
    return await axios.get(`https://api.semanticscholar.org/graph/v1/paper/${paperId}`, {
        responseType: 'json',
        params: {
            fields: PAPER_FIELDS
        },
    });
}


// https://api.semanticscholar.org/api-docs/graph#tag/Paper-Data/operation/get_graph_paper_relevance_search
// Can only return up to 1,000 relevance-ranked results. For larger queries, see "/search/bulk" or the Datasets API.
// Can only return up to 10 MB of data at a time.
async function paperRelevanceSearch(params) {
    return await axios.get(`https://api.semanticscholar.org/graph/v1/paper/search`, {
        responseType: 'json',
        params,
    });
}


// Text query is optional and supports boolean logic for document matching.
// Papers can be filtered using various criteria.
// Up to 1,000 papers will be returned in each call.
// Nested paper data, such as citations, references, etc, is not available via this method.
// Up to 10,000,000 papers can be fetched via this method. For larger needs, please use the Datasets API to retrieve full copies of the corpus.
async function paperBulkSearch(params) {
    return await axios.post(`https://api.semanticscholar.org/graph/v1/paper/search`, {
        responseType: 'json',
        params,
    });
}


// https://api.semanticscholar.org/api-docs/recommendations#tag/Paper-Recommendations
async function paperRecommendations(pos, neg = [], params) {
    return await axios.get(`https://api.semanticscholar.org/graph/v1/papers`,
        {
            positivePaperIds: pos,
            negativePaperIds: neg,
        }, {
        responseType: 'json',
        headers: {
            'Content-Type': 'application/json'
        },
        params,
    });
}


class EntrezError extends Error {
    constructor(response) {
        super(response.data); // Call the parent class constructor with the message
        this.response = response;
        this.name = this.constructor.name; // Set the error name to the class name
        Error.captureStackTrace(this, this.constructor); // Create a stack trace for the error
    }
}


async function EntrezRequest(endpoint, params) {
    const response = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/${endpoint}.fcgi`, {
        params,
    });

    if (typeof response.data === 'string' && response.data.includes('<error>')) {
        throw new EntrezError(response);
    }
    return response.data;
}


async function ESearch(params) {
    return await EntrezRequest('esearch', params);
}

async function EFetch(params) {
    return await EntrezRequest('efetch', params);
}


async function getHPO(endpoint, params) {
    const r = await axios.get(`https://ontology.jax.org/api/hp/${endpoint}`, {
        responseType: 'json',
        params,
    });
    return r.data;
}


async function getChEMBL(entity, params) {
    const r = await axios.get(`https://www.ebi.ac.uk/chembl/api/data/${entity}.json`, {
        responseType: 'json',
        params,
    });
    return r.data;
}


// https://id.nlm.nih.gov/mesh/swagger/ui#/sparql/sparqlQuery
async function meshSPARQL(query) {
    const r = await axios.get('https://id.nlm.nih.gov/mesh/sparql', {
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        },
        params: {
            query: query,
            format: 'JSON',
            limit: 100,
            offset: 0,
            inference: false,
        },
        paramsSerializer: (params) => Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&'),
    });
    console.log(r);
    return r.data;
}


async function pushPullReddit(endpoint, params) {
    const r = await axios.get(`https://api.pullpush.io/reddit/search/${endpoint}/`, {
        responseType: 'json',
        params,
    });
    return r.data;
}


async function clinicalTrials(endpoint, params) {
    const r = await axios.get(`https://clinicaltrials.gov/api/v2/${endpoint}`, {
        responseType: 'json',
        params,
    });
    return r.data;
}


const sleep = ms => new Promise(r => setTimeout(r, ms));


module.exports = { sleep, multiplePaperDetails, paperBulkSearch, paperDetails, paperRecommendations, paperRelevanceSearch, ESearch, EFetch, EntrezError, getChEMBL, getHPO, meshSPARQL, pushPullReddit, clinicalTrials };