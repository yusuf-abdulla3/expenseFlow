import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Edit2, Download } from "lucide-react"
import { Expense } from '@/hooks/useExpenses'
import { generateCSV, downloadCSV } from '@/utils/csv'

interface ExpenseListProps {
  processedData: Expense[]
  isEditing: boolean
  editingData: Expense[]
  startEditing: () => void
  saveChanges: () => void
  handleEdit: (index: number, field: keyof Expense, value: string | number | boolean) => void
  mileageInfo: any
  calculateTotals: (data: Expense[]) => { total: number, byCategory: Record<string, number> }
}

export function ExpenseList({
  processedData,
  isEditing,
  editingData,
  startEditing,
  saveChanges,
  handleEdit,
  mileageInfo,
  calculateTotals
}: ExpenseListProps) {
  const handleDownload = () => {
    const dataToExport = isEditing ? editingData : processedData
    const { byCategory } = calculateTotals(dataToExport)
    const csvContent = generateCSV(dataToExport, mileageInfo, byCategory)
    downloadCSV(csvContent)
  }

  if (processedData.length === 0) {
    return null
  }

  return (
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
              onClick={handleDownload}
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
                        onChange={(e) => handleEdit(index, 'isUnsure', e.target.checked)}
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
  )
} 