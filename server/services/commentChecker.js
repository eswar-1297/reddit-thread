// Comment Checker - Check for brand mentions (CloudFuze) in comments/answers across platforms
// Supports: Reddit, Quora, Google Community

const REDDIT_USER_AGENT = 'RedditThreadFinder/1.0.0'
const BRAND_KEYWORDS = ['cloudfuze', 'cloud fuze', 'cloud-fuze']

/**
 * Check if text contains brand mention
 * @param {string} text - Text to check
 * @returns {boolean} True if brand is mentioned
 */
export function containsBrandMention(text) {
  if (!text) return false
  const lowerText = text.toLowerCase()
  return BRAND_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

// ============================================
// REDDIT COMMENT CHECKER
// ============================================

/**
 * Fetch Reddit thread with all comments
 * @param {string} threadId - Reddit thread ID
 * @returns {Promise<Object|null>} Thread data with comments or null
 */
async function fetchRedditComments(threadId) {
  try {
    // Fetch thread with comments (limit=500 gets most comments)
    const url = `https://www.reddit.com/comments/${threadId}.json?limit=500&depth=10`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log(`   ⚠️ Failed to fetch Reddit comments for ${threadId}: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.log(`   ⚠️ Error fetching Reddit comments for ${threadId}: ${error.message}`)
    return null
  }
}

/**
 * Extract all comment text from Reddit response
 * @param {Object} commentData - Reddit comment listing
 * @returns {string[]} Array of comment texts
 */
function extractRedditCommentTexts(commentData) {
  const texts = []
  
  if (!commentData?.data?.children) return texts
  
  for (const child of commentData.data.children) {
    if (child.kind === 't1' && child.data) {
      // t1 = comment
      const comment = child.data
      if (comment.body) {
        texts.push(comment.body)
      }
      
      // Check nested replies
      if (comment.replies && comment.replies.data) {
        texts.push(...extractRedditCommentTexts(comment.replies))
      }
    }
  }
  
  return texts
}

/**
 * Check if a Reddit thread has brand mentions in comments
 * @param {string} threadId - Reddit thread ID
 * @returns {Promise<{hasBrandMention: boolean, mentionCount: number}>}
 */
export async function checkRedditCommentsForBrand(threadId) {
  const data = await fetchRedditComments(threadId)
  
  if (!data || !Array.isArray(data) || data.length < 2) {
    return { hasBrandMention: false, mentionCount: 0, error: 'Failed to fetch' }
  }
  
  // data[0] = thread info, data[1] = comments
  const commentTexts = extractRedditCommentTexts(data[1])
  
  let mentionCount = 0
  for (const text of commentTexts) {
    if (containsBrandMention(text)) {
      mentionCount++
    }
  }
  
  return {
    hasBrandMention: mentionCount > 0,
    mentionCount,
    commentCount: commentTexts.length
  }
}

/**
 * Batch check multiple Reddit threads for brand mentions
 * @param {string[]} threadIds - Array of thread IDs
 * @param {number} concurrency - Max concurrent requests (default 5)
 * @returns {Promise<Map<string, {hasBrandMention: boolean, mentionCount: number}>>}
 */
export async function batchCheckRedditComments(threadIds, concurrency = 5) {
  const results = new Map()
  
  // Process in batches to avoid rate limiting
  for (let i = 0; i < threadIds.length; i += concurrency) {
    const batch = threadIds.slice(i, i + concurrency)
    
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100 * (batch.indexOf(id))))
        const result = await checkRedditCommentsForBrand(id)
        return { id, result }
      })
    )
    
    for (const { id, result } of batchResults) {
      results.set(id, result)
    }
    
    // Rate limit between batches
    if (i + concurrency < threadIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

// ============================================
// QUORA ANSWER CHECKER
// ============================================

/**
 * Fetch Quora page content and extract answers
 * Note: Quora heavily uses JavaScript, so this may not get all content
 * @param {string} url - Quora question URL
 * @returns {Promise<string|null>} Page content or null
 */
async function fetchQuoraPageContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    return html
  } catch (error) {
    console.log(`   ⚠️ Error fetching Quora page: ${error.message}`)
    return null
  }
}

/**
 * Extract text content from HTML (basic extraction)
 * @param {string} html - HTML content
 * @returns {string} Extracted text
 */
function extractTextFromHtml(html) {
  if (!html) return ''
  
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#\d+;/g, '')
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

/**
 * Check if a Quora question has brand mentions in answers
 * @param {string} url - Quora question URL
 * @returns {Promise<{hasBrandMention: boolean, checked: boolean}>}
 */
export async function checkQuoraAnswersForBrand(url) {
  const html = await fetchQuoraPageContent(url)
  
  if (!html) {
    return { hasBrandMention: false, checked: false, error: 'Failed to fetch' }
  }
  
  const text = extractTextFromHtml(html)
  const hasBrandMention = containsBrandMention(text)
  
  return {
    hasBrandMention,
    checked: true
  }
}

/**
 * Batch check multiple Quora questions for brand mentions
 * @param {string[]} urls - Array of Quora URLs
 * @param {number} concurrency - Max concurrent requests (default 3)
 * @returns {Promise<Map<string, {hasBrandMention: boolean, checked: boolean}>>}
 */
export async function batchCheckQuoraAnswers(urls, concurrency = 3) {
  const results = new Map()
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        await new Promise(resolve => setTimeout(resolve, 200 * (batch.indexOf(url))))
        const result = await checkQuoraAnswersForBrand(url)
        return { url, result }
      })
    )
    
    for (const { url, result } of batchResults) {
      results.set(url, result)
    }
    
    // Rate limit between batches
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }
  
  return results
}

// ============================================
// GOOGLE COMMUNITY REPLY CHECKER
// ============================================

/**
 * Fetch Google Community thread content
 * @param {string} url - Google Community thread URL
 * @returns {Promise<string|null>} Page content or null
 */
async function fetchGoogleCommunityContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    return html
  } catch (error) {
    console.log(`   ⚠️ Error fetching Google Community page: ${error.message}`)
    return null
  }
}

/**
 * Check if a Google Community thread has brand mentions in replies
 * @param {string} url - Google Community thread URL
 * @returns {Promise<{hasBrandMention: boolean, checked: boolean}>}
 */
export async function checkGoogleCommunityRepliesForBrand(url) {
  const html = await fetchGoogleCommunityContent(url)
  
  if (!html) {
    return { hasBrandMention: false, checked: false, error: 'Failed to fetch' }
  }
  
  const text = extractTextFromHtml(html)
  const hasBrandMention = containsBrandMention(text)
  
  return {
    hasBrandMention,
    checked: true
  }
}

/**
 * Batch check multiple Google Community threads for brand mentions
 * @param {string[]} urls - Array of Google Community URLs
 * @param {number} concurrency - Max concurrent requests (default 3)
 * @returns {Promise<Map<string, {hasBrandMention: boolean, checked: boolean}>>}
 */
export async function batchCheckGoogleCommunityReplies(urls, concurrency = 3) {
  const results = new Map()
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        await new Promise(resolve => setTimeout(resolve, 200 * (batch.indexOf(url))))
        const result = await checkGoogleCommunityRepliesForBrand(url)
        return { url, result }
      })
    )
    
    for (const { url, result } of batchResults) {
      results.set(url, result)
    }
    
    // Rate limit between batches
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }
  
  return results
}

// ============================================
// UNIFIED BRAND CHECK
// ============================================

/**
 * Check if thread/question should be excluded based on brand mention in content or comments
 * Works for all platforms
 * 
 * @param {Object} item - Thread/question object
 * @param {string} platform - 'reddit' | 'quora' | 'google-community'
 * @param {Map} commentCheckResults - Pre-fetched comment check results (optional)
 * @returns {boolean} True if should be excluded (brand already mentioned)
 */
export function shouldExcludeForBrandMention(item, platform, commentCheckResults = null) {
  // First check title and body/snippet (existing logic)
  const title = (item.title || '').toLowerCase()
  const body = (item.selftext || item.snippet || '').toLowerCase()
  const content = title + ' ' + body
  
  if (containsBrandMention(content)) {
    return true
  }
  
  // Then check comments if results are available
  if (commentCheckResults) {
    const key = platform === 'reddit' ? item.id : item.url
    const checkResult = commentCheckResults.get(key)
    
    if (checkResult?.hasBrandMention) {
      return true
    }
  }
  
  return false
}

export default {
  containsBrandMention,
  checkRedditCommentsForBrand,
  batchCheckRedditComments,
  checkQuoraAnswersForBrand,
  batchCheckQuoraAnswers,
  checkGoogleCommunityRepliesForBrand,
  batchCheckGoogleCommunityReplies,
  shouldExcludeForBrandMention
}
