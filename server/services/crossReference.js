// Cross-Reference Engine
// Combines results from Reddit + Gemini + ChatGPT with RELEVANCE FILTERING

import { searchWithGemini } from './gemini.js'
import { searchWithOpenAI } from './openai.js'

const REDDIT_USER_AGENT = 'RedditThreadFinder/1.0.0'

// Check if thread is relevant to the search query
function isRelevantToQuery(thread, query) {
  if (!thread.title) return false
  
  // Split query into words, filter out very short and common words
  const stopWords = ['the', 'and', 'for', 'from', 'with', 'how', 'what', 'why', 'can', 'you', 'your', 'are', 'was', 'were', 'has', 'have', 'had', 'been']
  const searchTerms = query.toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2)
    .filter(term => !stopWords.includes(term))
  
  const title = thread.title.toLowerCase()
  const selftext = (thread.selftext || '').toLowerCase()
  const subreddit = (thread.subreddit || '').toLowerCase()
  const content = title + ' ' + selftext + ' ' + subreddit
  
  // Count how many search terms appear in the content
  const matchedTerms = searchTerms.filter(term => content.includes(term))
  
  // More strict: require at least 60% of terms to match, minimum 2
  const minRequired = Math.max(2, Math.ceil(searchTerms.length * 0.6))
  const passes = matchedTerms.length >= Math.min(minRequired, searchTerms.length)
  
  // Extra check: if query contains "teams" and "slack" together, require BOTH in content
  const queryLower = query.toLowerCase()
  if (queryLower.includes('teams') && queryLower.includes('slack')) {
    const hasTeams = content.includes('teams') || content.includes('microsoft teams')
    const hasSlack = content.includes('slack')
    if (!hasTeams || !hasSlack) return false
  }
  
  return passes
}

// Check if thread should be excluded (archived, locked, or mentions CloudFuze)
function shouldExcludeThread(thread) {
  // Filter out archived threads (can't comment on them)
  if (thread.archived) {
    return true
  }
  
  // Filter out locked threads (can't comment on them)
  if (thread.locked) {
    return true
  }
  
  // Filter out threads that mention CloudFuze (already have content)
  const title = (thread.title || '').toLowerCase()
  const selftext = (thread.selftext || '').toLowerCase()
  const content = title + ' ' + selftext
  
  if (content.includes('cloudfuze')) {
    return true
  }
  
  return false
}

// Calculate relevance score
function calculateRelevanceScore(thread, query) {
  if (!thread.title) return 0
  
  const searchTerms = query.toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2)
  
  const title = thread.title.toLowerCase()
  const selftext = (thread.selftext || '').toLowerCase()
  
  let score = 0
  
  searchTerms.forEach(term => {
    if (title.includes(term)) score += 15  // Title match is important
    if (selftext.includes(term)) score += 5
  })
  
  // Exact phrase match in title is very valuable
  if (title.includes(query.toLowerCase())) {
    score += 100
  }
  
  return score
}

// Search Reddit directly
async function searchRedditDirect(query, sort = 'relevance', limit = 100) {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=${sort}&t=all&limit=${limit}`
    
    console.log(`Reddit (${sort}):`, url.substring(0, 80) + '...')
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error('Reddit API error:', response.status)
      return []
    }
    
    const data = await response.json()
    
    if (!data?.data?.children) return []
    
    return data.data.children.map(child => {
      const post = child.data
      return {
        id: post.id,
        title: post.title,
        selftext: post.selftext ? post.selftext.substring(0, 500) : '',
        author: post.author,
        subreddit: post.subreddit,
        score: post.score,
        upvote_ratio: post.upvote_ratio,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        url: `https://reddit.com${post.permalink}`,
        permalink: post.permalink,
        archived: post.archived,
        locked: post.locked,
        source: 'reddit',
        ai_sources: ['reddit']
      }
    })
  } catch (error) {
    console.error('Reddit search error:', error.message)
    return []
  }
}

