import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ValidationDetailsDialog from "./validation-details-dialog";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/ui/stepper";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus, Search, Trash2, Upload, User, UserPlus, X, Eye } from "lucide-react";
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
  rmId?: string;
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
  company?: string;
  country?: string;
  registrationNumber?: string;
  contactPerson?: string;
  contactEmail?: string;
  complianceScore?: number;
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
      unit: "kg",
      rmId: ""
    }
  ]);
  
  // Dates state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [validityPeriod, setValidityPeriod] = useState<string>("custom");
  const [showCustomDates, setShowCustomDates] = useState(true);
  
  // GeoJSON upload state for fresh declarations
  const [hasUploadedGeoJSON, setHasUploadedGeoJSON] = useState(false);
  const [geometryValid, setGeometryValid] = useState<boolean | null>(null);
  const [satelliteValid, setSatelliteValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState<string | null>(null); // 'geometry' or 'satellite' or null
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null); // To store which plot is selected in the details view
  
  // Documents state
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  // Customer selection and additional data state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [customerPONumber, setCustomerPONumber] = useState("");
  const [soNumber, setSONumber] = useState("");
  const [shipmentNumber, setShipmentNumber] = useState("");
  
  // Comments state for review
  const [comments, setComments] = useState("");
  
  // Mock data - in a real app, this would come from API requests
  const existingDeclarations: ExistingDeclaration[] = [
    { id: 1, name: "ABC Declaration", code: "#A12345", product: "Palm Oil", quantity: "5,000 Tons", status: "Approved" },
    { id: 2, name: "XYZ Declaration", code: "#B67890", product: "Rubber", quantity: "2,000 Tons", status: "Approved" }
  ];
  
  // Fetch customers from API
  const { data: apiCustomers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ['/api/customers'],
    refetchOnWindowFocus: false,
  });
  
  // Transform API customers to match the Customer interface
  const customers: Customer[] = apiCustomers.map(customer => ({
    id: customer.id,
    name: customer.companyName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
    type: customer.type || "Customer",
    company: customer.companyName || "",
    country: customer.country || "",
    registrationNumber: customer.registrationNumber || "N/A",
    contactPerson: customer.contactPerson || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
    contactEmail: customer.email || "",
    complianceScore: customer.complianceScore !== undefined ? customer.complianceScore : 75
  }));
  
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
      apiRequest('/api/declarations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(declaration)
      }),
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
      unit: "kg",
      rmId: ""
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

  // Handle GeoJSON upload and validation
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
          
          // Check dates for existing declarations
          if (!startDate || !endDate) {
            toast({
              title: "Dates required",
              description: "Please select both start and end dates for the declaration validity period",
              variant: "destructive",
            });
            return false;
          }
          
          return true;
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
        
      case 4: // Additional Data
        if (!selectedCustomer) {
          toast({
            title: "Selection required",
            description: "Please select a customer to continue",
            variant: "destructive",
          });
          return false;
        }
        
        // Optional validation for reference numbers if needed
        // For now, we make these fields optional but you can add validation here
        
        return true;
        
      default:
        return true;
    }
  };

  // Submit the declaration
  const submitDeclaration = () => {
    if (!validateCurrentStep()) return;
    
    // For fresh declarations, check if GeoJSON validation passed
    if (declarationSource === "fresh" && hasUploadedGeoJSON) {
      // If still validating, ask user to wait
      if (isValidating) {
        toast({
          title: "Validation in progress",
          description: "Please wait while the GeoJSON file is being validated",
          variant: "default",
        });
        return;
      }
      
      // Check for geometry validation failure
      if (geometryValid === false) {
        toast({
          title: "Cannot submit declaration",
          description: "Geometry validation failed. Please notify the supplier and save as draft instead.",
          variant: "destructive",
        });
        return;
      }
      
      // Check for satellite validation failure
      if (satelliteValid === false) {
        toast({
          title: "Cannot submit declaration",
          description: "Satellite check detected potential deforestation. Please notify the supplier and save as draft instead.",
          variant: "destructive",
        });
        return;
      }
    }
    
    let payload;
    let status = "pending";
    
    // If there are validation issues, set status to draft
    if (declarationSource === "fresh" && 
        hasUploadedGeoJSON && 
        (geometryValid === false || satelliteValid === false)) {
      status = "draft";
    }
    
    if (declarationSource === "existing") {
      // Prepare payload for declaration based on existing ones
      payload = {
        type: "outbound",
        basedOnDeclarationIds: selectedDeclarationIds,
        customerId: selectedCustomer?.id || null,
        customerPONumber: customerPONumber.trim() || null,
        soNumber: soNumber.trim() || null,
        shipmentNumber: shipmentNumber.trim() || null,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        status: status,
        comments: comments.trim() || null
      };
    } else {
      // Prepare payload for fresh declaration
      const firstItem = items.find(item => 
        item.hsnCode.trim() !== "" && 
        item.productName.trim() !== "" && 
        item.quantity.trim() !== ""
      );
      
      if (!firstItem) {
        toast({
          title: "Error",
          description: "Unable to find a valid item to create the declaration",
          variant: "destructive",
        });
        return;
      }
      
      payload = {
        type: "outbound",
        productName: firstItem.productName,
        hsnCode: firstItem.hsnCode,
        scientificName: firstItem.scientificName || null,
        quantity: parseFloat(firstItem.quantity),
        unit: firstItem.unit,
        customerId: selectedCustomer?.id || null,
        customerPONumber: customerPONumber.trim() || null,
        soNumber: soNumber.trim() || null,
        shipmentNumber: shipmentNumber.trim() || null,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        status: status,
        comments: comments.trim() || null,
        items: items.filter(item => 
          item.hsnCode.trim() !== "" && 
          item.productName.trim() !== "" && 
          item.quantity.trim() !== ""
        ).map(item => ({
          hsnCode: item.hsnCode,
          productName: item.productName,
          scientificName: item.scientificName || null,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          rmId: item.rmId || null
        }))
      };
    }
    
    createDeclaration.mutate(payload);
  };

  // Handle validity period selection
  const handleValidityPeriodChange = (value: string) => {
    setValidityPeriod(value);
    
    // Set appropriate dates based on selection
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
      // Custom selection
      setShowCustomDates(true);
      // Don't set end date for custom
      end = new Date(now);
    }
    
    if (value !== "custom") {
      setEndDate(end);
    }
  };

  // Reset all form state
  const resetForm = () => {
    // Reset all state variables to initial values
    setCurrentStep(1);
    setCompletedSteps([]);
    setDeclarationSource("existing");
    setSelectedDeclarationIds([]);
    setDeclarationSearchTerm("");
    setShowDeclarationsList(false);
    setItems([{
      id: "item-1",
      hsnCode: "",
      productName: "",
      scientificName: "",
      quantity: "",
      unit: "kg",
      rmId: ""
    }]);
    setStartDate(undefined);
    setEndDate(undefined);
    setValidityPeriod("custom");
    setShowCustomDates(true);
    setHasUploadedGeoJSON(false);
    setGeometryValid(null);
    setSatelliteValid(null);
    setIsValidating(false);
    setUploadedFiles([]);
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setShowCustomerResults(false);
    setCustomerPONumber("");
    setSONumber("");
    setShipmentNumber("");
    setComments("");
    setShowValidationDetails(null);
    setSelectedPlot(null);
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Filter declarations based on search term
  const filteredDeclarations = declarationSearchTerm.length > 0
    ? declarations.filter((declaration: any) => 
        declaration.productName?.toLowerCase().includes(declarationSearchTerm.toLowerCase()) ||
        declaration.code?.toLowerCase().includes(declarationSearchTerm.toLowerCase())
      )
    : declarations;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Outbound Declaration</DialogTitle>
          <DialogDescription>
            Create a new outbound declaration for your customers
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Stepper 
            steps={["Declaration Source", "Details", "Upload & Validate", "Customer", "Review"]} 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
          />
        </div>

        {/* Step 1: Declaration Source */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setDeclarationSource("existing")}
                className={cn(
                  "p-6 border rounded-lg cursor-pointer transition-colors",
                  declarationSource === "existing" 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-primary/50"
                )}
              >
                <div className="flex items-center mb-4">
                  <Checkbox 
                    checked={declarationSource === "existing"}
                    onCheckedChange={() => setDeclarationSource("existing")}
                    className="mr-2 h-5 w-5"
                  />
                  <h3 className="text-lg font-medium">Based on Existing Declaration</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Create an outbound declaration based on an approved inbound declaration.
                  This simplifies the process by reusing validated data.
                </p>
              </div>

              <div 
                onClick={() => setDeclarationSource("fresh")}
                className={cn(
                  "p-6 border rounded-lg cursor-pointer transition-colors",
                  declarationSource === "fresh" 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-primary/50"
                )}
              >
                <div className="flex items-center mb-4">
                  <Checkbox 
                    checked={declarationSource === "fresh"}
                    onCheckedChange={() => setDeclarationSource("fresh")}
                    className="mr-2 h-5 w-5"
                  />
                  <h3 className="text-lg font-medium">New Declaration</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Create a completely new outbound declaration. You'll need to provide
                  product details and upload supporting documentation.
                </p>
              </div>
            </div>

            {declarationSource === "existing" && (
              <div className="mt-8">
                <Label>Select Inbound Declaration(s)</Label>
                <div className="relative">
                  <div 
                    className="p-2 border rounded-md cursor-pointer flex items-center justify-between"
                    onClick={() => setShowDeclarationsList(!showDeclarationsList)}
                  >
                    {selectedDeclarationIds.length > 0 ? (
                      <div>
                        <span className="font-medium">{selectedDeclarationIds.length} declaration(s) selected</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Select inbound declarations</span>
                    )}
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>

                  {showDeclarationsList && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                      <div className="p-2 border-b">
                        <Input 
                          placeholder="Search declarations..." 
                          value={declarationSearchTerm}
                          onChange={(e) => setDeclarationSearchTerm(e.target.value)}
                        />
                      </div>
                      <div>
                        {filteredDeclarations.length > 0 ? (
                          filteredDeclarations.map((declaration: any) => (
                            <div
                              key={declaration.id}
                              className={cn(
                                "p-3 hover:bg-gray-100 cursor-pointer",
                                selectedDeclarationIds.includes(declaration.id) && "bg-primary/5"
                              )}
                              onClick={() => {
                                if (selectedDeclarationIds.includes(declaration.id)) {
                                  setSelectedDeclarationIds(selectedDeclarationIds.filter(id => id !== declaration.id));
                                } else {
                                  setSelectedDeclarationIds([...selectedDeclarationIds, declaration.id]);
                                }
                              }}
                            >
                              <div className="flex items-center">
                                <Checkbox 
                                  checked={selectedDeclarationIds.includes(declaration.id)}
                                  className="mr-2"
                                />
                                <div>
                                  <div className="font-medium">{declaration.productName}</div>
                                  <div className="text-xs text-gray-500 flex mt-1">
                                    <span className="mr-2">#{declaration.id}</span>
                                    <Badge variant="outline" className="mr-2">
                                      {declaration.status}
                                    </Badge>
                                    <span>{declaration.quantity} {declaration.unit}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500">
                            No approved inbound declarations found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Declaration Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {declarationSource === "fresh" && (
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
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Declaration Validity Period</Label>
                <Select 
                  value={validityPeriod} 
                  onValueChange={handleValidityPeriodChange}
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
          </div>
        )}

        {/* Step 3: Upload & Validate */}
        {currentStep === 3 && (
          <div className="space-y-8">
            {declarationSource === "fresh" && (
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
            )}

            <div>
              <h3 className="text-lg font-medium mb-4">Upload Supporting Documents</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload supporting documents like purchase orders, quality certificates, and other relevant documentation.
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

        {/* Step 4: Customer Selection */}
        {currentStep === 4 && (
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
                    <div className="p-2 border-t flex justify-between items-center">
                      <span className="text-xs text-gray-500">Can't find a customer?</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add New
                      </Button>
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

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Review Declaration</h3>
              <p className="text-sm text-gray-500 mb-4">
                Review the information before submitting the outbound declaration.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-3">General Information</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-32">Declaration Type:</span>
                      <span className="font-medium">
                        Outbound
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Source:</span>
                      <span className="font-medium">
                        {declarationSource === "existing" 
                          ? `Based on ${selectedDeclarationIds.length} inbound declaration(s)` 
                          : "New declaration"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Customer:</span>
                      <span className="font-medium">{selectedCustomer?.name || "Not selected"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Customer PO:</span>
                      <span className="font-medium">{customerPONumber || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">SO Number:</span>
                      <span className="font-medium">{soNumber || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Shipment #:</span>
                      <span className="font-medium">{shipmentNumber || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-32">Validity Period:</span>
                      <span className="font-medium">
                        {startDate && endDate 
                          ? `${format(startDate, "PP")} to ${format(endDate, "PP")}` 
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {declarationSource === "fresh" && (
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
                )}
                
                {declarationSource === "fresh" && (
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
                )}
                
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
          
          {currentStep < 5 ? (
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