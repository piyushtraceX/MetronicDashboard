import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Reports() {
  const [reportType, setReportType] = useState("compliance");
  const [timeRange, setTimeRange] = useState("6months");
  
  // Fetch compliance history data
  const { data: complianceHistory, isLoading } = useQuery({
    queryKey: ["/api/compliance/history", timeRange],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch suppliers data
  const { data: suppliers, isLoading: isSuppliersLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch risk categories
  const { data: riskCategories, isLoading: isRiskCategoriesLoading } = useQuery({
    queryKey: ["/api/risk-categories"],
    staleTime: 60000, // 1 minute
  });
  
  // Colors for pie chart
  const COLORS = ['#009ef7', '#50cd89', '#ffc700', '#f1416c', '#7239ea'];
  
  const prepareSupplierStatusData = () => {
    if (!suppliers) return [];
    
    const statusCounts: Record<string, number> = {};
    
    suppliers.forEach((supplier: any) => {
      if (statusCounts[supplier.status]) {
        statusCounts[supplier.status]++;
      } else {
        statusCounts[supplier.status] = 1;
      }
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">View and generate reports on your compliance status</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button>
            <i className="fas fa-file-export mr-2"></i>
            Export Report
          </Button>
          <Button variant="outline">
            <i className="fas fa-print mr-2"></i>
            Print
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900">Report Configuration</h3>
          <div className="mt-3 md:mt-0 flex flex-col sm:flex-row gap-3">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compliance">Compliance Overview</SelectItem>
                <SelectItem value="risk">Risk Assessment</SelectItem>
                <SelectItem value="supplier">Supplier Status</SelectItem>
                <SelectItem value="document">Document Status</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="charts" className="space-y-6">
            {isLoading || isSuppliersLoading || isRiskCategoriesLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance Trend Chart */}
                <Card className="p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Compliance Trend</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={complianceHistory}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })} 
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
                        formatter={(value: number) => [`${value}%`, 'Rate']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      />
                      <Legend />
                      <Bar name="Overall Compliance" dataKey="overallCompliance" fill="#009ef7" barSize={20} />
                      <Bar name="Supplier Compliance" dataKey="supplierCompliance" fill="#50cd89" barSize={20} />
                      <Bar name="Document Status" dataKey="documentStatus" fill="#ffc700" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                
                {/* Supplier Status Pie Chart */}
                <Card className="p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Supplier Status Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={prepareSupplierStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareSupplierStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} suppliers`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
                
                {/* Risk Categories Chart */}
                <Card className="p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Risk Categories</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={riskCategories}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]} 
                        tickFormatter={(value) => `${value}%`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
                      <Bar 
                        dataKey="score" 
                        fill="#8884d8" 
                        barSize={20}
                        {...{
                          fill: 'url(#colorUv)'
                        }}
                      >
                        {riskCategories.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                
                {/* Issues by Month */}
                <Card className="p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Issues Detected by Month</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={complianceHistory}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      />
                      <Legend />
                      <Bar name="Issues Detected" dataKey="issuesDetected" fill="#f1416c" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tables">
            <Card className="p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Compliance Metrics</h4>
              
              {isLoading ? (
                <Skeleton className="h-60 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Compliance</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Compliance</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {complianceHistory?.map((metric: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(metric.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metric.overallCompliance}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metric.supplierCompliance}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metric.documentStatus}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              metric.riskLevel === 'Low' ? 'bg-success/10 text-success' :
                              metric.riskLevel === 'Medium' ? 'bg-warning/10 text-warning' :
                              'bg-danger/10 text-danger'
                            }`}>
                              {metric.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metric.issuesDetected}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="summary">
            <Card className="p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Compliance Summary Report</h4>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : (
                <>
                  <div className="prose max-w-none">
                    <p>
                      This report provides an overview of your organization's EUDR compliance status over the selected time period.
                      Based on the data collected, your overall compliance rate is currently at 
                      <strong className="text-primary"> {complianceHistory?.[complianceHistory.length - 1]?.overallCompliance}%</strong>.
                    </p>
                    
                    <h5>Key Findings:</h5>
                    <ul>
                      <li>Supplier compliance rate: <strong>{complianceHistory?.[complianceHistory.length - 1]?.supplierCompliance}%</strong></li>
                      <li>Document verification status: <strong>{complianceHistory?.[complianceHistory.length - 1]?.documentStatus}%</strong></li>
                      <li>Current risk level: <strong className={`${
                          complianceHistory?.[complianceHistory.length - 1]?.riskLevel === 'Low' ? 'text-success' :
                          complianceHistory?.[complianceHistory.length - 1]?.riskLevel === 'Medium' ? 'text-warning' :
                          'text-danger'
                        }`}>
                        {complianceHistory?.[complianceHistory.length - 1]?.riskLevel}
                      </strong></li>
                      <li>Total issues detected: <strong>{complianceHistory?.[complianceHistory.length - 1]?.issuesDetected}</strong></li>
                    </ul>
                    
                    <h5>Recommendations:</h5>
                    <ol>
                      <li>Address the {complianceHistory?.[complianceHistory.length - 1]?.issuesDetected} detected compliance issues.</li>
                      <li>Complete documentation verification for remaining suppliers.</li>
                      <li>Schedule regular risk assessments for high-risk suppliers.</li>
                      <li>Implement corrective actions for non-compliant suppliers.</li>
                    </ol>
                    
                    <p>
                      Continued monitoring and proactive management of your supply chain will help ensure
                      full compliance with EUDR regulations and minimize environmental and social risks.
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button>
                      <i className="fas fa-download mr-2"></i>
                      Download Full Report
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
