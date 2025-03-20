import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { provinceTaxRates, Province } from '@/hooks/useExpenses'
import { MileageInfo } from '@/hooks/useExpenses'

interface ProfileFormProps {
  occupation: string
  setOccupation: (value: string) => void
  mileageInfo: MileageInfo | null
  updateMileageInfo: (field: keyof MileageInfo, value: number) => void
  province: Province
  setProvince: (province: Province) => void
}

export function ProfileForm({
  occupation,
  setOccupation,
  mileageInfo,
  updateMileageInfo,
  province,
  setProvince
}: ProfileFormProps) {
  return (
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
                value={mileageInfo?.totalKms || ''}
                onChange={(e) => updateMileageInfo('totalKms', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 20000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Work-Related Kilometers</label>
              <Input
                type="number"
                value={mileageInfo?.workKms || ''}
                onChange={(e) => updateMileageInfo('workKms', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 5000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Province</label>
            <select 
              className="w-full p-2 border rounded"
              value={province} 
              onChange={(e) => setProvince(e.target.value as Province)}
            >
              {Object.keys(provinceTaxRates).map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 