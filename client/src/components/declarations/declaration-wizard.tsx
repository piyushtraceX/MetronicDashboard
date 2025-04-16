import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/ui/stepper";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CalendarIcon, Plus, Search, Trash2, Upload, User, Info, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ValidationDetailsDialog from "./validation-details-dialog";

// Declaration types
type DeclarationType = "inbound" | "outbound";

interface Customer {
  id: number;
  name: string;
  type: string;
  company?: string;
  country?: string;
  registrationNumber?: string;
  contactPerson?: string;
  contactEmail?: string;
  complianceScore?: number;
}

interface Supplier {
  id: number;
  name: string;
  products?: string;
  countries?: string[];
}

interface DeclarationItem {
  id: string;
  hsnCode: string;
  productName: string;
  scientificName: string;
  quantity: string;
  unit: string;
  rmId?: string;
}

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeclarationWizard({ open, onOpenChange }: WizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1: Declaration Type
  const [declarationType, setDeclarationType] = useState<DeclarationType>("inbound");

  // Step 2: Declaration Details - Items
  const [items, setItems] = useState<DeclarationItem[]>([
    {
      id: "item-1",
      hsnCode: "",
      productName: "",
      scientificName: "",
      quantity: "",
      unit: "kg",
      rmId: ""
    }
  ]);

  // Step 3: Upload Evidence Documents
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Form data - Dates and Supplier
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [validityPeriod, setValidityPeriod] = useState<string>("custom");
  const [showCustomDates, setShowCustomDates] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  // For multiple supplier selection
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [supplierSoNumber, setSupplierSoNumber] = useState("");
  const [shipmentNumber, setShipmentNumber] = useState("");
  const [comments, setComments] = useState("");

  // Step 4: Customer Selection (for outbound only)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // GeoJSON upload state
  const [hasUploadedGeoJSON, setHasUploadedGeoJSON] = useState(false);
  const [geometryValid, setGeometryValid] = useState<boolean | null>(null);
  const [satelliteValid, setSatelliteValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState<string | null>(null); // 'geometry' or 'satellite' or null
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null); // To store which plot is selected in the details view

  // Create declaration mutation
  const createDeclaration = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/declarations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      // Close modal
      onOpenChange(false);

      // Show success toast
      toast({
        title: "Declaration created",
        description: "Your declaration has been successfully submitted",
        variant: "default",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/declarations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/declarations/stats'] });

      // Reset form
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create declaration. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
    refetchOnWindowFocus: false,
  });

  // Mock customers for the example
  const customers: Customer[] = [
    { 
      id: 1, 
      name: "EuroFood Retailers GmbH", 
      type: "EU-Based Entity",
      company: "EuroFood Group",
      country: "Germany",
      registrationNumber: "DE78901234",
      contactPerson: "Hans Mueller",
      contactEmail: "h.mueller@eurofood.example",
      complianceScore: 92
    },
    { 
      id: 2, 
      name: "Global Trade Partners Ltd", 
      type: "Non-EU Distributor",
      company: "GTP International",
      country: "United Kingdom",
      registrationNumber: "GB45678901",
      contactPerson: "Sarah Johnson",
      contactEmail: "sjohnson@gtp.example",
      complianceScore: 85
    },
    { 
      id: 3, 
      name: "Nordic Organic Markets AB", 
      type: "Retail Chain",
      company: "Nordic Foods Group",
      country: "Sweden",
      registrationNumber: "SE12345678",
      contactPerson: "Erik Andersson",
      contactEmail: "e.andersson@nordicorganic.example",
      complianceScore: 95
    },
    { 
      id: 4, 
      name: "Mediterranean Distributors S.L.", 
      type: "EU-Based Entity",
      company: "Med Group",
      country: "Spain",
      registrationNumber: "ES87654321",
      contactPerson: "Carmen Rodriguez",
      contactEmail: "rodriguez@meddist.example",
      complianceScore: 88
    },
    { 
      id: 5, 
      name: "Asian Markets Co., Ltd.", 
      type: "Non-EU Distributor",
      company: "AMC Holdings",
      country: "Singapore",
      registrationNumber: "SG67890123",
      contactPerson: "Lim Wei Ling",
      contactEmail: "wlim@asianmarkets.example",
      complianceScore: 82
    }
  ];

  // Handle form input changes for items
  const updateItem = (id: string, field: keyof DeclarationItem, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Add a new item
  const addItem = () => {
    setItems(prev => [
      ...prev, 
      {
        id: `item-${prev.length + 1}`,
        hsnCode: "",
        productName: "",
        scientificName: "",
        quantity: "",
        unit: "kg",
        rmId: ""
      }
    ]);
  };

  // Remove an item
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    } else {
      toast({
        title: "Cannot remove item",
        description: "At least one item is required",
        variant: "destructive",
      });
    }
  };

  // Handle file upload simulation
  const handleGeoJSONUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    setHasUploadedGeoJSON(true);
    setIsValidating(true);
    setGeometryValid(null);
    setSatelliteValid(null);
    
    toast({
      title: "GeoJSON uploaded",
      description: "GeoJSON file has been uploaded successfully. Validating...",
      variant: "default",
    });
    
    // Simulate geometry validation check
    setTimeout(() => {
      // 80% probability of geometry validation passing, 20% failing
      const geometryIsValid = Math.random() < 0.8;
      setGeometryValid(geometryIsValid);
      
      // If geometry validation fails, don't proceed to satellite check
      if (!geometryIsValid) {
        setIsValidating(false);
        toast({
          title: "Geometry validation failed",
          description: "The GeoJSON contains non-compliant geometry. Please notify the supplier. The declaration can be saved as draft but cannot be submitted.",
          variant: "destructive",
        });
        return;
      }
      
      // Only proceed to satellite check if geometry is valid
      setTimeout(() => {
        // 75% probability of satellite validation passing, 25% failing
        const satelliteIsValid = Math.random() < 0.75;
        setSatelliteValid(satelliteIsValid);
        setIsValidating(false);
        
        // If satellite check fails, notify the user
        if (!satelliteIsValid) {
          toast({
            title: "Validation issues detected",
            description: "Satellite check detected potential deforestation. The declaration can be saved as draft but cannot be submitted.",
            variant: "destructive",
          });
        }
      }, 2000);
    }, 1500);
  };

  const handleDocumentUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    const filename = `document_${uploadedFiles.length + 1}.pdf`;
    setUploadedFiles(prev => [...prev, filename]);
    toast({
      title: "File uploaded",
      description: `${filename} has been uploaded successfully`,
      variant: "default",
    });
  };

  // Remove uploaded file
  const removeFile = (filename: string) => {
    setUploadedFiles(prev => prev.filter(file => file !== file));
  };

  // Navigate to next step
  const goToNextStep = () => {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Declaration Type
        // Check if a supplier is selected
        if (!selectedSupplierId) {
          toast({
            title: "Supplier required",
            description: "Please select a supplier to continue",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if PO Number is provided
        if (!poNumber.trim()) {
          toast({
            title: "PO Number required",
            description: "Please enter a PO number to continue",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if at least one valid item is present
        const validItems = items.filter(item => 
          item.hsnCode.trim() !== "" && 
          item.productName.trim() !== "" && 
          item.quantity.trim() !== ""
        );
        
        if (validItems.length === 0) {
          toast({
            title: "Valid item required",
            description: "Please complete at least one item with HSN Code, Product Name, and Quantity",
            variant: "destructive",
          });
          return false;
        }
        
        return true;

      case 2: // GeoJSON Upload
        // Check if GeoJSON is uploaded
        if (!hasUploadedGeoJSON) {
          toast({
            title: "GeoJSON required",
            description: "Please upload a GeoJSON file to continue",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if validation is in progress
        if (isValidating) {
          toast({
            title: "Validation in progress",
            description: "Please wait for the GeoJSON validation to complete",
            variant: "destructive",
          });
          return false;
        }
        
        // Allow proceeding even with failed validations
        // The declaration can be saved as draft but won't be submittable later
        return true;

      case 3: // Upload Evidence
        // Check if at least one file is uploaded
        if (uploadedFiles.length === 0) {
          toast({
            title: "Evidence required",
            description: "Please upload at least one document as evidence",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 4: // Customer Selection (outbound only)
        if (declarationType === "outbound" && !selectedCustomer) {
          toast({
            title: "Selection required",
            description: "Please select a customer to continue",
            variant: "destructive",
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Submit declaration
  const submitDeclaration = () => {
    if (!validateCurrentStep()) return;

    // Format items for submission
    const formattedItems = items.filter(item => 
      item.hsnCode.trim() !== "" && 
      item.productName.trim() !== "" && 
      item.quantity.trim() !== ""
    ).map(item => ({
      hsnCode: item.hsnCode,
      productName: item.productName,
      scientificName: item.scientificName,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      rmId: item.rmId
    }));

    // Determine declaration status based on GeoJSON validation results
    let status = "pending";
    
    if (geometryValid === false) {
      status = "non-compliant-geometry";
    } else if (satelliteValid === false) {
      status = "non-compliant-satellite";
    } else if (declarationType === "inbound") {
      status = "validating";
    }
    
    // Get the first product name as the primary name for the declaration
    const firstProduct = formattedItems[0]?.productName || "Unnamed Product";
    
    // Create a simplified payload with only required fields
    const payload = {
      type: declarationType,
      supplierId: selectedSupplierId || 1, // Ensure we always have a supplier ID
      productName: firstProduct,
      productDescription: formattedItems[0]?.scientificName || "",
      hsnCode: formattedItems[0]?.hsnCode || "",
      quantity: Number(formattedItems[0]?.quantity) || 0,
      unit: formattedItems[0]?.unit || "kg",
      status: status,
      riskLevel: "medium",
      industry: "Food & Beverage" // Default industry
    };

    createDeclaration.mutate(payload);
  };

  // Reset form state
  const resetForm = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setDeclarationType("inbound");
    setItems([
      {
        id: "item-1",
        hsnCode: "",
        productName: "",
        scientificName: "",
        quantity: "",
        unit: "kg",
        rmId: ""
      }
    ]);
    setUploadedFiles([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setValidityPeriod("custom");
    setShowCustomDates(true);
    setSelectedSupplierId(null);
    setSelectedSupplier(null);
    setSelectedSupplierIds([]);
    setSupplierSearchTerm("");
    setShowSupplierDropdown(false);
    setPoNumber("");
    setSupplierSoNumber("");
    setShipmentNumber("");
    setSelectedCustomer(null);
    setComments("");
    setHasUploadedGeoJSON(false);
    setGeometryValid(null);
    setSatelliteValid(null);
    setIsValidating(false);
    setShowValidationDetails(null);
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Filter suppliers based on search term
  // Show all suppliers by default, filter when there's a search term
  const filteredSuppliers = supplierSearchTerm.length > 0
    ? suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
      )
    : suppliers;

  // Get step labels based on declaration type
  const getStepLabels = () => {
    if (declarationType === "inbound") {
      return [
        "Items & Supplier", 
        "GeoJSON Upload", 
        "Evidence Documents", 
        "Review"
      ];
    } else {
      return [
        "Items & Supplier", 
        "GeoJSON Upload", 
        "Evidence Documents", 
        "Customer Selection",
        "Review"
      ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Declaration</DialogTitle>
          <DialogDescription>
            {declarationType === "inbound" 
              ? "Create a new inbound declaration from a supplier" 
              : "Create a new outbound declaration for a customer"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Stepper 
            steps={getStepLabels()} 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
          />
        </div>

        <Tabs 
          defaultValue="inbound" 
          value={declarationType}
          onValueChange={(value) => setDeclarationType(value as DeclarationType)}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="inbound">Inbound</TabsTrigger>
            <TabsTrigger value="outbound">Outbound</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Step 1: Items & Supplier */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="poNumber">PO Number</Label>
                <Input 
                  id="poNumber" 
                  placeholder="Enter PO number" 
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supplierSONumber">Supplier SO Number</Label>
                <Input 
                  id="supplierSONumber" 
                  placeholder="Enter supplier SO number (if available)" 
                  value={supplierSoNumber}
                  onChange={(e) => setSupplierSoNumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Supplier</Label>
              <div className="relative">
                <div 
                  className={cn(
                    "flex items-center justify-between p-2 border rounded-md cursor-pointer",
                    selectedSupplier ? "border-primary/30 bg-primary/5" : ""
                  )}
                  onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                >
                  {selectedSupplier ? (
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="ml-2">
                        <div className="font-medium">{selectedSupplier.name}</div>
                        <div className="text-xs text-gray-500">
                          {selectedSupplier.products}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Select a supplier</span>
                  )}
                  <Search className="h-4 w-4 text-gray-500" />
                </div>

                {/* Dropdown for suppliers */}
                {showSupplierDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-2 border-b">
                      <Input 
                        placeholder="Search suppliers..." 
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                      />
                    </div>
                    <div>
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map(supplier => (
                          <div
                            key={supplier.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedSupplierId(supplier.id);
                              setSelectedSupplier(supplier);
                              setShowSupplierDropdown(false);
                            }}
                          >
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-gray-500">
                              {supplier.products}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-center text-gray-500">
                          No suppliers found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Declaration Validity Period</Label>
                <Select 
                  value={validityPeriod} 
                  onValueChange={(value) => {
                    setValidityPeriod(value);
                    
                    const now = new Date();
                    setStartDate(now);
                    
                    let end = new Date();
                    if (value === "30days") {
                      end.setDate(now.getDate() + 30);
                      setShowCustomDates(false);
                    } else if (value === "6months") {
                      end.setMonth(now.getMonth() + 6);
                      setShowCustomDates(false);
                    } else if (value === "9months") {
                      end.setMonth(now.getMonth() + 9);
                      setShowCustomDates(false);
                    } else if (value === "1year") {
                      end.setFullYear(now.getFullYear() + 1);
                      setShowCustomDates(false);
                    } else {
                      setShowCustomDates(true);
                    }
                    
                    if (value !== "custom") {
                      setEndDate(end);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="9months">9 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                        disabled={!showCustomDates}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={!showCustomDates}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Declaration Items</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-md bg-slate-50">
                    <div className="grid grid-cols-6 gap-4">
                      <div className="col-span-1">
                        <Label htmlFor={`hsn-${item.id}`}>HSN Code</Label>
                        <Input 
                          id={`hsn-${item.id}`} 
                          placeholder="HSN code" 
                          value={item.hsnCode}
                          onChange={(e) => updateItem(item.id, "hsnCode", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`product-${item.id}`}>Product Name</Label>
                        <Input 
                          id={`product-${item.id}`} 
                          placeholder="Product name" 
                          value={item.productName}
                          onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label htmlFor={`scientific-${item.id}`}>Scientific Name</Label>
                        <Input 
                          id={`scientific-${item.id}`} 
                          placeholder="Scientific name" 
                          value={item.scientificName}
                          onChange={(e) => updateItem(item.id, "scientificName", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            id={`quantity-${item.id}`} 
                            type="number" 
                            placeholder="Quantity" 
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                          />
                          <Select 
                            value={item.unit} 
                            onValueChange={(value) => updateItem(item.id, "unit", value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="tons">tons</SelectItem>
                              <SelectItem value="lbs">lbs</SelectItem>
                              <SelectItem value="l">liters</SelectItem>
                              <SelectItem value="pcs">pieces</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(item.id)}
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: GeoJSON Upload */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">GeoJSON Data Upload</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload GeoJSON files containing geographic information about cultivation areas. This data will be used to validate compliance with deforestation regulations.
              </p>
              
              <div className="border-2 border-dashed rounded-md p-8 text-center">
                {hasUploadedGeoJSON ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        geojson-data.json
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6">
                      <div className="border rounded-md p-4 relative">
                        <h4 className="font-medium mb-2">Geometry Validation</h4>
                        <div className="flex items-center">
                          {isValidating ? (
                            <div className="flex items-center text-amber-600">
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                              <span>Validating...</span>
                            </div>
                          ) : geometryValid === null ? (
                            <span className="text-gray-500">Pending</span>
                          ) : geometryValid ? (
                            <div className="flex items-center text-green-600">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mr-2">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Compliant</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mr-2">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span>Non-Compliant</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Validates the structure and integrity of GeoJSON polygons.
                        </p>
                        
                        {geometryValid !== null && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-2 right-2"
                            onClick={() => setShowValidationDetails('geometry')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="border rounded-md p-4 relative">
                        <h4 className="font-medium mb-2">Satellite Check</h4>
                        <div className="flex items-center">
                          {!geometryValid ? (
                            <span className="text-gray-500">Skipped</span>
                          ) : isValidating ? (
                            <div className="flex items-center text-amber-600">
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                              <span>Validating...</span>
                            </div>
                          ) : satelliteValid === null ? (
                            <span className="text-gray-500">Pending</span>
                          ) : satelliteValid ? (
                            <div className="flex items-center text-green-600">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mr-2">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Compliant</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mr-2">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span>Non-Compliant</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Checks cultivation areas against satellite imagery for deforestation.
                        </p>
                        
                        {satelliteValid !== null && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-2 right-2"
                            onClick={() => setShowValidationDetails('satellite')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Drag and drop your GeoJSON file here, or click to browse
                    </p>
                    <Button variant="outline" onClick={handleGeoJSONUpload}>
                      Upload GeoJSON
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload Evidence */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Upload Evidence Documents</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload supporting documents like certificates, permits, and supply chain records to validate compliance.
              </p>
              
              <div className="border-2 border-dashed rounded-md p-8 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline" onClick={handleDocumentUpload}>
                  Upload Documents
                </Button>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Uploaded Files</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v.92l4.08 4.08L5 13.08V14h10v-.92l-4.08-4.08L15 5.08V4H5zm1 2.08l3.075 3.075L5.92 13.08h8.16l-3.155-3.925L14 6.08H6z" clipRule="evenodd" />
                          </svg>
                          <span>{file}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFile(file)}
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Customer Selection (for outbound only) */}
        {currentStep === 4 && declarationType === "outbound" && (
          <div className="space-y-6">
            <div>
              <Label>Customer</Label>
              <div className="relative">
                <div 
                  className={cn(
                    "flex items-center justify-between p-2 border rounded-md cursor-pointer",
                    selectedCustomer ? "border-primary/30 bg-primary/5" : ""
                  )}
                  onClick={() => setShowCustomerResults(!showCustomerResults)}
                >
                  {selectedCustomer ? (
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="ml-2">
                        <div className="font-medium">{selectedCustomer.name}</div>
                        <div className="text-xs text-gray-500">
                          {selectedCustomer.type}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Select a customer</span>
                  )}
                  <Search className="h-4 w-4 text-gray-500" />
                </div>

                {/* Dropdown for customers */}
                {showCustomerResults && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-2 border-b">
                      <Input 
                        placeholder="Search customers..." 
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      />
                    </div>
                    <div>
                      {customers
                        .filter(customer => 
                          customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                          customer.company?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                          customerSearchTerm === ""
                        )
                        .map(customer => (
                          <div
                            key={customer.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowCustomerResults(false);
                            }}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <span className="mr-2">{customer.type}</span>
                              <Badge variant="outline" className="text-[10px] h-5">
                                {customer.complianceScore}% Compliant
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPONumber">Customer PO Number</Label>
                <Input 
                  id="customerPONumber" 
                  placeholder="Enter customer PO number" 
                  value={customerPONumber}
                  onChange={(e) => setCustomerPONumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="soNumber">SO Number</Label>
                <Input 
                  id="soNumber" 
                  placeholder="Enter SO number" 
                  value={soNumber}
                  onChange={(e) => setSONumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shipmentNumber">Shipment Number</Label>
              <Input 
                id="shipmentNumber" 
                placeholder="Enter shipment number" 
                value={shipmentNumber}
                onChange={(e) => setShipmentNumber(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 5 (or 4 for inbound): Review */}
        {((currentStep === 4 && declarationType === "inbound") || (currentStep === 5 && declarationType === "outbound")) && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Review Declaration</h3>
              <p className="text-sm text-gray-500 mb-4">
                Review the information before submitting the declaration.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-3">General Information</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-32">Declaration Type:</span>
                      <span className="font-medium">
                        {declarationType === "inbound" ? "Inbound (from Supplier)" : "Outbound (to Customer)"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">PO Number:</span>
                      <span className="font-medium">{poNumber}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Supplier:</span>
                      <span className="font-medium">{selectedSupplier?.name || "Not selected"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Validity Period:</span>
                      <span className="font-medium">
                        {startDate && endDate 
                          ? `${format(startDate, "PP")} to ${format(endDate, "PP")}` 
                          : "Not specified"}
                      </span>
                    </div>
                    {declarationType === "outbound" && (
                      <div className="flex">
                        <span className="text-gray-500 w-32">Customer:</span>
                        <span className="font-medium">{selectedCustomer?.name || "Not selected"}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-3">Declaration Items</h4>
                  <div className="space-y-3">
                    {items.filter(item => 
                      item.hsnCode.trim() !== "" || 
                      item.productName.trim() !== "" || 
                      item.quantity.trim() !== ""
                    ).map((item, index) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-md">
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 block">HSN Code</span>
                            <span className="font-medium">{item.hsnCode || "—"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Product Name</span>
                            <span className="font-medium">{item.productName || "—"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Scientific Name</span>
                            <span className="font-medium">{item.scientificName || "—"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Quantity</span>
                            <span className="font-medium">
                              {item.quantity ? `${item.quantity} ${item.unit}` : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-3">GeoJSON Validation</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Geometry Validation</span>
                      <div className="mt-1">
                        {geometryValid === null ? (
                          <Badge variant="outline">Not Validated</Badge>
                        ) : geometryValid ? (
                          <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Non-Compliant</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Satellite Check</span>
                      <div className="mt-1">
                        {satelliteValid === null ? (
                          <Badge variant="outline">Not Validated</Badge>
                        ) : satelliteValid ? (
                          <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Non-Compliant</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-3">Supporting Documents</h4>
                  <div className="space-y-2 text-sm">
                    {uploadedFiles.length > 0 ? (
                      uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center">
                          <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v.92l4.08 4.08L5 13.08V14h10v-.92l-4.08-4.08L15 5.08V4H5zm1 2.08l3.075 3.075L5.92 13.08h8.16l-3.155-3.925L14 6.08H6z" clipRule="evenodd" />
                          </svg>
                          <span>{file}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">No documents uploaded</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="comments">Additional Comments</Label>
                  <Textarea 
                    id="comments" 
                    placeholder="Add any additional information or notes" 
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="h-24"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {currentStep > 1 && (
            <Button variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
          )}
          
          {currentStep < (declarationType === "inbound" ? 4 : 5) ? (
            <Button onClick={goToNextStep}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={submitDeclaration} 
              disabled={createDeclaration.isPending}
            >
              {createDeclaration.isPending ? "Submitting..." : "Submit Declaration"}
            </Button>
          )}
        </DialogFooter>

        {/* Validation Details Dialog */}
        <ValidationDetailsDialog
          open={showValidationDetails !== null}
          onClose={() => setShowValidationDetails(null)}
          validationType={showValidationDetails as "geometry" | "satellite" | null}
        />
      </DialogContent>
    </Dialog>
  );
}