import { Router } from 'express'
import { searchReddit, getSubredditSuggestions } from '../services/reddit.js'
import { crossReferenceSearch } from '../services/crossReference.js'
import { crossReferenceQuoraSearch } from '../services/crossReferenceQuora.js'

const router = Router()

// Basic Reddit search
router.get('/', async (req, res, next) => {
  try {
    const { q, subreddit, time, sort, limit, minScore, minComments, aiOptimized } = req.query

    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query is required' })
    }

    const results = await searchReddit({
      query: q.trim(),
      subreddit: subreddit?.trim(),
      timeFilter: time || 'all',
      sort: sort || 'relevance',
      limit: parseInt(limit) || 200,
      minScore: parseInt(minScore) || 0,
      minComments: parseInt(minComments) || 0,
      aiOptimized: aiOptimized === 'true'
    })

    res.json(results)
  } catch (error) {
    next(error)
  }
})

// Cross-reference AI search (Gemini + OpenAI + Google)
router.get('/ai', async (req, res, next) => {
  try {
    const { q, minScore, minComments, limit, gemini, openai, google } = req.query

    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query is required' })
    }

    console.log('\n🔍 AI Cross-Reference Search Request')
    console.log('Query:', q)

    const results = await crossReferenceSearch(q.trim(), {
      includeGemini: gemini !== 'false',
      includeOpenAI: openai !== 'false',
      includeGoogle: google !== 'false',
      minScore: parseInt(minScore) || 0,
      minComments: parseInt(minComments) || 0,
      limit: parseInt(limit) || 150
    })

    res.json(results)
  } catch (error) {
    console.error('AI search error:', error)
    next(error)
  }
})

// Quora search using Search APIs (Bing + Google CSE)
router.get('/quora', async (req, res, next) => {
  try {
    const { q, limit, bing, google, cache, time } = req.query

    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query is required' })
    }

    console.log('\n🔍 Quora Search API Request')
    console.log('Query:', q)
    console.log('Time Filter:', time || 'all')

    const results = await crossReferenceQuoraSearch(q.trim(), {
      useBing: bing !== 'false',
      useGoogle: google !== 'false',
      useCache: cache !== 'false',
      limit: parseInt(limit) || 150,
      timeFilter: time || 'all'
    })

    res.json(results)
  } catch (error) {
    console.error('Quora search error:', error)
    next(error)
  }
})

// Get subreddit suggestions
router.get('/subreddits', async (req, res, next) => {
  try {
    const { q } = req.query

    if (!q || !q.trim()) {
      return res.json([])
    }

    const suggestions = await getSubredditSuggestions(q.trim())
    res.json(suggestions)
  } catch (error) {
    next(error)
  }
})

export default router
