import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Safe redirect function
  const safeRedirect = (path: string) => {
    console.log(`Attempting to redirect to: ${path}`)
    try {
      if (typeof path === 'string' && path) {
        router.push(path)
      } else {
        console.error(`Invalid redirect path: ${path}`)
      }
    } catch (error) {
      console.error('Redirect error:', error)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('User is authenticated:', session.user.email)
          if (isMounted) setUser(session.user)
        } else {
          console.log('No active session, redirecting to /auth')
          if (isMounted) {
            setUser(null)
            // Use the safe redirect
            safeRedirect('/auth')
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (isMounted) {
          setUser(null)
          // Use the safe redirect
          safeRedirect('/auth')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    
    checkAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event)
        if (isMounted) {
          setUser(session?.user || null)
          if (!session) {
            console.log('Session ended, redirecting to /auth')
            // Use the safe redirect
            safeRedirect('/auth')
          }
        }
      }
    )
    
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  return { user, isLoading }
} 