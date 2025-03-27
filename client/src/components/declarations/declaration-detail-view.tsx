import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ExternalLink, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Declaration {
  id: number;
  type: "inbound" | "outbound";
  supplierId: number;
  productName: string;
  productDescription: string | null;
  hsnCode: string | null;
  quantity: number | null;
  unit: string | null;
  status: string;
  riskLevel: string;
  geojsonData: any | null;
  startDate: string | null;
  endDate: string | null;
  createdBy: number;
  createdAt: string;
  lastUpdated: string;
  industry: string | null;
  customerPONumber?: string | null;
  soNumber?: string | null;
  shipmentNumber?: string | null;
  customerId?: number | null;
  documents?: string[];
  hasGeoJSON?: boolean;
}

interface Supplier {
  id: number;
  name: string;
  products?: string;
  country?: string;
  registrationNumber?: string;
  contactPerson?: string;
  status?: string;
  complianceScore?: number;
}

interface Customer {
  id: number;
  name: string;
  type: string;
}

interface DeclarationDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declarationId: number | null;
}

export default function DeclarationDetailView({ open, onOpenChange, declarationId }: DeclarationDetailViewProps) {
  const { toast } = useToast();

  // Fetch declaration details
  const { data: declaration, isLoading: isLoadingDeclaration } = useQuery<Declaration>({
    queryKey: ['/api/declarations', declarationId],
    enabled: !!declarationId && open,
  });

  // Fetch supplier details
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery<Supplier>({
    queryKey: ['/api/suppliers', declaration?.supplierId],
    enabled: !!declaration?.supplierId && open,
  });

  // Fetch customer details if it's an outbound declaration
  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: ['/api/customers', declaration?.customerId],
    enabled: !!declaration?.customerId && open && declaration?.type === 'outbound',
  });

  const handleFileDDS = () => {
    toast({
      title: "DDS Filing Initiated",
      description: "Your Due Diligence Statement is being prepared for submission to EU Traces",
      variant: "default",
    });
  };

  // Return early if dialog is not open
  if (!open) {
    return null;
  }
  
  // Show loading dialog while data is fetching
  if (!declaration || isLoadingDeclaration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="py-8 text-center">
            <div className="animate-pulse h-6 w-1/3 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="animate-pulse h-32 w-full bg-gray-100 rounded mb-4"></div>
            <div className="animate-pulse h-20 w-full bg-gray-100 rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{declaration.type === "outbound" ? "Outbound" : "Inbound"} Declaration Details</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {(
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {declaration.productName}
                    {declaration.hsnCode && <span className="ml-2 text-sm text-gray-500">HSN: {declaration.hsnCode}</span>}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {declaration.productDescription || "No description provided"}
                  </p>
                </div>
                <Badge className={
                  declaration.status === "approved" ? "bg-green-500" :
                  declaration.status === "pending" ? "bg-yellow-500" :
                  declaration.status === "rejected" ? "bg-red-500" :
                  "bg-blue-500"
                }>
                  {declaration.status ? 
                    `${declaration.status.charAt(0).toUpperCase()}${declaration.status.slice(1)}` : 
                    "Unknown"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Declaration ID</h3>
                  <p className="mt-1">{declaration.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Risk Level</h3>
                  <div className="mt-1 flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-2 ${
                      declaration.riskLevel === "low" ? "bg-green-500" :
                      declaration.riskLevel === "medium" ? "bg-yellow-500" :
                      "bg-red-500"
                    }`}></span>
                    <span>
                      {declaration.riskLevel ? 
                        `${declaration.riskLevel.charAt(0).toUpperCase()}${declaration.riskLevel.slice(1)} Risk` : 
                        "Unknown Risk"}
                    </span>
                  </div>
                </div>
                
                {declaration.type === "outbound" && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">GeoJSON Compliance Status</h3>
                      <div className="mt-1 flex items-center">
                        {declaration.hasGeoJSON ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-green-600">Compliant</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-red-600">Non-Compliant</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                      <p className="mt-1">{isLoadingCustomer ? "Loading..." : customer?.name || "Not specified"}</p>
                    </div>
                  </>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                  <p className="mt-1">{isLoadingSupplier ? "Loading..." : supplier?.name || `Supplier ${declaration.supplierId}`}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                  <p className="mt-1">{declaration.industry || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                  <p className="mt-1">
                    {declaration.quantity ? 
                      `${declaration.quantity} ${declaration.unit || ''}` : 
                      "Not specified"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Validity Period</h3>
                  <p className="mt-1">
                    {declaration.startDate && declaration.endDate ? 
                      `${format(new Date(declaration.startDate), "PP")} to ${format(new Date(declaration.endDate), "PP")}` : 
                      "Not specified"}
                  </p>
                </div>
                
                {declaration.type === "outbound" && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">PO Number</h3>
                      <p className="mt-1">{declaration.customerPONumber || "Not specified"}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">SO Number</h3>
                      <p className="mt-1">{declaration.soNumber || "Not specified"}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Shipment Number</h3>
                      <p className="mt-1">{declaration.shipmentNumber || "Not specified"}</p>
                    </div>
                  </>
                )}
              </div>
              
              {declaration.documents && declaration.documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Associated Documents</h3>
                    <div className="space-y-2">
                      {declaration.documents.map((doc, index) => (
                        <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="flex-1 text-sm">{doc}</span>
                          <Button variant="ghost" size="sm" className="text-primary">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="space-x-2">
          {declaration.type === "outbound" && (
            <Button 
              type="button" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleFileDDS}
            >
              <FileText className="h-4 w-4 mr-2" />
              File DDS in EU Traces
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}