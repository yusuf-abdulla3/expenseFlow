'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaGoogle, FaFacebook, FaRegLightbulb } from 'react-icons/fa'
import { LuBrain, LuSparkles } from 'react-icons/lu'
import { HiOutlineDocumentReport } from 'react-icons/hi'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const router = useRouter()
  
  const features = [
    {
      title: "AI Analysis",
      description: "Smart categorization of expenses",
      icon: <LuBrain className="w-5 h-5 text-purple-600" />
    },
    {
      title: "Time Saving",
      description: "Process in minutes, not hours",
      icon: <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    },
    {
      title: "Secure",
      description: "End-to-end encryption for your data",
      icon: <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    },
    {
      title: "Insights",
      description: "Visual reports to track spending",
      icon: <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    }
  ]
  
  useEffect(() => {
    // Rotate through features every 3 seconds
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [features.length])

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
    } catch (error) {
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
    } catch (error) {
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
      
      {/* Left side - Image */}
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90 rounded-r-3xl"></div>
        
        <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-md mx-auto transform transition-all duration-500 hover:scale-105">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6 shadow-lg">
                <HiOutlineDocumentReport className="w-14 h-14 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gradient mb-3">Smart Tax Processing</h2>
              <p className="text-gray-600 text-lg">
                Our AI-powered system automatically categorizes your expenses and maximizes your deductions
              </p>
            </div>
            
            <div className="mt-10 relative">
              <div className="grid grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col items-center text-center p-5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm border border-purple-100 transition-all duration-300 ${activeFeature === index ? 'scale-110 shadow-md border-purple-200' : 'opacity-70'}`}
                  >
                    <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-6 space-x-2">
                {features.map((_, index) => (
                  <button 
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${activeFeature === index ? 'bg-purple-600 w-6' : 'bg-gray-300'}`}
                    aria-label={`View feature ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-10 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-full mr-3 shrink-0">
                  <FaRegLightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Did you know?</h3>
                  <p className="text-gray-600 mt-1">Users save an average of 5 hours per month on expense tracking with our AI tools.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10">
        <Card className="w-full max-w-md border border-gray-100 shadow-xl rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2"></div>
          <CardContent className="p-10">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
                <LuSparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gradient mb-2">Welcome!</h1>
            <p className="text-gray-500 text-center mb-8">
              Login to simplify your tax journey
            </p>

            <div className="space-y-4">
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
                <span className="px-3 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <Link 
              href="/auth/email" 
              className="block w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-300 shadow-md hover:shadow-lg text-center transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign in with Email
            </Link>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Don't have an account?{' '}
                <Link 
                  href="/auth/email?signup=true" 
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign up
                </Link>
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