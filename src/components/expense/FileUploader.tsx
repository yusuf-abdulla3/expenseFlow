import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Receipt, Download, FileType2 } from "lucide-react"
import { generateCSV, downloadCSV } from '@/utils/csv'
import { Expense, MileageInfo } from '@/hooks/useExpenses'
import { useState } from "react"

interface FileUploaderProps {
  files: File[]
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  processFiles: () => Promise<void>
  loading: boolean
  error: string | null
  processedData: Expense[]
  mileageInfo: MileageInfo | null
  calculateTotals: (data: Expense[]) => { total: number, byCategory: Record<string, number> }
  fileType: string
  setFileType: (type: string) => void
}

export function FileUploader({
  files,
  handleFileUpload,
  processFiles,
  loading,
  error,
  processedData,
  mileageInfo,
  calculateTotals,
  fileType,
  setFileType
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
        <CardDescription>Upload your statements to process them into a categorized CSV file</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="pdf-option"
                name="file-type"
                value="pdf"
                checked={fileType === 'pdf'}
                onChange={() => setFileType('pdf')}
                className="mr-2"
              />
              <label htmlFor="pdf-option">PDF Files</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="csv-option"
                name="file-type"
                value="csv"
                checked={fileType === 'csv'}
                onChange={() => setFileType('csv')}
                className="mr-2"
              />
              <label htmlFor="csv-option">CSV Files</label>
            </div>
          </div>
          
          <input 
            type="file" 
            accept={fileType === 'pdf' ? ".pdf" : ".csv"}
            multiple={fileType === 'pdf'}
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
                <FileType2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileType2 className="h-4 w-4" />
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