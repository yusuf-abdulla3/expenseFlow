import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'

interface ChartDataPoint {
  name: string
  value: number
}

interface ExpenseBarChartProps {
  data: ChartDataPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-sm">Amount: ${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export function ExpenseBarChart({ data }: ExpenseBarChartProps) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" tickFormatter={(value) => `$${value}`} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Bar 
            dataKey="value" 
            name="Amount" 
            fill="#4f46e5" 
            radius={[0, 4, 4, 0]}
          >
            <LabelList dataKey="value" position="right" formatter={(value: number) => `$${value.toFixed(0)}`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 