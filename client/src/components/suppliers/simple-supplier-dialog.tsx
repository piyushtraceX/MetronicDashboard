import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export default function SimpleSupplierDialog({
  open,
  onOpenChange,
  initialData,
}: SupplierDialogProps) {
  const [activeTab, setActiveTab] = useState("partnerDetails");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Partner Details
    name: initialData?.name || "",
    partnerType: initialData?.partnerType || "",
    domain: initialData?.domain || "",
    website: initialData?.website || "",
    partnerRole: initialData?.partnerRole || "",
    partnerRoleName: initialData?.partnerRoleName || "SUPPLIER",
    registrationType: initialData?.registrationType || "",
    category: initialData?.category || "",
    incorporationDate: initialData?.incorporationDate || null,
    
    // Address Details
    addressType: initialData?.addressType || "",
    addressLine1: initialData?.addressLine1 || "",
    street: initialData?.street || "",
    country: initialData?.country || "",
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
    email: initialData?.email || "",
    secondaryEmail: initialData?.secondaryEmail || "",
    mobileNumber: initialData?.mobileNumber || "",
    
    // Status
    status: initialData?.status || "pending"
  });
  
  const queryClient = useQueryClient();

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

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, you would handle file upload to a server/storage
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name);
      // Here you would upload the file and update formData with the resulting URL
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const method = initialData ? "PATCH" : "POST";
      const endpoint = initialData
        ? `/api/suppliers/${initialData.id}`
        : "/api/suppliers";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save supplier data");
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      
      // Close form
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving supplier:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            defaultValue="partnerDetails"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="partnerDetails">Partner Details</TabsTrigger>
              <TabsTrigger value="addressDetails">Address Details</TabsTrigger>
              <TabsTrigger value="contactDetails">Primary Contact</TabsTrigger>
            </TabsList>

            {/* Partner Details Tab */}
            <TabsContent value="partnerDetails" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>COMPANY LOGO</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="partnerType">Partner Type *</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("partnerType", value)} 
                    value={formData.partnerType}
                  >
                    <SelectTrigger id="partnerType">
                      <SelectValue placeholder="Select partner type" />
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
                  <Label htmlFor="name">PARTNER'S NAME *</Label>
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
                  <Label htmlFor="website">WEBSITE URL</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="E.g., https://company.com"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="partnerRole">PARTNER'S ROLE *</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("partnerRole", value)} 
                    value={formData.partnerRole}
                  >
                    <SelectTrigger id="partnerRole">
                      <SelectValue placeholder="Select partner role" />
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
                  <Label htmlFor="partnerRoleName">PARTNER'S ROLE NAME OF YOUR CHOICE *</Label>
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

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="incorporationDate">DATE OF INCORPORATION</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.incorporationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.incorporationDate ? (
                          format(formData.incorporationDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.incorporationDate}
                        onSelect={(date) => handleDateChange("incorporationDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                <h3 className="text-lg font-medium">Address Details (LP/1)</h3>

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

                <div>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => console.log("Add Secondary Address")}
                  >
                    Add Secondary Address
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("partnerDetails")}
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
                  <Label htmlFor="firstName">FIRST NAME</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="E.g., Uday"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="lastName">LAST NAME</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="E.g., Singh"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="designation">DESIGNATION</Label>
                  <Input
                    id="designation"
                    name="designation"
                    placeholder="E.g., Manager"
                    value={formData.designation}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="email">EMAIL ID</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="E.g., contact@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="secondaryEmail">SECONDARY EMAIL IDS</Label>
                  <Input
                    id="secondaryEmail"
                    name="secondaryEmail"
                    type="email"
                    placeholder="E.g., secondary@example.com"
                    value={formData.secondaryEmail}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="mobileNumber">MOBILE NUMBER</Label>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    placeholder="E.g., +91 9123456789"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("addressDetails")}
                  >
                    Previous
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {initialData ? "Update Supplier" : "Add Supplier"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}