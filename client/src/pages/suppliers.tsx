import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

import { Head } from "@/components/head";
import SimpleSupplierDialog from "@/components/suppliers/simple-supplier-dialog";
import BulkUploadDialog from "@/components/suppliers/bulk-upload-dialog";
import InviteSupplierDialog from "@/components/suppliers/invite-supplier-dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Building,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
  ClockIcon,
} from "lucide-react";

export default function Suppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showInviteSupplier, setShowInviteSupplier] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  
  // Mutation for bulk uploading suppliers
  const bulkUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/suppliers/bulk", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload suppliers");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/stats"] });
      toast({
        title: "Suppliers imported",
        description: "Suppliers were successfully imported from file.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "There was an error importing suppliers.",
      });
    },
  });
  
  // Mutation for inviting suppliers
  const inviteSupplierMutation = useMutation({
    mutationFn: async (data: { emails: string[], message?: string }) => {
      const response = await fetch("/api/suppliers/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to send invitations");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitations sent",
        description: "Invitations were successfully sent to the suppliers.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to send invitations",
        description: error.message || "There was an error sending invitations.",
      });
    },
  });
  
  const { data: suppliers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    staleTime: 60 * 1000,
  });
  
  const { data: stats = { total: 0, active: 0, inactive: 0 } } = useQuery<{
    total: number;
    active: number;
    inactive: number;
  }>({
    queryKey: ["/api/suppliers/stats"],
    staleTime: 60 * 1000,
  });
  
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];
    
    // Apply status filter
    if (filter !== "all") {
      result = result.filter((supplier) => supplier.status === filter);
    }
    
    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (supplier) =>
          (supplier.name && supplier.name.toLowerCase().includes(query)) ||
          (supplier.partnerRoleName && supplier.partnerRoleName.toLowerCase().includes(query)) ||
          (supplier.email && supplier.email.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [suppliers, filter, searchQuery]);
  
  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setOpenCreateForm(true);
  };
  
  const handleCloseForm = () => {
    setOpenCreateForm(false);
    setSelectedSupplier(null);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <>
      <Head title="Suppliers | EUDR Compliance" />
      
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">
              Manage your suppliers and partners
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setOpenCreateForm(true)}>
                <Building className="mr-2 h-4 w-4" />
                <span>Add Manually</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBulkUpload(true)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Bulk Upload</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowInviteSupplier(true)}>
                <Mail className="mr-2 h-4 w-4" />
                <span>Invite Supplier</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || suppliers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active || suppliers.filter(s => s.status === 'active').length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inactive || suppliers.filter(s => s.status === 'pending').length}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-md shadow mb-6">
          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Supplier</TableHead>
                  <TableHead className="whitespace-nowrap">Contact</TableHead>
                  <TableHead className="whitespace-nowrap">Location</TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Added</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex justify-center items-center">
                        <ClockIcon className="h-6 w-6 mr-2 animate-spin" />
                        Loading suppliers...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <Building className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {supplier.name || "Unnamed Supplier"}
                            </div>
                            {supplier.partnerRoleName && (
                              <div className="text-xs text-muted-foreground">
                                {supplier.partnerRoleName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {supplier.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{supplier.email}</span>
                            </div>
                          )}
                          {supplier.mobileNumber && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{supplier.mobileNumber}</span>
                            </div>
                          )}
                          {supplier.website && (
                            <div className="flex items-center text-sm">
                              <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{supplier.website}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {supplier.city && supplier.country
                              ? `${supplier.city}, ${supplier.country}`
                              : supplier.country || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(supplier.status || "pending")}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {supplier.createdAt
                            ? formatDistanceToNow(new Date(supplier.createdAt), {
                                addSuffix: true,
                              })
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/suppliers/${supplier.id}`} className="w-full">
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/suppliers/${supplier.id}/declarations`} className="w-full">
                                Declarations
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/suppliers/${supplier.id}/documents`} className="w-full">
                                Documents
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <SimpleSupplierDialog 
        open={openCreateForm} 
        onOpenChange={handleCloseForm} 
        initialData={selectedSupplier}
      />
      
      <BulkUploadDialog
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        uploadMutation={bulkUploadMutation}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
          queryClient.invalidateQueries({ queryKey: ["/api/suppliers/stats"] });
        }}
      />
      
      <InviteSupplierDialog
        open={showInviteSupplier}
        onOpenChange={setShowInviteSupplier}
        inviteMutation={inviteSupplierMutation}
      />
    </>
  );
}