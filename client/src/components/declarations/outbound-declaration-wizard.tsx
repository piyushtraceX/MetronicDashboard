import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  
  // GeoJSON upload state for fresh declarations
  const [hasUploadedGeoJSON, setHasUploadedGeoJSON] = useState(false);
  const [geometryValid, setGeometryValid] = useState<boolean | null>(null);
  const [satelliteValid, setSatelliteValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
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
      // Randomly decide geometry validation result (80% success rate)
      const geometryIsValid = Math.random() < 0.8;
      setGeometryValid(geometryIsValid);
      
      // Simulate satellite check (after geometry check is complete)
      setTimeout(() => {
        // Randomly decide satellite validation result (70% success rate)
        const satelliteIsValid = Math.random() < 0.7;
        setSatelliteValid(satelliteIsValid);
        setIsValidating(false);
        
        // If either check fails, notify the user
        if (!geometryIsValid || !satelliteIsValid) {
          toast({
            title: "Validation issues detected",
            description: !geometryIsValid 
              ? "Geometry validation failed. The declaration can be saved as draft but cannot be submitted."
              : "Satellite check detected potential deforestation. The declaration can be saved as draft but cannot be submitted.",
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
        unit: item.unit,
        rmId: item.rmId || null
      }));
      
      payload = {
        type: "outbound",
        items: formattedItems,
        documents: uploadedFiles,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        customerId: selectedCustomer?.id || null,
        customerPONumber: customerPONumber.trim() || null,
        soNumber: soNumber.trim() || null,
        shipmentNumber: shipmentNumber.trim() || null,
        hasGeoJSON: hasUploadedGeoJSON,
        geometryValid: geometryValid,
        satelliteValid: satelliteValid,
        comments: comments.trim() || null,
        status,
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
        unit: "kg",
        rmId: ""
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
    setCustomerPONumber("");
    setSONumber("");
    setShipmentNumber("");
    setHasUploadedGeoJSON(false);
    setGeometryValid(null);
    setSatelliteValid(null);
    setIsValidating(false);
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
    "Additional Data",
    "Review"
  ];

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create Outbound Declaration</DialogTitle>
          <DialogDescription>
            Create an outbound declaration to your customers with compliance documentation.
          </DialogDescription>
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
                                RM ID
                                <span 
                                  className="ml-1 text-gray-400 cursor-help"
                                  title="RM Id refers to the raw material id of this product in your ERP"
                                >
                                  ⓘ
                                </span>
                              </Label>
                              <Input 
                                id={`rm-id-${item.id}`} 
                                placeholder="e.g. RM12345"
                                value={item.rmId || ""}
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
                        
                        {/* Warning message for failed validations */}
                        {(geometryValid === false || satelliteValid === false) && (
                          <div className="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">
                              {geometryValid === false ? 
                                "Geometry validation failed. Please notify the supplier." : 
                                "Satellite check detected potential deforestation. Please notify the supplier."}
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
          
          {/* Step 4: Additional Data */}
          {currentStep === 4 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Additional Data</h3>
              
              {/* Customer Selection */}
              <div className="mb-6">
                <h4 className="text-base font-medium mb-3">Customer Selection</h4>
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
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-gray-500">{customer.company} - {customer.type}</div>
                                <div className="text-xs text-gray-400 mt-1">{customer.country} • Reg: {customer.registrationNumber}</div>
                              </div>
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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedCustomer && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Selected Customer</h4>
                    <div className="p-4 border rounded-lg bg-primary/5 border-primary">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-lg">{selectedCustomer.name}</div>
                          <div className="text-sm text-gray-500">{selectedCustomer.company} - {selectedCustomer.type}</div>
                        </div>
                        <div className="flex items-center space-x-2">
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
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Country:</span> {selectedCustomer.country}
                        </div>
                        <div>
                          <span className="text-gray-500">Registration:</span> {selectedCustomer.registrationNumber}
                        </div>
                        <div>
                          <span className="text-gray-500">Contact:</span> {selectedCustomer.contactPerson}
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span> {selectedCustomer.contactEmail}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {!selectedCustomer && (
                  <div className="flex items-center justify-center p-6 border border-dashed rounded-lg mb-6">
                    <div className="text-center text-gray-500">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Please select a customer to continue</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Reference Numbers */}
              <div className="mb-6">
                <h4 className="text-base font-medium mb-3">Reference Numbers</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customer-po-number">Customer PO Number</Label>
                    <Input 
                      id="customer-po-number" 
                      placeholder="Enter PO number"
                      value={customerPONumber}
                      onChange={(e) => setCustomerPONumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="so-number">SO Number</Label>
                    <Input 
                      id="so-number" 
                      placeholder="Enter SO number"
                      value={soNumber}
                      onChange={(e) => setSONumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipment-number">Shipment Number</Label>
                    <Input 
                      id="shipment-number" 
                      placeholder="Enter shipment number"
                      value={shipmentNumber}
                      onChange={(e) => setShipmentNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
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
                        <div className="p-3 bg-gray-50 rounded-md">
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
                            <div><span className="text-gray-500">Contact:</span> {selectedCustomer.contactPerson}</div>
                            <div><span className="text-gray-500">Email:</span> {selectedCustomer.contactEmail}</div>
                          </div>
                        </div>
                      ) : (
                        <p>No customer selected</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Reference Numbers</h4>
                    <div className="mt-1 space-y-1">
                      <p>PO Number: {customerPONumber || 'Not specified'}</p>
                      <p>SO Number: {soNumber || 'Not specified'}</p>
                      <p>Shipment Number: {shipmentNumber || 'Not specified'}</p>
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