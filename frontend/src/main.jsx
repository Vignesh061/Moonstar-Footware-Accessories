import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const root = createRoot(document.getElementById('root'))

// Render app — wrap with GoogleOAuthProvider only when Client ID is configured.
// Without a Client ID the app works fully; Google login button is just hidden.
if (GOOGLE_CLIENT_ID) {
  import('@react-oauth/google').then(({ GoogleOAuthProvider }) => {
    root.render(
      <StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </StrictMode>
    )
  })
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

function removeSplash() {
  const splash = document.getElementById('app-splash')
  if (!splash) return
  setTimeout(() => {
    requestAnimationFrame(() => {
      splash.classList.add('splash--hidden')
      splash.addEventListener('transitionend', () => splash.remove(), { once: true })
    })
  }, 1800)
}

removeSplash()
