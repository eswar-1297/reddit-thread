// Cross-Reference Engine for Google Community - Search API Based
// Uses Bing Web Search (primary) + Google CSE (secondary)
// No AI/LLM - direct search API for real URLs

import { expandQuery } from './queryExpander.js'
import { searchBingMultiQuery } from './bingSearch.js'
import { searchGoogleCSEMultiQuery } from './googleCSE.js'
import { processGoogleCommunityResults } from './googleCommunityUrlProcessor.js'
import { batchCheckGoogleCommunityReplies, containsBrandMention } from './commentChecker.js'

/**
 * Check which search APIs are configured
 */
function getConfiguredAPIs() {
  return {
    bing: !!process.env.BING_API_KEY,
    google: !!process.env.GOOGLE_CSE_API_KEY && !!process.env.GOOGLE_CSE_ID
  }
}

/**
 * Build search queries with site: prefix for Google Community
 * 
 * @param {string[]} variants - Query variants
 * @returns {string[]} Search queries with site prefix
 */
function buildGoogleCommunitySearchQueries(variants) {
  const sitePrefix = 'site:support.google.com inurl:thread OR site:productforums.google.com'
  
  return variants.map(variant => `${sitePrefix} ${variant}`)
}

/**
 * Main Google Community search function using Search APIs
 * 
 * Workflow:
 * 1. Expand user query into variants
 * 2. Build search queries with site:support.google.com
 * 3. Execute Bing search (if configured)
 * 4. Execute Google CSE search (if configured)
 * 5. Process, deduplicate, validate URLs
 * 6. Return aggregated results
 * 
 * @param {string} query - User's search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results with questions and stats
 */
