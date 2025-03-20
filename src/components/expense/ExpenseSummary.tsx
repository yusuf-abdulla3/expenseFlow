import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Expense, MileageInfo } from '@/hooks/useExpenses'
import { ExpensePieChart } from '../charts/ExpensePieChart'
import { ExpenseBarChart } from '../charts/ExpenseBarChart'
import { generateCSV, downloadCSV, saveCSVToSupabase } from '@/utils/csv'
import { Download, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useState } from 'react'

interface ExpenseSummaryProps {
  processedData: Expense[]
  mileageInfo: MileageInfo | null
  calculateTotals: (data?: Expense[]) => { amount: number, hst: number, net: number }
}

interface ChartDataPoint {
  name: string
  value: number
  percent?: number
}

export function ExpenseSummary({ processedData, mileageInfo, calculateTotals }: ExpenseSummaryProps) {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  
  if (processedData.length === 0) {
    return null
  }

  // Calculate totals and group expenses by category
  const totals = calculateTotals(processedData)
  
  // Group expenses by category for charts
  const byCategory: Record<string, number> = processedData.reduce((acc, expense) => {
    const category = expense.glAccount || 'Uncategorized'
    acc[category] = (acc[category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const prepareChartData = (): ChartDataPoint[] => {
    // Convert to array and sort by amount (descending)
    const chartData = Object.entries(byCategory || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    
    // Calculate percentages
    const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0)
    return chartData.map(item => ({
      ...item,
      percent: totalAmount > 0 ? item.value / totalAmount : 0
    }))
  }

  const handleExportCSV = () => {
    const csvContent = generateCSV(processedData, mileageInfo, byCategory)
    downloadCSV(csvContent)
  }
  
  const handleSaveToSupabase = async () => {
    if (!user) {
      toast.error('You must be logged in to save expenses')
      return
    }
    
    setIsSaving(true)
    try {
      console.log('Starting save to Supabase with user ID:', user.id)
      
      if (!user.id) {
        throw new Error('User ID is missing or invalid')
      }
      
      const csvContent = generateCSV(processedData, mileageInfo, byCategory)
      const filename = `Expense-Report-${new Date().toLocaleDateString('en-CA')}`
      
      try {
        const recordId = await saveCSVToSupabase(csvContent, user.id, { filename })
        
        if (recordId) {
          toast.success('Expense report saved successfully')
        } else {
          throw new Error('Failed to receive record ID after saving')
        }
      } catch (saveError: any) {
        console.error('Detailed save error:', saveError)
        toast.error(`Save failed: ${saveError.message || 'Unknown error'}`)
        throw saveError
      }
    } catch (error: any) {
      console.error('Error saving expense report:', error)
      toast.error(`An error occurred: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const chartData = prepareChartData()
  const totalAmount = totals.amount || 0

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expense Summary</CardTitle>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportCSV} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </Button>
          <Button 
            onClick={handleSaveToSupabase} 
            variant="default" 
            className="flex items-center gap-2"
            disabled={isSaving || !user}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save to Account'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Total Expenses</h3>
            <p className="text-2xl font-bold mb-8">
              ${totalAmount.toFixed(2)}
            </p>
            
            <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
            <div className="space-y-2">
              {Object.entries(byCategory || {}).map(([category, amount]) => (
                <div key={category} className="flex justify-between">
                  <span>{category}</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="h-[300px] mt-6">
              <ExpensePieChart data={chartData} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Expense Distribution</h3>
            <div className="h-[450px] mt-2">
              <ExpenseBarChart data={chartData} />
            </div>
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
                  ${((byCategory['Transportation'] || 0) * mileageInfo.workPercentage / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 