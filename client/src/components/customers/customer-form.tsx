import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = insertCustomerSchema.extend({
  displayName: z.string().min(1, { message: "Display name is required" }),
  type: z.string().min(1, { message: "Type is required" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  workPhone: z
    .string()
    .min(1, { message: "Work phone is required" })
    .optional(),
  mobilePhone: z.string().optional(),
  
  billingAttention: z.string().optional(),
  billingCountry: z.string().min(1, { message: "Country is required" }),
  billingAddressLine1: z.string().min(1, { message: "Address is required" }),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().min(1, { message: "City is required" }),
  billingState: z.string().min(1, { message: "State is required" }),
  billingPostalCode: z.string().min(1, { message: "Postal code is required" }),
  
  sameAsBilling: z.boolean().default(true),
  
  // These are only required if sameAsBilling is false
  shippingAttention: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingAddressLine1: z.string().optional(),
  shippingAddressLine2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  
  gstTreatment: z.string().min(1, { message: "GST treatment is required" }),
  placeOfSupply: z.string().min(1, { message: "Place of supply is required" }),
  taxPreference: z.string().min(1, { message: "Tax preference is required" }),
  currency: z.string().min(1, { message: "Currency is required" }),
  paymentTerms: z.string().min(1, { message: "Payment terms are required" }),
  enablePortal: z.boolean().default(false),
  portalLanguage: z.string().optional(),
  
  registrationNumber: z.string().optional(),
  complianceScore: z.coerce.number().min(0).max(100).optional(),
  riskLevel: z.string().optional(),
  status: z.string().default("active"),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FormValues & { id?: number };
}

export default function CustomerForm({ open, onOpenChange, initialData }: CustomerFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic-info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      type: "business",
      displayName: "",
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      workPhone: "",
      mobilePhone: "",
      
      billingAttention: "",
      billingCountry: "",
      billingAddressLine1: "",
      billingAddressLine2: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      
      sameAsBilling: true,
      
      shippingAttention: "",
      shippingCountry: "",
      shippingAddressLine1: "",
      shippingAddressLine2: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      
      gstTreatment: "registered",
      placeOfSupply: "",
      taxPreference: "taxable",
      currency: "EUR",
      paymentTerms: "net30",
      enablePortal: false,
      portalLanguage: "english",
      
      registrationNumber: "",
      complianceScore: 0,
      riskLevel: "low",
      status: "active",
    },
  });
  
  const isEditMode = !!initialData;
  
  const { mutate, isPending } = {
    mutate: async (data: FormValues) => {
      try {
        setIsSubmitting(true);
        
        // If shipping address is the same as billing, copy values
        if (data.sameAsBilling) {
          data.shippingAttention = data.billingAttention;
          data.shippingCountry = data.billingCountry;
          data.shippingAddressLine1 = data.billingAddressLine1;
          data.shippingAddressLine2 = data.billingAddressLine2;
          data.shippingCity = data.billingCity;
          data.shippingState = data.billingState;
          data.shippingPostalCode = data.billingPostalCode;
        }
        
        if (isEditMode && initialData?.id) {
          await apiRequest(`/api/customers/${initialData.id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
          });
          toast({
            title: "Customer updated",
            description: "Customer information has been updated successfully.",
          });
        } else {
          await apiRequest("/api/customers", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
          });
          toast({
            title: "Customer created",
            description: "New customer has been created successfully.",
          });
        }
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        
        // Close the dialog
        onOpenChange(false);
        
        // Reset form for next use
        if (!isEditMode) {
          form.reset();
        }
      } catch (error) {
        console.error("Error saving customer:", error);
        toast({
          title: "Error",
          description: "An error occurred while saving the customer. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    isPending: isSubmitting,
  };
  
  const onSubmit = (data: FormValues) => {
    mutate(data);
  };
  
  // Watch for sameAsBilling changes to determine if shipping fields are required
  const sameAsBilling = form.watch("sameAsBilling");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update customer information and compliance details." 
              : "Fill in the customer details to add them to your system."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs 
              defaultValue="basic-info" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic-info" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Customer Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="business" />
                              </FormControl>
                              <FormLabel className="font-normal">Business</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="individual" />
                              </FormControl>
                              <FormLabel className="font-normal">Individual</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("type") === "business" && (
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This is how the customer will be displayed in your system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="mobilePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="address" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Billing Address</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="billingAttention"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attention</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="billingCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Germany">Germany</SelectItem>
                                <SelectItem value="France">France</SelectItem>
                                <SelectItem value="Italy">Italy</SelectItem>
                                <SelectItem value="Spain">Spain</SelectItem>
                                <SelectItem value="Netherlands">Netherlands</SelectItem>
                                <SelectItem value="Belgium">Belgium</SelectItem>
                                <SelectItem value="Sweden">Sweden</SelectItem>
                                <SelectItem value="Poland">Poland</SelectItem>
                                <SelectItem value="Austria">Austria</SelectItem>
                                <SelectItem value="Denmark">Denmark</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="billingAddressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="billingAddressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="billingCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="billingState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="billingPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="py-2">
                    <FormField
                      control={form.control}
                      name="sameAsBilling"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Shipping address same as billing
                            </FormLabel>
                            <FormDescription>
                              Use the billing address details for shipping
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {!sameAsBilling && (
                    <div className="space-y-4 mt-4">
                      <Separator />
                      <h3 className="text-lg font-medium">Shipping Address</h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAttention"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Attention</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Germany">Germany</SelectItem>
                                    <SelectItem value="France">France</SelectItem>
                                    <SelectItem value="Italy">Italy</SelectItem>
                                    <SelectItem value="Spain">Spain</SelectItem>
                                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                                    <SelectItem value="Belgium">Belgium</SelectItem>
                                    <SelectItem value="Sweden">Sweden</SelectItem>
                                    <SelectItem value="Poland">Poland</SelectItem>
                                    <SelectItem value="Austria">Austria</SelectItem>
                                    <SelectItem value="Denmark">Denmark</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAddressLine1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAddressLine2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shippingState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shippingPostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gstTreatment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Treatment</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select GST treatment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registered">Registered Business</SelectItem>
                              <SelectItem value="unregistered">Unregistered Business</SelectItem>
                              <SelectItem value="consumer">Consumer</SelectItem>
                              <SelectItem value="overseas">Overseas</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="placeOfSupply"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place of Supply</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Preference</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax preference" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="taxable">Taxable</SelectItem>
                              <SelectItem value="tax-exempt">Tax Exempt</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">Euro (EUR)</SelectItem>
                              <SelectItem value="USD">US Dollar (USD)</SelectItem>
                              <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                              <SelectItem value="CHF">Swiss Franc (CHF)</SelectItem>
                              <SelectItem value="SEK">Swedish Krona (SEK)</SelectItem>
                              <SelectItem value="NOK">Norwegian Krone (NOK)</SelectItem>
                              <SelectItem value="DKK">Danish Krone (DKK)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Due on Receipt</SelectItem>
                              <SelectItem value="net15">Net 15</SelectItem>
                              <SelectItem value="net30">Net 30</SelectItem>
                              <SelectItem value="net45">Net 45</SelectItem>
                              <SelectItem value="net60">Net 60</SelectItem>
                              <SelectItem value="net90">Net 90</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="enablePortal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Enable Customer Portal
                          </FormLabel>
                          <FormDescription>
                            Allow customers to access documents and track status via portal
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("enablePortal") && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="portalLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portal Language</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="german">German</SelectItem>
                                <SelectItem value="french">French</SelectItem>
                                <SelectItem value="italian">Italian</SelectItem>
                                <SelectItem value="spanish">Spanish</SelectItem>
                                <SelectItem value="dutch">Dutch</SelectItem>
                                <SelectItem value="swedish">Swedish</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Business registration or tax identification number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="complianceScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compliance Score (0-100)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between">
              <div className="flex space-x-2">
                {activeTab !== "basic-info" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const tabs = ["basic-info", "address", "financial", "compliance"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1]);
                      }
                    }}
                  >
                    Previous
                  </Button>
                )}
                
                {activeTab !== "compliance" && (
                  <Button
                    type="button"
                    onClick={() => {
                      const tabs = ["basic-info", "address", "financial", "compliance"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : isEditMode ? "Update Customer" : "Create Customer"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}