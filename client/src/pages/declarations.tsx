import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Search, Eye, Upload, Plus, MapPin, AlertCircle, MoreHorizontal, FileText, Download, Map, Tag, FileSpreadsheet } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, formatDate } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EUTracesForm from "@/components/declarations/eu-traces-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import DeclarationWizard from "@/components/declarations/declaration-wizard";
import OutboundDeclarationWizard from "@/components/declarations/outbound-declaration-wizard";
import DeclarationDetailView from "@/components/declarations/declaration-detail-view";

interface Declaration {
  id: number;
  type: "inbound" | "outbound";
  supplierId: number;
  supplier?: string; // Supplier name
  customerId?: number; // Customer ID for outbound declarations
  customer?: string; // Customer name for outbound declarations
  partnerName?: string; // Partner name - could be supplier or customer depending on type
  partnerType?: "supplier" | "customer"; // Type of partner
  productName: string;
  productDescription: string | null;
  hsnCode: string | null;
  quantity: number | null;
  unit: string | null;
  status: string;
  riskLevel: string;
  geojsonData: any | null;
  startDate: string | null;
  endDate: string | null;
  createdBy: number;
  createdAt: string;
  lastUpdated: string;
  industry: string | null;
  rmId?: string | null;
  eudrReferenceNumber?: string | null; // EUDR Reference Number
  eudrVerificationNumber?: string | null; // EUDR Verification Number
  previousReferenceNumber?: string | null; // Previous Reference Number
  ddsStatus?: "Filed" | "DDS Success" | "DDS Failed" | null; // DDS Status
  complianceStatus?: "compliant" | "non-compliant" | "non-compliant-geometry" | "non-compliant-satellite";
}

interface DeclarationStats {
  total: number;
  inbound: number;
  outbound: number;
  approved: number;
  pending: number;
  review: number;
  rejected: number;
}

