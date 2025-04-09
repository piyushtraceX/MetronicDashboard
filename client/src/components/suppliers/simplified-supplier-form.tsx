import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface SimplifiedSupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export default function SimplifiedSupplierForm({
  open,
  onOpenChange,
  initialData,
}: SimplifiedSupplierFormProps) {
  const [activeTab, setActiveTab] = useState("supplierDetails");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Create a default form state
  const getDefaultFormState = () => ({
    // Supplier Details - All required fields are pre-filled with defaults
    name: initialData?.name || "",
    partnerType: initialData?.partnerType || "supplier",
    partnerRole: initialData?.partnerRole || "supplier",
    partnerRoleName: initialData?.partnerRoleName || "SUPPLIER",
    status: initialData?.status || "pending",
    products: initialData?.products || "Default Products",
    country: initialData?.country || "india",
    
    // Optional fields
    domain: initialData?.domain || "",
    registrationType: initialData?.registrationType || "",
    category: initialData?.category || "",
    
    // Address Details
    addressType: initialData?.addressType || "",
    addressLine1: initialData?.addressLine1 || "",
    street: initialData?.street || "",
    state: initialData?.state || "",
    city: initialData?.city || "",
    pinCode: initialData?.pinCode || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    
    // Primary Contact
    contactTitle: initialData?.contactTitle || "",
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    designation: initialData?.designation || "",
    mobileNumber: initialData?.mobileNumber || "",
  });
  
  const [formData, setFormData] = useState(getDefaultFormState());
  
  // Reset the form when the dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form data when closing
      setFormData(getDefaultFormState());
      setActiveTab("supplierDetails");
    }
    onOpenChange(open);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const method = initialData ? "PATCH" : "POST";
      const endpoint = initialData
        ? `/api/suppliers/${initialData.id}`
        : "/api/suppliers";

      // Prepare submission data - ONLY include required/valid fields
      const submissionData = {
        name: formData.name || "New Supplier",
        partnerType: formData.partnerType,
        partnerRole: formData.partnerRole,
        partnerRoleName: formData.partnerRoleName,
        country: formData.country,
        status: formData.status,
        products: formData.products,
        
        // Only include these optional fields if they have values
        ...(formData.addressType ? { addressType: formData.addressType } : {}),
        ...(formData.addressLine1 ? { addressLine1: formData.addressLine1 } : {}),
        ...(formData.street ? { street: formData.street } : {}),
        ...(formData.state ? { state: formData.state } : {}),
        ...(formData.city ? { city: formData.city } : {}),
        ...(formData.pinCode ? { pinCode: formData.pinCode } : {}),
        ...(formData.latitude ? { latitude: formData.latitude } : {}),
        ...(formData.longitude ? { longitude: formData.longitude } : {}),
        
        ...(formData.contactTitle ? { contactTitle: formData.contactTitle } : {}),
        ...(formData.firstName ? { firstName: formData.firstName } : {}),
        ...(formData.lastName ? { lastName: formData.lastName } : {}),
        ...(formData.designation ? { designation: formData.designation } : {}),
        ...(formData.mobileNumber ? { mobileNumber: formData.mobileNumber } : {}),
        
        ...(formData.domain ? { domain: formData.domain } : {}),
        ...(formData.registrationType ? { registrationType: formData.registrationType } : {}),
        ...(formData.category ? { category: formData.category } : {})
      };

      console.log("Submitting supplier data:", submissionData);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Ignore if we can't parse the JSON
        }
        
        console.error("Server response:", response.status, errorData);
        throw new Error(`Failed to save supplier data: ${errorData?.message || response.statusText}`);
      }

      const savedSupplier = await response.json();
      console.log("Supplier saved successfully:", savedSupplier);

      // Show success message
      toast({
        title: initialData ? "Supplier Updated" : "Supplier Added",
        description: `${submissionData.name} has been ${initialData ? "updated" : "added"} successfully.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      
      // Reset form data
      setFormData(getDefaultFormState());
      
      // Close form
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving supplier:", error);
      
      // Show error message
      toast({
        title: "Error",
        description: "Failed to save supplier. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the supplier information."
              : "Fill in the supplier details in the form below."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs
            defaultValue="supplierDetails"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="supplierDetails">Supplier Details</TabsTrigger>
              <TabsTrigger value="addressDetails">Address Details</TabsTrigger>
              <TabsTrigger value="contactDetails">Primary Contact</TabsTrigger>
            </TabsList>

            {/* Supplier Details Tab */}
            <TabsContent value="supplierDetails" className="space-y-4">
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="name">SUPPLIER'S NAME *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="E.g., SUNDARAM INDUSTRIES PRIVATE LIMITED"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="partnerType">Supplier Type *</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("partnerType", value)} 
                    value={formData.partnerType}
                  >
                    <SelectTrigger id="partnerType">
                      <SelectValue placeholder="Select supplier type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="retailer">Retailer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="domain">DOMAIN</Label>
                  <Input
                    id="domain"
                    name="domain"
                    placeholder="E.g., Manufacturing"
                    value={formData.domain}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="partnerRole">SUPPLIER'S ROLE *</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("partnerRole", value)} 
                    value={formData.partnerRole}
                  >
                    <SelectTrigger id="partnerRole">
                      <SelectValue placeholder="Select supplier role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="service_provider">Service Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="partnerRoleName">SUPPLIER'S ROLE NAME OF YOUR CHOICE *</Label>
                  <Input
                    id="partnerRoleName"
                    name="partnerRoleName"
                    placeholder="E.g., SUPPLIER"
                    value={formData.partnerRoleName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="registrationType">REGISTRATION TYPE</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("registrationType", value)} 
                    value={formData.registrationType}
                  >
                    <SelectTrigger id="registrationType">
                      <SelectValue placeholder="Select registration type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="llp">LLP</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="proprietorship">Proprietorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("category", value)} 
                    value={formData.category}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="trader">Trader</SelectItem>
                      <SelectItem value="service_provider">Service Provider</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("addressDetails")}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Address Details Tab */}
            <TabsContent value="addressDetails" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address Details</h3>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="addressType">ADDRESS Type</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("addressType", value)} 
                    value={formData.addressType}
                  >
                    <SelectTrigger id="addressType">
                      <SelectValue placeholder="Select address type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered">Registered Office</SelectItem>
                      <SelectItem value="corporate">Corporate Office</SelectItem>
                      <SelectItem value="factory">Factory</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="addressLine1">ADDRESS LINE 1</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    placeholder="E.g., NO: A1 F3 A"
                    value={formData.addressLine1}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    name="street"
                    placeholder="E.g., SIDCO INDUSTRIAL ESTATE"
                    value={formData.street}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="country">COUNTRY *</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("country", value)} 
                    value={formData.country}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="usa">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="germany">Germany</SelectItem>
                      <SelectItem value="france">France</SelectItem>
                      <SelectItem value="china">China</SelectItem>
                      <SelectItem value="japan">Japan</SelectItem>
                      <SelectItem value="brazil">Brazil</SelectItem>
                      <SelectItem value="australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="state">STATE</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="E.g., Tamil Nadu"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="E.g., MARAIMALAINAGAR"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="pinCode">PIN CODE</Label>
                  <Input
                    id="pinCode"
                    name="pinCode"
                    placeholder="E.g., 603209"
                    value={formData.pinCode}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      placeholder="E.g., 12.7914736660428"
                      value={formData.latitude}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      placeholder="E.g., 80.0253294752703"
                      value={formData.longitude}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("supplierDetails")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("contactDetails")}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Primary Contact Tab */}
            <TabsContent value="contactDetails" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Primary Contact</h3>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="contactTitle">TITLE</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("contactTitle", value)} 
                    value={formData.contactTitle}
                  >
                    <SelectTrigger id="contactTitle">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mr">Mr.</SelectItem>
                      <SelectItem value="mrs">Mrs.</SelectItem>
                      <SelectItem value="ms">Ms.</SelectItem>
                      <SelectItem value="dr">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="E.g., John"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="E.g., Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    placeholder="E.g., Procurement Manager"
                    value={formData.designation}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    placeholder="E.g., +1 234 567 8900"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("addressDetails")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Supplier"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {activeTab !== "contactDetails" && (
            <DialogFooter>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="ml-auto"
              >
                {isSubmitting ? "Saving..." : "Save Supplier"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}