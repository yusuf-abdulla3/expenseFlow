import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Receipt, Download } from "lucide-react"
import { generateCSV, downloadCSV } from '@/utils/csv'
import { Expense, MileageInfo } from '@/hooks/useExpenses'

interface FileUploaderProps {
  files: File[]
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  processFiles: () => Promise<void>
  loading: boolean
  error: string | null
  processedData: Expense[]
  mileageInfo: MileageInfo | null
  calculateTotals: (data: Expense[]) => { total: number, byCategory: Record<string, number> }
}

export function FileUploader({
  files,
  handleFileUpload,
  processFiles,
  loading,
  error,
  processedData,
  mileageInfo,
  calculateTotals
}: FileUploaderProps) {
  const handleDownload = () => {
    if (processedData.length === 0) return
    
    const { byCategory } = calculateTotals(processedData)
    const csvContent = generateCSV(processedData, mileageInfo, byCategory)
    downloadCSV(csvContent)
  }

  return (
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
              onClick={handleDownload}
              disabled={processedData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
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
  )
} 