export async function crossReferenceGoogleCommunitySearch(query, options = {}) {
  // Auto-detect configured APIs
  const configuredAPIs = getConfiguredAPIs()
  
  console.log('\n========================================')
  console.log('GOOGLE COMMUNITY SEARCH API WORKFLOW')
  console.log('Query:', query)
  console.log('Configured APIs:', 
    configuredAPIs.bing ? '✅ Bing' : '❌ Bing',
    configuredAPIs.google ? '✅ Google' : '❌ Google'
  )
  console.log('========================================\n')
  
  // Check if at least one API is configured
  if (!configuredAPIs.bing && !configuredAPIs.google) {
    console.error('❌ No search APIs configured! Add BING_API_KEY or GOOGLE_CSE_API_KEY to .env')
    return {
      questions: [],
      stats: { total: 0, bing: 0, google: 0, multiSource: 0 },
      query,
      error: 'No search APIs configured. Please add API keys to .env file.'
    }
  }
  
  const {
    useBing = configuredAPIs.bing,
    useGoogle = configuredAPIs.google,
    maxVariants = 15,        // Increased for more coverage
    resultsPerQuery = 30,    // Use pagination to get more results
    limit = 150,
    timeFilter = 'all',
    productFilter = 'all'  // Filter by Google product (drive, gmail, etc.)
  } = options
  
  // Convert timeFilter to API-specific formats
  const getTimeParams = (filter) => {
    switch (filter) {
      case '1month':
        return { bingFreshness: 'Month', googleDateRestrict: 'm1' }
      case '3months':
        return { bingFreshness: 'Month', googleDateRestrict: 'm3' }
      case '6months':
        return { bingFreshness: null, googleDateRestrict: 'm6' }
      case '1year':
        return { bingFreshness: null, googleDateRestrict: 'y1' }
      default:
        return { bingFreshness: null, googleDateRestrict: null }
    }
  }
  
  const timeParams = getTimeParams(timeFilter)
  
  // Step 1: Expand query into variants
  console.log('📝 Step 1: Query Expansion')
  const variants = expandQuery(query, maxVariants)
  
  // Add product-specific query if filter is set
  let searchVariants = variants
  if (productFilter && productFilter !== 'all') {
    searchVariants = variants.map(v => `${v} ${productFilter}`)
  }
  
  // Step 2: Build search queries with site:support.google.com prefix
  console.log('\n🔍 Step 2: Building Search Queries')
  const searchQueries = buildGoogleCommunitySearchQueries(searchVariants)
  console.log(`   Generated ${searchQueries.length} search queries`)
  
  // Step 3 & 4: Execute searches in parallel
  console.log('\n🌐 Step 3-4: Executing Searches')
  
  const searchPromises = []
  
  if (useBing) {
    searchPromises.push(
      searchBingMultiQuery(searchQueries, resultsPerQuery, { freshness: timeParams.bingFreshness })
        .catch(err => {
          console.error('Bing search failed:', err.message)
          return { results: [], source: 'bing' }
        })
    )
  }
  
  if (useGoogle) {
    searchPromises.push(
      searchGoogleCSEMultiQuery(searchQueries, resultsPerQuery, { dateRestrict: timeParams.googleDateRestrict })
        .catch(err => {
          console.error('Google CSE search failed:', err.message)
          return { results: [], source: 'google' }
        })
    )
  }
  
  const searchResults = await Promise.all(searchPromises)
  
  // Separate results by source
  const bingResults = searchResults.find(r => r.source === 'bing')?.results || []
  const googleResults = searchResults.find(r => r.source === 'google')?.results || []
  
  // Step 5: Process, normalize, deduplicate, validate, filter
  console.log('\n🔧 Step 5: Processing Results')
  const { questions, stats } = processGoogleCommunityResults(bingResults, googleResults, query)
  
  // Step 6: Apply product filter if specified
  let filteredQuestions = questions
  if (productFilter && productFilter !== 'all') {
    filteredQuestions = questions.filter(q => 
      q.product.toLowerCase().includes(productFilter.toLowerCase()) ||
      q.url.toLowerCase().includes(productFilter.toLowerCase())
    )
  }
  
  // Step 7: Check replies for CloudFuze mentions and locked threads
  console.log('\n🔍 Step 7: Checking Google Community threads for CloudFuze mentions and locked status...')
  
  if (filteredQuestions.length > 0) {
    try {
      // Check ALL threads for locked status and brand mentions
      const urlsToCheck = filteredQuestions.map(q => q.url).filter(Boolean)
      console.log(`   Checking ${urlsToCheck.length} threads for locked status and brand mentions...`)
      
      const replyCheckResults = await batchCheckGoogleCommunityReplies(urlsToCheck, 5)
      
      const threadsWithBrandInReplies = Array.from(replyCheckResults.values())
        .filter(r => r.hasBrandMention).length
      const lockedThreads = Array.from(replyCheckResults.values())
        .filter(r => r.isLocked).length
      
      console.log(`   Found ${threadsWithBrandInReplies} threads with CloudFuze in replies`)
      console.log(`   Found ${lockedThreads} locked threads`)
      
      // Filter out threads with CloudFuze in replies OR locked threads
      const beforeFilter = filteredQuestions.length
      filteredQuestions = filteredQuestions.filter(q => {
        const checkResult = replyCheckResults.get(q.url)
        // Keep if: no check result OR check failed OR (no brand mention AND not locked)
        if (!checkResult || !checkResult.checked) {
          return true // Keep if we couldn't check
        }
        // Exclude if brand is mentioned OR thread is locked
        return !checkResult.hasBrandMention && !checkResult.isLocked
      })
      
      const removedCount = beforeFilter - filteredQuestions.length
      console.log(`   After filtering: ${filteredQuestions.length} (removed ${removedCount} - brand: ${threadsWithBrandInReplies}, locked: ${lockedThreads})`)
    } catch (error) {
      console.error('   ⚠️ Error checking threads:', error.message)
      // Continue with unfiltered results on error
    }
  }
  
  // Limit results
  const limitedQuestions = filteredQuestions.slice(0, limit)
  
  // Final stats
  const finalStats = {
    total: limitedQuestions.length,
    bing: limitedQuestions.filter(q => q.sources.includes('bing')).length,
    google: limitedQuestions.filter(q => q.sources.includes('google')).length,
    multiSource: limitedQuestions.filter(q => q.sources.length > 1).length,
    queriesExecuted: searchQueries.length
  }
  
  // Log results
  console.log('\n--- TOP 5 RESULTS ---')
  limitedQuestions.slice(0, 5).forEach((q, i) => {
    console.log(`${i + 1}. [${q.sources.join('+')}] [${q.product}] ${q.title?.substring(0, 50)}...`)
  })
  console.log('\n--- STATS ---')
  console.log(`Total: ${finalStats.total} | Bing: ${finalStats.bing} | Google: ${finalStats.google} | Multi: ${finalStats.multiSource}`)
  console.log('========================================\n')
  
  return {
    questions: limitedQuestions,
    stats: finalStats,
    query,
    variants
  }
}

/**
 * Get search configuration status
 * @returns {Object} Configuration status for Bing and Google
 */
export function getGoogleCommunitySearchConfigStatus() {
  return {
    bing: {
      configured: !!process.env.BING_API_KEY,
      name: 'Bing Web Search API'
    },
    google: {
      configured: !!process.env.GOOGLE_CSE_API_KEY && !!process.env.GOOGLE_CSE_ID,
      name: 'Google Custom Search API'
    }
  }
}
