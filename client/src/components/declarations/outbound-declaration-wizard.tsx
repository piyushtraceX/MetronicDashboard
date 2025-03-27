import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/ui/stepper";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus, Search, Trash2, Upload, User, X, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DeclarationSourceType = "existing" | "fresh";

// Define the interface for declaration items
interface DeclarationItem {
  id: string;
  hsnCode: string;
  productName: string;
  scientificName: string;
  quantity: string;
  unit: string;
}

// Define the interface for existing declaration objects
interface ExistingDeclaration {
  id: number;
  name: string;
  code: string;
  product: string;
  quantity: string;
  status: string;
}

// Define the interface for customer objects
interface Customer {
  id: number;
  name: string;
  type: string;
}

interface OutboundDeclarationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OutboundDeclarationWizard({ open, onOpenChange }: OutboundDeclarationWizardProps) {
  const { toast } = useToast();
  
  // Wizard steps state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Declaration source type state (existing or fresh)
  const [declarationSource, setDeclarationSource] = useState<DeclarationSourceType>("existing");
  
  // State for selected existing declarations (now supports multiple selections)
  const [selectedDeclarationIds, setSelectedDeclarationIds] = useState<number[]>([]);
  const [declarationSearchTerm, setDeclarationSearchTerm] = useState("");
  const [showDeclarationsList, setShowDeclarationsList] = useState(false);
  
  // State for fresh declaration details
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
  
  // Dates state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // GeoJSON upload state for fresh declarations
  const [hasUploadedGeoJSON, setHasUploadedGeoJSON] = useState(false);
  
  // Documents state
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  // Customer selection state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  
  // Comments state for review
  const [comments, setComments] = useState("");
  
  // Mock data - in a real app, this would come from API requests
  const existingDeclarations: ExistingDeclaration[] = [
    { id: 1, name: "ABC Declaration", code: "#A12345", product: "Palm Oil", quantity: "5,000 Tons", status: "Approved" },
    { id: 2, name: "XYZ Declaration", code: "#B67890", product: "Rubber", quantity: "2,000 Tons", status: "Approved" }
  ];
  
  const customers: Customer[] = [
    { id: 1, name: "Customer 1", type: "EU-Based Entity" },
    { id: 2, name: "Customer 2", type: "Non-EU Distributor" },
    { id: 3, name: "Customer 3", type: "Retail Chain" }
  ];
  
  // Query to get available inbound declarations (would be replaced with actual API call)
  const { data: declarations = [] } = useQuery<any[]>({
    queryKey: ['/api/declarations'],
    select: (data: any) => {
      if (!data) return [];
      return data.filter((d: any) => d.status === 'approved' && d.type === 'inbound');
    }
  });
  
