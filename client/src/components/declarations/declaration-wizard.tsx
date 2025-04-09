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
import { CalendarIcon, Plus, Search, Trash2, Upload, User, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  // For multiple supplier selection
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
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
      // 50% probability of geometry validation passing/failing for equal testing scenarios
      const geometryIsValid = Math.random() < 0.5;
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
        // 50% probability of satellite validation passing/failing
        const satelliteIsValid = Math.random() < 0.5;
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
        // Check if a supplier is selected in either single or multiple mode
        if (selectedSupplierIds.length === 0 && !selectedSupplierId) {
          toast({
            title: "Supplier required",
            description: "Please select at least one supplier to continue",
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
    
    // Check if we're in multiple supplier mode or single supplier mode
    if (selectedSupplierIds.length > 0) {
      // Multiple supplier mode - create a declaration for each supplier
      const createMultipleDeclarations = async () => {
        try {
          // Show loading toast
          toast({
            title: "Creating declarations",
            description: `Creating ${selectedSupplierIds.length} declarations...`,
            variant: "default",
          });
          
          let successCount = 0;
          let errorCount = 0;
          
          // Create a declaration for each supplier
          for (const supplierId of selectedSupplierIds) {
            const payload = {
              type: declarationType,
              items: formattedItems,
              documents: uploadedFiles,
              startDate: startDate ? startDate.toISOString() : null,
              endDate: endDate ? endDate.toISOString() : null,
              supplierId: supplierId,
              customerId: declarationType === "outbound" ? selectedCustomer?.id || null : null,
              status: status,
              riskLevel: "medium",
              poNumber: poNumber,
              supplierSoNumber: supplierSoNumber,
              shipmentNumber: shipmentNumber,
              comments: comments,
              geometryValid: geometryValid,
              satelliteValid: satelliteValid,
              supplier: suppliers.find(s => s.id === supplierId)?.name // Include supplier name
            };
            
            try {
              await apiRequest('/api/declarations', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
              });
              successCount++;
            } catch (error) {
              console.error(`Error creating declaration for supplier ID ${supplierId}:`, error);
              errorCount++;
            }
          }
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/declarations'] });
          queryClient.invalidateQueries({ queryKey: ['/api/declarations/stats'] });
          
          // Show completion toast
          toast({
            title: "Declarations created",
            description: `Successfully created ${successCount} declarations${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
            variant: errorCount > 0 ? "destructive" : "default",
          });
          
          // Close modal
          onOpenChange(false);
          
          // Reset form
          resetForm();
        } catch (error) {
          console.error("Error in creating multiple declarations:", error);
          toast({
            title: "Error",
            description: "Failed to create multiple declarations. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      createMultipleDeclarations();
    } else {
      // Single supplier mode - create one declaration
      const payload = {
        type: declarationType,
        items: formattedItems,
        documents: uploadedFiles,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        supplierId: selectedSupplierId,
        customerId: declarationType === "outbound" ? selectedCustomer?.id || null : null,
        status: status,
        riskLevel: "medium",
        poNumber: poNumber,
        supplierSoNumber: supplierSoNumber,
        shipmentNumber: shipmentNumber,
        comments: comments,
        geometryValid: geometryValid,
        satelliteValid: satelliteValid,
        supplier: suppliers.find(s => s.id === selectedSupplierId)?.name // Include supplier name
      };

      createDeclaration.mutate(payload);
    }
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
    setSelectedSupplierId(null);
    setSelectedSupplier(null);
    setSelectedSupplierIds([]);
    setSupplierSearchTerm("");
    setPoNumber("");
    setSupplierSoNumber("");
    setShipmentNumber("");
    setSelectedCustomer(null);
    setComments("");
    setHasUploadedGeoJSON(false);
    setGeometryValid(null);
    setSatelliteValid(null);
    setIsValidating(false);
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Filter suppliers based on search term
  // Only show suppliers when there's an active search with at least 2 characters
  const filteredSuppliers = supplierSearchTerm.length >= 2 
    ? suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
      )
    : [];

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Declaration</DialogTitle>
          <DialogDescription>
            Create an inbound declaration with proper compliance documentation.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-8">
          <Stepper 
            steps={getStepLabels()}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        <div className="py-4">
          {/* Step removed - Declaration Type is now set by the main buttons */}

          {/* Step 1: Declaration Details - Items */}
          {currentStep === 1 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Declaration Validity Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select start date"}
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
                    <Label htmlFor="end-date">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="end-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          fromDate={startDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Supplier Selection</h3>
                <div className="flex items-center mb-2">
                  <div className="text-sm text-gray-600 mr-2">Selection Mode:</div>
                  <Tabs
                    value={selectedSupplierIds.length > 0 ? "multiple" : "single"}
                    onValueChange={(value) => {
                      // When switching to single mode, clear multi selections
                      if (value === "single" && selectedSupplierIds.length > 0) {
                        setSelectedSupplierIds([]);
                      }
                      // When switching to multiple mode, convert single selection to multi if it exists
                      if (value === "multiple" && selectedSupplierId) {
                        setSelectedSupplierIds([selectedSupplierId]);
                        setSelectedSupplierId(null);
                        setSelectedSupplier(null);
                      }
                    }}
                    className="mb-2"
                  >
                    <TabsList className="grid w-[300px] grid-cols-2">
                      <TabsTrigger value="single">Single Supplier</TabsTrigger>
                      <TabsTrigger value="multiple">Multiple Suppliers</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="relative mb-4">
                  <Input 
                    type="text" 
                    placeholder="Type at least 2 characters to search suppliers..." 
                    className="pl-9"
                    value={supplierSearchTerm}
                    onChange={(e) => {
                      setSupplierSearchTerm(e.target.value);
                      if (!e.target.value) {
                        setSelectedSupplierId(null);
                      }
                    }}
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  {supplierSearchTerm.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border">
                      <div className="max-h-60 overflow-auto">
                        {filteredSuppliers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500">No suppliers found</div>
                        ) : (
                          filteredSuppliers.map((supplier) => (
                            <div
                              key={supplier.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                                selectedSupplierId === supplier.id || selectedSupplierIds.includes(supplier.id) 
                                  ? 'bg-primary/5' 
                                  : ''
                              }`}
                              onClick={() => {
                                // If in multiple mode
                                if (selectedSupplierIds.length > 0 || (selectedSupplierId === null && selectedSupplier === null)) {
                                  // Toggle selection
                                  if (selectedSupplierIds.includes(supplier.id)) {
                                    setSelectedSupplierIds(prev => prev.filter(id => id !== supplier.id));
                                  } else {
                                    setSelectedSupplierIds(prev => [...prev, supplier.id]);
                                  }
                                } else {
                                  // Single mode
                                  setSelectedSupplierId(supplier.id);
                                  setSelectedSupplier(supplier);
                                  setSupplierSearchTerm(supplier.name);
                                }
                              }}
                            >
                              <div className="font-medium">{supplier.name}</div>
                              <div className="text-xs text-gray-500">{supplier.products || 'No products specified'}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Show selected suppliers */}
                {selectedSupplierIds.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between mb-2">
                      <div className="text-sm font-medium">Selected Suppliers ({selectedSupplierIds.length})</div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 h-8 px-2"
                        onClick={() => setSelectedSupplierIds([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    {selectedSupplierIds.map(id => {
                      const supplier = suppliers.find(s => s.id === id);
                      return supplier ? (
                        <div key={id} className="p-3 border rounded-lg flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {supplier.name.substring(0, 2).toUpperCase() || 'SP'}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">{supplier.name}</div>
                              <div className="text-xs text-gray-400">{supplier.products || 'No products specified'}</div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 h-8 px-2"
                            onClick={() => setSelectedSupplierIds(prev => prev.filter(suppId => suppId !== id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  // Show selected supplier card only if a supplier is selected in single mode
                  selectedSupplierId && (
                    <div className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {suppliers.find(s => s.id === selectedSupplierId)?.name.substring(0, 2).toUpperCase() || 'SP'}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{suppliers.find(s => s.id === selectedSupplierId)?.name}</div>
                          <div className="text-xs text-gray-400">{suppliers.find(s => s.id === selectedSupplierId)?.products || 'No products specified'}</div>
                        </div>
                      </div>
                      <Badge className="bg-primary">Selected</Badge>
                    </div>
                  )
                )}
              </div>

              <div className="space-y-6 mb-6">
                <div>
                  <Label htmlFor="po-number" className="text-sm font-medium">
                    PO Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="po-number"
                    type="text"
                    placeholder="Enter PO number"
                    className="mt-1"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="supplier-so" className="text-sm font-medium">
                    Supplier SO Number
                  </Label>
                  <Input
                    id="supplier-so"
                    type="text"
                    placeholder="Enter supplier SO number"
                    className="mt-1"
                    value={supplierSoNumber}
                    onChange={(e) => setSupplierSoNumber(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="shipment-number" className="text-sm font-medium">
                    Shipment Number (BL, LR etc.)
                  </Label>
                  <Input
                    id="shipment-number"
                    type="text"
                    placeholder="Enter shipment number"
                    className="mt-1"
                    value={shipmentNumber}
                    onChange={(e) => setShipmentNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Declaration Items</h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // This will trigger a click on the hidden file input
                        document.getElementById('importItemsFile')?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Items
                    </Button>
                    <input 
                      type="file" 
                      id="importItemsFile" 
                      accept=".csv,.xlsx,.xls" 
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          console.log('Selected file:', e.target.files[0].name);
                          // Here you would handle the file import
                          // For example, parsing the CSV/Excel and adding items
                          toast({
                            title: "Items imported",
                            description: `${e.target.files[0].name} has been processed.`,
                            variant: "default",
                          });
                        }
                      }} 
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-primary border-primary"
                      onClick={addItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        {items.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 h-8 px-2"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="w-28">
                          <Label htmlFor={`hsn-code-${item.id}`} className="text-sm">HSN Code *</Label>
                          <Input 
                            id={`hsn-code-${item.id}`} 
                            placeholder="e.g. 1511.10.00"
                            value={item.hsnCode}
                            onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="w-28">
                          <Label htmlFor={`rm-id-${item.id}`} className="text-sm flex items-center">
                            RM Id
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 ml-1 text-gray-400 hover:text-gray-600 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-xs">RM Id refers to the raw material id of this product in your ERP</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <Input 
                            id={`rm-id-${item.id}`} 
                            placeholder="e.g. RM13579"
                            value={item.rmId}
                            onChange={(e) => updateItem(item.id, 'rmId', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div className="w-44">
                          <Label htmlFor={`product-name-${item.id}`} className="text-sm">Product Name *</Label>
                          <Input 
                            id={`product-name-${item.id}`} 
                            placeholder="e.g. Palm Oil"
                            value={item.productName}
                            onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div className="w-44">
                          <Label htmlFor={`scientific-name-${item.id}`} className="text-sm">Scientific Name</Label>
                          <Input 
                            id={`scientific-name-${item.id}`} 
                            placeholder="e.g. Elaeis guineensis"
                            value={item.scientificName}
                            onChange={(e) => updateItem(item.id, 'scientificName', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div className="w-28">
                          <Label htmlFor={`quantity-${item.id}`} className="text-sm">Quantity *</Label>
                          <Input 
                            id={`quantity-${item.id}`} 
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 5000"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div className="w-28">
                          <Label htmlFor={`unit-${item.id}`} className="text-sm">Unit</Label>
                          <Select 
                            value={item.unit} 
                            onValueChange={(value) => updateItem(item.id, 'unit', value)}
                          >
                            <SelectTrigger id={`unit-${item.id}`} className="mt-1">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="tons">tons</SelectItem>
                              <SelectItem value="liters">liters</SelectItem>
                              <SelectItem value="m³">m³</SelectItem>
                            </SelectContent>
                          </Select>
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
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">GeoJSON Upload</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Please upload a GeoJSON file containing the geographical data associated with this declaration.
                </p>

                <div 
                  className={cn(
                    "border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-gray-50",
                    hasUploadedGeoJSON ? 
                      (geometryValid === false || satelliteValid === false) 
                        ? "border-red-300 bg-red-50" 
                        : "border-green-300 bg-green-50"
                      : "border-gray-300"
                  )}
                  onClick={!hasUploadedGeoJSON ? handleGeoJSONUpload : undefined}
                  style={{ cursor: hasUploadedGeoJSON ? 'default' : 'pointer' }}
                >
                  <div className="mx-auto flex justify-center">
                    <Upload className={cn(
                      "h-12 w-12",
                      hasUploadedGeoJSON ? 
                        (geometryValid === false || satelliteValid === false) 
                          ? "text-red-500" 
                          : "text-green-500" 
                        : "text-gray-400"
                    )} />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    {hasUploadedGeoJSON ? 
                      (isValidating ? "Validating GeoJSON file..." : "GeoJSON file uploaded successfully") : 
                      "Drag and drop your GeoJSON file here, or click to browse"}
                  </p>
                  {!hasUploadedGeoJSON && (
                    <Button 
                      variant="secondary" 
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGeoJSONUpload(e);
                      }}
                    >
                      Browse Files
                    </Button>
                  )}
                  
                  {/* Validation status indicators */}
                  {hasUploadedGeoJSON && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm font-medium">Geometry Check:</span>
                        {isValidating ? (
                          <span className="text-sm text-amber-500">Checking...</span>
                        ) : geometryValid === true ? (
                          <span className="text-sm text-green-600">Compliant</span>
                        ) : geometryValid === false ? (
                          <span className="text-sm text-red-600">Non-Compliant</span>
                        ) : (
                          <span className="text-sm text-gray-500">Pending</span>
                        )}
                      </div>
                      
                      {/* Only show satellite check if geometry check passed */}
                      {geometryValid === true && (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm font-medium">Satellite Check:</span>
                          {isValidating ? (
                            <span className="text-sm text-amber-500">Checking...</span>
                          ) : satelliteValid === true ? (
                            <span className="text-sm text-green-600">Compliant</span>
                          ) : satelliteValid === false ? (
                            <span className="text-sm text-red-600">Non-Compliant</span>
                          ) : (
                            <span className="text-sm text-gray-500">Pending</span>
                          )}
                        </div>
                      )}
                      
                      {/* Warning message for failed validations */}
                      {geometryValid === false && (
                        <div className="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">
                            Geometry validation failed. Please notify the supplier.
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            The declaration can only be saved as draft and cannot be submitted.
                          </p>
                        </div>
                      )}
                      
                      {geometryValid === true && satelliteValid === false && (
                        <div className="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">
                            Satellite check detected potential deforestation. Please notify the supplier.
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            The declaration can only be saved as draft and cannot be submitted.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Upload Evidence Documents */}
          {currentStep === 3 && (
            <div>
              <div className="mb-6">
                <Label className="text-base font-medium">Upload Evidence Documents</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Please upload all relevant documentation to support your declaration, including:
                  GeoJSON data, certificates, shipping documents, and any other evidence.
                </p>

                <div 
                  className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-gray-50"
                  onClick={handleDocumentUpload}
                >
                  <div className="mx-auto flex justify-center">
                    <Upload className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Drag and drop your files here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Accepted formats: PDF, JPG, PNG, GeoJSON (max 10MB)
                  </p>
                  <Button 
                    variant="secondary" 
                    className="mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDocumentUpload(e);
                    }}
                  >
                    Browse Files
                  </Button>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div>
                  <h3 className="text-base font-medium mb-2">Uploaded Files</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                            <svg 
                              className="h-4 w-4 text-primary" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2 text-sm font-medium">{file}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500"
                          onClick={() => removeFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Customer Selection (for outbound only) */}
          {currentStep === 4 && declarationType === "outbound" && (
            <div>
              <h3 className="text-lg font-medium mb-4">Customer Selection</h3>
              <div className="relative mb-4">
                <Input 
                  type="text" 
                  placeholder="Search customers..." 
                  className="pl-9"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>

              <div className="space-y-3">
                {customers.map((customer) => (
                  <div 
                    key={customer.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer",
                      selectedCustomer?.id === customer.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start">
                        <User className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.company} - {customer.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {customer.complianceScore !== undefined && (
                          <div className={cn(
                            "text-xs font-medium rounded-full px-2 py-1",
                            customer.complianceScore >= 90 ? "bg-green-100 text-green-800" :
                            customer.complianceScore >= 80 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {customer.complianceScore}% Compliant
                          </div>
                        )}
                        {selectedCustomer?.id === customer.id && (
                          <Badge className="bg-primary ml-2">Selected</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-2 pl-8">
                      <div><span className="text-gray-400">Country:</span> {customer.country}</div>
                      <div><span className="text-gray-400">Registration:</span> {customer.registrationNumber}</div>
                      <div><span className="text-gray-400">Contact:</span> {customer.contactPerson}</div>
                      <div><span className="text-gray-400">Email:</span> {customer.contactEmail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4/5: Review (Final Step) */}
          {((currentStep === 4 && declarationType === "inbound") || 
            (currentStep === 5 && declarationType === "outbound")) && (
            <div>
              <h3 className="text-lg font-medium mb-6">Review Declaration</h3>

              {declarationType === "inbound" && (
                <div className="mb-6">
                  <Label htmlFor="comments" className="text-base font-medium">Add Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Add any notes or comments about this declaration"
                    className="min-h-[100px] mt-2"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Declaration Type</h4>
                    <p className="mt-1">{declarationType === "inbound" ? "Inbound" : "Outbound"}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Validity Period</h4>
                    <p className="mt-1">
                      {startDate && endDate ? 
                        `${format(startDate, "PP")} to ${format(endDate, "PP")}` : 
                        "Not specified"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Supplier</h4>
                    <p className="mt-1">
                      {selectedSupplierId ? 
                        suppliers.find(s => s.id === selectedSupplierId)?.name || "Unknown supplier" : 
                        "Not selected"}
                    </p>
                  </div>

                  {declarationType === "outbound" && (
                    <div className="col-span-2">
                      <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                      {selectedCustomer ? (
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{selectedCustomer.name}</div>
                            {selectedCustomer.complianceScore !== undefined && (
                              <div className={cn(
                                "text-xs font-medium rounded-full px-2 py-1",
                                selectedCustomer.complianceScore >= 90 ? "bg-green-100 text-green-800" :
                                selectedCustomer.complianceScore >= 80 ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              )}>
                                {selectedCustomer.complianceScore}% Compliant
                              </div>
                            )}
                          </div>
                          <div className="text-sm grid grid-cols-2 gap-2">
                            <div><span className="text-gray-500">Company:</span> {selectedCustomer.company}</div>
                            <div><span className="text-gray-500">Type:</span> {selectedCustomer.type}</div>
                            <div><span className="text-gray-500">Country:</span> {selectedCustomer.country}</div>
                            <div><span className="text-gray-500">Registration:</span> {selectedCustomer.registrationNumber}</div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-red-500">Not selected</p>
                      )}
                    </div>
                  )}

                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Items</h4>
                    <div className="mt-1 space-y-2">
                      {items.filter(item => item.productName).map((item, index) => (
                        <div key={item.id} className="text-sm">
                          {index + 1}. {item.productName} ({item.quantity} {item.unit}) - HSN: {item.hsnCode}
                          {item.scientificName && ` - ${item.scientificName}`}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Evidence Documents</h4>
                    <div className="mt-1">
                      {uploadedFiles.length === 0 ? (
                        <span className="text-red-500">No documents uploaded</span>
                      ) : (
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <li key={index}>{file}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">GeoJSON Validation Status</h4>
                    {!hasUploadedGeoJSON ? (
                      <p className="mt-1 text-red-500">Not uploaded</p>
                    ) : (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center">
                          <span className="text-sm mr-2">Geometry Check:</span>
                          {geometryValid === true ? (
                            <Badge className="bg-green-500">Compliant</Badge>
                          ) : geometryValid === false ? (
                            <Badge className="bg-red-500">Non-Compliant</Badge>
                          ) : (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          )}
                        </div>
                        
                        {geometryValid === true && (
                          <div className="flex items-center">
                            <span className="text-sm mr-2">Satellite Check:</span>
                            {satelliteValid === true ? (
                              <Badge className="bg-green-500">Compliant</Badge>
                            ) : satelliteValid === false ? (
                              <Badge className="bg-red-500">Non-Compliant</Badge>
                            ) : (
                              <Badge className="bg-yellow-500">Pending</Badge>
                            )}
                          </div>
                        )}
                        
                        {(geometryValid === false || (geometryValid === true && satelliteValid === false)) && (
                          <div className="mt-2 text-sm text-red-600">
                            This declaration will be saved with non-compliant status.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-amber-500" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Declaration Submission Notice</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      By submitting this declaration, I confirm that all the information provided is 
                      accurate and complete to the best of my knowledge. I understand that false 
                      information may lead to penalties under the EUDR regulations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
              className="mr-auto"
            >
              Back
            </Button>
          )}

          {((currentStep < 4 && declarationType === "inbound") || 
            (currentStep < 5 && declarationType === "outbound")) ? (
            <Button onClick={goToNextStep}>
              Continue
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
      </DialogContent>
    </Dialog>
  );
}