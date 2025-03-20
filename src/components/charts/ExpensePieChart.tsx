import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartDataPoint {
  name: string
  value: number
  percent?: number
}

interface ExpensePieChartProps {
  data: ChartDataPoint[]
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#F06292', '#4DB6AC', '#FFB74D', '#9575CD'
]

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: ChartDataPoint) => 
              `${name} (${(percent! * 100).toFixed(0)}%)`
            }
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
