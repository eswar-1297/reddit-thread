// Google Custom Search Engine (CSE) API Integration
// Secondary/fallback search engine for discovering Quora URLs

const GOOGLE_CSE_API_URL = 'https://www.googleapis.com/customsearch/v1'

/**
 * Search Google CSE for Quora URLs
 * @param {string} query - Search query (should include site:quora.com)
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results with URLs
 */
export async function searchGoogleCSE(query, options = {}) {
  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID
  
  if (!apiKey || !cseId) {
    console.log('🟢 Google CSE: No API key or CSE ID configured, skipping...')
    return { results: [], source: 'google', error: 'No API key or CSE ID' }
  }
  
  const {
    num = 10,           // Results per page (max 10 for Google CSE)
    start = 1,          // Start index (1-based)
    safe = 'active'     // Safe search level
  } = options
  
  console.log(`🟢 Google: Searching "${query.substring(0, 60)}..."`)
  
  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: cseId,
      q: query,
      num: Math.min(num, 10).toString(),
      start: start.toString(),
      safe
    })
    
    const response = await fetch(`${GOOGLE_CSE_API_URL}?${params}`)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('🟢 Google CSE API error:', response.status, error.error?.message)
      return { results: [], source: 'google', error: `API error: ${response.status}` }
    }
    
    const data = await response.json()
    
    // Extract search results
    const items = data.items || []
    
    const results = items.map(item => ({
      url: item.link,
      title: item.title,
      snippet: item.snippet,
      displayUrl: item.displayLink,
      source: 'google'
    }))
    
    console.log(`🟢 Google: Found ${results.length} results`)
    
    // Check if there are more results
    const totalResults = parseInt(data.searchInformation?.totalResults || '0')
    const currentEnd = start + results.length - 1
    
    return {
      results,
      source: 'google',
      totalResults,
      hasMore: currentEnd < Math.min(totalResults, 100) // Google CSE limits to 100 results
    }
    
  } catch (error) {
    console.error('🟢 Google CSE search error:', error.message)
    return { results: [], source: 'google', error: error.message }
  }
}

/**
 * Search Google CSE with pagination to get more results
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum total results to fetch (max 100 for Google CSE)
 * @returns {Promise<Object>} Aggregated search results
 */
export async function searchGoogleCSEWithPagination(query, maxResults = 50) {
  const allResults = []
  let start = 1
  const pageSize = 10 // Google CSE max is 10 per request
  
  // Google CSE only allows up to 100 results total
  const effectiveMax = Math.min(maxResults, 100)
  
  while (allResults.length < effectiveMax) {
    const { results, hasMore, error } = await searchGoogleCSE(query, {
      num: pageSize,
      start
    })
    
    if (error || results.length === 0) {
      break
    }
    
    allResults.push(...results)
    
    if (!hasMore) {
      break
    }
    
    start += pageSize
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  
  return {
    results: allResults.slice(0, effectiveMax),
    source: 'google',
    totalFetched: allResults.length
  }
}

/**
 * Search Google CSE with multiple query variants
 * @param {string[]} queries - Array of search queries
 * @param {number} resultsPerQuery - Max results per query
 * @returns {Promise<Object>} Combined results from all queries
 */
export async function searchGoogleCSEMultiQuery(queries, resultsPerQuery = 10) {
  console.log(`\n🟢 ========== GOOGLE CSE MULTI-QUERY SEARCH ==========`)
  console.log(`🟢 Running ${queries.length} queries...`)
  
  const allResults = []
  
  for (const query of queries) {
    const { results, error } = await searchGoogleCSE(query, { num: resultsPerQuery })
    
    if (!error) {
      allResults.push(...results)
    }
    
    // Delay between queries to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  
  console.log(`🟢 Total raw results: ${allResults.length}`)
  console.log(`🟢 ========== END GOOGLE CSE ==========\n`)
  
  return {
    results: allResults,
    source: 'google',
    queriesExecuted: queries.length
  }
}

