'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { FaGoogle, FaFacebook, FaRegLightbulb } from 'react-icons/fa'
import { LuBrain, LuSparkles } from 'react-icons/lu'
import { HiOutlineDocumentReport } from 'react-icons/hi'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const router = useRouter()
  
  const tips = [
    "Upload multiple receipts at once to save time",
    "Categorize expenses automatically with our AI",
    "Export reports in multiple formats for your accountant",
    "Set up recurring expense tracking for subscriptions"
  ]
  
  useEffect(() => {
    // Rotate through tips every 5 seconds
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [tips.length])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        })
        
        if (error) throw error
        
        toast.success('Check your email for the confirmation link')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      setError(error.message || 'An error occurred during authentication')
      toast.error(error.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        throw error
      }
      
      // The redirect is handled by Supabase, so we don't need to do anything here
    } catch (error: any) {
      console.error('Error logging in with Google:', error)
      toast.error('Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        throw error
      }
      
      // The redirect is handled by Supabase
    } catch (error: any) {
      console.error('Error logging in with Facebook:', error)
      toast.error('Failed to sign in with Facebook')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Left side - Features */}
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90 rounded-r-3xl"></div>
        
        <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-md mx-auto transition-transform duration-500 hover:scale-105">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6 shadow-lg">
                <HiOutlineDocumentReport className="w-14 h-14 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gradient mb-3">Smart Tax Processing</h2>
              <p className="text-gray-600 text-lg">
                Our AI-powered system automatically categorizes your expenses and maximizes your deductions
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-10">
              <div className="flex flex-col items-center text-center p-5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm border border-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                  <LuBrain className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800">AI Analysis</h3>
                <p className="text-gray-500 text-sm mt-1">Smart categorization of expenses</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm border border-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Time Saving</h3>
                <p className="text-gray-500 text-sm mt-1">Process in minutes, not hours</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm border border-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Secure</h3>
                <p className="text-gray-500 text-sm mt-1">End-to-end encryption for your data</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm border border-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Insights</h3>
                <p className="text-gray-500 text-sm mt-1">Visual reports to track spending</p>
              </div>
            </div>
            
            <div className="mt-10 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-full mr-3 shrink-0">
                  <FaRegLightbulb className="w-5 h-5 text-white" />
                </div>
                <div className="relative h-14 overflow-hidden">
                  <h3 className="font-medium text-gray-800">Pro Tip:</h3>
                  {tips.map((tip, index) => (
                    <p 
                      key={index} 
                      className={`text-gray-600 mt-1 absolute transition-all duration-500 ${
                        tipIndex === index 
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 translate-y-10'
                      }`}
                    >
                      {tip}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10">
        <Card className="w-full max-w-md border border-gray-100 shadow-xl rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2"></div>
          <CardContent className="p-10">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
                <LuSparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gradient mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back!'}
            </h1>
            <p className="text-gray-500 text-center mb-8">
              {isSignUp ? 'Sign up to start managing your expenses' : 'Login to continue your tax journey'}
            </p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <Button 
                variant="outline" 
                className="w-full py-6 flex items-center justify-center gap-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <FaGoogle className="w-5 h-5 text-red-500" />
                <span className="font-medium">Continue with Google</span>
                {isLoading && (
                  <svg className="animate-spin ml-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full py-6 flex items-center justify-center gap-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleFacebookLogin}
                disabled={isLoading}
              >
                <FaFacebook className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Continue with Facebook</span>
                {isLoading && (
                  <svg className="animate-spin ml-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </Button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <div className="relative group">
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-hover:text-purple-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 py-6 rounded-xl border-gray-200 focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-300 hover:border-purple-300"
                  />
                </div>
              </div>
              
              <div>
                <div className="relative group">
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-hover:text-purple-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 py-6 rounded-xl border-gray-200 focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-300 hover:border-purple-300"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-center text-gray-400">
                By continuing, you agree to our{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700">Privacy Policy</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 