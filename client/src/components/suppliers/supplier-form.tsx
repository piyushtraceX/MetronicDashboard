import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the form validation schema
const formSchema = z.object({
  // Partner Details
  logo: z.any().optional(),
  partnerType: z.string().min(1, { message: "Partner type is required" }),
  name: z.string().min(1, { message: "Partner name is required" }),
  domain: z.string().optional(),
  website: z.string().optional(), // Don't validate URL format to avoid form errors
  partnerRole: z.string().min(1, { message: "Partner role is required" }),
  partnerRoleName: z.string().min(1, { message: "Partner role name is required" }),
  registrationType: z.string().optional(),
  category: z.string().optional(),
  incorporationDate: z.date().optional(),
  
  // Address Details
  addressType: z.string().optional(),
  addressLine1: z.string().optional(),
  street: z.string().optional(),
  country: z.string().min(1, { message: "Country is required" }),
  state: z.string().optional(),
  city: z.string().optional(),
  pinCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  
  // Primary Contact
  contactTitle: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  designation: z.string().optional(),
  email: z.string().optional(), // Don't validate email format to avoid form errors
  secondaryEmail: z.string().optional(),
  mobileNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export default function SupplierForm({
  open,
  onOpenChange,
  initialData,
}: SupplierFormProps) {
  const [activeTab, setActiveTab] = useState("partnerDetails");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Initialize form with default values or existing data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      partnerType: "",
      name: "",
      domain: "",
      website: "",
      partnerRole: "",
      partnerRoleName: "SUPPLIER",
      registrationType: "",
      category: "",
      addressType: "",
      addressLine1: "",
      street: "",
      country: "",
      state: "",
      city: "",
      pinCode: "",
      latitude: "",
      longitude: "",
      contactTitle: "",
      firstName: "",
      lastName: "",
      designation: "",
      email: "",
      secondaryEmail: "",
      mobileNumber: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Determine if creating new or updating existing
      const method = initialData ? "PATCH" : "POST";
      const endpoint = initialData
        ? `/api/suppliers/${initialData.id}`
        : "/api/suppliers";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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

  // Function to handle file upload for logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, you would handle file upload to a server/storage
    // For this prototype, we're just logging the file
    const file = e.target.files?.[0];
    if (file) {
      console.log("Logo file selected:", file.name);
      // You would typically upload the file to a server here
      // and then update the form with the resulting URL
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
              ? "Update the supplier information in the form below."
              : "Fill in the supplier details in the form below."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormLabel>COMPANY LOGO</FormLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mt-1"
                    />
                    <FormDescription>
                      Upload your company logo
                    </FormDescription>
                  </div>

                  <FormField
                    control={form.control}
                    name="partnerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partner Type *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select partner type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                            <SelectItem value="retailer">Retailer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PARTNER'S NAME *</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., SUNDARAM INDUSTRIES PRIVATE LIMITED" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DOMAIN</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Manufacturing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WEBSITE URL</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., https://company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="partnerRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PARTNER'S ROLE *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select partner role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="service_provider">Service Provider</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="partnerRoleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PARTNER'S ROLE NAME OF YOUR CHOICE *</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., SUPPLIER" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>REGISTRATION TYPE</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select registration type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="llp">LLP</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="proprietorship">Proprietorship</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="trader">Trader</SelectItem>
                            <SelectItem value="service_provider">Service Provider</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incorporationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>DATE OF INCORPORATION</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                  
                  <FormField
                    control={form.control}
                    name="addressType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ADDRESS Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select address type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="registered">Registered Office</SelectItem>
                            <SelectItem value="corporate">Corporate Office</SelectItem>
                            <SelectItem value="branch">Branch Office</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing Unit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ADDRESS LINE 1</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., NO: A1 F3 A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., SIDCO INDUSTRIAL ESTATE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COUNTRY *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="india">India</SelectItem>
                            <SelectItem value="usa">USA</SelectItem>
                            <SelectItem value="uk">UK</SelectItem>
                            <SelectItem value="canada">Canada</SelectItem>
                            <SelectItem value="australia">Australia</SelectItem>
                            <SelectItem value="germany">Germany</SelectItem>
                            <SelectItem value="france">France</SelectItem>
                            <SelectItem value="japan">Japan</SelectItem>
                            <SelectItem value="china">China</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>STATE</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Tamil Nadu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., MARAIMALAINAGAR" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pinCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN CODE</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., 603209" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GEO COORDINATES (Latitude)</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., 12.7914736660428" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., 80.0253294752703" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full mt-2"
                  >
                    Add Secondary Address
                  </Button>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("partnerDetails")}
                    >
                      Back
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
                  
                  <FormField
                    control={form.control}
                    name="contactTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TITLE</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mr">Mr.</SelectItem>
                            <SelectItem value="mrs">Mrs.</SelectItem>
                            <SelectItem value="ms">Ms.</SelectItem>
                            <SelectItem value="dr">Dr.</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FIRST NAME</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Uday" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LAST NAME</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Kumar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DESIGNATION</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EMAIL ID</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="E.g., contact@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondaryEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SECONDARY EMAIL IDS</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., secondary@example.com, another@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MOBILE NUMBER</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Enter mobile number" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="+91">+91 India</SelectItem>
                            <SelectItem value="+1">+1 USA/Canada</SelectItem>
                            <SelectItem value="+44">+44 UK</SelectItem>
                            <SelectItem value="+61">+61 Australia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("addressDetails")}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}