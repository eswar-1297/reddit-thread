import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import searchRoutes from './routes/search.js'
import bookmarkRoutes from './routes/bookmarks.js'
import { initializeDatabase } from './db/database.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/search', searchRoutes)
app.use('/api/bookmarks', bookmarkRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase()
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📡 Reddit Thread Finder API ready`)
    })
  } catch (error) {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  }
}

startServer()
