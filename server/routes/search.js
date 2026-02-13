import { Router } from 'express'
import { searchReddit, getSubredditSuggestions } from '../services/reddit.js'
import { crossReferenceSearch } from '../services/crossReference.js'
import { crossReferenceQuoraSearch } from '../services/crossReferenceQuora.js'
import { crossReferenceGoogleCommunitySearch } from '../services/crossReferenceGoogleCommunity.js'
// COMMENTED OUT: Stack Overflow, Hacker News, GitHub - temporarily disabled
// import { crossReferenceStackOverflowSearch } from '../services/crossReferenceStackOverflow.js'
import { crossReferenceMicrosoftTechSearch } from '../services/crossReferenceMicrosoftTech.js'
// import { crossReferenceHackerNewsSearch } from '../services/crossReferenceHackerNews.js'
// COMMENTED OUT: Spiceworks and Product Hunt - temporarily disabled
// import { crossReferenceSpiceworksSearch } from '../services/crossReferenceSpiceworks.js'
// import { crossReferenceProductHuntSearch } from '../services/crossReferenceProductHunt.js'
// import { crossReferenceGitHubSearch } from '../services/crossReferenceGitHub.js'

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

// Google Community search using Search APIs (Bing + Google CSE)
router.get('/google-community', async (req, res, next) => {
  try {
    const { q, limit, bing, google, time, product } = req.query

    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query is required' })
    }

    console.log('\n🔍 Google Community Search API Request')
    console.log('Query:', q)
    console.log('Time Filter:', time || 'all')
    console.log('Product Filter:', product || 'all')

    const results = await crossReferenceGoogleCommunitySearch(q.trim(), {
      useBing: bing !== 'false',
      useGoogle: google !== 'false',
      limit: parseInt(limit) || 150,
      timeFilter: time || 'all',
      productFilter: product || 'all'
    })

    res.json(results)
  } catch (error) {
    console.error('Google Community search error:', error)
    next(error)
  }
})

// COMMENTED OUT: Stack Overflow search - temporarily disabled
// router.get('/stackoverflow', async (req, res, next) => {
//   try {
//     const { q, limit, stackexchange, bing, google, time, tags, minScore, minAnswers } = req.query
//
//     if (!q || !q.trim()) {
//       return res.status(400).json({ message: 'Search query is required' })
//     }
//
//     console.log('\n🔍 Stack Overflow Search API Request')
//     console.log('Query:', q)
//     console.log('Time Filter:', time || 'all')
//     console.log('Tags:', tags || 'none')
//
//     const results = await crossReferenceStackOverflowSearch(q.trim(), {
//       useStackExchange: stackexchange !== 'false',
//       useBing: bing !== 'false',
//       useGoogle: google !== 'false',
//       limit: parseInt(limit) || 150,
//       timeFilter: time || 'all',
//       tags: tags || '',
//       minScore: parseInt(minScore) || 0,
//       minAnswers: parseInt(minAnswers) || 0
//     })
//
//     res.json(results)
//   } catch (error) {
//     console.error('Stack Overflow search error:', error)
//     next(error)
//   }
// })

// Microsoft Tech Community search using Bing + Google CSE
router.get('/microsoft-tech', async (req, res, next) => {
  try {
    const { q, limit, bing, google, time, product } = req.query

    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query is required' })
    }

    console.log('\n🔍 Microsoft Tech Community Search API Request')
    console.log('Query:', q)
    console.log('Time Filter:', time || 'all')
    console.log('Product Filter:', product || 'all')

    const results = await crossReferenceMicrosoftTechSearch(q.trim(), {
      useBing: bing !== 'false',
      useGoogle: google !== 'false',
      limit: parseInt(limit) || 150,
      timeFilter: time || 'all',
      productFilter: product || 'all'
    })

    res.json(results)
  } catch (error) {
    console.error('Microsoft Tech Community search error:', error)
    next(error)
  }
})

