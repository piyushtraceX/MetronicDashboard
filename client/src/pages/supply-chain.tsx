import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SAQResponseViewer from "@/components/supply-chain/saq-response-viewer";
import SimplifiedSupplierForm from "@/components/suppliers/simplified-supplier-form";

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState("onboarding");
  const [viewResponseOpen, setViewResponseOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedResponseId, setSelectedResponseId] = useState("");
  const [openCreateForm, setOpenCreateForm] = useState(false);
  
  // Fetch real suppliers from the API
  const { data: supplierData, isLoading, error } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) {
        throw new Error("Failed to fetch suppliers");
      }
      return res.json();
    }
  });
  
  // Combine fetched suppliers with mock data for demonstration
  const suppliers = supplierData || [
    { id: 1, name: "ABC Corp", address: "Berlin, Germany", industry: "Wood Products", status: "SAQ Pending" },
    { id: 2, name: "XYZ Ltd", address: "Madrid, Spain", industry: "Palm Oil", status: "Approved" },
    { id: 3, name: "DEF Inc", address: "London, UK", industry: "Rubber", status: "Rejected" },
  ];

  // Mock SAQ response data
  const saqResponses = [
    { id: "001", supplier: "ABC Corp", address: "Berlin, Germany", industry: "Wood Products" },
    { id: "002", supplier: "ABC Corp", address: "Berlin, Germany", industry: "Wood Products" },
    { id: "003", supplier: "ABC Corp", address: "Berlin, Germany", industry: "Wood Products" },
  ];

  // Mock assessment results
  const assessmentResults = [
    { supplier: "ABC Corp", decision: "Approved", explanation: "Meets compliance standards" },
    { supplier: "ABC Corp", decision: "Rejected", explanation: "Does not meet compliance standards" },
    { supplier: "ABC Corp", decision: "Review", explanation: "Few compliance standard met" },
  ];

  // Function to get the right status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">{status}</Badge>;
      case "SAQ Pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{status}</Badge>;
      case "Review":
        return <Badge className="bg-yellow-400 hover:bg-yellow-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gray-900 h-8 w-8 rounded flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <Tabs defaultValue="onboarding" className="w-full" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="onboarding" className={cn("text-md px-6", activeTab === "onboarding" ? "font-medium" : "")}>Onboarding</TabsTrigger>
              <TabsTrigger value="saq-management" className={cn("text-md px-6", activeTab === "saq-management" ? "font-medium" : "")}>SAQ Management</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Button>
          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff" alt="User" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="container p-6">
        <Tabs defaultValue="onboarding" value={activeTab} className="w-full">
          <TabsContent value="onboarding" className="mt-0">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold">Supplier Management</h2>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // This will trigger a click on the hidden file input
                    document.getElementById('importSupplierFile')?.click();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Import
                </Button>
                <input 
                  type="file" 
                  id="importSupplierFile" 
                  accept=".csv,.xlsx,.xls" 
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      console.log('Selected file:', e.target.files[0].name);
                      // Here you would handle the file import
                      // For example, sending it to the server
                    }
                  }} 
                />
                <Button 
                  onClick={() => setOpenCreateForm(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Supplier
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <div className="relative">
                  <Input placeholder="Search suppliers..." className="pl-9 bg-white" />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">SAQ Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="wood">Wood Products</SelectItem>
                    <SelectItem value="palm">Palm Oil</SelectItem>
                    <SelectItem value="rubber">Rubber</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="europe">Europe</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="americas">Americas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Industry/Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-500 mr-2" />
                          <span>Loading suppliers...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-red-500">
                        Failed to load suppliers. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No suppliers found. Add your first supplier to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium text-blue-600 hover:underline">
                          {supplier.name}
                        </TableCell>
                        <TableCell>
                          {supplier.city && supplier.country ? 
                            `${supplier.city}, ${supplier.country}` : 
                            supplier.country || supplier.address || "Not specified"}
                        </TableCell>
                        <TableCell>{supplier.products || supplier.industry || supplier.category || "Not specified"}</TableCell>
                        <TableCell>{getStatusBadge(supplier.status || "Pending")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                              <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h3.8a2 2 0 0 0 1.4-.6L12 4.6a2 2 0 0 1 1.4-.6h3.8a2 2 0 0 1 2 2v2.4Z" />
                              <path d="M7 13h0" />
                              <path d="M12 13h0" />
                              <path d="M17 13h0" />
                            </svg>
                            Send SAQ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              <div className="flex items-center justify-between py-4">
                <p className="text-sm text-gray-500">Showing 1 to 3 of 12 results</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">1</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">2</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">3</Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saq-management" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Sent SAQs</p>
                    <h3 className="text-2xl font-bold">156</h3>
                  </div>
                  <div className="rounded-full bg-amber-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-800">
                      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Responded</p>
                    <h3 className="text-2xl font-bold">89</h3>
                  </div>
                  <div className="rounded-full bg-green-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-800">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Not Responded</p>
                    <h3 className="text-2xl font-bold">67</h3>
                  </div>
                  <div className="rounded-full bg-red-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-800">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <h3 className="text-lg font-medium mb-4">Supplier Responses</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Industry/Product</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saqResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>{response.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <span className="text-xs font-medium">AC</span>
                          </div>
                          <span className="font-medium">{response.supplier}</span>
                        </div>
                      </TableCell>
                      <TableCell>{response.address}</TableCell>
                      <TableCell>{response.industry}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            setSelectedSupplier(response.supplier);
                            setSelectedResponseId(response.id);
                            setViewResponseOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Response
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Assessment Results</h3>
                <Button variant="outline" size="sm" className="h-8">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Explanation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <span className="text-xs font-medium">AC</span>
                          </div>
                          <span className="font-medium">{result.supplier}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(result.decision)}</TableCell>
                      <TableCell>{result.explanation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* SAQ Response Viewer Modal */}
      <SAQResponseViewer 
        open={viewResponseOpen}
        onClose={() => setViewResponseOpen(false)}
        supplierName={selectedSupplier}
        responseId={selectedResponseId}
      />
      
      {/* Supplier Form Dialog */}
      <SimplifiedSupplierForm
        open={openCreateForm}
        onOpenChange={(open) => setOpenCreateForm(open)}
        initialData={null}
      />
    </div>
  );
}
