import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface Declaration {
  id: number;
  type: "inbound" | "outbound";
  supplierId: number;
  supplier?: string;
  productName: string;
  productDescription: string | null;
  hsnCode: string | null;
  quantity: number | null;
  unit: string | null;
}

interface EUTracesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declarationId?: number;
}

const EUTracesForm: React.FC<EUTracesFormProps> = ({ open, onOpenChange, declarationId }) => {
  const { toast } = useToast();
  const [activityType, setActivityType] = useState<"import" | "export" | "domestic">("import");
  const [copyOperatorCountry, setCopyOperatorCountry] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; hsCode: string; quantity: string; unit: string }[]>([
    { id: "product-1", name: "", hsCode: "", quantity: "", unit: "kg" }
  ]);
  const [formData, setFormData] = useState({
    reference: "",
    traderName: "",
    traderCountry: "",
    vatCode: "",
    countryOfActivity: "",
    countryOfEntry: "",
    additionalInfo: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Function to handle form input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // List of countries for the select elements
  const countries = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", 
    "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", 
    "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", 
    "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", 
    "Slovenia", "Spain", "Sweden"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields: string[] = [];
    
    // Check required fields
    if (!formData.reference) missingFields.push('Reference Number');
    if (!formData.traderName) missingFields.push('Trader Name');
    if (!formData.traderCountry) missingFields.push('Trader Country');
    if (!formData.countryOfActivity) missingFields.push('Country of Activity');
    if (!formData.countryOfEntry) missingFields.push('Country of Entry');
    
    // Check if at least one product is properly filled out
    const validProduct = products.some(product => 
      product.name && product.hsCode && product.quantity
    );
    
    if (!validProduct) missingFields.push('At least one complete Product');
    
    // Show error if missing fields
    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill out the following fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Prepare the form data to submit
      const submissionData = {
        ...formData,
        activityType,
        products,
        // Add declaration ID reference
        declarationId,
        // Add submission metadata
        submittedBy: "Current User",
        submittedAt: new Date().toISOString(),
        eudrReference: `EUDR-${Math.floor(100000 + Math.random() * 900000)}`,
        verificationReference: `VER-${Math.floor(800000 + Math.random() * 199999)}`,
        inspectionReference: `REF-${Math.floor(600000 + Math.random() * 199999)}`,
        status: "pending",
        type: "eu_filed" // Mark this as an EU filed declaration
      };
      
      // In a real implementation, this would make an API call
      // For this demo, we're simulating the API call
      console.log("Submitting EU Traces form data:", submissionData);
      
      // Simulate API call to create a new declaration in the EU Filed category
      const response = await fetch('/api/declarations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit EU Traces form');
      }
      
      // Show success toast
      toast({
        title: "Form submitted",
        description: "EU-IS Filing: EUDR Declaration has been submitted successfully",
      });
      
      // Close the form
      onOpenChange(false);
      
      // Force a refresh of the declarations list to show the new EU filed declaration
      window.location.href = '/#/declarations?tab=eu_filed';
    } catch (error) {
      console.error("Error submitting EU Traces form:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting the EU Traces form. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Update the country of entry when trader country changes and checkbox is checked
  useEffect(() => {
    if (copyOperatorCountry && formData.traderCountry) {
      handleInputChange('countryOfEntry', formData.traderCountry);
    }
  }, [formData.traderCountry, copyOperatorCountry]);

  // Fetch declaration data when the form opens
  useEffect(() => {
    const fetchDeclarationData = async () => {
      if (declarationId && open) {
        setIsLoading(true);
        try {
          const data = await apiRequest(`/api/declarations/${declarationId}`, { method: 'GET' });
          
          // Auto-fill only commodity/product information based on the declaration
          if (data) {
            // Create a product entry with the declaration data
            setProducts([
              {
                id: "product-1",
                name: data.productName || "",
                hsCode: data.hsnCode || "",
                quantity: data.quantity ? String(data.quantity) : "",
                unit: data.unit || "kg"
              }
            ]);
          }
        } catch (error) {
          console.error("Error fetching declaration data:", error);
          toast({
            title: "Error",
            description: "Could not load declaration data",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchDeclarationData();
  }, [declarationId, open, toast]);

  const addProduct = () => {
    setProducts([
      ...products,
      { 
        id: `product-${products.length + 1}`, 
        name: "", 
        hsCode: "", 
        quantity: "", 
        unit: "kg" 
      }
    ]);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">EU-IS Filing Form: EUDR Declaration for Operators/Traders</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-gray-500">Loading declaration data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Statement Details */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-4">1. Statement Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input 
                    id="reference" 
                    placeholder="Enter reference number" 
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* 2. Activity Type */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-4">2. Activity Type</h3>
              <RadioGroup 
                defaultValue="import" 
                value={activityType}
                onValueChange={(value) => setActivityType(value as "import" | "export" | "domestic")}
                className="flex items-center space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="import" id="import" />
                  <Label htmlFor="import">Import</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="export" id="export" />
                  <Label htmlFor="export">Export</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="domestic" id="domestic" />
                  <Label htmlFor="domestic">Domestic</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* 3. Operator/Trader Information */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-4">3. Operator/Trader Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trader-name">Name</Label>
                  <Input 
                    id="trader-name" 
                    placeholder="Company name" 
                    value={formData.traderName}
                    onChange={(e) => handleInputChange('traderName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="trader-country">Country</Label>
                  <Select 
                    value={formData.traderCountry}
                    onValueChange={(value) => handleInputChange('traderCountry', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vat-code">VAT Code</Label>
                  <Input 
                    id="vat-code" 
                    placeholder="VAT number" 
                    value={formData.vatCode}
                    onChange={(e) => handleInputChange('vatCode', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* 4. Place of Activity */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-4">4. Place of Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country-of-activity">Country of Activity</Label>
                  <Select
                    value={formData.countryOfActivity}
                    onValueChange={(value) => handleInputChange('countryOfActivity', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country-of-entry">Country of Entry</Label>
                  <Select 
                    disabled={copyOperatorCountry}
                    value={formData.countryOfEntry}
                    onValueChange={(value) => handleInputChange('countryOfEntry', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="copy-country" 
                      checked={copyOperatorCountry}
                      onCheckedChange={(checked) => {
                        setCopyOperatorCountry(checked as boolean);
                        if (checked) {
                          // Copy trader country to country of entry
                          handleInputChange('countryOfEntry', formData.traderCountry);
                        }
                      }}
                    />
                    <Label htmlFor="copy-country">Copy from Operator Country</Label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 5. Additional Information */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-4">5. Additional Information</h3>
              <div>
                <Label htmlFor="additional-info">Enter additional information here...</Label>
                <Textarea 
                  id="additional-info" 
                  placeholder="Provide any additional details about this filing"
                  className="h-24"
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                />
              </div>
            </div>
            
            {/* 6. Commodity(ies) or Product(s) */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-4">6. Commodity(ies) or Product(s)</h3>
              <div className="space-y-4">
                {products.map((product, index) => (
                  <div key={product.id} className="bg-white p-3 rounded-md border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`product-name-${index}`}>Product Name</Label>
                        <Input 
                          id={`product-name-${index}`} 
                          value={product.name}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].name = e.target.value;
                            setProducts(newProducts);
                          }}
                          placeholder="Product name" 
                        />
                      </div>
                      <div>
                        <Label htmlFor={`hs-code-${index}`}>HS Code</Label>
                        <Input 
                          id={`hs-code-${index}`} 
                          value={product.hsCode}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].hsCode = e.target.value;
                            setProducts(newProducts);
                          }}
                          placeholder="HS code" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                          <Input 
                            id={`quantity-${index}`} 
                            value={product.quantity}
                            onChange={(e) => {
                              const newProducts = [...products];
                              newProducts[index].quantity = e.target.value;
                              setProducts(newProducts);
                            }}
                            placeholder="Amount" 
                            type="number"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`unit-${index}`}>Unit</Label>
                          <Select 
                            value={product.unit}
                            onValueChange={(value) => {
                              const newProducts = [...products];
                              newProducts[index].unit = value;
                              setProducts(newProducts);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">Kilogram (kg)</SelectItem>
                              <SelectItem value="ton">Metric ton</SelectItem>
                              <SelectItem value="liter">Liter</SelectItem>
                              <SelectItem value="piece">Piece</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={addProduct}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t">
              <Button 
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button type="submit">
                Submit Declaration
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EUTracesForm;