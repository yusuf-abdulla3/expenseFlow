import { Expense, MileageInfo } from '@/hooks/useExpenses'
import { saveFileToStorage, saveExpenseRecord } from './storage'

export function generateCSV(
  processedData: Expense[], 
  mileageInfo: MileageInfo | null,
  byCategory: Record<string, number>
): string {
  const headers = ['Date', 'Paid By', 'Description', 'GL Account', 'Amount', 'HST', 'Net', 'Needs Review']
  const total = processedData.reduce((sum, expense) => sum + expense.amount, 0)
  
  const csvContent = [
    headers.join(','),
    ...processedData.map(row => [
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
  
  return csvContent
}

export function downloadCSV(csvContent: string, filename: string = 'expenses'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function saveCSVToSupabase(
  csvContent: string, 
  userId: string, 
  metadata: Record<string, any> = {}
): Promise<string> {
  if (!csvContent) {
    throw new Error('No CSV content provided')
  }
  
  if (!userId) {
    throw new Error('No user ID provided')
  }
  
  console.log('Saving CSV to Supabase for user:', userId)
  
  try {
    const filename = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // Save the file to storage
    console.log('Calling saveFileToStorage...')
    const fileUrl = await saveFileToStorage(blob, filename, userId)
    
    if (!fileUrl) {
      throw new Error('Failed to save file to storage - no URL returned')
    }
    
    console.log('File saved to storage, URL:', fileUrl)
    
    // Save the record to the database
    console.log('Calling saveExpenseRecord...')
    const recordId = await saveExpenseRecord(userId, fileUrl, {
      ...metadata,
      filename,
      timestamp: new Date().toISOString()
    })
    
    if (!recordId) {
      throw new Error('Failed to save expense record - no ID returned')
    }
    
    console.log('Expense record saved successfully, ID:', recordId)
    return recordId
  } catch (error: any) {
    console.error('Error in saveCSVToSupabase:', error)
    throw error // Propagate the error to the caller
  }
} 