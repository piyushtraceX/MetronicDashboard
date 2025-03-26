import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/ui/stepper";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus, Search, Trash2, Upload, User } from "lucide-react";
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
      unit: "kg"
    }
  ]);
  
  // Step 3: Upload Evidence Documents
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  // Form data - Dates and Supplier
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  
  // Step 4: Customer Selection (for outbound only)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [hasUploadedGeoJSON, setHasUploadedGeoJSON] = useState(false);
  
  // Create declaration mutation
  const createDeclaration = useMutation({
    mutationFn: async (data: any) => {
      const result = await apiRequest('POST', '/api/declarations', data);
      return result.json();
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
    { id: 1, name: "Euro Foods GmbH", type: "EU-Based Entity" },
    { id: 2, name: "Global Trade Partners", type: "Non-EU Entity" },
    { id: 3, name: "Organic Distributors Ltd", type: "EU-Based Entity" },
    { id: 4, name: "Pacific Wholesale Inc", type: "Non-EU Entity" },
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
        unit: "kg"
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
  const handleFileUpload = (isGeoJSON = false) => {
    if (isGeoJSON) {
      setHasUploadedGeoJSON(true);
      toast({
        title: "GeoJSON uploaded",
        description: "GeoJSON file has been uploaded successfully",
        variant: "default",
      });
      return;
    }

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
    setUploadedFiles(prev => prev.filter(file => file !== filename));
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
        return true; // Always valid as we have a default
        
      case 2: // Declaration Details - Items
        // Check if at least one item has required fields
        const validItems = items.some(item => 
          item.hsnCode.trim() !== "" && 
          item.productName.trim() !== "" && 
          item.quantity.trim() !== "" && 
          parseFloat(item.quantity) > 0
        );
        
        if (!validItems) {
          toast({
            title: "Required fields missing",
            description: "Please fill in HSN Code, Product Name and Quantity for at least one item",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if dates are selected
        if (!startDate || !endDate) {
          toast({
            title: "Dates required",
            description: "Please select both start and end dates for the declaration validity period",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if supplier is selected
        if (!selectedSupplierId) {
          toast({
            title: "Supplier selection required",
            description: "Please select a supplier for the declaration",
            variant: "destructive",
          });
          return false;
        }
        
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
      unit: item.unit
    }));
    
    // Prepare payload
    const payload = {
      type: declarationType,
      items: formattedItems,
      documents: uploadedFiles,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      supplierId: selectedSupplierId,
      customerId: declarationType === "outbound" ? selectedCustomer?.id || null : null,
      status: "pending",
      riskLevel: "medium"
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
        unit: "kg"
      }
    ]);
    setUploadedFiles([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedSupplierId(null);
    setSupplierSearchTerm("");
    setSelectedCustomer(null);
  };
  
  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };
  
  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );
  
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
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create Declaration</DialogTitle>
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
                <div className="relative mb-4">
                  <Input 
                    type="text" 
                    placeholder="Search suppliers..." 
                    className="pl-9"
                    value={supplierSearchTerm}
                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredSuppliers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No suppliers found matching your search
                    </div>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <div 
                        key={supplier.id}
                        className={cn(
                          "p-3 border rounded-lg flex items-center justify-between cursor-pointer",
                          selectedSupplierId === supplier.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                        )}
                        onClick={() => setSelectedSupplierId(supplier.id)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {supplier.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-gray-500">{supplier.products}</div>
                          </div>
                        </div>
                        {selectedSupplierId === supplier.id && (
                          <Badge className="bg-primary">Selected</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Declaration Items</h3>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`hsn-code-${item.id}`} className="text-sm">HSN Code *</Label>
                          <Input 
                            id={`hsn-code-${item.id}`} 
                            placeholder="e.g. 1511.10.00"
                            value={item.hsnCode}
                            onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`product-name-${item.id}`} className="text-sm">Product Name *</Label>
                          <Input 
                            id={`product-name-${item.id}`} 
                            placeholder="e.g. Palm Oil"
                            value={item.productName}
                            onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`scientific-name-${item.id}`} className="text-sm">Scientific Name</Label>
                          <Input 
                            id={`scientific-name-${item.id}`} 
                            placeholder="e.g. Elaeis guineensis"
                            value={item.scientificName}
                            onChange={(e) => updateItem(item.id, 'scientificName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="flex gap-2 items-start">
                          <div className="flex-1">
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
                          <div className="w-1/3">
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
                    hasUploadedGeoJSON ? "border-green-300 bg-green-50" : "border-gray-300"
                  )}
                  onClick={() => handleFileUpload(true)}
                >
                  <div className="mx-auto flex justify-center">
                    <Upload className={cn(
                      "h-12 w-12",
                      hasUploadedGeoJSON ? "text-green-500" : "text-gray-400"
                    )} />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    {hasUploadedGeoJSON ? 
                      "GeoJSON file uploaded successfully" : 
                      "Drag and drop your GeoJSON file here, or click to browse"}
                  </p>
                  {!hasUploadedGeoJSON && (
                    <Button 
                      variant="secondary" 
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileUpload();
                      }}
                    >
                      Browse Files
                    </Button>
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
                  onClick={handleFileUpload}
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
                      handleFileUpload();
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
                      "p-4 border rounded-lg flex items-center justify-between cursor-pointer",
                      selectedCustomer?.id === customer.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.type}</div>
                      </div>
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <Badge className="bg-primary">Selected</Badge>
                    )}
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
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                      <p className="mt-1">{selectedCustomer?.name || "Not selected"}</p>
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