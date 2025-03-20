import '../app/globals.css'
import { useState, useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { Toaster } from 'sonner'

function MyApp({ Component, pageProps }) {
  const [authError, setAuthError] = useState(false)
  
  useEffect(() => {
    // Listen for auth errors
    const handleError = (event) => {
      if (event.message && event.message.includes('auth')) {
        console.error('Auth error detected:', event)
        setAuthError(true)
      }
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  // If there's an auth error, show a simple fallback
  if (authError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Authentication Error</h1>
        <p>There was a problem with authentication. Please try again.</p>
        <button 
          onClick={() => window.location.href = '/auth/fallback'}
          style={{ 
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    )
  }
  
  // Check if we're in the Pages Router
  const isInPagesRouter = !Component.getLayout && !Component.__N_SSG
  
  // Only wrap with AuthProvider if we're in the Pages Router
  if (isInPagesRouter) {
    return (
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </AuthProvider>
    )
  }
  
  // For App Router pages, don't wrap with AuthProvider
  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </>
  )
}

export default MyApp 