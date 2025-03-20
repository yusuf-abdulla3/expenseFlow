import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TestComponent() {
  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Styling Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This is a test component to verify that the styling is working correctly.
          </p>
          <div className="space-y-4">
            <Button variant="default" className="w-full">Default Button</Button>
            <Button variant="destructive" className="w-full">Destructive Button</Button>
            <Button variant="outline" className="w-full">Outline Button</Button>
            <Button variant="secondary" className="w-full">Secondary Button</Button>
            <Button variant="ghost" className="w-full">Ghost Button</Button>
            <Button variant="link" className="w-full">Link Button</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 