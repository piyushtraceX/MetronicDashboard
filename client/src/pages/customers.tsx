import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

import { Head } from "@/components/head";
import CustomerForm from "../components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle,
  ClockIcon,
} from "lucide-react";

export default function Customers() {
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerStates, setCustomerStates] = useState<Record<number, string>>({});
  
  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    staleTime: 60 * 1000
  });
  
  // Initialize customer states when data changes
  useEffect(() => {
    if (customers && customers.length > 0) {
      const stateMap: Record<number, string> = {};
      customers.forEach((customer: any) => {
        stateMap[customer.id] = customer.status;
      });
      setCustomerStates(stateMap);
    }
  }, [customers]);
  
  const { data: stats = { total: 0, active: 0, inactive: 0 } } = useQuery<{
    total: number;
    active: number;
    inactive: number;
  }>({
    queryKey: ["/api/customers/stats"],
    staleTime: 60 * 1000,
  });
  
  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    
    // Apply status filter
    if (filter !== "all") {
      result = result.filter((customer) => customer.status === filter);
    }
    
    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (customer) =>
          (customer.displayName && customer.displayName.toLowerCase().includes(query)) ||
          (customer.companyName && customer.companyName.toLowerCase().includes(query)) ||
          (customer.email && customer.email.toLowerCase().includes(query)) ||
          `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [customers, filter, searchQuery]);
  
  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setOpenCreateForm(true);
  };
  
  const handleCloseForm = () => {
    setOpenCreateForm(false);
    setSelectedCustomer(null);
  };
  
  // Toggle customer status function with immediate UI update
  const handleToggleStatus = async (customer: any, newStatus: boolean) => {
    try {
      const status = newStatus ? "active" : "inactive";
      
      // Update local state immediately for a responsive UI
      setCustomerStates(prev => ({
        ...prev,
        [customer.id]: status
      }));
      
      // Call the API to update the customer status
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        // If there's an error, revert to the previous state
        setCustomerStates(prev => ({
          ...prev,
          [customer.id]: customer.status // Revert to original status
        }));
        throw new Error('Failed to update customer status');
      }
      
      // Invalidate the queries to refresh the data
      const queryClient = useQueryClient();
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers/stats'] });
    } catch (error) {
      console.error('Error updating customer status:', error);
      // In a real app, you would show a toast notification here
    }
  };
  
  // This function was used for risk badges, but we've removed risk level display
  
  return (
    <>
      <Head title="Customers | EUDR Compliance" />
      
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer relationships and compliance status
            </p>
          </div>
          <Button onClick={() => setOpenCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inactive Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-md shadow mb-6">
          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Contact</TableHead>
                  <TableHead className="whitespace-nowrap">Location</TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Added</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex justify-center items-center">
                        <ClockIcon className="h-6 w-6 mr-2 animate-spin" />
                        Loading customers...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="bg-primary/10 p-2 rounded-md">
                            {customer.type === "business" ? (
                              <Building className="h-5 w-5 text-primary" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {customer.displayName || `${customer.firstName} ${customer.lastName}`}
                            </div>
                            {customer.type === "business" && customer.companyName && (
                              <div className="text-xs text-muted-foreground">
                                {customer.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span>{customer.workPhone || "N/A"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {customer.billingCity && customer.billingCountry
                              ? `${customer.billingCity}, ${customer.billingCountry}`
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={customerStates[customer.id] === "active"}
                            onCheckedChange={(checked) => handleToggleStatus(customer, checked)}
                            aria-label="Toggle customer status"
                          />
                          <span className={`text-sm ${customerStates[customer.id] === "active" ? "text-green-600" : "text-gray-500"}`}>
                            {customerStates[customer.id] === "active" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {customer.createdAt
                            ? formatDistanceToNow(new Date(customer.createdAt), {
                                addSuffix: true,
                              })
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/customers/${customer.id}`} className="w-full">
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/customers/${customer.id}/declarations`} className="w-full">
                                Declarations
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/customers/${customer.id}/documents`} className="w-full">
                                Documents
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <CustomerForm 
        open={openCreateForm} 
        onOpenChange={handleCloseForm} 
        initialData={selectedCustomer}
      />
    </>
  );
}