// COMMENTED OUT: Hacker News search - temporarily disabled
// router.get('/hackernews', async (req, res, next) => {
//   try {
//     const { q, limit, hn, bing, google, time, type, minPoints } = req.query
//
//     if (!q || !q.trim()) {
//       return res.status(400).json({ message: 'Search query is required' })
//     }
//
//     console.log('\n🔍 Hacker News Search API Request')
//     console.log('Query:', q)
//     console.log('Time Filter:', time || 'all')
//     console.log('Story Type:', type || 'all')
//
//     const results = await crossReferenceHackerNewsSearch(q.trim(), {
//       useHackerNews: hn !== 'false',
//       useBing: bing !== 'false',
//       useGoogle: google !== 'false',
//       limit: parseInt(limit) || 150,
//       timeFilter: time || 'all',
//       storyType: type || 'all',
//       minPoints: parseInt(minPoints) || 0
//     })
//
//     res.json(results)
//   } catch (error) {
//     console.error('Hacker News search error:', error)
//     next(error)
//   }
// })

// COMMENTED OUT: Spiceworks search - temporarily disabled
// router.get('/spiceworks', async (req, res, next) => {
//   try {
//     const { q, limit, bing, google, time, category } = req.query
//
//     if (!q || !q.trim()) {
//       return res.status(400).json({ message: 'Search query is required' })
//     }
//
//     console.log('\n🔍 Spiceworks Search API Request')
//     console.log('Query:', q)
//     console.log('Time Filter:', time || 'all')
//     console.log('Category:', category || 'all')
//
//     const results = await crossReferenceSpiceworksSearch(q.trim(), {
//       useBing: bing !== 'false',
//       useGoogle: google !== 'false',
//       limit: parseInt(limit) || 150,
//       timeFilter: time || 'all',
//       categoryFilter: category || 'all'
//     })
//
//     res.json(results)
//   } catch (error) {
//     console.error('Spiceworks search error:', error)
//     next(error)
//   }
// })

// COMMENTED OUT: Product Hunt search - temporarily disabled
// router.get('/producthunt', async (req, res, next) => {
//   try {
//     const { q, limit, bing, google, time, type } = req.query
//
//     if (!q || !q.trim()) {
//       return res.status(400).json({ message: 'Search query is required' })
//     }
//
//     console.log('\n🔍 Product Hunt Search API Request')
//     console.log('Query:', q)
//     console.log('Time Filter:', time || 'all')
//     console.log('Content Type:', type || 'all')
//
//     const results = await crossReferenceProductHuntSearch(q.trim(), {
//       useBing: bing !== 'false',
//       useGoogle: google !== 'false',
//       limit: parseInt(limit) || 150,
//       timeFilter: time || 'all',
//       contentType: type || 'all'
//     })
//
//     res.json(results)
//   } catch (error) {
//     console.error('Product Hunt search error:', error)
//     next(error)
//   }
// })

// COMMENTED OUT: GitHub Discussions search - temporarily disabled
// router.get('/github', async (req, res, next) => {
//   try {
//     const { q, limit, gh, bing, google, time, type } = req.query
//
//     if (!q || !q.trim()) {
//       return res.status(400).json({ message: 'Search query is required' })
//     }
//
//     console.log('\n🔍 GitHub Search API Request')
//     console.log('Query:', q)
//     console.log('Time Filter:', time || 'all')
//     console.log('Content Type:', type || 'all')
//
//     const results = await crossReferenceGitHubSearch(q.trim(), {
//       useGitHub: gh !== 'false',
//       useBing: bing !== 'false',
//       useGoogle: google !== 'false',
//       limit: parseInt(limit) || 150,
//       timeFilter: time || 'all',
//       contentType: type || 'all'
//     })
//
//     res.json(results)
//   } catch (error) {
//     console.error('GitHub search error:', error)
//     next(error)
//   }
// })

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
