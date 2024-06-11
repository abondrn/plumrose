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


async function ESearch(params) {
    const response = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
        params,
    });

    return response.data;
}

async function EFetch(params) {
    const response = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
        params,
    });

    return response.data;
}


module.exports = { multiplePaperDetails, paperBulkSearch, paperDetails, paperRecommendations, paperRelevanceSearch, ESearch, EFetch };