function RiskSummaryCard({ color, label, count, icon }: { color: string; label: string; count: number; icon: React.ReactNode }) {
  return (
    <Card className="flex-1">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 mb-1">{label}</span>
          <span className="text-2xl font-bold">{count}</span>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function DeclarationRow({ 
  declaration, 
  onViewClick,
  selected = false,
  onSelectChange,
  suppliersList = [],
  setSelectedTracesDeclarationId,
  setEuTracesFormOpen
}: { 
  declaration: Declaration; 
  onViewClick: (id: number) => void;
  selected?: boolean;
  onSelectChange?: (id: number, selected: boolean) => void;
  suppliersList?: any[];
  setSelectedTracesDeclarationId?: (id: number | null) => void;
  setEuTracesFormOpen?: (open: boolean) => void;
}) {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [notifySupplierOpen, setNotifySupplierOpen] = useState(false);
  const { toast } = useToast();
  
  // Determine compliance status based on declaration status
  let complianceStatus = declaration.complianceStatus;
  
  // If not explicitly set, determine from the status field
  if (!complianceStatus) {
    // Status field values can be: "approved", "review", "rejected", "pending", "validating",
    // "non-compliant-geometry", "non-compliant-satellite"
    if (declaration.status === "non-compliant-geometry" || declaration.status === "non-compliant-satellite") {
      complianceStatus = declaration.status; // Use the exact non-compliant reason
    } else if (declaration.status === "approved") {
      complianceStatus = "compliant";
    } else if (declaration.status === "rejected") {
      complianceStatus = "non-compliant";
    } else {
      // For pending, review, validating - determine by risk level
      complianceStatus = (declaration.riskLevel === "low" || declaration.riskLevel === "medium") 
        ? "compliant" 
        : "non-compliant";
    }
  }
  
  const isCompliant = complianceStatus === "compliant";
  
  // Function to handle downloading consolidated GeoJSON
  const handleDownloadGeoJSON = () => {
    // In a real app, this would make an API call to get the actual GeoJSON data
    // For this demo, we'll create a sample GeoJSON object
    const geoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Declaration Area #" + declaration.id,
            description: "Boundary for " + declaration.productName
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0]
              ]
            ]
          }
        }
      ]
    };
    
    // Convert to string and create blob
    const geoJSONString = JSON.stringify(geoJSON, null, 2);
    const blob = new Blob([geoJSONString], { type: 'application/geo+json' });
    
    // Create download link and trigger click
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `declaration-${declaration.id}-geojson.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    toast({
      title: "GeoJSON Downloaded",
      description: `GeoJSON data for Declaration #${declaration.id} has been downloaded`,
      variant: "default",
    });
  };
  
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-4 pl-4 pr-3 text-sm whitespace-nowrap">
        <Checkbox 
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(declaration.id, checked === true)}
          aria-label={`Select declaration ${declaration.id}`}
        />
      </td>
      <td className="py-4 pl-4 pr-3 text-sm whitespace-nowrap">
        <div className="font-medium text-gray-900">
          {/* Use partnerName if available, otherwise fall back to appropriate name based on declaration type */}
          {declaration.partnerName || 
           (declaration.type === "outbound" 
             ? (declaration.customer || `Customer ${declaration.customerId}`)
             : (suppliersList.find(s => s.id === declaration.supplierId)?.name || declaration.supplier || `Supplier ${declaration.supplierId}`)
           )}
        </div>
        {declaration.partnerType && (
          <div className="text-xs text-gray-500 mt-1">
            {declaration.partnerType.charAt(0).toUpperCase() + declaration.partnerType.slice(1)}
          </div>
        )}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
        {declaration.industry && declaration.industry !== declaration.productName 
          ? `${declaration.industry} / ${declaration.productName}` 
          : declaration.productName}
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap">
        <StatusBadge status={declaration.status} />
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap">
        <span className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          declaration.riskLevel === "low" ? "bg-green-100 text-green-800" : 
          declaration.riskLevel === "medium" ? "bg-yellow-100 text-yellow-800" : 
          "bg-red-100 text-red-800"
        )}>
          <span className={cn(
            "mr-1 h-2 w-2 rounded-full",
            declaration.riskLevel === "low" ? "bg-green-500" : 
            declaration.riskLevel === "medium" ? "bg-yellow-500" : 
            "bg-red-500"
          )}></span>
          {declaration.riskLevel.charAt(0).toUpperCase() + declaration.riskLevel.slice(1)} Risk
        </span>
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap">
        <span className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          complianceStatus === "compliant" ? "bg-green-100 text-green-800" : 
          complianceStatus === "non-compliant-geometry" ? "bg-orange-100 text-orange-800" : 
          complianceStatus === "non-compliant-satellite" ? "bg-amber-100 text-amber-800" : 
          "bg-red-100 text-red-800"
        )}>
          <span className={cn(
            "mr-1 h-2 w-2 rounded-full",
            complianceStatus === "compliant" ? "bg-green-500" : 
            complianceStatus === "non-compliant-geometry" ? "bg-orange-500" : 
            complianceStatus === "non-compliant-satellite" ? "bg-amber-500" : 
            "bg-red-500"
          )}></span>
          {complianceStatus === "compliant" 
            ? "Compliant" 
            : complianceStatus === "non-compliant-geometry" 
              ? "Non-Compliant Geometry"
              : complianceStatus === "non-compliant-satellite"
                ? "Non-Compliant Satellite"
                : "Non-Compliant"}
        </span>
      </td>

      <td className="px-3 py-4 text-sm whitespace-nowrap">
        {declaration.ddsStatus ? (
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            declaration.ddsStatus === "Filed" ? "bg-blue-100 text-blue-800" : 
            declaration.ddsStatus === "DDS Success" ? "bg-green-100 text-green-800" : 
            "bg-red-100 text-red-800"
          )}>
            <span className={cn(
              "mr-1 h-2 w-2 rounded-full",
              declaration.ddsStatus === "Filed" ? "bg-blue-500" : 
              declaration.ddsStatus === "DDS Success" ? "bg-green-500" : 
              "bg-red-500"
            )}></span>
            {declaration.ddsStatus}
          </span>
        ) : (
          <span className="text-gray-400">Not Filed</span>
        )}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
        {formatDate(declaration.lastUpdated)}
      </td>
      <td className="px-3 py-4 text-sm text-right whitespace-nowrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewClick(declaration.id)}>
              <Eye className="h-4 w-4 mr-2" />
              <span>View Details</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => {
              if (setSelectedTracesDeclarationId && setEuTracesFormOpen) {
                setSelectedTracesDeclarationId(declaration.id);
                setEuTracesFormOpen(true);
              }
            }}>
              <FileText className="h-4 w-4 mr-2" />
              <span>File DDS in EU Traces</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleDownloadGeoJSON}>
              <Download className="h-4 w-4 mr-2" />
              <span>Download Consolidated GeoJSON</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => {
                // Create a sample Excel-like CSV data
                const csvContent = `Sr No.,Product Name\n1,${declaration.productName}`;
                const blob = new Blob([csvContent], { type: 'text/csv' });
                
                // Create download link and trigger click
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `declaration-${declaration.id}-products.csv`;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 0);
                
                toast({
                  title: "Product List Downloaded",
                  description: `Product list for Declaration #${declaration.id} has been downloaded`,
                  variant: "default",
                });
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span>Download Product List</span>
            </DropdownMenuItem>
            
            {!isCompliant && (
              <DropdownMenuItem onClick={() => setMapModalOpen(true)} className="text-red-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>View Non-Compliant Farms</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Map Modal for Non-Compliant Farms */}
        <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Non-Compliant Farms</DialogTitle>
              <DialogDescription>
                This map shows the locations of non-compliant farms for Declaration #{declaration.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="relative bg-gray-100 border rounded-md h-[60vh] flex items-center justify-center">
              <div className="absolute inset-0 m-4 bg-white/80 border rounded-md p-4 max-w-xs">
                <h3 className="font-semibold text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Non-Compliant Areas
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  3 areas have been identified as non-compliant with EUDR regulations
                </p>
                <ul className="mt-2 text-sm space-y-1">
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                    Deforested area (2022-2023)
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-orange-500 rounded-full mr-2"></span>
                    Missing traceability data
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span>
                    Incomplete documentation
                  </li>
                </ul>
              </div>
              <div className="text-center text-gray-500">
                <MapPin className="h-20 w-20 mx-auto text-gray-300" />
                <p className="mt-4">Map visualization would be displayed here</p>
                <p className="text-sm mt-2">GeoJSON data for non-compliant polygon areas</p>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button 
                variant="secondary" 
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setNotifySupplierOpen(true)}
              >
                <span>Notify Supplier</span>
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setMapModalOpen(false)}>Close</Button>
                <Button onClick={handleDownloadGeoJSON}>Download GeoJSON</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Notify Partner Modal - Works for both suppliers and customers */}
        <Dialog open={notifySupplierOpen} onOpenChange={setNotifySupplierOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Notify {declaration.partnerType === 'customer' ? 'Customer' : 'Supplier'}</DialogTitle>
              <DialogDescription>
                Send email notification to the {declaration.partnerType === 'customer' ? 'customer' : 'supplier'} about non-compliant areas.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="partner-name" className="text-sm font-medium">{declaration.partnerType === 'customer' ? 'Customer' : 'Supplier'} Name</Label>
                <Input 
                  id="partner-name" 
                  placeholder={`Enter ${declaration.partnerType === 'customer' ? 'customer' : 'supplier'} name`}
                  defaultValue={declaration.partnerName || 
                    (declaration.type === "outbound" 
                      ? (declaration.customer || `Customer ${declaration.customerId}`)
                      : (suppliersList.find(s => s.id === declaration.supplierId)?.name || declaration.supplier || `Supplier ${declaration.supplierId}`)
                    )}
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="partner-contact" className="text-sm font-medium">Contact Person</Label>
                <Input 
                  id="partner-contact" 
                  placeholder="Enter contact person" 
                  defaultValue={
                    declaration.type === "outbound"
                      ? "Unknown Contact" // Would come from customer data in real implementation
                      : (suppliersList.find(s => s.id === declaration.supplierId)?.contactPerson || "Unknown Contact")
                  }
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="partner-email" className="text-sm font-medium">{declaration.partnerType === 'customer' ? 'Customer' : 'Supplier'} Email</Label>
                <Input 
                  id="partner-email" 
                  placeholder={`Enter ${declaration.partnerType === 'customer' ? 'customer' : 'supplier'} email`}
                  defaultValue={
                    declaration.type === "outbound"
                      ? `customer${declaration.customerId}@example.com` // Would come from customer data in real implementation
                      : (suppliersList.find(s => s.id === declaration.supplierId)?.email || `supplier${declaration.supplierId}@example.com`)
                  }
                  readOnly 
                  className="bg-gray-50"
                  type="email" 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotifySupplierOpen(false)}>Cancel</Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  toast({
                    title: "Email Notification Sent",
                    description: `The ${declaration.partnerType === 'customer' ? 'customer' : 'supplier'} has been notified about the non-compliant areas.`,
                    variant: "default",
                  });
                  setNotifySupplierOpen(false);
                }}
              >
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  );
}