  // Create declaration mutation
  const createDeclaration = useMutation({
    mutationFn: (declaration: any) => 
      apiRequest('POST', '/api/declarations', declaration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/declarations'] });
      toast({
        title: "Declaration submitted",
        description: "Your outbound declaration has been successfully submitted",
        variant: "default",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit declaration",
        description: "There was an error submitting your declaration. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add a new item to the items list
  const addItem = () => {
    const newItem: DeclarationItem = {
      id: `item-${items.length + 1}`,
      hsnCode: "",
      productName: "",
      scientificName: "",
      quantity: "",
      unit: "kg"
    };
    setItems([...items, newItem]);
  };

  // Remove an item from the items list
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Update an item's property
  const updateItem = (id: string, field: keyof DeclarationItem, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Handle GeoJSON upload
  const handleGeoJSONUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    setHasUploadedGeoJSON(true);
    toast({
      title: "GeoJSON uploaded",
      description: "GeoJSON file has been uploaded successfully",
      variant: "default",
    });
  };

  // Handle document upload
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

  // Remove a file from uploaded files
  const removeFile = (filename: string) => {
    setUploadedFiles(prev => prev.filter(file => file !== filename));
  };

  // Go to next step in the wizard
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }
  };

  // Go to previous step in the wizard
  const goToPreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Validate current step before proceeding
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Declaration Type
        return true; // Always valid as we have a default type
        
      case 2: // Select Declaration or Fresh Declaration Details
        if (declarationSource === "existing") {
          if (selectedDeclarationIds.length === 0) {
            toast({
              title: "Selection required",
              description: "Please select at least one existing inbound declaration",
              variant: "destructive",
            });
            return false;
          }
        } else {
          // For fresh declarations, check if items have required fields
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
          
          // Check dates for fresh declarations
          if (!startDate || !endDate) {
            toast({
              title: "Dates required",
              description: "Please select both start and end dates for the declaration validity period",
              variant: "destructive",
            });
            return false;
          }
        }
        return true;
        
      case 3: // Upload Data/Documents
        // For fresh declarations, we should check if GeoJSON is uploaded
        if (declarationSource === "fresh" && !hasUploadedGeoJSON) {
          toast({
            title: "GeoJSON required",
            description: "Please upload a GeoJSON file for geographical data",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if at least one document is uploaded
        if (uploadedFiles.length === 0) {
          toast({
            title: "Evidence required",
            description: "Please upload at least one document as evidence",
            variant: "destructive",
          });
          return false;
        }
        return true;
        
      case 4: // Customer Selection
        if (!selectedCustomer) {
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

  // Submit the declaration
  const submitDeclaration = () => {
    if (!validateCurrentStep()) return;
    
    let payload;
    
    if (declarationSource === "existing") {
      // Prepare payload for declaration based on existing ones
      payload = {
        type: "outbound",
        basedOnDeclarationIds: selectedDeclarationIds,
        customerId: selectedCustomer?.id || null,
        documents: uploadedFiles,
        comments: comments.trim() || null,
        status: "pending"
      };
    } else {
      // Prepare payload for fresh declaration
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
      
      payload = {
        type: "outbound",
        items: formattedItems,
        documents: uploadedFiles,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        customerId: selectedCustomer?.id || null,
        hasGeoJSON: hasUploadedGeoJSON,
        comments: comments.trim() || null,
        status: "pending",
        riskLevel: "medium"
      };
    }
    
    createDeclaration.mutate(payload);
  };

  // Reset form state when wizard is closed
  const resetForm = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setDeclarationSource("existing");
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
    setSelectedDeclarationIds([]);
    setDeclarationSearchTerm("");
    setShowDeclarationsList(false);
    setUploadedFiles([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setShowCustomerResults(false);
    setHasUploadedGeoJSON(false);
    setComments("");
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Filter existing declarations based on search term
  const filteredDeclarations = existingDeclarations.filter(declaration => 
    declaration.name.toLowerCase().includes(declarationSearchTerm.toLowerCase()) ||
    declaration.code.toLowerCase().includes(declarationSearchTerm.toLowerCase()) ||
    declaration.product.toLowerCase().includes(declarationSearchTerm.toLowerCase())
  );

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Get step labels
  const stepLabels = [
    "Declaration Type", 
    declarationSource === "existing" ? "Select Declaration" : "Declaration Details", 
    "Upload Data", 
    "Customer Selection",
    "Review"
  ];

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create Outbound Declaration</DialogTitle>
        </DialogHeader>
        
        <div className="mb-8">
          <Stepper 
            steps={stepLabels}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>
        
        <div className="py-4">
          {/* Step 1: Declaration Type (Based on Existing or Create Fresh) */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-6">Select Declaration Type</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className={cn(
                    "p-6 border rounded-lg cursor-pointer transition-all",
                    declarationSource === "existing" 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-gray-400"
                  )}
                  onClick={() => setDeclarationSource("existing")}
                >
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium">Based on Existing Declaration</h4>
                      <p className="text-sm text-gray-500">Use approved inbound declarations as reference</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={cn(
                    "p-6 border rounded-lg cursor-pointer transition-all",
                    declarationSource === "fresh" 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-gray-400"
                  )}
                  onClick={() => setDeclarationSource("fresh")}
                >
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium">Create Fresh Declaration</h4>
                      <p className="text-sm text-gray-500">Start a new declaration from scratch</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Select Declaration (for Based on Existing) or Declaration Details (for Fresh) */}
          {currentStep === 2 && (
            <div>
              {declarationSource === "existing" ? (
                /* Select from existing inbound declarations */
                <div>
                  <h3 className="text-lg font-medium mb-4">Select Declaration</h3>
                  <div className="relative mb-4">
                    <Input 
                      type="text" 
                      placeholder="Search declarations..." 
                      className="pl-9"
                      value={declarationSearchTerm}
                      onChange={(e) => setDeclarationSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                  
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium">Declaration Name</th>
                          <th className="py-3 px-4 text-left font-medium">Code</th>
                          <th className="py-3 px-4 text-left font-medium">Product</th>
                          <th className="py-3 px-4 text-left font-medium">Quantity</th>
                          <th className="py-3 px-4 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeclarations.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                              No declarations found matching your search
                            </td>
                          </tr>
                        ) : (
                          filteredDeclarations.map((declaration) => (
                            <tr 
                              key={declaration.id}
                              className={cn(
                                "border-b cursor-pointer hover:bg-gray-50",
                                selectedDeclarationIds.includes(declaration.id) ? "bg-primary/5" : ""
                              )}
                              onClick={() => {
                                if (selectedDeclarationIds.includes(declaration.id)) {
                                  // Remove if already selected
                                  setSelectedDeclarationIds(prev => prev.filter(id => id !== declaration.id));
                                } else {
                                  // Add to selection if not already selected
                                  setSelectedDeclarationIds(prev => [...prev, declaration.id]);
                                }
                              }}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <Checkbox 
                                    className="mr-2" 
                                    checked={selectedDeclarationIds.includes(declaration.id)} 
                                    onCheckedChange={(checked: boolean) => {
                                      if (checked) {
                                        setSelectedDeclarationIds(prev => [...prev, declaration.id]);
                                      } else {
                                        setSelectedDeclarationIds(prev => prev.filter(id => id !== declaration.id));
                                      }
                                    }}
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  />
                                  {declaration.name}
                                </div>
                              </td>
                              <td className="py-3 px-4">{declaration.code}</td>
                              <td className="py-3 px-4">{declaration.product}</td>
                              <td className="py-3 px-4">{declaration.quantity}</td>
                              <td className="py-3 px-4">
                                <Badge className="bg-green-500">{declaration.status}</Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Fresh declaration details */
                <div>
                  {/* Declaration Validity Period */}
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
                  
                  {/* Declaration Items */}
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
                          
                          <div className="flex flex-wrap gap-3 items-end">
                            <div className="w-44">
                              <Label htmlFor={`hsn-code-${item.id}`} className="text-sm">HSN Code *</Label>
                              <Input 
                                id={`hsn-code-${item.id}`} 
                                placeholder="e.g. 1511.10.00"
                                value={item.hsnCode}
                                onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
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
            </div>
          )}
          
          {/* Step 3: Upload Data (GeoJSON for fresh declarations, documents for both) */}
          {currentStep === 3 && (
            <div>
              {/* For fresh declarations, show GeoJSON upload */}
              {declarationSource === "fresh" && (
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
                    onClick={handleGeoJSONUpload}
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
                          handleGeoJSONUpload(e);
                        }}
                      >
                        Browse Files
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Document upload section for both declaration types */}
              <div className="mb-6">
                <Label className="text-base font-medium">Upload Evidence Documents</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Please upload all relevant documentation to support your declaration, including
                  {declarationSource === "fresh" ? " certificates, shipping documents, and any other evidence." : " shipping documents, customer information, and any other evidence."}
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
                    Accepted formats: PDF, JPG, PNG {declarationSource === "fresh" && ", GeoJSON"} (max 10MB)
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
              
              {/* Uploaded files list */}
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
          
          {/* Step 4: Customer Selection */}
          {currentStep === 4 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Customer Selection</h3>
              <div className="relative mb-4">
                <Input 
                  type="text" 
                  placeholder="Search for a customer..." 
                  className="pl-9"
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    if (e.target.value) {
                      setShowCustomerResults(true);
                    }
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
              
              {showCustomerResults && customerSearchTerm && (
                <div className="border rounded-md overflow-hidden mb-4 shadow-sm">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No customers found. Try a different search term.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <div 
                          key={customer.id}
                          className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerResults(false);
                            setCustomerSearchTerm('');
                          }}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.type}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {selectedCustomer && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Selected Customer</h4>
                  <div className="p-4 border rounded-lg flex items-center justify-between bg-primary/5 border-primary">
                    <div>
                      <div className="font-medium">{selectedCustomer.name}</div>
                      <div className="text-sm text-gray-500">{selectedCustomer.type}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
              
              {!selectedCustomer && (
                <div className="flex items-center justify-center p-6 border border-dashed rounded-lg mt-4">
                  <div className="text-center text-gray-500">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Please select a customer to continue</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h3 className="text-lg font-medium mb-6">Review Declaration</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Declaration Type</h4>
                    <p className="mt-1">Outbound</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Declaration Source</h4>
                    <p className="mt-1">{declarationSource === "existing" ? "Based on Existing Declaration" : "Fresh Declaration"}</p>
                  </div>
                  
                  {declarationSource === "existing" ? (
                    <div className="col-span-2">
                      <h4 className="text-sm font-medium text-gray-500">Based On ({selectedDeclarationIds.length})</h4>
                      <div className="mt-1 space-y-2">
                        {selectedDeclarationIds.length > 0 ? (
                          selectedDeclarationIds.map(id => (
                            <div key={id} className="p-2 bg-gray-50 rounded-md">
                              {existingDeclarations.find(d => d.id === id)?.name || "Unknown declaration"}
                            </div>
                          ))
                        ) : (
                          <p>No declarations selected</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Validity Period</h4>
                        <p className="mt-1">
                          {startDate && endDate ? 
                            `${format(startDate, "PP")} to ${format(endDate, "PP")}` : 
                            "Not specified"}
                        </p>
                      </div>
                      
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
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">GeoJSON</h4>
                        <p className="mt-1">{hasUploadedGeoJSON ? "Uploaded" : "Not uploaded"}</p>
                      </div>
                    </>
                  )}
                  
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                    <div className="mt-1 space-y-2">
                      {selectedCustomer ? (
                        <div className="p-2 bg-gray-50 rounded-md">
                          {selectedCustomer.name} - {selectedCustomer.type}
                        </div>
                      ) : (
                        <p>No customer selected</p>
                      )}
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

                {/* Comments Section */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Comments</h4>
                  <Textarea 
                    placeholder="Add any additional comments, notes, or special instructions related to this declaration..."
                    value={comments}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
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
          
          {currentStep < 5 ? (
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