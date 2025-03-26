import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Search, Eye, Upload, Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DeclarationWizard from "@/components/declarations/declaration-wizard";

interface Declaration {
  id: number;
  type: "inbound" | "outbound";
  supplierId: number;
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

function DeclarationRow({ declaration }: { declaration: Declaration }) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-4 pl-4 pr-3 text-sm whitespace-nowrap">
        <div className="font-medium text-gray-900">Supplier {declaration.supplierId}</div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
        {declaration.industry || "Not specified"} / {declaration.productName}
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
      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
        {formatDate(declaration.lastUpdated)}
      </td>
      <td className="px-3 py-4 text-sm text-right whitespace-nowrap">
        <Button variant="ghost" size="sm" className="text-primary">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
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
}

export default function Declarations() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [simpleModalOpen, setSimpleModalOpen] = useState(false);
  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  const [declarationType, setDeclarationType] = useState<"inbound" | "outbound">("inbound");
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
    agreementChecked: false
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
      
      // Using the apiRequest function with the correct parameter order:
      // apiRequest(method, url, data?)
      const result = await apiRequest('POST', '/api/declarations', payload);
      
      return result.json();
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
        agreementChecked: false
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
  
  // Fetch declarations
  const { data: declarations = [], isLoading: isLoadingDeclarations } = useQuery<Declaration[]>({
    queryKey: ['/api/declarations', activeTab !== 'all' ? { type: activeTab } : undefined],
    refetchOnWindowFocus: false,
  });
  
  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DeclarationStats>({
    queryKey: ['/api/declarations/stats'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch suppliers (simplified for this example)
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    refetchOnWindowFocus: false,
  });
  
  const filteredDeclarations = activeTab === 'all' 
    ? declarations 
    : declarations.filter((d) => d.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Declarations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage inbound and outbound declarations for EUDR compliance</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
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
        </div>
      </div>
      
      {/* Simple Declaration Modal */}
      <Dialog open={simpleModalOpen} onOpenChange={setSimpleModalOpen}>
        
      {/* Advanced Declaration Wizard */}
      <DeclarationWizard 
        open={wizardModalOpen} 
        onOpenChange={setWizardModalOpen} 
      />
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
                    value={form.type} 
                    onValueChange={(value: "inbound" | "outbound") => {
                      handleInputChange('type', value);
                      setDeclarationType(value);
                    }}
                  >
                    <SelectTrigger id="type" className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
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
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="inbound">Inbound Declaration</TabsTrigger>
          <TabsTrigger value="outbound">Outbound Declaration</TabsTrigger>
        </TabsList>
        
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
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input placeholder="Search suppliers..." className="pl-9" />
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
        
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Supplier Name
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
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      Loading declarations...
                    </td>
                  </tr>
                ) : filteredDeclarations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      No declarations found
                    </td>
                  </tr>
                ) : (
                  filteredDeclarations.map((declaration: Declaration) => (
                    <DeclarationRow key={declaration.id} declaration={declaration} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Tabs>
    </div>
  );
}