// Form state for new declaration
interface NewDeclarationForm {
  type: "inbound" | "outbound";
  productName: string;
  productDescription: string;
  hsnCode: string;
  quantity: string;
  unit: string;
  supplierId: number;
  startDate: Date | undefined;
  endDate: Date | undefined;
  industry: string;
  agreementChecked: boolean;
  rmId?: string;
}

export default function Declarations() {
  const { user } = useAuth();
  const isSupplier = user?.role === 'supplier';
  const isCustomer = user?.role === 'customer';
  const isEuOperator = user?.role === 'eu_operator';
  
  // For suppliers, default to outbound tab, for customers default to inbound tab
  const [activeTab, setActiveTab] = useState<string>(
    isSupplier ? "outbound" : "inbound"
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // EU Traces form state
  const [euTracesFormOpen, setEuTracesFormOpen] = useState(false);
  const [selectedTracesDeclarationId, setSelectedTracesDeclarationId] = useState<number | null>(null);
  const [simpleModalOpen, setSimpleModalOpen] = useState(false);
  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  // For suppliers, always set declarationType to outbound, for customers to inbound
  const [declarationType, setDeclarationType] = useState<"inbound" | "outbound">(
    isSupplier ? "outbound" : isCustomer ? "inbound" : "inbound"
  );
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedDeclarationId, setSelectedDeclarationId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // New declaration form state
  const [form, setForm] = useState<NewDeclarationForm>({
    type: "inbound",
    productName: "",
    productDescription: "",
    hsnCode: "",
    quantity: "",
    unit: "kg",
    supplierId: 1,
    startDate: undefined,
    endDate: undefined,
    industry: "Food & Beverage",
    agreementChecked: false,
    rmId: ""
  });
  
  // Handle form input changes
  const handleInputChange = (field: keyof NewDeclarationForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  
  // Create declaration mutation
  const createDeclaration = useMutation({
    mutationFn: async (newDeclaration: Omit<NewDeclarationForm, 'agreementChecked'>) => {
      const payload = {
        ...newDeclaration,
        quantity: parseInt(newDeclaration.quantity) || 0,
        status: "pending",
        riskLevel: "medium",
      };
      
      return apiRequest('/api/declarations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      // Reset form
      setForm({
        type: "inbound",
        productName: "",
        productDescription: "",
        hsnCode: "",
        quantity: "",
        unit: "kg",
        supplierId: 1,
        startDate: undefined,
        endDate: undefined,
        industry: "Food & Beverage",
        agreementChecked: false,
        rmId: ""
      });
      
      // Close modal
      setSimpleModalOpen(false);
      
      // Show success toast
      toast({
        title: "Declaration created",
        description: "Your declaration has been successfully submitted",
        variant: "default",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/declarations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/declarations/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create declaration. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = () => {
    if (!form.agreementChecked) {
      toast({
        title: "Compliance agreement required",
        description: "Please confirm the compliance agreement to continue",
        variant: "destructive",
      });
      return;
    }
    
    if (!form.productName) {
      toast({
        title: "Product name required",
        description: "Please enter a product name to continue",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the form without the agreementChecked field
    const { agreementChecked, ...submissionData } = form;
    createDeclaration.mutate(submissionData);
  };
  
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // State for selected rows
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  
  // State for RM ID allotment modal
  const [allotRmIdModalOpen, setAllotRmIdModalOpen] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  
  // Fetch declarations - make sure the query updates when activeTab changes
  const { data: declarations = [], isLoading: isLoadingDeclarations } = useQuery<Declaration[]>({
    queryKey: ['/api/declarations', activeTab],
    queryFn: async () => {
      // Pass type as a query parameter
      console.log(`Fetching declarations with type: ${activeTab}`);
      return apiRequest(`/api/declarations?type=${activeTab}`);
    },
    refetchOnWindowFocus: false,
  });
  
  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DeclarationStats>({
    queryKey: ['/api/declarations/stats'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch suppliers (simplified for this example)
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ['/api/suppliers'],
    refetchOnWindowFocus: false,
  });
  
  // Since we're already filtering by type on the server, we don't need to filter by type again
  // First filter by declaration type (inbound/outbound) based on active tab
  // For the EU Filed tab, include all types of declarations
  let filteredDeclarations = [...declarations];
  
  if (activeTab !== "eu_filed") {
    // Filter by declaration type only for inbound/outbound tabs
    filteredDeclarations = filteredDeclarations.filter(
      (d) => d.type === activeTab
    );
  }
          
  // Apply status filter
  if (statusFilter !== "all") {
    if (statusFilter === "rm_id_not_present") {
      // Filter declarations without RM IDs
      filteredDeclarations = filteredDeclarations.filter((d) => !d.rmId);
    } else {
      // Filter by regular status
      filteredDeclarations = filteredDeclarations.filter((d) => d.status === statusFilter);
    }
  }
  
  // Sort declarations by ID/date in descending order (newest first)
  filteredDeclarations = [...filteredDeclarations].sort((a, b) => {
    // If we have date fields, sort by date
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Otherwise sort by ID (assuming higher IDs are newer entries)
    return b.id - a.id;
  });
  
  // Handle row selection functions
  const handleRowSelect = (id: number, selected: boolean) => {
    if (selected) {
      setSelectedRows((prev) => [...prev, id]);
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    }
  };
  
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = filteredDeclarations.map((d) => d.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };
  
  // Check if all rows are selected
  const allSelected = filteredDeclarations.length > 0 && 
    filteredDeclarations.every((d) => selectedRows.includes(d.id));
    
  // Get declarations without RM IDs from selected rows
  const selectedWithoutRmId = selectedRows.length > 0 
    ? filteredDeclarations.filter(d => selectedRows.includes(d.id) && !d.rmId)
    : [];
    
  // Get IDs of declarations without RM IDs
  const selectedWithoutRmIdIds = selectedWithoutRmId.map(d => d.id);
  
  // Create a lookup object for declarations by ID
  const declarationsById: {[key: number]: Declaration} = {};
  filteredDeclarations.forEach(d => {
    declarationsById[d.id] = d;
  });
    
  // Handle RM ID allotment for single declaration
  const handleAllotRmId = (id: number) => {
    setSelectedRows([id]);
    setAllotRmIdModalOpen(true);
  };
  
  // Mutation to update RM ID for a single declaration
  const updateRmId = useMutation({
    mutationFn: async ({ id, rmId }: { id: number, rmId: string }) => {
      return apiRequest(`/api/declarations/${id}/rm-id`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rmId }),
      });
    },
    onSuccess: () => {
      toast({
        title: "RM ID Updated",
        description: "The RM ID has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/declarations'] });
      setAllotRmIdModalOpen(false);
    },
    onError: (error) => {
      console.error('Error updating RM ID:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the RM ID",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to bulk update RM IDs for multiple declarations
  const bulkUpdateRmIds = useMutation({
    mutationFn: async (updates: { id: number, rmId: string }[]) => {
      return apiRequest('/api/declarations/bulk-update-rm-ids', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates }),
      });
    },
    onSuccess: () => {
      toast({
        title: "RM IDs Updated",
        description: "The RM IDs have been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/declarations'] });
      setAllotRmIdModalOpen(false);
      setSelectedRows([]);
    },
    onError: (error) => {
      console.error('Error updating RM IDs:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the RM IDs",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Declarations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage inbound and outbound declarations for EUDR compliance</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          {/* Only show Inbound Declaration button for non-supplier users */}
          {(!isSupplier || isCustomer) && (
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => {
                setDeclarationType("inbound");
                setWizardModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Inbound Declaration
            </Button>
          )}
          {/* Only show Outbound Declaration button for non-customer users */}
          {!isCustomer && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setDeclarationType("outbound");
                setWizardModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Outbound Declaration
            </Button>
          )}
        </div>
      </div>
      
      {/* Advanced Declaration Wizard */}
      {declarationType === "inbound" ? (
        <DeclarationWizard 
          open={wizardModalOpen} 
          onOpenChange={setWizardModalOpen} 
        />
      ) : (
        <OutboundDeclarationWizard 
          open={wizardModalOpen} 
          onOpenChange={setWizardModalOpen}
        />
      )}
      
      {/* Simple Declaration Modal */}
      <Dialog open={simpleModalOpen} onOpenChange={setSimpleModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Declaration</DialogTitle>
            <DialogDescription>
              Create an {form.type} declaration on behalf of the Supplier
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium">Itemwise Entry</h3>
              <Button variant="outline" size="sm" className="ml-auto">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hsn-code">HSN Code</Label>
                <Select 
                  value={form.hsnCode} 
                  onValueChange={(value) => handleInputChange('hsnCode', value)}
                >
                  <SelectTrigger id="hsn-code">
                    <SelectValue placeholder="Search HSN Code..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0901.21.00">0901.21.00 - Coffee</SelectItem>
                    <SelectItem value="1511.10.00">1511.10.00 - Palm Oil</SelectItem>
                    <SelectItem value="4407.21.00">4407.21.00 - Tropical Hardwood</SelectItem>
                    <SelectItem value="2106.10.00">2106.10.00 - Soy Protein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="product-name">Product Name</Label>
                <Input 
                  id="product-name" 
                  placeholder="Enter product name" 
                  value={form.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="product-description">Product Description</Label>
                <Textarea 
                  id="product-description" 
                  placeholder="Enter product description" 
                  value={form.productDescription}
                  onChange={(e) => handleInputChange('productDescription', e.target.value)}
                  className="h-24"
                />
              </div>
              
              <div>
                <Label htmlFor="rm-id" className="flex items-center">
                  RM ID
                  <span className="ml-1 cursor-help" title="RM ID refers to the raw material id of this product in your ERP">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 16v-4"></path>
                      <path d="M12 8h.01"></path>
                    </svg>
                  </span>
                </Label>
                <Input 
                  id="rm-id" 
                  placeholder="Enter RM ID" 
                  value={form.rmId}
                  onChange={(e) => handleInputChange('rmId', e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    placeholder="Enter quantity" 
                    value={form.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                  />
                </div>
                <div className="w-1/3">
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    value={form.unit} 
                    onValueChange={(value) => handleInputChange('unit', value)}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">KG</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="m³">m³</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-6 w-full text-primary border-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Item
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-md font-medium">Overall Declaration</h3>
              
              <div>
                <Label>GeoJSON Upload</Label>
                <div className="border-2 border-dashed rounded-md p-6 mt-1 text-center">
                  <div className="mx-auto flex justify-center">
                    <Upload className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Drag and drop your GeoJSON file here
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Declaration Start & End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !form.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.startDate ? format(form.startDate, "PPP") : "Date Picker"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.startDate}
                        onSelect={(date) => handleInputChange('startDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select 
                    value={form.supplierId.toString()} 
                    onValueChange={(value) => handleInputChange('supplierId', parseInt(value))}
                  >
                    <SelectTrigger id="supplier" className="mt-1">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Supplier 1</SelectItem>
                      <SelectItem value="2">Supplier 2</SelectItem>
                      <SelectItem value="3">Supplier 3</SelectItem>
                      <SelectItem value="4">Supplier 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select 
                    value={form.industry} 
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger id="industry" className="mt-1">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                      <SelectItem value="Agriculture">Agriculture</SelectItem>
                      <SelectItem value="Forestry">Forestry</SelectItem>
                      <SelectItem value="Textiles">Textiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="type">Declaration Type</Label>
                  <Select 
                    value={isSupplier ? "outbound" : isCustomer ? "inbound" : form.type} 
                    onValueChange={(value: "inbound" | "outbound") => {
                      if (!isSupplier && !isCustomer) {
                        handleInputChange('type', value);
                        setDeclarationType(value);
                      }
                    }}
                    disabled={isSupplier || isCustomer}
                  >
                    <SelectTrigger id="type" className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {!isSupplier && <SelectItem value="inbound">Inbound</SelectItem>}
                      {!isCustomer && <SelectItem value="outbound">Outbound</SelectItem>}
                    </SelectContent>
                  </Select>
                  {isSupplier && (
                    <p className="mt-1 text-xs text-gray-500">
                      As a supplier, you can only create outbound declarations
                    </p>
                  )}
                  {isCustomer && (
                    <p className="mt-1 text-xs text-gray-500">
                      As a customer, you can only create inbound declarations
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-md font-medium">Compliance Agreement</h3>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="agreement" 
                  checked={form.agreementChecked}
                  onCheckedChange={(checked) => 
                    handleInputChange('agreementChecked', checked === true)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="agreement" className="text-sm text-muted-foreground">
                    I confirm that all the information provided is accurate and complete
                  </Label>
                  <Label htmlFor="agreement" className="text-sm text-muted-foreground">
                    I agree to the terms and conditions of declaration submission
                  </Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimpleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline">
              Save as Draft
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createDeclaration.isPending}
              className="bg-primary"
            >
              {createDeclaration.isPending ? "Submitting..." : "Submit Declaration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs 
        defaultValue={isSupplier ? "outbound" : "inbound"} 
        className="w-full" 
        onValueChange={setActiveTab}
      >
        {isSupplier ? (
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value="outbound">Outbound Declaration</TabsTrigger>
          </TabsList>
        ) : isCustomer ? (
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value="inbound">Inbound Declaration</TabsTrigger>
          </TabsList>
        ) : isEuOperator ? (
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="inbound">Inbound Declaration</TabsTrigger>
            <TabsTrigger value="outbound">Outbound Declaration</TabsTrigger>
            <TabsTrigger value="eu_filed">EU Filed Declarations</TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="inbound">Inbound Declaration</TabsTrigger>
            <TabsTrigger value="outbound">Outbound Declaration</TabsTrigger>
          </TabsList>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <RiskSummaryCard 
            color="bg-green-100 text-green-600" 
            label="Low Risk" 
            count={stats?.approved || 0} 
            icon={<svg viewBox="0 0 24 24" width="24" height="24" className="fill-current"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <RiskSummaryCard 
            color="bg-yellow-100 text-yellow-600" 
            label="Medium Risk" 
            count={stats?.review || 0} 
            icon={<svg viewBox="0 0 24 24" width="24" height="24" className="fill-current"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
          <RiskSummaryCard 
            color="bg-red-100 text-red-600" 
            label="High Risk" 
            count={stats?.rejected || 0} 
            icon={<svg viewBox="0 0 24 24" width="24" height="24" className="fill-current"><path d="M12 2c5.522 0 10 4.478 10 10s-4.478 10-10 10S2 17.522 2 12 6.478 2 12 2zm0 15a1 1 0 100-2 1 1 0 000 2zm1-5a1 1 0 10-2 0v-4a1 1 0 112 0v4z" /></svg>}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/4">
            <Select defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="rm_id_not_present">RM id not present</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input 
                placeholder={activeTab === "inbound" ? "Search suppliers..." : "Search customers..."} 
                className="pl-9" 
              />
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Bulk Actions Panel */}
        {selectedRows.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedRows([])}>
                Clear selection
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === "eu_filed" ? (
          // EU Filed Declarations Table with different columns
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="whitespace-nowrap">
                    <th scope="col" className="py-3.5 pl-4 pr-1 text-left text-xs font-semibold text-gray-900">
                      <Checkbox 
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th scope="col" className="py-3.5 px-1 text-left text-xs font-semibold text-gray-900">
                      Dec. ID
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Filing Date
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Supplier
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Material
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Product
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Origin
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Destination
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      GeoJSON
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      DDS Status
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Docs
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Filed By
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Audit Trail
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-xs font-semibold text-gray-900">
                      Review Date
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-right text-xs font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoadingDeclarations ? (
                    <tr>
                      <td colSpan={17} className="py-10 text-center text-gray-500">
                        Loading EU Filed declarations...
                      </td>
                    </tr>
                  ) : filteredDeclarations.length === 0 ? (
                    // Add sample realistic data when no real data is available
                    <>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 pl-4 pr-1 text-sm whitespace-nowrap">
                          <Checkbox aria-label="Select declaration" />
                        </td>
                        <td className="py-4 px-1 text-sm whitespace-nowrap">
                          <div className="font-medium text-gray-900">EUDR-1001</div>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          02/15/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          EcoFarm Industries
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Palm Oil
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Refined Palm Oil
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Malaysia
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          European Union
                        </td>
                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                            Yes
                          </span>
                        </td>

                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                            DDS Success
                          </span>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <a href="#" className="text-blue-500 hover:underline">View</a>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          John Smith
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Yes
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          05/15/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 pl-4 pr-1 text-sm whitespace-nowrap">
                          <Checkbox aria-label="Select declaration" />
                        </td>
                        <td className="py-4 px-1 text-sm whitespace-nowrap">
                          <div className="font-medium text-gray-900">EUDR-1002</div>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          03/22/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          ForestryGlobal Inc.
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Timber
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Hardwood Lumber
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Brazil
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          European Union
                        </td>
                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                            Yes
                          </span>
                        </td>

                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-blue-500"></span>
                            Filed
                          </span>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <a href="#" className="text-blue-500 hover:underline">View</a>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Maria Garcia
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Yes
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          06/22/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 pl-4 pr-1 text-sm whitespace-nowrap">
                          <Checkbox aria-label="Select declaration" />
                        </td>
                        <td className="py-4 px-1 text-sm whitespace-nowrap">
                          <div className="font-medium text-gray-900">EUDR-1003</div>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          03/28/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          CocoaSource Ltd.
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Cocoa
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Cocoa Beans
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Ghana
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          European Union
                        </td>
                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-red-500"></span>
                            Invalid
                          </span>
                        </td>

                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-red-500"></span>
                            DDS Failed
                          </span>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <a href="#" className="text-blue-500 hover:underline">View</a>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          David Kim
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          No
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          06/28/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 pl-4 pr-1 text-sm whitespace-nowrap">
                          <Checkbox aria-label="Select declaration" />
                        </td>
                        <td className="py-4 px-1 text-sm whitespace-nowrap">
                          <div className="font-medium text-gray-900">EUDR-1004</div>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          04/02/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          RubberTrade Co.
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Rubber
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Natural Rubber
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Indonesia
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          European Union
                        </td>
                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-amber-500"></span>
                            Pending
                          </span>
                        </td>

                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-amber-500"></span>
                            Filed
                          </span>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <a href="#" className="text-blue-500 hover:underline">View</a>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Emma Wilson
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Yes
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          07/02/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 pl-4 pr-1 text-sm whitespace-nowrap">
                          <Checkbox aria-label="Select declaration" />
                        </td>
                        <td className="py-4 px-1 text-sm whitespace-nowrap">
                          <div className="font-medium text-gray-900">EUDR-1005</div>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          04/05/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          SoyExport S.A.
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Soy
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Soybean Meal
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Brazil
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          European Union
                        </td>
                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                            Yes
                          </span>
                        </td>

                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                            DDS Success
                          </span>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <a href="#" className="text-blue-500 hover:underline">View</a>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Robert Chen
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Yes
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          07/05/2025
                        </td>
                        <td className="px-1 py-4 text-sm text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    </>
                  ) : (
                    filteredDeclarations.map((declaration: Declaration) => (
                      <tr key={declaration.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 pl-4 pr-1 text-sm whitespace-nowrap">
                          <Checkbox 
                            checked={selectedRows.includes(declaration.id)}
                            onCheckedChange={(checked) => handleRowSelect(declaration.id, checked === true)}
                            aria-label={`Select declaration ${declaration.id}`}
                          />
                        </td>
                        <td className="py-4 px-1 text-sm whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {declaration.id}
                          </div>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(declaration.createdAt)}
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {declaration.supplier || `Supplier ${declaration.supplierId}`}
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {declaration.industry || "Not specified"}
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {declaration.productName}
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {/* Simulated origin country */}
                          {["Indonesia", "Brazil", "Malaysia", "Ghana", "Nigeria"][declaration.id % 5]}
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {/* Simulated destination country */}
                          European Union
                        </td>
                        <td className="px-1 py-4 text-sm whitespace-nowrap">
                          {declaration.geojsonData ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <span className="mr-1 h-2 w-2 rounded-full bg-gray-500"></span>
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <a href="#" className="text-blue-500 hover:underline">View</a>
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          System Admin
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {declaration.id % 2 === 0 ? 'Yes' : 'No'}
                        </td>
                        <td className="px-1 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {/* Simulated next review date - 90 days from creation */}
                          {formatDate(new Date(new Date(declaration.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString())}
                        </td>
                        <td className="px-1 py-4 text-sm text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                setSelectedDeclarationId(declaration.id);
                                setDetailViewOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Regular Inbound/Outbound Declarations Table
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      <Checkbox 
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      {activeTab === "inbound" ? "Supplier Name" : "Customer Name"}
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Industry/Product
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Risk Level
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Compliance Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      DDS Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Last Update
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoadingDeclarations ? (
                    <tr>
                      <td colSpan={12} className="py-10 text-center text-gray-500">
                        Loading declarations...
                      </td>
                    </tr>
                  ) : filteredDeclarations.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-10 text-center text-gray-500">
                        No {activeTab === "inbound" ? "inbound" : "outbound"} declarations found
                      </td>
                    </tr>
                  ) : (
                    filteredDeclarations.map((declaration: Declaration) => (
                      <DeclarationRow 
                        key={declaration.id} 
                        declaration={declaration} 
                        selected={selectedRows.includes(declaration.id)}
                        onSelectChange={handleRowSelect}
                        onViewClick={(id) => {
                          setSelectedDeclarationId(id);
                          setDetailViewOpen(true);
                        }}
                        suppliersList={suppliers}
                        setSelectedTracesDeclarationId={setSelectedTracesDeclarationId}
                        setEuTracesFormOpen={setEuTracesFormOpen}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Tabs>
      
      {/* Declaration Detail View Modal */}
      <DeclarationDetailView
        open={detailViewOpen}
        onOpenChange={setDetailViewOpen}
        declarationId={selectedDeclarationId}
      />
      
      {/* Allot RM ID Modal */}
      <Dialog open={allotRmIdModalOpen} onOpenChange={setAllotRmIdModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Upload a spreadsheet with RM IDs for your selected declarations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border-2 border-dashed rounded-md p-6 text-center">
            <div className="mx-auto flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-2">
                Drag and drop your Excel file here
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <Button size="sm" className="mb-2">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Browse Files
              </Button>
              <p className="text-xs text-gray-500 mb-2">
                Supported formats: .xlsx, .xls
              </p>
            </div>
          </div>
          
          <div className="flex items-center text-sm py-2">
            <div className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => {
              // Create a request to the server to download the product list Excel file
              fetch('/api/declarations/product-list-template', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  products: selectedWithoutRmIdIds.map((id, index) => ({
                    srNo: index + 1,
                    productName: declarationsById[id]?.productName || "",
                    rmId: ""
                  }))
                }),
              })
              .then(response => response.blob())
              .then(blob => {
                // Create a URL for the blob
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Product List.xlsx';
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                toast({
                  title: "Product List Downloaded",
                  description: `Downloaded template with ${selectedWithoutRmId.length} products`,
                });
              })
              .catch(error => {
                console.error('Error downloading file:', error);
                toast({
                  title: "Download Failed",
                  description: "There was an error downloading the product list template",
                  variant: "destructive",
                });
              });
            }}>
              <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Product List
            </div>
            <p className="ml-1 text-gray-500 text-xs">
              Get Excel template with selected products
            </p>
          </div>
          
          <div className="text-sm flex items-center text-blue-500">
            <svg className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Maximum file size: 10MB
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllotRmIdModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={fileUploading}>
              {fileUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                "Upload File"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* EU Traces Form */}
      <EUTracesForm 
        open={euTracesFormOpen} 
        onOpenChange={setEuTracesFormOpen}
        declarationId={selectedTracesDeclarationId || undefined}
      />
    </div>
  );
}