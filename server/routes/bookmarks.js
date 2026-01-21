import { Router } from 'express'
import {
  getAllBookmarks,
  getBookmarkById,
  getBookmarkByRedditId,
  createBookmark,
  updateBookmark,
  deleteBookmark
} from '../db/database.js'

const router = Router()

// Export bookmarks as CSV (must be before /:id to avoid conflicts)
router.get('/export', async (req, res) => {
  try {
    const bookmarks = await getAllBookmarks()
    
    const headers = ['ID', 'Title', 'Subreddit', 'Author', 'Score', 'Comments', 'Status', 'Notes', 'URL', 'Saved Date']
    const rows = bookmarks.map(b => [
      b.id,
      `"${b.title.replace(/"/g, '""')}"`,
      b.subreddit,
      b.author,
      b.score,
      b.num_comments,
      b.status,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
      b.url,
      b.created_at
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="bookmarks-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csv)
  } catch (error) {
    console.error('Error exporting bookmarks:', error)
    res.status(500).json({ message: 'Failed to export bookmarks' })
  }
})

// Get all bookmarks
router.get('/', async (req, res) => {
  try {
    const bookmarks = await getAllBookmarks()
    res.json(bookmarks)
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    res.status(500).json({ message: 'Failed to fetch bookmarks' })
  }
})

// Get single bookmark
router.get('/:id', async (req, res) => {
  try {
    const bookmark = await getBookmarkById(req.params.id)
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' })
    }
    res.json(bookmark)
  } catch (error) {
    console.error('Error fetching bookmark:', error)
    res.status(500).json({ message: 'Failed to fetch bookmark' })
  }
})

// Create bookmark
router.post('/', async (req, res) => {
  try {
    const { thread, notes } = req.body

    if (!thread || !thread.id) {
      return res.status(400).json({ message: 'Thread data is required' })
    }

    // Check if already bookmarked
    const existing = await getBookmarkByRedditId(thread.id)
    if (existing) {
      return res.status(409).json({ 
        message: 'Thread already bookmarked',
        bookmark: existing
      })
    }

    const bookmark = await createBookmark(thread, notes || '')
    res.status(201).json(bookmark)
  } catch (error) {
    console.error('Error creating bookmark:', error)
    res.status(500).json({ message: 'Failed to create bookmark' })
  }
})

// Update bookmark
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const existing = await getBookmarkById(id)
    if (!existing) {
      return res.status(404).json({ message: 'Bookmark not found' })
    }

    const bookmark = await updateBookmark(id, updates)
    res.json(bookmark)
  } catch (error) {
    console.error('Error updating bookmark:', error)
    res.status(500).json({ message: 'Failed to update bookmark' })
  }
})

// Delete bookmark
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const existing = await getBookmarkById(id)
    if (!existing) {
      return res.status(404).json({ message: 'Bookmark not found' })
    }

    await deleteBookmark(id)
    res.json({ message: 'Bookmark deleted successfully' })
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    res.status(500).json({ message: 'Failed to delete bookmark' })
  }
})

export default router
