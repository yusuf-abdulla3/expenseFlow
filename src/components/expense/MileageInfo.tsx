import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MileageInfo as MileageInfoType } from '@/hooks/useExpenses'

interface MileageInfoProps {
  mileageInfo: MileageInfoType | null
  transportationExpense: number
}

export function MileageInfo({ mileageInfo, transportationExpense }: MileageInfoProps) {
  if (!mileageInfo) return null

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Mileage Information</CardTitle>
      </CardHeader>
      <CardContent>
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
              ${(transportationExpense * mileageInfo.workPercentage / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 