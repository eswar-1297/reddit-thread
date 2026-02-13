import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Quora from './pages/Quora'
import GoogleCommunity from './pages/GoogleCommunity'
// COMMENTED OUT: Stack Overflow, Hacker News, GitHub - temporarily disabled
// import StackOverflow from './pages/StackOverflow'
import MicrosoftTech from './pages/MicrosoftTech'
// import HackerNews from './pages/HackerNews'
// COMMENTED OUT: Spiceworks and Product Hunt - temporarily disabled
// import Spiceworks from './pages/Spiceworks'
// import ProductHunt from './pages/ProductHunt'
// import GitHub from './pages/GitHub'
import Bookmarks from './pages/Bookmarks'
import Navbar from './components/Navbar'

function App() {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <BrowserRouter>
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-reddit-darker via-reddit-dark to-reddit-gray text-gray-100' 
          : 'bg-gradient-to-br from-orange-50 via-white to-gray-100 text-gray-900'
      }`}>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home darkMode={darkMode} />} />
            <Route path="/quora" element={<Quora darkMode={darkMode} />} />
            <Route path="/google-community" element={<GoogleCommunity darkMode={darkMode} />} />
            {/* COMMENTED OUT: Stack Overflow, Hacker News, GitHub - temporarily disabled */}
            {/* <Route path="/stackoverflow" element={<StackOverflow darkMode={darkMode} />} /> */}
            <Route path="/microsoft-tech" element={<MicrosoftTech darkMode={darkMode} />} />
            {/* <Route path="/hackernews" element={<HackerNews darkMode={darkMode} />} /> */}
            {/* COMMENTED OUT: Spiceworks and Product Hunt - temporarily disabled */}
            {/* <Route path="/spiceworks" element={<Spiceworks darkMode={darkMode} />} /> */}
            {/* <Route path="/producthunt" element={<ProductHunt darkMode={darkMode} />} /> */}
            {/* <Route path="/github" element={<GitHub darkMode={darkMode} />} /> */}
            <Route path="/bookmarks" element={<Bookmarks darkMode={darkMode} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App


