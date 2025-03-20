import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CategoryManagerProps {
  categories: string[]
  addCategory: (category: string) => void
  removeCategory: (category: string) => void
}

export function CategoryManager({ categories, addCategory, removeCategory }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('')

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim())
      setNewCategory('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddCategory()
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>Add, view, or remove your spending categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleAddCategory}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center bg-gray-200 px-2 py-1 rounded">
                <span>{category}</span>
                <button
                  onClick={() => removeCategory(category)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 