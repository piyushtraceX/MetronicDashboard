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
import { Loader2 } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    country: initialData?.country || "",
    email: initialData?.email || "",
    partnerRole: "supplier",
    partnerRoleName: "SUPPLIER",
    partnerType: "supplier",
    status: "pending"
  });
  
  const queryClient = useQueryClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the supplier information."
              : "Fill in the basic supplier details below."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Supplier Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="E.g., SUNDARAM INDUSTRIES"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              name="country"
              placeholder="E.g., India"
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="E.g., contact@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {initialData ? "Update Supplier" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}