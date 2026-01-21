// URL Processor - Normalization, Validation, and Deduplication for Quora URLs

/**
 * Normalize a Quora URL to a canonical format
 * - Convert to lowercase (domain only)
 * - Remove tracking parameters
 * - Normalize trailing slashes
 * - Ensure https://www.quora.com format
 * 
 * @param {string} url - Raw URL
 * @returns {string|null} Normalized URL or null if invalid
 */
export function normalizeUrl(url) {
  try {
    if (!url || typeof url !== 'string') return null
    
    // Parse the URL
    const parsed = new URL(url)
    
    // Ensure it's a Quora URL
    if (!parsed.hostname.includes('quora.com')) {
      return null
    }
    
    // Extract the path
    let path = parsed.pathname
    
    // Remove trailing slash
    path = path.replace(/\/+$/, '')
    
    // Remove /answer/... suffix if present (we want the question, not specific answer)
    path = path.replace(/\/answer\/[^\/]+$/, '')
    
    // Build canonical URL
    const canonical = `https://www.quora.com${path}`
    
    return canonical
  } catch (error) {
    return null
  }
}

/**
 * Validate if a URL is a valid Quora question page
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Quora question URL
 */
export function validateQuoraUrl(url) {
  if (!url) return false
  
  try {
    const parsed = new URL(url)
    
    // Must be quora.com domain
    if (!parsed.hostname.includes('quora.com')) {
      return false
    }
    
    const path = parsed.pathname
    
    // Skip non-question pages
    const invalidPaths = [
      '/profile/',
      '/topic/',
      '/space/',
      '/search',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
      '/settings',
      '/notifications',
      '/answer_requests',
      '/content',
      '/stats',
      '/log',
      '/followers',
      '/following',
      '/edits',
      '/all_posts'
    ]
    
    for (const invalid of invalidPaths) {
      if (path.toLowerCase().includes(invalid)) {
        return false
      }
    }
    
    // Path should have a question slug (at least one segment after /)
    const segments = path.split('/').filter(s => s.length > 0)
    if (segments.length === 0) {
      return false
    }
    
    // Question slug should be reasonably long (not just a short code)
    const slug = segments[0]
    if (slug.length < 5) {
      return false
    }
    
    // Should contain hyphens or be a readable question
    // Most Quora questions have hyphens: "How-do-I-learn-programming"
    // But some older ones might not
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * Extract question slug from Quora URL
 * 
 * @param {string} url - Quora URL
 * @returns {string|null} Question slug or null
 */
export function extractSlug(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    
    // Remove leading slash and get first segment
    const segments = path.split('/').filter(s => s.length > 0)
    
    // Handle /unanswered/Question-Slug format
    if (segments[0] === 'unanswered' && segments.length > 1) {
      return segments[1]
    }
    
    return segments[0] || null
  } catch (error) {
    return null
  }
}

/**
 * Convert slug to readable title
 * "How-do-I-learn-programming" -> "How do I learn programming"
 * 
 * @param {string} slug - URL slug
 * @returns {string} Readable title
 */
export function slugToTitle(slug) {
  if (!slug) return ''
  return slug.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Deduplicate search results by URL
 * Merges metadata from multiple sources
 * 
 * @param {Object[]} results - Array of search results
 * @returns {Object[]} Deduplicated results
 */
export function deduplicateResults(results) {
  const urlMap = new Map()
  
  for (const result of results) {
    // Normalize the URL
    const normalizedUrl = normalizeUrl(result.url)
    if (!normalizedUrl) continue
    
    // Validate it's a question URL
    if (!validateQuoraUrl(normalizedUrl)) continue
    
    const slug = extractSlug(normalizedUrl)
    if (!slug) continue
    
    if (urlMap.has(normalizedUrl)) {
      // Merge sources
      const existing = urlMap.get(normalizedUrl)
      
      // Add source to list
      if (!existing.sources.includes(result.source)) {
        existing.sources.push(result.source)
      }
      
      // Keep the better title (longer usually means more complete)
      if (result.title && result.title.length > (existing.title?.length || 0)) {
        existing.title = result.title
      }
      
      // Keep the better snippet
      if (result.snippet && result.snippet.length > (existing.snippet?.length || 0)) {
        existing.snippet = result.snippet
      }
    } else {
      // New URL
      urlMap.set(normalizedUrl, {
        id: slug,
        slug,
        url: normalizedUrl,
        title: result.title || slugToTitle(slug),
        snippet: result.snippet || '',
        sources: [result.source],
        discoveredAt: new Date().toISOString()
      })
    }
  }
  
  return Array.from(urlMap.values())
}

/**
 * Process raw search results through the full pipeline
 * 1. Normalize URLs
 * 2. Validate as Quora questions
 * 3. Deduplicate across sources
 * 4. Add metadata
 * 
 * @param {Object[]} bingResults - Results from Bing
 * @param {Object[]} googleResults - Results from Google CSE
 * @returns {Object} Processed results with stats
 */
export function processSearchResults(bingResults = [], googleResults = []) {
  console.log('\n📊 Processing search results...')
  console.log(`   Raw Bing results: ${bingResults.length}`)
  console.log(`   Raw Google results: ${googleResults.length}`)
  
  // Combine all results
  const allResults = [...bingResults, ...googleResults]
  
  // Deduplicate and validate
  const processed = deduplicateResults(allResults)
  
  // Calculate stats
  const stats = {
    total: processed.length,
    bing: processed.filter(r => r.sources.includes('bing')).length,
    google: processed.filter(r => r.sources.includes('google')).length,
    multiSource: processed.filter(r => r.sources.length > 1).length
  }
  
  console.log(`   After processing: ${processed.length} unique questions`)
  console.log(`   From Bing: ${stats.bing}`)
  console.log(`   From Google: ${stats.google}`)
  console.log(`   Multi-source: ${stats.multiSource}`)
  
  // Sort by source count (multi-source first) then alphabetically
  processed.sort((a, b) => {
    if (b.sources.length !== a.sources.length) {
      return b.sources.length - a.sources.length
    }
    return a.title.localeCompare(b.title)
  })
  
  return {
    questions: processed,
    stats
  }
}

