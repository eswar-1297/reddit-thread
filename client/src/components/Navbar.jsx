import { Link, useLocation } from 'react-router-dom'
// COMMENTED OUT: Code, Newspaper, Github, Wrench, Rocket icons - temporarily disabled
import { Search, Bookmark, Sun, Moon, HelpCircle, Users, /* Code, */ Monitor, /* Newspaper, Wrench, Rocket, Github */ } from 'lucide-react'

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
              <span className="hidden sm:inline">Reddit</span>
            </Link>
            
            <Link
              to="/quora"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/quora')
                  ? 'bg-red-500 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <HelpCircle size={18} />
              <span className="hidden sm:inline">Quora</span>
            </Link>
            
            <Link
              to="/google-community"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/google-community')
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Users size={18} />
              <span className="hidden sm:inline">Google</span>
            </Link>
            
            {/* COMMENTED OUT: Stack Overflow - temporarily disabled */}
            {/* <Link
              to="/stackoverflow"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/stackoverflow')
                  ? 'bg-orange-500 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Code size={18} />
              <span className="hidden sm:inline">Stack</span>
            </Link> */}
            
            <Link
              to="/microsoft-tech"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/microsoft-tech')
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Monitor size={18} />
              <span className="hidden sm:inline">MS Tech</span>
            </Link>
            
            {/* COMMENTED OUT: Hacker News - temporarily disabled */}
            {/* <Link
              to="/hackernews"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/hackernews')
                  ? 'bg-orange-600 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Newspaper size={18} />
              <span className="hidden sm:inline">HN</span>
            </Link> */}
            
            {/* COMMENTED OUT: Spiceworks - temporarily disabled */}
            {/* <Link
              to="/spiceworks"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/spiceworks')
                  ? 'bg-green-600 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Wrench size={18} />
              <span className="hidden sm:inline">IT</span>
            </Link> */}
            
            {/* COMMENTED OUT: Product Hunt - temporarily disabled */}
            {/* <Link
              to="/producthunt"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/producthunt')
                  ? 'bg-orange-500 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Rocket size={18} />
              <span className="hidden sm:inline">PH</span>
            </Link> */}
            
            {/* COMMENTED OUT: GitHub - temporarily disabled */}
            {/* <Link
              to="/github"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/github')
                  ? darkMode ? 'bg-white text-black' : 'bg-gray-800 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-reddit-gray hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Github size={18} />
              <span className="hidden sm:inline">GH</span>
            </Link> */}
            
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


