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
import satelliteMapImage from "../../assets/satellite-map.png";

type DeclarationSourceType = "existing" | "fresh";

// Define the interface for declaration items
interface DeclarationItem {
  id: string;
  hsnCode: string;
  productName: string;
  scientificName: string;
  quantity: string;
  unit: string;
  batchId?: string;
  sku?: string;
}

// Define the interface for existing declaration objects
interface ExistingDeclaration {
  id: number;
  name: string;
  code: string;
  product: string;
  quantity: string;
  status: string;
  eudrReferenceNumber: string;
  eudrVerificationNumber: string;
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
  
  // State management for wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [declarationSource, setDeclarationSource] = useState<DeclarationSourceType>("fresh");
  
  // Selected customer state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected existing declaration state
  const [selectedDeclaration, setSelectedDeclaration] = useState<ExistingDeclaration | null>(null);
  const [declarationSearchQuery, setDeclarationSearchQuery] = useState("");
  
  // Declaration details state
  const [declarationName, setDeclarationName] = useState("");
  const [eudrRefNumber, setEudrRefNumber] = useState("");
  const [validityPeriod, setValidityPeriod] = useState<"30days" | "6months" | "9months" | "1year" | "custom">("30days");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days ahead
  const [notes, setNotes] = useState("");
  
  // Declaration items state
  const [items, setItems] = useState<DeclarationItem[]>([
    {
      id: "1",
      hsnCode: "",
      productName: "",
      scientificName: "",
      quantity: "",
      unit: "kg",
      batchId: "",
      sku: ""
    }
  ]);
  
  // GeoJSON validation state
  const [hasUploadedGeoJSON, setHasUploadedGeoJSON] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [geometryValid, setGeometryValid] = useState<boolean | null>(null);
  const [satelliteValid, setSatelliteValid] = useState<boolean | null>(null);
  
  // Declaration submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [declNumber, setDeclNumber] = useState("");
  
