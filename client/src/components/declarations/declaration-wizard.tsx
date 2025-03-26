import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/ui/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Database, FileText, Upload, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

// Declaration types
type DeclarationType = "inbound" | "outbound";
type DeclarationSource = "new" | "existing";

interface Declaration {
  id: number;
  type: DeclarationType;
  productName: string;
  quantity: number;
  unit: string;
  code?: string;
  status: string;
}

interface Customer {
  id: number;
  name: string;
  type: string;
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
  
  // Step 2: Declaration Source
  const [declarationSource, setDeclarationSource] = useState<DeclarationSource>("new");
  const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
  
  // Step 3: Upload Data
  const [hasUploadedGeoJSON, setHasUploadedGeoJSON] = useState(false);
  
  // Step 4: Customer Selection (for outbound only)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form data for new declaration
  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    hsnCode: "",
    quantity: "",
    unit: "kg",
    supplierId: 1,
    industry: "Food & Beverage",
    customerId: null as number | null,
    geoJsonData: null as any
  });
  
  // Mock declarations for the example
  const existingDeclarations: Declaration[] = [
    { id: 1, type: "inbound", productName: "Palm Oil", quantity: 5000, unit: "Tons", code: "#A12345", status: "approved" },
    { id: 2, type: "inbound", productName: "Rubber", quantity: 2000, unit: "Tons", code: "#B67890", status: "approved" },
  ];
  
  // Mock customers for the example
  const customers: Customer[] = [
    { id: 1, name: "Customer 1", type: "EU-Based Entity" },
    { id: 2, name: "Customer 2", type: "Non-EU Entity" },
  ];
  
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
  
  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        
      case 2: // Declaration Source
        if (declarationSource === "existing" && !selectedDeclaration) {
          toast({
            title: "Selection required",
            description: "Please select an existing declaration to continue",
            variant: "destructive",
          });
          return false;
        }
        return true;
        
      case 3: // Upload Data
        // In a real app, we'd validate the GeoJSON data
        // For this example, we'll always return true
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
    
    // Prepare payload based on declaration type and source
    const payload = {
      type: declarationType,
      productName: declarationSource === "existing" && selectedDeclaration ? 
        selectedDeclaration.productName : formData.productName,
      productDescription: formData.productDescription,
      hsnCode: formData.hsnCode,
      quantity: parseInt(formData.quantity) || 0,
      unit: formData.unit,
      supplierId: formData.supplierId,
      industry: formData.industry,
      customerId: declarationType === "outbound" ? (selectedCustomer?.id || null) : null,
      geoJsonData: formData.geoJsonData,
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
    setDeclarationSource("new");
    setSelectedDeclaration(null);
    setHasUploadedGeoJSON(false);
    setSelectedCustomer(null);
    setFormData({
      productName: "",
      productDescription: "",
      hsnCode: "",
      quantity: "",
      unit: "kg",
      supplierId: 1,
      industry: "Food & Beverage",
      customerId: null,
      geoJsonData: null
    });
  };
  
  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };
  
  // Handle file upload simulation
  const handleFileUpload = () => {
    setHasUploadedGeoJSON(true);
    toast({
      title: "File uploaded",
      description: "GeoJSON file has been uploaded successfully",
      variant: "default",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create Declaration</DialogTitle>
        </DialogHeader>
        
        <div className="mb-8">
          <Stepper 
            steps={[
              "Declaration Type", 
              "Select Declaration", 
              "Upload Data", 
              declarationType === "outbound" ? "Customer Selection" : "Review"
            ]}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>
        
        <div className="py-4">
          {/* Step 1: Declaration Type */}
          {currentStep === 1 && (
            <Tabs 
              defaultValue={declarationType} 
              onValueChange={(value) => setDeclarationType(value as DeclarationType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="inbound">Inbound Declaration</TabsTrigger>
                <TabsTrigger value="outbound">Outbound Declaration</TabsTrigger>
              </TabsList>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium">
                  {declarationType === "inbound" ? 
                    "Create declaration for goods received from supplier" : 
                    "Create declaration for goods shipped to customer"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {declarationType === "inbound" ? 
                    "Used for material sourcing compliance" : 
                    "Used for reporting outbound shipments to customers"}
                </p>
              </div>
            </Tabs>
          )}
          
          {/* Step 2: Declaration Source */}
          {currentStep === 2 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card 
                  className={cn(
                    "cursor-pointer transition-all border-2", 
                    declarationSource === "existing" ? "border-primary" : "hover:border-gray-300"
                  )} 
                  onClick={() => setDeclarationSource("existing")}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Database className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-lg font-medium">Based on Existing Declaration</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Use approved inbound declarations as reference
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={cn(
                    "cursor-pointer transition-all border-2", 
                    declarationSource === "new" ? "border-primary" : "hover:border-gray-300"
                  )} 
                  onClick={() => setDeclarationSource("new")}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <FileText className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-lg font-medium">Create Fresh Declaration</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Start a new declaration from scratch
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {declarationSource === "existing" && (
                <div className="mt-6">
                  <div className="relative mb-4">
                    <Input 
                      type="text" 
                      placeholder="Search declarations..." 
                      className="pl-9"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Declaration Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {existingDeclarations.map((declaration) => (
                          <tr 
                            key={declaration.id} 
                            className={cn(
                              "cursor-pointer hover:bg-gray-50",
                              selectedDeclaration?.id === declaration.id ? "bg-primary/5" : ""
                            )}
                            onClick={() => setSelectedDeclaration(declaration)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {declaration.id === 1 ? "ABC Declaration" : "XYZ Declaration"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{declaration.code}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{declaration.productName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {declaration.quantity} {declaration.unit}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                variant="outline" 
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                {declaration.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Upload Data */}
          {currentStep === 3 && (
            <div>
              <div className="mb-6">
                <Label className="text-base font-medium">GeoJSON Upload</Label>
                <div 
                  className={cn(
                    "mt-2 border-2 border-dashed rounded-md p-8 text-center",
                    hasUploadedGeoJSON ? "border-green-300 bg-green-50" : "border-gray-300"
                  )}
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
                      onClick={handleFileUpload}
                    >
                      Browse Files
                    </Button>
                  )}
                </div>
              </div>
              
              {declarationSource === "new" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div>
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input 
                      id="product-name" 
                      placeholder="Enter product name" 
                      value={formData.productName}
                      onChange={(e) => handleInputChange('productName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hsn-code">HSN Code</Label>
                    <Input 
                      id="hsn-code" 
                      placeholder="Enter HSN code" 
                      value={formData.hsnCode}
                      onChange={(e) => handleInputChange('hsnCode', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input 
                        id="quantity" 
                        type="number" 
                        placeholder="Enter quantity" 
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="w-1/3">
                      <Label htmlFor="unit">Unit</Label>
                      <Input 
                        id="unit" 
                        placeholder="kg, tons, etc." 
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input 
                      id="industry" 
                      placeholder="Industry" 
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="mt-1"
                    />
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
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
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 text-primary" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
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
                    <h4 className="text-sm font-medium text-gray-500">Declaration Source</h4>
                    <p className="mt-1">{declarationSource === "new" ? "New Declaration" : "Based on Existing"}</p>
                  </div>
                  
                  {declarationSource === "existing" && selectedDeclaration && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Base Declaration</h4>
                        <p className="mt-1">{selectedDeclaration.id === 1 ? "ABC Declaration" : "XYZ Declaration"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Product</h4>
                        <p className="mt-1">{selectedDeclaration.productName}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
                        <p className="mt-1">{selectedDeclaration.quantity} {selectedDeclaration.unit}</p>
                      </div>
                    </>
                  )}
                  
                  {declarationSource === "new" && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Product Name</h4>
                        <p className="mt-1">{formData.productName || "Not specified"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">HSN Code</h4>
                        <p className="mt-1">{formData.hsnCode || "Not specified"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
                        <p className="mt-1">
                          {formData.quantity ? `${formData.quantity} ${formData.unit}` : "Not specified"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Industry</h4>
                        <p className="mt-1">{formData.industry}</p>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">GeoJSON Data</h4>
                    <p className="mt-1">{hasUploadedGeoJSON ? "Uploaded" : "Not uploaded"}</p>
                  </div>
                  
                  {declarationType === "outbound" && selectedCustomer && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                      <p className="mt-1">{selectedCustomer.name}</p>
                    </div>
                  )}
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