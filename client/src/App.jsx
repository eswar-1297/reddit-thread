import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Quora from './pages/Quora'
import GoogleCommunity from './pages/GoogleCommunity'
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
            <Route path="/bookmarks" element={<Bookmarks darkMode={darkMode} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App