  // Fetch customers from API
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    select: (data) => data.filter(customer => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    enabled: currentStep === 1 && declarationSource === "fresh",
  });
  
  // Fetch existing declarations from API
  const { data: declarations = [] } = useQuery<ExistingDeclaration[]>({
    queryKey: ['/api/declarations', 'outbound'],
    select: (data) => data.filter(declaration => 
      declaration.name.toLowerCase().includes(declarationSearchQuery.toLowerCase()) ||
      declaration.product.toLowerCase().includes(declarationSearchQuery.toLowerCase())
    ),
    enabled: currentStep === 1 && declarationSource === "existing",
  });
  
  // Declaration submission mutation
  const submitDeclarationMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customerId: selectedCustomer?.id,
        name: declarationName,
        eudrReferenceNumber: eudrRefNumber,
        validFrom: startDate,
        validTo: endDate,
        notes,
        items: items.map(item => ({
          hsnCode: item.hsnCode,
          productName: item.productName,
          scientificName: item.scientificName,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          batchId: item.batchId || null,
          sku: item.sku || null
        })),
        type: "outbound",
        geoValidated: hasUploadedGeoJSON && geometryValid && satelliteValid,
        status: "pending"
      };
      
      return await apiRequest("POST", "/api/declarations", payload);
    },
    onSuccess: (res) => {
      const result = res.json();
      setIsSubmitting(false);
      setDeclNumber("EUDR-OUT-2025-" + Math.floor(1000 + Math.random() * 9000));
      setShowSuccessDialog(true);
      queryClient.invalidateQueries({ queryKey: ['/api/declarations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit declaration: " + error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });
  
  // Handle step navigation
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Reset wizard state
  const resetWizard = () => {
    setCurrentStep(1);
    setDeclarationSource("fresh");
    setSelectedCustomer(null);
    setSearchQuery("");
    setSelectedDeclaration(null);
    setDeclarationSearchQuery("");
    setDeclarationName("");
    setEudrRefNumber("");
    setValidityPeriod("30days");
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setNotes("");
    setItems([
      {
        id: "1",
        hsnCode: "",
        productName: "",
        scientificName: "",
        quantity: "",
        unit: "kg",
        batchId: "",
        sku: ""
      }
    ]);
    setHasUploadedGeoJSON(false);
    setIsValidating(false);
    setGeometryValid(null);
    setSatelliteValid(null);
    setShowSuccessDialog(false);
    setDeclNumber("");
  };
  
  // Handle wizard close
  const handleCloseWizard = () => {
    resetWizard();
    onOpenChange(false);
  };
  
  // Declaration items management
  const addItem = () => {
    const newItem: DeclarationItem = {
      id: (items.length + 1).toString(),
      hsnCode: "",
      productName: "",
      scientificName: "",
      quantity: "",
      unit: "kg",
      batchId: "",
      sku: ""
    };
    setItems([...items, newItem]);
  };
  
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
  const handleGeoJSONUpload = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    // Simulate file upload
    setHasUploadedGeoJSON(true);
    setIsValidating(true);
    
    // Simulate validation process
    setTimeout(() => {
      setGeometryValid(true);
      setIsValidating(false);
      
      // After geometry validation, simulate satellite validation
      setTimeout(() => {
        setIsValidating(true);
        setTimeout(() => {
          setSatelliteValid(true);
          setIsValidating(false);
        }, 1500);
      }, 500);
    }, 1500);
  };
  
  // Handle declaration submission
  const handleSubmitDeclaration = () => {
    setIsSubmitting(true);
    submitDeclarationMutation.mutate();
  };
  
  // Get declaration validity dates based on selected period
  const setDurationAndDates = (period: "30days" | "6months" | "9months" | "1year" | "custom") => {
    setValidityPeriod(period);
    
    const now = new Date();
    let end;
    
    switch (period) {
      case "30days":
        end = new Date(now);
        end.setDate(now.getDate() + 30);
        break;
      case "6months":
        end = new Date(now);
        end.setMonth(now.getMonth() + 6);
        break;
      case "9months":
        end = new Date(now);
        end.setMonth(now.getMonth() + 9);
        break;
      case "1year":
        end = new Date(now);
        end.setFullYear(now.getFullYear() + 1);
        break;
      case "custom":
        // Keep existing end date for custom period
        return;
    }
    
    setStartDate(now);
    setEndDate(end);
  };
  
  // Determine if the current step is complete
  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return declarationSource === "existing" 
          ? selectedDeclaration !== null 
          : selectedCustomer !== null;
      case 2:
        return declarationName.trim() !== "" && 
               startDate !== undefined && 
               endDate !== undefined && 
               items.length > 0 && 
               items.every(item => 
                 item.hsnCode.trim() !== "" && 
                 item.productName.trim() !== "" && 
                 item.quantity.trim() !== ""
               );
      case 3:
        return declarationSource === "existing" || 
               (hasUploadedGeoJSON && geometryValid === true && 
               (satelliteValid === true || satelliteValid === null));
      default:
        return true;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        {!showSuccessDialog ? (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Create Outbound Declaration</DialogTitle>
              <DialogDescription>
                Create a new outbound declaration to your customers
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-grow overflow-y-auto px-6">
              {/* Stepper component */}
              <div className="my-6">
                <Stepper 
                  steps={[
                    { label: "Customer", completed: currentStep > 1 },
                    { label: "Details", completed: currentStep > 2 },
                    { label: "Documents", completed: currentStep > 3 },
                    { label: "Review", completed: false }
                  ]} 
                  currentStep={currentStep}
                />
              </div>
              
              {/* Step 1: Select Customer and Declaration Source */}
              {currentStep === 1 && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Declaration Source</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div 
                        className={cn(
                          "flex flex-col border rounded-lg p-4 cursor-pointer",
                          declarationSource === "fresh" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setDeclarationSource("fresh")}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center",
                            declarationSource === "fresh" ? "border-primary" : "border-border"
                          )}>
                            {declarationSource === "fresh" && (
                              <div className="h-3 w-3 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="font-medium">Create Fresh Declaration</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Start a new declaration from scratch
                        </p>
                      </div>
                      
                      <div 
                        className={cn(
                          "flex flex-col border rounded-lg p-4 cursor-pointer",
                          declarationSource === "existing" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setDeclarationSource("existing")}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center",
                            declarationSource === "existing" ? "border-primary" : "border-border"
                          )}>
                            {declarationSource === "existing" && (
                              <div className="h-3 w-3 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="font-medium">Use Existing Declaration</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Create a new declaration based on an existing one
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* For fresh declarations, show customer selection */}
                  {declarationSource === "fresh" && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Select Customer</h3>
                      <div className="mb-4 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search customers..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customers.map((customer) => (
                          <div
                            key={customer.id}
                            className={cn(
                              "border rounded-md p-4 cursor-pointer",
                              selectedCustomer?.id === customer.id 
                                ? "border-primary bg-primary/5" 
                                : "hover:border-primary/50"
                            )}
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {customer.name}
                                  {customer.company && (
                                    <span className="text-muted-foreground ml-1">
                                      ({customer.company})
                                    </span>
                                  )}
                                </h4>
                                {customer.country && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {customer.country}
                                  </p>
                                )}
                              </div>
                              <Badge variant={customer.type === "direct" ? "default" : "secondary"}>
                                {customer.type === "direct" ? "Direct" : "Indirect"}
                              </Badge>
                            </div>
                            {customer.complianceScore !== undefined && (
                              <div className="mt-3 flex items-center">
                                <span className="text-xs text-muted-foreground mr-2">
                                  Compliance Score:
                                </span>
                                <div className="h-2 bg-gray-200 rounded-full w-24">
                                  <div 
                                    className={cn(
                                      "h-2 rounded-full", 
                                      customer.complianceScore >= 80 
                                        ? "bg-green-500" 
                                        : customer.complianceScore >= 50 
                                          ? "bg-yellow-500" 
                                          : "bg-red-500"
                                    )}
                                    style={{ width: `${customer.complianceScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs ml-2">{customer.complianceScore}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* For existing declarations, show declaration selection */}
                  {declarationSource === "existing" && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Select Existing Declaration</h3>
                      <div className="mb-4 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search declarations..."
                          className="pl-8"
                          value={declarationSearchQuery}
                          onChange={(e) => setDeclarationSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        {declarations.map((declaration) => (
                          <div
                            key={declaration.id}
                            className={cn(
                              "border rounded-md p-4 cursor-pointer",
                              selectedDeclaration?.id === declaration.id 
                                ? "border-primary bg-primary/5" 
                                : "hover:border-primary/50"
                            )}
                            onClick={() => setSelectedDeclaration(declaration)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{declaration.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-muted-foreground">
                                    {declaration.product}
                                  </span>
                                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                    {declaration.quantity}
                                  </span>
                                </div>
                              </div>
                              <Badge 
                                variant={
                                  declaration.status === "approved" 
                                    ? "success" 
                                    : declaration.status === "pending" 
                                      ? "warning" 
                                      : "secondary"
                                }
                              >
                                {declaration.status}
                              </Badge>
                            </div>
                            <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              <div>EUDR Ref: {declaration.eudrReferenceNumber}</div>
                              <div>Verification: {declaration.eudrVerificationNumber}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 2: Declaration Details */}
              {currentStep === 2 && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Declaration Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="declaration-name" className="mb-2">
                          Declaration Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="declaration-name"
                          placeholder="Enter declaration name"
                          value={declarationName}
                          onChange={(e) => setDeclarationName(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="eudr-ref" className="mb-2">
                          EUDR Reference Number
                        </Label>
                        <Input
                          id="eudr-ref"
                          placeholder="Enter EUDR reference number"
                          value={eudrRefNumber}
                          onChange={(e) => setEudrRefNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label className="mb-2">Declaration Validity Period <span className="text-red-500">*</span></Label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge 
                          variant={validityPeriod === "30days" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setDurationAndDates("30days")}
                        >
                          30 days
                        </Badge>
                        <Badge 
                          variant={validityPeriod === "6months" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setDurationAndDates("6months")}
                        >
                          6 months
                        </Badge>
                        <Badge 
                          variant={validityPeriod === "9months" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setDurationAndDates("9months")}
                        >
                          9 months
                        </Badge>
                        <Badge 
                          variant={validityPeriod === "1year" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setDurationAndDates("1year")}
                        >
                          1 year
                        </Badge>
                        <Badge 
                          variant={validityPeriod === "custom" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setDurationAndDates("custom")}
                        >
                          Custom
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date" className="mb-2">
                            Start Date <span className="text-red-500">*</span>
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
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
                          <Label htmlFor="end-date" className="mb-2">
                            End Date <span className="text-red-500">*</span>
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
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
                                disabled={(date) => date < (startDate || new Date())}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label htmlFor="notes" className="mb-2">
                        Notes
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any additional notes or instructions"
                        className="h-24"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Declaration Items</h3>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          className="hidden"
                          id="import-items"
                          accept=".csv,.xlsx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              toast({
                                title: "File selected",
                                description: `${e.target.files[0].name} will be processed`,
                              });
                              // Actual import logic would go here
                            }
                          }}
                        />
                        
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => addItem()}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={item.id} className="p-4 border rounded-md">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Item {index + 1}</h4>
                            {items.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-6 gap-4">
                            <div>
                              <Label htmlFor={`hsn-code-${item.id}`} className="flex items-center mb-2">
                                HSN Code <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id={`hsn-code-${item.id}`}
                                placeholder="e.g. 1511.10.00"
                                value={item.hsnCode}
                                onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`batch-id-${item.id}`} className="flex items-center mb-2">
                                Batch ID 
                                <span className="ml-1 text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                  </svg>
                                </span>
                              </Label>
                              <Input
                                id={`batch-id-${item.id}`}
                                placeholder="e.g. BATCH-001"
                                value={item.batchId || ''}
                                onChange={(e) => updateItem(item.id, 'batchId', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`sku-${item.id}`} className="flex items-center mb-2">
                                SKU
                                <span className="ml-1 text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                  </svg>
                                </span>
                              </Label>
                              <Input
                                id={`sku-${item.id}`}
                                placeholder="e.g. SKU-2025-A100"
                                value={item.sku || ''}
                                onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`product-name-${item.id}`} className="flex items-center mb-2">
                                Product Name <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id={`product-name-${item.id}`}
                                placeholder="e.g. Palm Oil"
                                value={item.productName}
                                onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`scientific-name-${item.id}`} className="mb-2">
                                Scientific Name
                              </Label>
                              <Input
                                id={`scientific-name-${item.id}`}
                                placeholder="e.g. Elaeis guineensis"
                                value={item.scientificName}
                                onChange={(e) => updateItem(item.id, 'scientificName', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`quantity-${item.id}`} className="flex items-center mb-2">
                                Quantity <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id={`quantity-${item.id}`}
                                type="text"
                                placeholder="e.g. 5000"
                                value={item.quantity}
                                onChange={(e) => {
                                  // Only allow numeric input with decimal point
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  updateItem(item.id, 'quantity', value);
                                }}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`unit-${item.id}`} className="mb-2">
                                Unit
                              </Label>
                              <Select
                                value={item.unit}
                                onValueChange={(value) => updateItem(item.id, 'unit', value)}
                              >
                                <SelectTrigger id={`unit-${item.id}`}>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="ton">ton</SelectItem>
                                  <SelectItem value="liters">liters</SelectItem>
                                  <SelectItem value="m³">m³</SelectItem>
                                  <SelectItem value="pieces">pieces</SelectItem>
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
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm text-green-600">Compliant</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="p-0 h-6 text-green-600 hover:text-green-800 hover:bg-transparent"
                                    onClick={() => window.open("https://trace-x-technologies.orbify.app/d/report/47db8820-3e57-45a1-92ea-79b23c08c988?tab=259473", "_blank")}
                                  >
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="16" 
                                      height="16" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      className="ml-1"
                                    >
                                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </Button>
                                </div>
                              ) : geometryValid === false ? (
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm text-red-600">Non-Compliant</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="p-0 h-6 text-red-600 hover:text-red-800 hover:bg-transparent"
                                    onClick={() => window.open("https://trace-x-technologies.orbify.app/d/report/47db8820-3e57-45a1-92ea-79b23c08c988?tab=259473", "_blank")}
                                  >
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="16" 
                                      height="16" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      className="ml-1"
                                    >
                                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </Button>
                                </div>
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
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm text-green-600">Compliant</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="p-0 h-6 text-green-600 hover:text-green-800 hover:bg-transparent"
                                      onClick={() => window.open("https://trace-x-technologies.orbify.app/d/report/47db8820-3e57-45a1-92ea-79b23c08c988?tab=259473", "_blank")}
                                    >
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        className="ml-1"
                                      >
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                      </svg>
                                    </Button>
                                  </div>
                                ) : satelliteValid === false ? (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm text-red-600">Non-Compliant</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="p-0 h-6 text-red-600 hover:text-red-800 hover:bg-transparent"
                                      onClick={() => window.open("https://trace-x-technologies.orbify.app/d/report/47db8820-3e57-45a1-92ea-79b23c08c988?tab=259473", "_blank")}
                                    >
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        className="ml-1"
                                      >
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                      </svg>
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">Pending</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Show satellite map visualization when GeoJSON is validated */}
                      {hasUploadedGeoJSON && geometryValid === true && satelliteValid === true && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Satellite View</h4>
                          <div className="border rounded-md overflow-hidden">
                            <img 
                              src={satelliteMapImage} 
                              alt="Satellite Map with GeoJSON Overlay" 
                              className="w-full h-auto"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Document upload section (for both declaration types) */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Supporting Documents</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Please upload any supporting documents for this declaration.
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50">
                      <div className="mx-auto flex justify-center">
                        <Upload className="h-12 w-12 text-gray-400" />
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        Drag and drop supporting documents here, or click to browse
                      </p>
                      <Button variant="secondary" className="mt-4">
                        Browse Files
                      </Button>
                      <p className="mt-2 text-xs text-gray-500">
                        Max file size: 10MB. Accepted formats: PDF, DOCX, XLSX, JPG, PNG
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 4: Review and Submit */}
              {currentStep === 4 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Review Declaration</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Please review the information below before submitting your declaration.
                  </p>
                  
                  <div className="rounded-md border overflow-hidden">
                    <div className="bg-muted p-4">
                      <h4 className="font-medium">Declaration Information</h4>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Declaration Name:</span>
                          <p className="font-medium">{declarationName}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-muted-foreground">EUDR Reference:</span>
                          <p className="font-medium">{eudrRefNumber || "Not specified"}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-muted-foreground">Customer:</span>
                          <p className="font-medium">{selectedCustomer?.name || "Not specified"}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Valid From:</span>
                          <p className="font-medium">{startDate ? format(startDate, "PPP") : "Not specified"}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-muted-foreground">Valid Until:</span>
                          <p className="font-medium">{endDate ? format(endDate, "PPP") : "Not specified"}</p>
                        </div>
                      </div>
                      
                      {notes && (
                        <div>
                          <span className="text-sm text-muted-foreground">Notes:</span>
                          <p className="text-sm mt-1">{notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="rounded-md border overflow-hidden mt-6">
                    <div className="bg-muted p-4 flex justify-between items-center">
                      <h4 className="font-medium">Declaration Items</h4>
                      <Badge variant="secondary">{items.length} items</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">#</th>
                            <th className="px-4 py-2 text-left font-medium">HSN Code</th>
                            <th className="px-4 py-2 text-left font-medium">Product</th>
                            <th className="px-4 py-2 text-left font-medium">Batch ID</th>
                            <th className="px-4 py-2 text-left font-medium">SKU</th>
                            <th className="px-4 py-2 text-left font-medium">Quantity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {items.map((item, index) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">{index + 1}</td>
                              <td className="px-4 py-3">{item.hsnCode}</td>
                              <td className="px-4 py-3">
                                {item.productName}
                                {item.scientificName && (
                                  <span className="text-gray-500 text-xs block">
                                    {item.scientificName}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">{item.batchId || "-"}</td>
                              <td className="px-4 py-3">{item.sku || "-"}</td>
                              <td className="px-4 py-3">
                                {item.quantity} {item.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {declarationSource === "fresh" && (
                    <div className="rounded-md border overflow-hidden mt-6">
                      <div className="bg-muted p-4">
                        <h4 className="font-medium">Validation Status</h4>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={cn(
                            "h-3 w-3 rounded-full",
                            geometryValid === true 
                              ? "bg-green-500" 
                              : geometryValid === false 
                                ? "bg-red-500" 
                                : "bg-amber-500"
                          )}></div>
                          <span className="text-sm">
                            Geometry Validation: {geometryValid === true 
                              ? "Compliant" 
                              : geometryValid === false 
                                ? "Non-Compliant" 
                                : "Pending"}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "h-3 w-3 rounded-full",
                            satelliteValid === true 
                              ? "bg-green-500" 
                              : satelliteValid === false 
                                ? "bg-red-500" 
                                : "bg-amber-500"
                          )}></div>
                          <span className="text-sm">
                            Satellite Validation: {satelliteValid === true 
                              ? "Compliant" 
                              : satelliteValid === false 
                                ? "Non-Compliant" 
                                : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms" className="text-sm">
                        I confirm that all information provided is accurate and compliant with EUDR regulations.
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between p-6 bg-muted/30 border-t">
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCloseWizard}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                {currentStep < 4 ? (
                  <Button 
                    onClick={nextStep}
                    disabled={!isStepComplete() || isSubmitting}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmitDeclaration}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Declaration"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        ) : (
          // Success dialog content
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Declaration Submitted</h2>
            <p className="text-muted-foreground mb-6">
              Your declaration has been submitted successfully.
            </p>
            <div className="bg-muted p-4 rounded-md mb-6 w-full max-w-md">
              <div className="text-sm text-left mb-2">
                <span className="text-muted-foreground">Declaration ID:</span>
                <span className="font-medium ml-2">{declNumber}</span>
              </div>
              <div className="text-sm text-left mb-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="warning" className="ml-2">Pending Verification</Badge>
              </div>
              <div className="text-sm text-left">
                <span className="text-muted-foreground">Submitted on:</span>
                <span className="font-medium ml-2">{format(new Date(), "PPP")}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <Button variant="outline" onClick={handleCloseWizard}>
                Close
              </Button>
              <Button>
                View Declaration
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}