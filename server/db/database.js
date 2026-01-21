import pg from 'pg'

const { Pool } = pg

let pool = null

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  }
  return pool
}

export async function initializeDatabase() {
  const pool = getPool()

  // Create bookmarks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      reddit_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      selftext TEXT,
      author TEXT NOT NULL,
      subreddit TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      num_comments INTEGER DEFAULT 0,
      url TEXT NOT NULL,
      permalink TEXT NOT NULL,
      created_utc BIGINT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'published')),
      notes TEXT,
      tags TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_reddit_id ON bookmarks(reddit_id);
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_subreddit ON bookmarks(subreddit);
  `)

  console.log('📦 PostgreSQL database initialized')
}

// Bookmark CRUD operations
export async function getAllBookmarks() {
  const pool = getPool()
  const result = await pool.query('SELECT * FROM bookmarks ORDER BY created_at DESC')
  return result.rows
}

export async function getBookmarkById(id) {
  const pool = getPool()
  const result = await pool.query('SELECT * FROM bookmarks WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function getBookmarkByRedditId(redditId) {
  const pool = getPool()
  const result = await pool.query('SELECT * FROM bookmarks WHERE reddit_id = $1', [redditId])
  return result.rows[0] || null
}

export async function createBookmark(thread, notes = '') {
  const pool = getPool()
  
  const result = await pool.query(`
    INSERT INTO bookmarks (
      reddit_id, title, selftext, author, subreddit,
      score, num_comments, url, permalink, created_utc, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    thread.id,
    thread.title,
    thread.selftext || '',
    thread.author,
    thread.subreddit,
    thread.score || 0,
    thread.num_comments || 0,
    thread.url,
    thread.permalink,
    thread.created_utc,
    notes
  ])

  return result.rows[0]
}

export async function updateBookmark(id, updates) {
  const pool = getPool()
  
  const allowedFields = ['status', 'notes', 'tags']
  const fields = Object.keys(updates).filter(k => allowedFields.includes(k))
  
  if (fields.length === 0) {
    return getBookmarkById(id)
  }

  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')
  const values = [id, ...fields.map(f => updates[f])]
  
  await pool.query(`
    UPDATE bookmarks 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1
  `, values)

  return getBookmarkById(id)
}

export async function deleteBookmark(id) {
  const pool = getPool()
  const result = await pool.query('DELETE FROM bookmarks WHERE id = $1', [id])
  return { changes: result.rowCount }
}

export async function getBookmarksByStatus(status) {
  const pool = getPool()
  const result = await pool.query(
    'SELECT * FROM bookmarks WHERE status = $1 ORDER BY created_at DESC',
    [status]
  )
  return result.rows
}
