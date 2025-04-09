import { useQuery } from "@tanstack/react-query";
import DashboardCard from "@/components/ui/dashboard-card";
import StatusBadge from "@/components/ui/status-badge";
import ComplianceChart from "@/components/ui/compliance-chart";
import RiskIndicator from "@/components/ui/risk-indicator";
import ActivityTimeline from "@/components/ui/activity-timeline";
import TaskItem from "@/components/ui/task-item";
import { Button } from "@/components/ui/button";
import SupplierAvatar from "@/components/ui/supplier-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch compliance history for chart
  const { data: complianceHistory, isLoading: isChartLoading } = useQuery({
    queryKey: ["/api/compliance/history"],
    staleTime: 60000, // 1 minute
  });
  
  // If loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <Skeleton className="h-80 rounded-lg lg:col-span-2" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }
  
  // Extract data
  const { 
    metrics, 
    riskCategories, 
    recentActivities, 
    upcomingTasks, 
    suppliers 
  } = dashboardData || {
    metrics: null,
    riskCategories: [],
    recentActivities: [],
    upcomingTasks: [],
    suppliers: []
  };
  
  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EUDR Compliance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor and manage your organization's compliance status</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button variant="outline">
            <i className="fas fa-download mr-2"></i>
            Export
          </Button>
        </div>
      </div>
      
      {/* Compliance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Overall Compliance */}
        <DashboardCard
          title="Overall Compliance"
          badge={{ 
            value: `${metrics?.overallCompliance || 0}%`, 
            color: "primary" 
          }}
          value={`${metrics?.overallCompliance || 0}%`}
          trend={{ value: "3.1%", direction: "up" }}
          progress={{ 
            value: metrics?.overallCompliance || 0, 
            color: "#009ef7" 
          }}
          footer="Last updated: 2 hours ago"
        />
        
        {/* Risk Level */}
        <DashboardCard
          title="Risk Level"
          badge={{ 
            value: metrics?.riskLevel || "N/A", 
            color: metrics?.riskLevel === "Low" ? "success" : 
                  metrics?.riskLevel === "Medium" ? "warning" : "danger" 
          }}
          value={`${metrics?.issuesDetected || 0}`}
          progress={{ 
            value: 50, 
            color: metrics?.riskLevel === "Low" ? "#50cd89" : 
                  metrics?.riskLevel === "Medium" ? "#ffc700" : "#f1416c" 
          }}
          footer={`${metrics?.issuesDetected ? '3 high-risk items need attention' : 'No issues detected'}`}
          icon={
            <i className={`fas fa-exclamation-triangle text-${
              metrics?.riskLevel === "Low" ? "success" : 
              metrics?.riskLevel === "Medium" ? "warning" : "danger"
            }`}></i>
          }
        />
        
        {/* Document Status */}
        <DashboardCard
          title="Document Status"
          badge={{ 
            value: `${metrics ? 50 - metrics.documentStatus / 2 : 0} Missing`, 
            color: "danger" 
          }}
          value={`${metrics?.documentStatus || 0}/100`}
          progress={{ 
            value: metrics?.documentStatus || 0, 
            color: "#50cd89" 
          }}
          footer="Next validation deadline: 14 days"
        />
        
        {/* Supplier Compliance */}
        <DashboardCard
          title="Supplier Compliance"
          badge={{ 
            value: "Good", 
            color: "success" 
          }}
          value={`${metrics?.supplierCompliance || 0}/100`}
          progress={{ 
            value: metrics?.supplierCompliance || 0, 
            color: "#50cd89" 
          }}
          footer={`${4 - Math.floor((metrics?.supplierCompliance || 0) / 25)} suppliers require follow-up`}
        />
      </div>
      
      {/* Compliance Trends Chart & Risk Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Compliance Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900">Compliance Trends</h3>
            <div className="flex items-center space-x-3">
              <select className="text-sm border-gray-200 rounded-md focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50">
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>All time</option>
              </select>
            </div>
          </div>
          
          {isChartLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="w-full h-[250px]" />
            </div>
          ) : (
            <ComplianceChart data={complianceHistory || []} />
          )}
        </div>
        
        {/* Risk Assessment Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900">Risk Assessment</h3>
            <Button variant="link" className="p-0 h-auto">
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {/* Risk Categories */}
            <div className="space-y-3">
              {riskCategories.map((category) => (
                <RiskIndicator 
                  key={category.id}
                  name={category.name}
                  score={category.score}
                  color={category.color}
                />
              ))}
            </div>
            
            {/* "Run New Assessment" button removed as requested */}
          </div>
        </div>
      </div>
      
      {/* Supplier Compliance Table */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6 pb-3 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h3 className="text-base font-semibold text-gray-900">Supplier Compliance Status</h3>
            <div className="mt-3 md:mt-0 flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400 text-sm"></i>
                </div>
                <input 
                  type="text" 
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50" 
                  placeholder="Search suppliers..." 
                />
              </div>
              <select className="text-sm border-gray-200 rounded-md focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50">
                <option>All Categories</option>
                <option>Tier 1</option>
                <option>Tier 2</option>
                <option>Tier 3</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SupplierAvatar 
                      name={supplier.name}
                      products={supplier.products}
                      riskLevel={supplier.riskLevel}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={supplier.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 mr-2">{supplier.riskLevel}</span>
                      <div className="w-16 h-2 bg-gray-100 rounded-full">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${supplier.riskScore}%`, 
                            backgroundColor: supplier.riskLevel === "Low" ? "#50cd89" : 
                                           supplier.riskLevel === "Medium" ? "#ffc700" : "#f1416c"
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(supplier.lastUpdated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="link" className="text-primary hover:text-primary/80 mr-3 p-0 h-auto">
                      View
                    </Button>
                    <button className="text-gray-500 hover:text-gray-700">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {suppliers.length} of 28 suppliers
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-50">
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-white bg-primary hover:bg-primary/90">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-50">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Activities & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 pb-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900">Recent Activities</h3>
              <Button variant="link" className="p-0 h-auto">
                View All
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <ActivityTimeline activities={recentActivities} />
          </div>
        </div>
        
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 pb-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900">Upcoming Tasks</h3>
              <Button variant="link" className="p-0 h-auto">
                View All
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  assigneeName="Admin User" 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
