import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm">${data.value.toFixed(2)}</p>
        <p className="text-xs text-gray-500">
          {(data.percent! * 100).toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => 
              percent! > 0.05 ? `${name} (${(percent! * 100).toFixed(0)}%)` : ''
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={1}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
