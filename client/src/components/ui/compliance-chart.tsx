import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { formatDate } from '@/lib/utils';

interface ComplianceMetric {
  date: string;
  overallCompliance: number;
  supplierCompliance: number;
  documentStatus: number;
  riskLevel: string;
  issuesDetected: number;
}

interface ComplianceChartProps {
  data: ComplianceMetric[];
}

export default function ComplianceChart({ data }: ComplianceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short' });
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          domain={[0, 100]} 
          tickFormatter={(value) => `${value}%`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          formatter={(value: number) => [`${value}%`, '']}
          labelFormatter={(label) => formatDate(label)}
          contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
        />
        <Legend 
          verticalAlign="top" 
          height={36} 
        />
        <Line 
          type="monotone" 
          dataKey="overallCompliance" 
          name="Overall Compliance" 
          stroke="#009ef7" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="supplierCompliance"
          name="Supplier Compliance" 
          stroke="#50cd89" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="documentStatus" 
          name="Document Status" 
          stroke="#ffc700" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}