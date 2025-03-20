import { useState } from 'react'
import { categorizeExpense } from '@/utils/categorize'

export interface Expense {
  date: string
  paidBy: string
  description: string
  glAccount: string
  amount: number
  hst: number
  net: number
  isUnsure?: boolean
}

export interface MileageInfo {
  totalKms: number
  workKms: number
  workPercentage: number
}

export type Province = keyof typeof provinceTaxRates

// Define the province tax rates object
export const provinceTaxRates = {
  Alberta: 0.05,
  'British Columbia': 0.12,
  Manitoba: 0.12,
  'New Brunswick': 0.15,
  'Newfoundland and Labrador': 0.15,
  'Northwest Territories': 0.05,
  'Nova Scotia': 0.15,
  Nunavut: 0.05,
  Ontario: 0.13,
  'Prince Edward Island': 0.15,
  Quebec: 0.14975,
  Saskatchewan: 0.11,
  Yukon: 0.05
}

export function useExpenses() {
  const [files, setFiles] = useState<File[]>([])
  const [processedData, setProcessedData] = useState<Expense[]>([])
  const [editingData, setEditingData] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [occupation, setOccupation] = useState<string>('')
  const [mileageInfo, setMileageInfo] = useState<MileageInfo | null>(null)
  const [categories, setCategories] = useState<string[]>([
    'Personal', 'Food', 'Gas', 'Car Service', 'Car Cleaning', 
    'Office', 'Insurance', 'Telephone', 'Parking', 
    'Professional Development', 'Health', 'Entertainment', 'Admin'
  ])
  const [province, setProvince] = useState<Province>('Ontario')

  const calculateTax = (amount: number, province: Province) => {
    const taxRate = provinceTaxRates[province] || 0.13 // Default to Ontario if not found
    return amount * taxRate
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const processFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process files')
      }

      const categorizedData = await Promise.all(data.data.map(async (expense: Expense) => {
        const { category, isUnsure } = await categorizeExpense(expense.description, occupation, categories)
        const tax = calculateTax(expense.amount, province)
        return {
          ...expense,
          glAccount: category,
          hst: tax,
          isUnsure
        }
      }))

      setProcessedData(categorizedData)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (index: number, field: keyof Expense, value: string | number | boolean) => {
    const newData = [...editingData]
    let newValue: string | number | boolean = value

    // Handle numeric fields
    if (field === 'amount' || field === 'hst' || field === 'net') {
      newValue = parseFloat(value as string) || 0
      
      // Recalculate net if amount or hst changes
      if (field === 'amount') {
        newData[index].hst = parseFloat((newValue as number * 0.13).toFixed(2))
        newData[index].net = parseFloat((newValue as number - newData[index].hst).toFixed(2))
      } else if (field === 'hst') {
        newData[index].net = parseFloat((newData[index].amount - newValue as number).toFixed(2))
      }
    }

    newData[index] = {
      ...newData[index],
      [field]: newValue
    }

    setEditingData(newData)
  }

  const startEditing = () => {
    setEditingData([...processedData])
    setIsEditing(true)
  }

  const saveChanges = () => {
    setProcessedData([...editingData])
    setIsEditing(false)
  }

  const calculateTotals = (data: Expense[]) => {
    const total = data.reduce((sum, expense) => sum + expense.amount, 0)
    const byCategory = data.reduce((acc, expense) => {
      acc[expense.glAccount] = (acc[expense.glAccount] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
    
    return { total, byCategory }
  }

  const addCategory = (newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory])
    }
  }

  const removeCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove))
  }

  const updateMileageInfo = (field: keyof MileageInfo, value: number) => {
    const currentInfo = mileageInfo || { totalKms: 0, workKms: 0, workPercentage: 0 }
    
    let newInfo: MileageInfo
    
    if (field === 'totalKms') {
      const workPercentage = currentInfo.workKms > 0 ? (currentInfo.workKms / value) * 100 : 0
      newInfo = { ...currentInfo, totalKms: value, workPercentage }
    } else if (field === 'workKms') {
      const workPercentage = currentInfo.totalKms > 0 ? (value / currentInfo.totalKms) * 100 : 0
      newInfo = { ...currentInfo, workKms: value, workPercentage }
    } else {
      newInfo = { ...currentInfo, [field]: value }
    }
    
    setMileageInfo(newInfo)
  }

  return {
    files,
    processedData,
    editingData,
    loading,
    error,
    isEditing,
    occupation,
    setOccupation,
    mileageInfo,
    updateMileageInfo,
    categories,
    province,
    setProvince,
    handleFileUpload,
    processFiles,
    handleEdit,
    startEditing,
    saveChanges,
    calculateTotals,
    addCategory,
    removeCategory
  }
} 