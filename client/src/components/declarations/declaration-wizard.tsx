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
import { CalendarIcon, Plus, Search, Trash2, Upload, User, Info, AlertCircle, Check, Clock } from "lucide-react";
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

// Validation plot data structure
type ValidationStatus = "compliant" | "non-compliant" | "warning";
type CheckType = "geometry" | "satellite";

interface ValidationIssue {
  type: CheckType;
  message: string;
  details?: string;
  severity: "error" | "warning";
}

interface ValidationPlot {
  id: string;
  name: string;
  plotId: string;
  area: number;
  areaUnit: string;
  perimeter: number;
  perimeterUnit: string;
  coordinates: string;
  vertices: number;
  status: ValidationStatus;
  geometryStatus: ValidationStatus;
  satelliteStatus: ValidationStatus;
  lastValidated: string;
  createdAt: string;
  issues: ValidationIssue[];
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
  const [showValidationDetails, setShowValidationDetails] = useState<string | null>(null); // 'validation' or null
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null); // To store which plot is selected in the details view
  const [validationPlots, setValidationPlots] = useState<ValidationPlot[]>([]);
  const [plotSearchTerm, setPlotSearchTerm] = useState("");

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

  // Generate sample validation plots with various validation states
  const generateValidationPlots = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Plot A - All compliant
    const plotA: ValidationPlot = {
      id: "plot-1",
      name: "Plot A",
      plotId: "POL-001",
      area: 125.4,
      areaUnit: "hectares",
      perimeter: 2.4,
      perimeterUnit: "km",
      coordinates: "12.345°N, 76.901°E",
      vertices: 28,
      status: "compliant",
      geometryStatus: "compliant",
      satelliteStatus: "compliant",
      lastValidated: currentDate,
      createdAt: "2025-01-15",
      issues: []
    };

    // Plot B - Geometry issues
    const plotB: ValidationPlot = {
      id: "plot-2",
      name: "Plot B",
      plotId: "POL-002",
      area: 98.7,
      areaUnit: "hectares",
      perimeter: 1.8,
      perimeterUnit: "km",
      coordinates: "12.355°N, 76.912°E",
      vertices: 24,
      status: "non-compliant",
      geometryStatus: "non-compliant",
      satelliteStatus: "warning",
      lastValidated: currentDate,
      createdAt: "2025-01-18",
      issues: [
        {
          type: "geometry",
          message: "Self-intersection detected",
          details: "Polygon has self-intersecting boundaries at coordinates (12.352°N, 76.908°E)",
          severity: "error"
        },
        {
          type: "geometry",
          message: "Invalid vertex count",
          details: "Polygons must have at least 4 vertices to form a valid closed shape",
          severity: "error"
        }
      ]
    };

    // Plot C - Satellite issues
    const plotC: ValidationPlot = {
      id: "plot-3",
      name: "Plot C",
      plotId: "POL-003",
      area: 142.1,
      areaUnit: "hectares",
      perimeter: 3.2,
      perimeterUnit: "km",
      coordinates: "12.365°N, 76.925°E",
      vertices: 32,
      status: "non-compliant",
      geometryStatus: "compliant",
      satelliteStatus: "non-compliant",
      lastValidated: currentDate,
      createdAt: "2025-01-20",
      issues: [
        {
          type: "satellite",
          message: "Deforestation detected",
          details: "Satellite imagery shows evidence of recent deforestation in the northwest section",
          severity: "error"
        },
        {
          type: "satellite",
          message: "Land use change detected",
          details: "Comparison with historical imagery shows unauthorized land use change since 2020",
          severity: "error"
        }
      ]
    };

    // Plot D - Both geometry and satellite warnings
    const plotD: ValidationPlot = {
      id: "plot-4",
      name: "Plot D",
      plotId: "POL-004",
      area: 110.8,
      areaUnit: "hectares",
      perimeter: 2.7,
      perimeterUnit: "km",
      coordinates: "12.375°N, 76.938°E",
      vertices: 26,
      status: "warning",
      geometryStatus: "warning",
      satelliteStatus: "warning",
      lastValidated: currentDate,
      createdAt: "2025-01-25",
      issues: [
        {
          type: "geometry",
          message: "Boundary proximity warning",
          details: "Polygon boundary is within 10m of a protected area border",
          severity: "warning"
        },
        {
          type: "satellite",
          message: "Potential water body encroachment",
          details: "Satellite imagery suggests possible encroachment into seasonal water body",
          severity: "warning"
        }
      ]
    };

    // Plot E - All compliant
    const plotE: ValidationPlot = {
      id: "plot-5",
      name: "Plot E",
      plotId: "POL-005",
      area: 135.6,
      areaUnit: "hectares",
      perimeter: 2.2,
      perimeterUnit: "km",
      coordinates: "12.385°N, 76.945°E",
      vertices: 30,
      status: "compliant",
      geometryStatus: "compliant",
      satelliteStatus: "compliant",
      lastValidated: currentDate,
      createdAt: "2025-01-28",
      issues: []
    };
    
    return [plotA, plotB, plotC, plotD, plotE];
  };

  // Handle file upload simulation
  const handleGeoJSONUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    setHasUploadedGeoJSON(true);
    setIsValidating(true);
    setGeometryValid(null);
    setSatelliteValid(null);
    setSelectedPlot(null);
    
    toast({
      title: "GeoJSON uploaded",
      description: "GeoJSON file has been uploaded successfully. Validating...",
      variant: "default",
    });
    
    // Generate validation plot data
    const plots = generateValidationPlots();
    
    // Simulate geometry validation check
    setTimeout(() => {
      // Check if any plots have geometry issues
      const hasGeometryIssues = plots.some(plot => plot.geometryStatus === "non-compliant");
      const geometryIsValid = !hasGeometryIssues;
      
      setGeometryValid(geometryIsValid);
      setValidationPlots(plots);
      
      // If geometry validation fails, don't proceed to satellite check
      if (!geometryIsValid) {
        setIsValidating(false);
        toast({
          title: "Geometry validation failed",
          description: "The GeoJSON contains non-compliant geometry. Please view validation details for more information.",
          variant: "destructive",
        });
        return;
      }
      
      // Only proceed to satellite check if geometry is valid
      setTimeout(() => {
        // Check if any plots have satellite issues
        const hasSatelliteIssues = plots.some(plot => plot.satelliteStatus === "non-compliant");
        const satelliteIsValid = !hasSatelliteIssues;
        
        setSatelliteValid(satelliteIsValid);
        setIsValidating(false);
        
        // If satellite check fails, notify the user
        if (!satelliteIsValid) {
          toast({
            title: "Validation issues detected",
            description: "Satellite check detected potential deforestation. View validation details for more information.",
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
    setSelectedPlot(null);
  };

  // Set validity period presets
  const handleValidityPeriodChange = (value: string) => {
    setValidityPeriod(value);
    const today = new Date();
    
    switch (value) {
      case "30days":
        setStartDate(today);
        setEndDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
        setShowCustomDates(false);
        break;
      case "6months":
        setStartDate(today);
        setEndDate(new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()));
        setShowCustomDates(false);
        break;
      case "9months":
        setStartDate(today);
        setEndDate(new Date(today.getFullYear(), today.getMonth() + 9, today.getDate()));
        setShowCustomDates(false);
        break;
      case "1year":
        setStartDate(today);
        setEndDate(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));
        setShowCustomDates(false);
        break;
      case "custom":
        setShowCustomDates(true);
        break;
    }
  };

  // Steps configuration
  const stepsConfig = [
    { label: "Declaration Details" },
    { label: "GeoJSON Upload" },
    { label: "Upload Evidence" },
    { label: "Review" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Declaration</DialogTitle>
          <DialogDescription>
            Create a new declaration to document and track compliance for your products.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 mb-6">
          <Stepper 
            steps={stepsConfig} 
            currentStep={currentStep} 
            completedSteps={completedSteps}
          />
        </div>

        <div className="space-y-6">
          {/* Step 1: Declaration Basic Info */}
          {currentStep === 1 && (
            <div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <Label htmlFor="poNumber" className="text-base font-medium">PO Number</Label>
                  <Input
                    id="poNumber"
                    placeholder="Enter PO number"
                    className="mt-2"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="supplierSoNumber" className="text-base font-medium">
                    Supplier SO Number
                    <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                  </Label>
                  <Input
                    id="supplierSoNumber"
                    placeholder="Enter supplier SO number"
                    className="mt-2"
                    value={supplierSoNumber}
                    onChange={(e) => setSupplierSoNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-base font-medium mb-3">Declaration Validity Period</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant={validityPeriod === "30days" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleValidityPeriodChange("30days")}
                  >
                    30 days
                  </Button>
                  <Button 
                    variant={validityPeriod === "6months" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleValidityPeriodChange("6months")}
                  >
                    6 months
                  </Button>
                  <Button 
                    variant={validityPeriod === "9months" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleValidityPeriodChange("9months")}
                  >
                    9 months
                  </Button>
                  <Button 
                    variant={validityPeriod === "1year" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleValidityPeriodChange("1year")}
                  >
                    1 year
                  </Button>
                  <Button 
                    variant={validityPeriod === "custom" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleValidityPeriodChange("custom")}
                  >
                    Custom
                  </Button>
                </div>
                
                {/* Selected period display */}
                {(startDate && endDate) && (
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <p className="text-sm font-medium mb-1">Selected period:</p>
                    <p className="text-sm text-gray-700">
                      {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
                    </p>
                  </div>
                )}
                
                {showCustomDates && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-1"
                            id="startDate"
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
                      <Label htmlFor="endDate" className="text-sm">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-1"
                            id="endDate"
                            disabled={!startDate}
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
                            disabled={(date) => startDate ? date < startDate : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <Label className="text-base font-medium">Supplier Selection</Label>
                <p className="text-sm text-gray-500 mb-2">Select the supplier associated with this declaration.</p>
                
                <div className="relative">
                  <Input
                    placeholder="Search suppliers..."
                    className="pl-9"
                    value={supplierSearchTerm}
                    onClick={() => setShowSupplierDropdown(true)}
                    onChange={(e) => {
                      setSupplierSearchTerm(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  
                  {showSupplierDropdown && (
                    <div className="absolute z-10 mt-1 w-full max-h-64 overflow-auto bg-white border rounded-md shadow-lg">
                      {suppliers.filter(supplier => 
                        supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
                      ).map((supplier) => (
                        <div
                          key={supplier.id}
                          className={cn(
                            "p-3 cursor-pointer",
                            selectedSupplierId === supplier.id ? "bg-primary/10" : "hover:bg-gray-50"
                          )}
                          onClick={() => {
                            setSelectedSupplierId(supplier.id);
                            setSelectedSupplier(supplier);
                            setSupplierSearchTerm(supplier.name);
                            setShowSupplierDropdown(false);
                          }}
                        >
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.products && (
                            <div className="text-sm text-gray-500">Products: {supplier.products}</div>
                          )}
                        </div>
                      ))}
                      {suppliers.filter(supplier => 
                        supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="p-3 text-center text-gray-500">No suppliers found</div>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedSupplier && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium">{selectedSupplier.name}</div>
                      <Badge className="bg-primary">Selected</Badge>
                    </div>
                    {selectedSupplier.products && (
                      <div className="mt-1 text-sm text-gray-500">Products: {selectedSupplier.products}</div>
                    )}
                    {selectedSupplier.countries && selectedSupplier.countries.length > 0 && (
                      <div className="mt-1 text-sm text-gray-500">
                        Countries: {selectedSupplier.countries.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-medium">Declaration Items</Label>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Import Items
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={addItem}
                      className="h-8 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="p-5 border rounded-md"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        {items.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-500"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-6 gap-4 items-end">
                        <div>
                          <Label htmlFor={`hsn-${item.id}`} className="text-sm flex items-center">
                            HSN Code
                            <span className="text-red-500 ml-0.5">*</span>
                          </Label>
                          <Input
                            id={`hsn-${item.id}`}
                            placeholder="e.g. 1511.10.00"
                            value={item.hsnCode}
                            onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`rm-id-${item.id}`} className="text-sm flex items-center">
                            RM ID
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="px-1 h-6">
                                    <Info className="h-3.5 w-3.5 text-gray-400" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Raw Material ID for internal tracking</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <Input
                            id={`rm-id-${item.id}`}
                            placeholder="e.g. RM12345"
                            value={item.rmId || ''}
                            onChange={(e) => updateItem(item.id, 'rmId', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`product-${item.id}`} className="text-sm flex items-center">
                            Product Name
                            <span className="text-red-500 ml-0.5">*</span>
                          </Label>
                          <Input
                            id={`product-${item.id}`}
                            placeholder="e.g. Palm Oil"
                            value={item.productName}
                            onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`scientific-${item.id}`} className="text-sm">
                            Scientific Name
                          </Label>
                          <Input
                            id={`scientific-${item.id}`}
                            placeholder="e.g. Elaeis guineen"
                            value={item.scientificName}
                            onChange={(e) => updateItem(item.id, 'scientificName', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`quantity-${item.id}`} className="text-sm flex items-center">
                            Quantity
                            <span className="text-red-500 ml-0.5">*</span>
                          </Label>
                          <Input
                            id={`quantity-${item.id}`}
                            type="number"
                            placeholder="e.g. 5000"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`unit-${item.id}`} className="text-sm">
                            Unit
                          </Label>
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
                      
                      {/* Single View Validation Details button */}
                      {!isValidating && (geometryValid !== null || satelliteValid !== null) && (
                        <div className="mt-4 flex justify-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center"
                            onClick={() => setShowValidationDetails('validation')}
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
                              className="mr-2"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View Validation Details
                          </Button>
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
                        <ul className="list-disc list-inside">
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="text-sm">{file}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">GeoJSON Validation</h4>
                    <div className="mt-1">
                      {!hasUploadedGeoJSON ? (
                        <span className="text-red-500">No GeoJSON file uploaded</span>
                      ) : (
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm">
                            Geometry Check: 
                            <span className={cn(
                              "ml-2 px-2 py-0.5 rounded-full text-xs font-medium",
                              geometryValid === true ? "bg-green-100 text-green-800" :
                              geometryValid === false ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {geometryValid === true ? "Compliant" : 
                               geometryValid === false ? "Non-Compliant" : 
                               "Pending"}
                            </span>
                          </div>

                          {geometryValid === true && (
                            <div className="text-sm">
                              Satellite Check: 
                              <span className={cn(
                                "ml-2 px-2 py-0.5 rounded-full text-xs font-medium",
                                satelliteValid === true ? "bg-green-100 text-green-800" :
                                satelliteValid === false ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              )}>
                                {satelliteValid === true ? "Compliant" : 
                                 satelliteValid === false ? "Non-Compliant" : 
                                 "Pending"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Validation Details Dialog */}
        <Dialog 
          open={showValidationDetails !== null} 
          onOpenChange={(open) => !open && setShowValidationDetails(null)}
        >
          <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[80vh]">
              {/* Left sidebar with plot list and search */}
              <div className="col-span-1 overflow-y-auto border-r flex flex-col h-full">
                <div className="p-6 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search plots..."
                      className="pl-8"
                      value={plotSearchTerm}
                      onChange={(e) => setPlotSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Plot list */}
                <div className="flex-1 overflow-y-auto">
                  {validationPlots
                    .filter(plot => 
                      plot.name.toLowerCase().includes(plotSearchTerm.toLowerCase()) || 
                      plot.plotId.toLowerCase().includes(plotSearchTerm.toLowerCase())
                    )
                    .map((plot) => (
                      <div 
                        key={plot.id}
                        className={cn(
                          "p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                          selectedPlot === plot.plotId ? "bg-primary/5 border-l-4 border-l-primary" : ""
                        )}
                        onClick={() => setSelectedPlot(plot.plotId)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{plot.name}</div>
                            <div className="text-xs text-gray-500">{plot.plotId}</div>
                          </div>
                          <div className={cn(
                            "text-xs font-medium px-2 py-1 rounded-full",
                            plot.status === "compliant" 
                              ? "bg-green-100 text-green-800" 
                              : plot.status === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          )}>
                            {plot.status === "compliant" 
                              ? "Compliant" 
                              : plot.status === "warning"
                                ? "Warning"
                                : "Non-Compliant"}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              {/* Right content section with map and details */}
              <div className="col-span-2 flex flex-col h-full">
                {selectedPlot ? (
                  <>
                    {/* Selected plot content */}
                    {(() => {
                      const plot = validationPlots.find(p => p.plotId === selectedPlot);
                      if (!plot) return null;
                      
                      return (
                        <>
                          {/* Map section */}
                          <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-medium">Plot Location</h3>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18" 
                                  height="18" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18" 
                                  height="18" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                              </Button>
                            </div>
                          </div>
                          
                          {/* Map Display */}
                          <div className="flex-1 bg-slate-50 overflow-auto relative">
                            <div className="min-w-[800px] min-h-[400px] relative">
                              {/* Satellite imagery */}
                              <img 
                                src={satelliteMapImage} 
                                alt="Satellite view of agricultural land"
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Overlay polygon */}
                              <div className={cn(
                                "absolute inset-0 flex items-center justify-center",
                                plot.status === "compliant" 
                                  ? "border-4 border-green-500/50" 
                                  : plot.status === "warning"
                                    ? "border-4 border-amber-500/50"
                                    : "border-4 border-red-500/50"
                              )}>
                                <div className={cn(
                                  "w-2/3 h-2/3 border-2 pointer-events-none",
                                  plot.status === "compliant" 
                                    ? "border-green-500" 
                                    : plot.status === "warning"
                                      ? "border-amber-500"
                                      : "border-red-500"
                                )}></div>
                              </div>
                            </div>
                            
                            {/* Map controls */}
                            <div className="absolute right-4 bottom-4 flex flex-col space-y-2">
                              <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-md">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="15" 
                                  height="15" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  className="text-primary"
                                >
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-md">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="15" 
                                  height="15" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  className="text-primary"
                                >
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                              </Button>
                            </div>
                          </div>
                          
                          {/* Details panel */}
                          <div className="grid grid-cols-2 gap-6 p-6 border-t bg-white">
                            {/* Left side: Validation Status */}
                            <div>
                              <h3 className="font-medium text-base mb-4">Validation Status</h3>
                              <div className="space-y-3">
                                {/* Geometry Check */}
                                <div className={cn(
                                  "p-3 border rounded-md",
                                  plot.geometryStatus === "compliant" 
                                    ? "bg-green-50 border-green-100" 
                                    : plot.geometryStatus === "warning"
                                      ? "bg-amber-50 border-amber-100"
                                      : "bg-red-50 border-red-100"
                                )}>
                                  <div className="flex items-center">
                                    {plot.geometryStatus === "compliant" ? (
                                      <Check className="h-5 w-5 text-green-600 mr-2" />
                                    ) : plot.geometryStatus === "warning" ? (
                                      <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                    )}
                                    <div className={cn(
                                      "font-medium",
                                      plot.geometryStatus === "compliant" 
                                        ? "text-green-800" 
                                        : plot.geometryStatus === "warning"
                                          ? "text-amber-800"
                                          : "text-red-800"
                                    )}>Geometry Check</div>
                                  </div>
                                  
                                  {/* Show status message or issues */}
                                  {plot.geometryStatus === "compliant" ? (
                                    <p className="text-sm text-green-700 mt-1 pl-7">All geometry validations passed successfully.</p>
                                  ) : (
                                    <div className="mt-2 pl-7 space-y-2">
                                      {plot.issues
                                        .filter(issue => issue.type === "geometry")
                                        .map((issue, idx) => (
                                          <div key={idx} className={cn(
                                            "text-sm p-2 rounded",
                                            issue.severity === "warning" ? "bg-amber-100" : "bg-red-100"
                                          )}>
                                            <div className={cn(
                                              "font-medium",
                                              issue.severity === "warning" ? "text-amber-800" : "text-red-800"
                                            )}>{issue.message}</div>
                                            <div className={cn(
                                              "text-xs mt-0.5",
                                              issue.severity === "warning" ? "text-amber-700" : "text-red-700"
                                            )}>{issue.details}</div>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  )}
                                </div>
                                
                                {/* Satellite Check */}
                                <div className={cn(
                                  "p-3 border rounded-md",
                                  plot.satelliteStatus === "compliant" 
                                    ? "bg-green-50 border-green-100" 
                                    : plot.satelliteStatus === "warning"
                                      ? "bg-amber-50 border-amber-100"
                                      : "bg-red-50 border-red-100"
                                )}>
                                  <div className="flex items-center">
                                    {plot.satelliteStatus === "compliant" ? (
                                      <Check className="h-5 w-5 text-green-600 mr-2" />
                                    ) : plot.satelliteStatus === "warning" ? (
                                      <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                    )}
                                    <div className={cn(
                                      "font-medium",
                                      plot.satelliteStatus === "compliant" 
                                        ? "text-green-800" 
                                        : plot.satelliteStatus === "warning"
                                          ? "text-amber-800"
                                          : "text-red-800"
                                    )}>Satellite Check</div>
                                  </div>
                                  
                                  {/* Show status message or issues */}
                                  {plot.satelliteStatus === "compliant" ? (
                                    <p className="text-sm text-green-700 mt-1 pl-7">No issues detected in satellite imagery.</p>
                                  ) : (
                                    <div className="mt-2 pl-7 space-y-2">
                                      {plot.issues
                                        .filter(issue => issue.type === "satellite")
                                        .map((issue, idx) => (
                                          <div key={idx} className={cn(
                                            "text-sm p-2 rounded",
                                            issue.severity === "warning" ? "bg-amber-100" : "bg-red-100"
                                          )}>
                                            <div className={cn(
                                              "font-medium",
                                              issue.severity === "warning" ? "text-amber-800" : "text-red-800"
                                            )}>{issue.message}</div>
                                            <div className={cn(
                                              "text-xs mt-0.5",
                                              issue.severity === "warning" ? "text-amber-700" : "text-red-700"
                                            )}>{issue.details}</div>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  )}
                                </div>
                                
                                {/* Last Validated */}
                                <div className="p-3 border rounded-md">
                                  <div className="flex items-center">
                                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                                    <div className="font-medium">Last Validated</div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 pl-7">{plot.lastValidated}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side: Plot Details */}
                            <div>
                              <h3 className="font-medium text-base mb-4">Plot Details</h3>
                              <dl className="grid grid-cols-2 gap-3">
                                <div className="col-span-1">
                                  <dt className="text-sm text-gray-500">Area</dt>
                                  <dd className="text-sm font-medium">{plot.area} {plot.areaUnit}</dd>
                                </div>
                                
                                <div className="col-span-1">
                                  <dt className="text-sm text-gray-500">Perimeter</dt>
                                  <dd className="text-sm font-medium">{plot.perimeter} {plot.perimeterUnit}</dd>
                                </div>
                                
                                <div className="col-span-2">
                                  <dt className="text-sm text-gray-500">Coordinates</dt>
                                  <dd className="text-sm font-medium">{plot.coordinates}</dd>
                                </div>
                                
                                <div className="col-span-1">
                                  <dt className="text-sm text-gray-500">Vertices</dt>
                                  <dd className="text-sm font-medium">{plot.vertices}</dd>
                                </div>
                                
                                <div className="col-span-2 mt-4">
                                  <h4 className="font-medium text-sm mb-2">Validation History</h4>
                                  <div className="text-sm space-y-3">
                                    <div className="flex items-start">
                                      <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <div className="text-sm">Validation Passed</div>
                                        <div className="text-xs text-gray-500">{plot.lastValidated}</div>
                                        <div className="text-xs text-gray-600 mt-0.5">
                                          {plot.issues.length === 0 
                                            ? "All checks passed successfully. No issues found."
                                            : `${plot.issues.length} issues detected and reported.`
                                          }
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                      <Clock className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <div className="text-sm">Validation Started</div>
                                        <div className="text-xs text-gray-500">{plot.lastValidated}</div>
                                        <div className="text-xs text-gray-600 mt-0.5">Initial validation process started.</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </dl>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="32" 
                        height="32" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Select a plot to view details</h3>
                    <p className="text-gray-500 max-w-md">
                      Choose a plot from the list on the left to view its location, validation status, and detailed information.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="px-6 py-4 border-t">
              <Button onClick={() => setShowValidationDetails(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
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