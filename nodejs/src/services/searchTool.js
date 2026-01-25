const { Tool } = require('@langchain/core/tools')
const { LINK } = require('../config/config');
const logger = require('../utils/logger');

class SearxNGSearchTool extends Tool {
    constructor({
        searxUrl = LINK.SEARXNG_API_URL,
        maxResults = 10,
        language = 'en',
        name = 'searxng_search',
        description = 'Search the web with SearxNG',
    } = {}) {
        super()
        this.searxUrl = searxUrl
        this.maxResults = maxResults
        this.language = language
        this.name = name
        this.description = description
    }

    /** LangChain calls _call() under the hood */
    async _call(query) {
        try {
            // Validate SearxNG URL is configured
            if (!this.searxUrl) {
                logger.error('[SEARXNG] SearxNG URL not configured. Set SEARXNG_TOOL_URL environment variable.');
                return JSON.stringify([]);
            }

            const searchUrl = `${this.searxUrl}/search?q=${encodeURIComponent(query)}&format=json&language=${this.language}`;
            logger.info(`[SEARXNG] Searching: ${query}`);
            logger.debug(`[SEARXNG] Request URL: ${searchUrl}`);

            const response = await fetch(searchUrl, {
                method: 'GET',
                timeout: 15_000,
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'Mozilla/5.0',
                },
            });

            // Check response status
            if (!response.ok) {
                logger.error(`[SEARXNG] HTTP ${response.status} ${response.statusText} from ${this.searxUrl}`);
                logger.error(`[SEARXNG] Full URL: ${searchUrl}`);
                return JSON.stringify([]);
            }

            const data = await response.json();
            const citations = [];
            
            if (data?.results?.length > 0) {
                data.results.forEach((result) => {
                    citations.push({
                        title: result.title,
                        url: result.url,
                        snippet: result.content,
                        domain: result.parsed_url?.[1] || new URL(result.url).hostname,
                    });
                });
                logger.info(`[SEARXNG] Found ${citations.length} results for: ${query}`);
            } else {
                logger.warn(`[SEARXNG] No results found for: ${query}`);
            }
            
            return JSON.stringify(citations);
        } catch (err) {
            // Comprehensive error logging
            logger.error('[SEARXNG] Search failed:', {
                error: err.message,
                code: err.code,
                name: err.name,
                query: query,
                searxUrl: this.searxUrl,
                stack: err.stack
            });

            // Provide specific error messages
            if (err.code === 'ECONNREFUSED') {
                logger.error(`[SEARXNG] Connection refused. Is SearxNG running at ${this.searxUrl}?`);
            } else if (err.code === 'ENOTFOUND') {
                logger.error(`[SEARXNG] Host not found: ${this.searxUrl}. Check DNS or URL configuration.`);
            } else if (err.code === 'ETIMEDOUT') {
                logger.error(`[SEARXNG] Request timed out after 15 seconds. SearxNG may be overloaded.`);
            } else if (err.name === 'AbortError') {
                logger.error(`[SEARXNG] Request aborted. Network issue or timeout.`);
            }

            return JSON.stringify([]);
        }
    }
}

module.exports = { SearxNGSearchTool }