// Fetch single thread details
async function fetchRedditThreadDetails(threadId) {
  try {
    const url = `https://www.reddit.com/comments/${threadId}.json`
    
    const response = await fetch(url, {
      headers: { 'User-Agent': REDDIT_USER_AGENT }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const post = data?.[0]?.data?.children?.[0]?.data
    
    if (!post) return null
    
    return {
      id: post.id,
      title: post.title,
      selftext: post.selftext ? post.selftext.substring(0, 500) : '',
      author: post.author,
      subreddit: post.subreddit,
      score: post.score,
      upvote_ratio: post.upvote_ratio,
      num_comments: post.num_comments,
      created_utc: post.created_utc,
      url: `https://reddit.com${post.permalink}`,
      permalink: post.permalink,
      archived: post.archived,
      locked: post.locked
    }
  } catch (error) {
    return null
  }
}

// Calculate AI visibility score
function calculateAIVisibilityScore(thread, query) {
  let score = 0
  
  // Relevance score (most important)
  score += calculateRelevanceScore(thread, query)
  
  // Source points
  const sourcePoints = { reddit: 20, gemini: 30, openai: 30 }
  thread.ai_sources.forEach(source => {
    score += sourcePoints[source] || 10
  })
  
  // Multi-source bonus
  if (thread.ai_sources.length >= 3) score += 50
  else if (thread.ai_sources.length >= 2) score += 25
  
  // Engagement bonus (capped)
  score += Math.min(thread.score / 20, 30)
  score += Math.min(thread.num_comments, 30)
  
  return Math.round(score)
}

export async function crossReferenceSearch(query, options = {}) {
  console.log('\n========================================')
  console.log('CROSS-REFERENCE SEARCH')
  console.log('Query:', query)
  console.log('========================================\n')
  
  const { 
    includeGemini = true, 
    includeOpenAI = true,
    minScore = 0,
    minComments = 0,
    limit = 150
  } = options
  
  // Collect threads from all sources
  const allPromises = []
  
  // Reddit searches (relevance + top + new)
  console.log('📌 Starting Reddit searches...')
  allPromises.push(searchRedditDirect(query, 'relevance', 100))
  allPromises.push(searchRedditDirect(query, 'top', 100))
  allPromises.push(searchRedditDirect(query, 'new', 100))
  
  // AI searches
  if (includeGemini) {
    console.log('🔵 Starting Gemini search...')
    allPromises.push(searchWithGemini(query))
  }
  
  if (includeOpenAI) {
    console.log('🟢 Starting OpenAI search...')
    allPromises.push(searchWithOpenAI(query))
  }
  
  // Wait for all
  const results = await Promise.all(allPromises)
  
  // Combine into map
  const threadMap = new Map()
  
  results.forEach(result => {
    const threads = result.threads || result
    if (!Array.isArray(threads)) return
    
    threads.forEach(thread => {
      if (!thread.id) return
      
      if (threadMap.has(thread.id)) {
        const existing = threadMap.get(thread.id)
        const newSources = thread.ai_sources || [thread.source || 'unknown']
        existing.ai_sources = [...new Set([...existing.ai_sources, ...newSources])]
      } else {
        threadMap.set(thread.id, {
          ...thread,
          ai_sources: thread.ai_sources || [thread.source || 'unknown']
        })
      }
    })
  })
  
  console.log(`\n📊 Total unique threads: ${threadMap.size}`)
  
  // FIRST: Enrich threads that need details (AI threads only have id/url)
  let threads = Array.from(threadMap.values())
  const enrichedThreads = []
  
  console.log('📥 Enriching threads that need details...')
  let enrichedCount = 0
  
  for (const thread of threads) {
    if (thread.title && thread.score !== undefined) {
      // Already has full details (from Reddit search)
      enrichedThreads.push(thread)
    } else {
      // Needs details (from Gemini/OpenAI) - fetch from Reddit
      const details = await fetchRedditThreadDetails(thread.id)
      if (details) {
        enrichedCount++
        enrichedThreads.push({
          ...details,
          ai_sources: thread.ai_sources
        })
      }
    }
  }
  
  console.log(`📥 Enriched ${enrichedCount} AI threads with Reddit data`)
  
  // FILTER: Exclude archived, locked, and CloudFuze-mentioned threads
  const beforeExclude = enrichedThreads.length
  const activeThreads = enrichedThreads.filter(thread => !shouldExcludeThread(thread))
  console.log(`📊 After excluding archived/locked/CloudFuze: ${activeThreads.length} (removed ${beforeExclude - activeThreads.length})`)
  
  // THEN: Filter for relevance (now all threads have titles)
  const beforeFilter = activeThreads.length
  const filteredByRelevance = activeThreads.filter(thread => isRelevantToQuery(thread, query))
  console.log(`📊 After relevance filter: ${filteredByRelevance.length} (removed ${beforeFilter - filteredByRelevance.length} irrelevant)`)
  
  // Add source flags and calculate scores
  const finalThreads = filteredByRelevance.map(thread => ({
    ...thread,
    found_in_reddit: thread.ai_sources.includes('reddit'),
    found_in_gemini: thread.ai_sources.includes('gemini'),
    found_in_openai: thread.ai_sources.includes('openai'),
    source_count: thread.ai_sources.length,
    ai_visibility_score: calculateAIVisibilityScore(thread, query)
  }))
  
  // Apply min filters
  let filteredThreads = finalThreads.filter(t => 
    t.score >= minScore && t.num_comments >= minComments
  )
  
  // Sort by AI visibility score
  filteredThreads.sort((a, b) => b.ai_visibility_score - a.ai_visibility_score)
  
  // Limit
  filteredThreads = filteredThreads.slice(0, limit)
  
  // Stats
  const stats = {
    total: filteredThreads.length,
    reddit: filteredThreads.filter(t => t.found_in_reddit).length,
    gemini: filteredThreads.filter(t => t.found_in_gemini).length,
    openai: filteredThreads.filter(t => t.found_in_openai).length,
    multiSource: filteredThreads.filter(t => t.source_count >= 2).length
  }
  
  // Log results
  console.log('\n--- TOP 5 RESULTS ---')
  filteredThreads.slice(0, 5).forEach(t => {
    console.log(`[${t.ai_visibility_score}] [${t.ai_sources.join('+')}] ${t.title?.substring(0, 60)}...`)
  })
  console.log('\n--- STATS ---')
  console.log(`Total: ${stats.total} | Reddit: ${stats.reddit} | Gemini: ${stats.gemini} | OpenAI: ${stats.openai} | Multi: ${stats.multiSource}`)
  
  return { threads: filteredThreads, stats, query }
}
