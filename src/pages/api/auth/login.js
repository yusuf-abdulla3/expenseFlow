import { supabase } from '@/lib/supabase'

export default async function handler(req, res) {
  try {
    const redirectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard`
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    })
    
    if (error) throw error
    
    return res.redirect(302, data.url)
  } catch (error) {
    console.error('Login error:', error)
    return res.redirect(302, '/auth/fallback?error=true')
  }
} 