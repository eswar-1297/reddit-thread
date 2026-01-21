# Reddit Thread Finder - AI Cross-Reference Edition

Find Reddit threads that are visible across the **entire AI ecosystem** - Gemini, ChatGPT, and web search engines.

![Reddit Thread Finder](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![AI](https://img.shields.io/badge/AI-Powered-purple)

## How It Works

```
Your Keyword
    ↓
┌───────────────────────────────────────────────┐
│  Cross-Reference Engine                        │
├───────────────────────────────────────────────┤
│  🔵 Gemini/Google  →  What Google indexes     │
│  🟢 ChatGPT/OpenAI →  What ChatGPT knows      │
│  🟠 Brave Search   →  What's on the web       │
└───────────────────────────────────────────────┘
    ↓
Threads found in MULTIPLE sources = Maximum AI Visibility
    ↓
Your team posts content there = Better AI search rankings
```

## Features

- **AI Cross-Reference Search**: Find threads indexed by multiple AI systems
- **Multi-Source Scoring**: Threads in more sources = higher visibility score
- **Source Badges**: See which AI systems index each thread
- **Bookmark Management**: Save and track threads for your content team
- **Export to CSV**: Share findings with your team

## Prerequisites

- Node.js 18+
- API Keys:
  - **Gemini API Key** (Google AI) - [Get it free](https://makersuite.google.com/app/apikey)
  - **OpenAI API Key** - [Get it here](https://platform.openai.com/api-keys)
  - **Brave Search API Key** (FREE 2000/month) - [Get it free](https://brave.com/search/api/)

## Quick Start

### 1. Install Dependencies

```bash
cd reddit-thread-finder

# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies  
cd ../server && npm install
```

### 2. Configure API Keys

Create a `.env` file in the `server` folder:

```bash
cd server
cp env.template .env
```

Edit `.env` with your API keys:

```env
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
BRAVE_API_KEY=your_brave_key_here
PORT=5000
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 4. Open in Browser

Go to: **http://localhost:3000**

## Usage

1. **Select "AI Cross-Reference" mode** (default)
2. **Enter your keyword** (e.g., "migrate from teams to slack")
3. **View results** - Threads are ranked by AI Visibility Score
4. **Look for badges**:
   - 🔵 **Gemini** - Found in Google/Gemini
   - 🟢 **ChatGPT** - Known to OpenAI
   - 🟠 **Brave** - Indexed on web
   - 🟣 **Multi-Source** - Found in 2+ sources (BEST for visibility!)
5. **Bookmark threads** for your content team

## AI Visibility Score

```
Score = 
  (Found in Gemini? +30) +
  (Found in ChatGPT? +30) +
  (Found in Brave? +20) +
  (Multi-source bonus: +25 to +50) +
  (Reddit upvotes / 10) +
  (Reddit comments × 2)
```

**Higher score = More AI visibility = Better for your content strategy**

## API Endpoints

### AI Cross-Reference Search
```
GET /api/search/ai?q=keyword&gemini=true&openai=true&brave=true
```

### Basic Reddit Search
```
GET /api/search?q=keyword&subreddit=tech&sort=top
```

### Bookmarks
```
GET    /api/bookmarks          - List all
POST   /api/bookmarks          - Create
PATCH  /api/bookmarks/:id      - Update
DELETE /api/bookmarks/:id      - Delete
GET    /api/bookmarks/export   - Export CSV
```

## Project Structure

```
reddit-thread-finder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Home, Bookmarks
│   │   └── services/       # API client
│   └── package.json
├── server/                 # Node.js backend
│   ├── services/
│   │   ├── gemini.js       # Gemini/Google integration
│   │   ├── openai.js       # ChatGPT integration
│   │   ├── brave.js        # Brave Search integration
│   │   ├── crossReference.js  # Combines all sources
│   │   └── reddit.js       # Reddit API
│   ├── routes/
│   ├── db/
│   └── package.json
└── README.md
```

## Why This Matters for AI Visibility

When AI systems (ChatGPT, Gemini, Perplexity, etc.) answer questions, they often cite Reddit threads. By:

1. **Finding threads AI already knows about**
2. **Posting helpful content in those threads**
3. **Your content becomes part of AI responses**

This is a legitimate content marketing strategy for the AI era.

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **AI APIs**: Gemini, OpenAI, Brave Search
- **Database**: SQLite

## License

MIT
