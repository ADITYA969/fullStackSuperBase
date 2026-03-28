import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Toaster } from 'react-hot-toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#12121a',
          color: '#e8e8f0',
          border: '1px solid #2a2a3d',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
        },
      }}
    />
  </React.StrictMode>
)
