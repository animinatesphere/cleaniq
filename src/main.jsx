import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RegionProvider } from './context/RegionContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RegionProvider>
        <App />
      </RegionProvider>
    </BrowserRouter>
  </StrictMode>,
)
