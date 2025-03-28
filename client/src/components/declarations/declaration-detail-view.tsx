import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock, 
  X,
  AlertTriangle 
} from "lucide-react";
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
  declarationSource?: string;
  comments?: string;
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
  const [comments, setComments] = useState("");

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Review Declaration</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Declaration Type</h3>
                <p className="mt-1 font-medium">{declaration.type === "outbound" ? "Outbound" : "Inbound"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Declaration Source</h3>
                <p className="mt-1">{declaration.declarationSource || "Fresh Declaration"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Validity Period</h3>
                <p className="mt-1">
                  {declaration.startDate && declaration.endDate ? 
                    `${format(new Date(declaration.startDate), "MMM d, yyyy")} to ${format(new Date(declaration.endDate), "MMM d, yyyy")}` : 
                    "Not specified"}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
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
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Items</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {declaration.productName ? (
                  <p>
                    1. {declaration.productName} 
                    {declaration.quantity ? ` (${declaration.quantity} ${declaration.unit || 'units'})` : ''}
                    {declaration.hsnCode ? ` - HSN: ${declaration.hsnCode}` : ''}
                    {declaration.productDescription ? ` - ${declaration.productDescription}` : ''}
                  </p>
                ) : (
                  <p className="text-gray-400">1.</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">GeoJSON</h3>
              <div className="flex items-center">
                {declaration.hasGeoJSON ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Uploaded</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Not Uploaded</span>
                  </>
                )}
              </div>
            </div>
            
            {declaration.type === "outbound" && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Customer</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p>
                    {isLoadingCustomer ? (
                      "Loading customer details..."
                    ) : customer ? (
                      `Customer ${customer.id} - ${customer.name} ${customer.type ? `(${customer.type})` : ""}`
                    ) : (
                      "EU-Based Entity"
                    )}
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Supplier</h3>
              <p>
                {isLoadingSupplier ? 
                  "Loading supplier details..." : 
                  supplier?.name || "Supplier undefined"}
              </p>
            </div>
            
            {declaration.type === "outbound" && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Reference Numbers</h3>
                <div className="space-y-1">
                  <p>PO Number: {declaration.customerPONumber || "PO1234"}</p>
                  <p>SO Number: {declaration.soNumber || "SO#ABCD"}</p>
                  <p>Shipment Number: {declaration.shipmentNumber || "56479"}</p>
                </div>
              </div>
            )}
            
            {(declaration.documents && declaration.documents.length > 0) ? (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Evidence Documents</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {declaration.documents.map((doc, index) => (
                    <li key={index}>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="flex-1 text-sm">{doc}</span>
                        <Button variant="ghost" size="sm" className="text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Evidence Documents</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="flex-1 text-sm">document_1.pdf</span>
                      <Button variant="ghost" size="sm" className="text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                </ul>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Comments</h3>
              <Textarea 
                placeholder="Add any additional comments, notes, or special instructions related to this declaration..."
                className="min-h-[100px]"
                value={declaration.comments || comments}
                onChange={(e) => setComments(e.target.value)}
                readOnly={!!declaration.comments}
              />
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start">
              <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Declaration Submission Notice</p>
                <p>By submitting this declaration, I confirm that all the information provided is accurate and complete to the best of my knowledge. I understand that false information may lead to penalties under the EUDR regulations.</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="space-x-2">
          <Button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleFileDDS}
          >
            <FileText className="h-4 w-4 mr-2" />
            File DDS in EU Traces
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}