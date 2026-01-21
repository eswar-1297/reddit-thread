import { Link, useLocation } from 'react-router-dom'
import { Search, Bookmark, Sun, Moon } from 'lucide-react'

function Navbar({ darkMode, setDarkMode }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      darkMode 
        ? 'bg-reddit-dark/90 border-reddit-gray' 
        : 'bg-white/90 border-gray-200'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-reddit-orange flex items-center justify-center group-hover:animate-pulse-glow transition-all">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg tracking-tight">
                <span className="text-reddit-orange">Reddit</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}> Thread Finder</span>
              </h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Find threads for content marketing
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/')
                  ? 'bg-reddit-orange text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </Link>
            
            <Link
              to="/bookmarks"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/bookmarks')
                  ? 'bg-reddit-orange text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Bookmark size={18} />
              <span className="hidden sm:inline">Bookmarks</span>
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all ${
                darkMode
                  ? 'text-yellow-400 hover:bg-reddit-gray'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

