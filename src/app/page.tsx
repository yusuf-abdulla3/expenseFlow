'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Receipt, Download, Save, Edit2 } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Expense {
  date: string
  paidBy: string
  description: string
  glAccount: string
  amount: number
  hst: number
  net: number
  isUnsure?: boolean
}

interface MileageInfo {
  totalKms: number;
  workKms: number;
  workPercentage: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  percent?: number;
}

// Define the province tax rates object
const provinceTaxRates = {
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
};

// Define a type for the provinces
type Province = keyof typeof provinceTaxRates;

export default function Home() {
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

  const downloadCSV = () => {
    if (!processedData.length) return
    const dataToExport = isEditing ? editingData : processedData ?? []
    const { total, byCategory } = calculateTotals(dataToExport)

    const headers = ['Date', 'Paid By', 'Description', 'GL Account', 'Amount', 'HST', 'Net', 'Needs Review']
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => [
        row.date,
        row.paidBy,
        `"${row.description.replace(/"/g, '""')}"`,
        row.glAccount,
        row.amount.toFixed(2),
        row.hst.toFixed(2),
        row.net.toFixed(2),
        row.isUnsure ? 'Yes' : 'No'
      ].join(',')),
      '',
      'Summary',
      `Total Expenses,,$${total.toFixed(2)}`,
      '',
      'By Category',
      ...Object.entries(byCategory).map(([category, amount]) => 
        `${category},,$${amount.toFixed(2)}`
      ),
      '',
      mileageInfo ? [
        'Mileage Information',
        `Total Kilometers,,${mileageInfo.totalKms}`,
        `Work Kilometers,,${mileageInfo.workKms}`,
        `Work Percentage,,${mileageInfo.workPercentage.toFixed(2)}%`,
        `Total Transportation Expenses,,$${byCategory['Transportation'] || 0}`,
        `Work Transportation Expenses,,$${((byCategory['Transportation'] || 0) * mileageInfo.workPercentage / 100).toFixed(2)}`
      ].join('\n') : ''
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const prepareChartData = (data: Expense[]) => {
    const { byCategory } = calculateTotals(data)
    return Object.entries(byCategory).map(([name, value]) => ({
      name,
      value
    }))
  }

  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#F06292', '#4DB6AC', '#FFB74D', '#9575CD'
  ]

  const addCategory = (newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory])
    }
  }

  const removeCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove))
  }

  const categorizeExpense = async (description: string, occupation: string, categories: string[]): Promise<{ category: string, isUnsure: boolean }> => {
    const lowerDescription = description.toLowerCase();

    // Apply specific rules based on the context provided
    if (lowerDescription.includes('course') || lowerDescription.includes('training') || lowerDescription.includes('workshop')) {
      return { category: 'Professional Development', isUnsure: false };
    }
    if (lowerDescription.includes('restaurant') || lowerDescription.includes('dinner') || lowerDescription.includes('lunch') || lowerDescription.includes('cafe')) {
      return { category: 'Food', isUnsure: false };
    }
    if (lowerDescription.includes('grocery') || lowerDescription.includes('supermarket')) {
      return { category: 'Food', isUnsure: false }; // or 'Entertainment' or 'Admin/Office' based on additional context
    }
    if (lowerDescription.includes('subscription') || lowerDescription.includes('membership') || lowerDescription.includes('service')) {
      return { category: 'Admin', isUnsure: false }; // or 'Office'
    }
    if (lowerDescription.includes('phone') || lowerDescription.includes('mobile') || lowerDescription.includes('cell')) {
      return { category: 'Telephone', isUnsure: false };
    }
    if (lowerDescription.includes('gas') || lowerDescription.includes('fuel')) {
      return { category: 'Gas', isUnsure: false };
    }
    if (lowerDescription.includes('insurance')) {
      return { category: 'Insurance', isUnsure: false };
    }
    if (lowerDescription.includes('parking')) {
      return { category: 'Parking', isUnsure: false };
    }
    if (lowerDescription.includes('office') || lowerDescription.includes('stationery') || lowerDescription.includes('supplies')) {
      return { category: 'Office', isUnsure: false };
    }
    if (lowerDescription.includes('health') || lowerDescription.includes('medical') || lowerDescription.includes('pharmacy')) {
      return { category: 'Health', isUnsure: false };
    }
    if (lowerDescription.includes('entertainment') || lowerDescription.includes('movie') || lowerDescription.includes('concert')) {
      return { category: 'Entertainment', isUnsure: false };
    }
    if (lowerDescription.includes('car service') || lowerDescription.includes('maintenance') || lowerDescription.includes('repair')) {
      return { category: 'Car Service', isUnsure: false };
    }
    if (lowerDescription.includes('cleaning') || lowerDescription.includes('wash')) {
      return { category: 'Car Cleaning', isUnsure: false };
    }

    // Fallback to existing categories
    for (const category of categories) {
      if (lowerDescription.includes(category.toLowerCase())) {
        return { category, isUnsure: true }; // Mark as unsure if using fallback
      }
    }

    return { category: categories[0], isUnsure: true }; // Default to the first category and mark as unsure
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-8">
        <Receipt className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">ExpenseFlow</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Help us better categorize your expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Occupation</label>
              <Input
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g., Software Developer, Teacher, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Kilometers Driven (Year)</label>
                <Input
                  type="number"
                  onChange={(e) => {
                    const totalKms = parseFloat(e.target.value)
                    const workKms = mileageInfo?.workKms || 0
                    setMileageInfo({
                      totalKms,
                      workKms,
                      workPercentage: totalKms ? (workKms / totalKms) * 100 : 0
                    })
                  }}
                  placeholder="e.g., 20000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Work-Related Kilometers</label>
                <Input
                  type="number"
                  onChange={(e) => {
                    const workKms = parseFloat(e.target.value)
                    const totalKms = mileageInfo?.totalKms || 0
                    setMileageInfo({
                      totalKms,
                      workKms,
                      workPercentage: totalKms ? (workKms / totalKms) * 100 : 0
                    })
                  }}
                  placeholder="e.g., 5000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Province</label>
              <select value={province} onChange={(e) => setProvince(e.target.value as Province)}>
                {Object.keys(provinceTaxRates).map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Statements</CardTitle>
          <CardDescription>Upload your credit card statements (PDF) to process them into a categorized CSV file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <input 
              type="file" 
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="border p-2 rounded"
            />
            <div className="flex gap-4">
              <Button 
                onClick={processFiles} 
                disabled={files.length === 0 || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Receipt className="h-4 w-4 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                {loading ? "Processing..." : "Process Files"}
              </Button>
              <Button 
                variant="outline" 
                onClick={downloadCSV}
                disabled={processedData.length === 0}
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>Add, view, or remove your spending categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Add a new category"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCategory(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
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

      {processedData.length > 0 && (
        <>
          <Card className="mt-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Processed Expenses</CardTitle>
                  <CardDescription>
                    {processedData.length} expense{processedData.length > 1 ? 's' : ''} processed
                    {processedData.some(d => d.isUnsure) && ' (some expenses need review)'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <Button 
                      onClick={saveChanges}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  ) : (
                    <Button 
                      onClick={startEditing}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button 
                    onClick={downloadCSV}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>GL Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">HST</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isEditing ? editingData : processedData).map((row, index) => (
                      <TableRow 
                        key={index}
                        className={row.isUnsure ? "bg-yellow-50" : ""}
                      >
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={row.date}
                              onChange={(e) => handleEdit(index, 'date', e.target.value)}
                            />
                          ) : row.date}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={row.description}
                              onChange={(e) => handleEdit(index, 'description', e.target.value)}
                            />
                          ) : row.description}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={row.glAccount}
                              onChange={(e) => handleEdit(index, 'glAccount', e.target.value)}
                            />
                          ) : row.glAccount}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={row.amount}
                              onChange={(e) => handleEdit(index, 'amount', e.target.value)}
                              className="text-right"
                            />
                          ) : `$${row.amount.toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={row.hst}
                              onChange={(e) => handleEdit(index, 'hst', e.target.value)}
                              className="text-right"
                            />
                          ) : `$${row.hst.toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={row.net}
                              onChange={(e) => handleEdit(index, 'net', e.target.value)}
                              className="text-right"
                            />
                          ) : `$${row.net.toFixed(2)}`}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="checkbox"
                              checked={row.isUnsure}
                              onChange={(e) => handleEdit(index, 'isUnsure', e.target.checked.toString())}
                            />
                          ) : (row.isUnsure ? "⚠️ Needs Review" : "✓")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Total Expenses</h3>
                  <p className="text-2xl font-bold mb-8">
                    ${calculateTotals(processedData).total.toFixed(2)}
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
                  <div className="space-y-2">
                    {Object.entries(calculateTotals(processedData).byCategory).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span>{category}</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareChartData(processedData)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: ChartDataPoint) => `${name} (${(percent! * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareChartData(processedData).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[400px] md:col-span-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareChartData(processedData)}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="value" name="Amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {mileageInfo && (
                <div className="mt-8 border-t pt-8">
                  <h3 className="text-lg font-semibold mb-4">Mileage Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Kilometers</p>
                      <p className="text-lg font-semibold">{mileageInfo.totalKms.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Work Kilometers</p>
                      <p className="text-lg font-semibold">{mileageInfo.workKms.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Work Percentage</p>
                      <p className="text-lg font-semibold">{mileageInfo.workPercentage.toFixed(2)}%</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Work Transportation Expenses</p>
                      <p className="text-lg font-semibold">
                        ${((calculateTotals(processedData).byCategory['Transportation'] || 0) * mileageInfo.workPercentage / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}
