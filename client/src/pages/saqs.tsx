import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from '@/lib/utils';
import { Loader2, FileText, CheckCircle2, AlertCircle, Clock, Building } from 'lucide-react';

// Type definitions
interface Saq {
  id: number;
  title: string;
  description: string;
  supplierId: number;
  customerId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  score: number | null;
  answers: any | null;
}

// Helper function to get status badge
function getStatusBadge(status: string) {
  switch(status) {
    case 'completed':
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
    case 'in-progress':
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function SaqDetailView({ saq, onClose }: { saq: Saq, onClose: () => void }) {
  if (!saq.answers) {
    return (
      <div className="p-4 text-center">
        <p>No response data available for this questionnaire.</p>
      </div>
    );
  }

  const answers = typeof saq.answers === 'string' ? JSON.parse(saq.answers) : saq.answers;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{saq.title}</h3>
          <p className="text-muted-foreground">{saq.description}</p>
        </div>
        <div className="text-right">
          {saq.score !== null && (
            <div className="text-2xl font-bold">
              {saq.score}%
            </div>
          )}
          {getStatusBadge(saq.status)}
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-semibold border-b pb-2">Questionnaire Responses</h4>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(answers).map(([key, value]: [string, any]) => (
            <div key={key} className="border rounded-md p-3">
              <div className="flex justify-between">
                <div className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                <div className={typeof value === 'boolean' ? (value ? 'text-green-500' : 'text-red-500') : ''}>
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t flex justify-between">
        <div className="text-sm text-muted-foreground">
          {saq.completedAt ? (
            <span>Completed on {formatDate(new Date(saq.completedAt))}</span>
          ) : (
            <span>Created on {formatDate(new Date(saq.createdAt))}</span>
          )}
        </div>
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export default function SAQPage() {
  const { user } = useAuth();
  const [selectedSAQ, setSelectedSAQ] = useState<Saq | null>(null);
  
  // Use the supplierId from the user object for the supplier persona
  // For demo purposes, we'll use a default supplierId of 1
  const supplierId = user?.role === 'supplier' ? 1 : 0;
  
  // Fetch SAQs for the supplier
  const { data: saqs, isLoading, error } = useQuery({ 
    queryKey: ['/api/supplier', supplierId, 'saqs'],
    queryFn: () => fetch(`/api/supplier/${supplierId}/saqs`).then(res => res.json()),
    enabled: supplierId > 0
  });
  
  // Fetch SAQ statistics
  const { data: saqStats } = useQuery({ 
    queryKey: ['/api/supplier', supplierId, 'saqs', 'stats'],
    queryFn: () => fetch(`/api/supplier/${supplierId}/saqs/stats`).then(res => res.json()),
    enabled: supplierId > 0
  });
  
  // Handle view SAQ details
  const handleViewSAQ = (saq: Saq) => {
    setSelectedSAQ(saq);
  };
  
  // Handle close detail view
  const handleCloseDetailView = () => {
    setSelectedSAQ(null);
  };
  
  // Set document title
  React.useEffect(() => {
    document.title = "Supplier Assessment | EUDR Comply";
  }, []);
  
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Supplier Assessment Questionnaires</h1>
        </div>
        
        {/* SAQ overview cards */}
        {saqStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{saqStats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{saqStats.completed}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">{saqStats.inProgress}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">{saqStats.pending}</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* SAQ tabs and listing */}
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="received" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500">Error loading questionnaires</div>
                ) : saqs && saqs.filter((saq: Saq) => saq.status === 'pending' || saq.status === 'in-progress').length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Received Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saqs
                        .filter((saq: Saq) => saq.status === 'pending' || saq.status === 'in-progress')
                        .map((saq: Saq) => (
                          <TableRow key={saq.id}>
                            <TableCell>
                              <div className="font-medium">{saq.title}</div>
                              <div className="text-sm text-muted-foreground">{saq.description}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                {saq.customerId === 1 ? "Eco Foods Inc." : 
                                 saq.customerId === 2 ? "Green Planet Ltd." : 
                                 saq.customerId === 3 ? "Sustainable Harvest" : 
                                 `Customer #${saq.customerId}`}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(new Date(saq.createdAt))}</TableCell>
                            <TableCell>{getStatusBadge(saq.status)}</TableCell>
                            <TableCell>
                              <Button 
                                variant={saq.status === 'pending' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => saq.status === 'in-progress' ? handleViewSAQ(saq) : null}
                              >
                                {saq.status === 'pending' ? 'Start' : <><FileText className="mr-2 h-4 w-4" />View</>}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    No received questionnaires found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500">Error loading questionnaires</div>
                ) : saqs && saqs.filter((saq: Saq) => saq.status === 'completed').length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Completed Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saqs
                        .filter((saq: Saq) => saq.status === 'completed')
                        .map((saq: Saq) => (
                          <TableRow key={saq.id}>
                            <TableCell>
                              <div className="font-medium">{saq.title}</div>
                              <div className="text-sm text-muted-foreground">{saq.description}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                {saq.customerId === 1 ? "Eco Foods Inc." : 
                                 saq.customerId === 2 ? "Green Planet Ltd." : 
                                 saq.customerId === 3 ? "Sustainable Harvest" : 
                                 `Customer #${saq.customerId}`}
                              </div>
                            </TableCell>
                            <TableCell>{saq.completedAt ? formatDate(new Date(saq.completedAt)) : '-'}</TableCell>
                            <TableCell>{getStatusBadge(saq.status)}</TableCell>
                            <TableCell>
                              <div className={`text-lg font-bold ${
                                saq.score !== null ? 
                                  (saq.score >= 80 ? 'text-green-500' : 
                                   saq.score >= 50 ? 'text-amber-500' : 'text-red-500') 
                                : ''
                              }`}>
                                {saq.score !== null ? `${saq.score}%` : '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewSAQ(saq)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    No completed questionnaires found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          

        </Tabs>
      </div>
      
      {/* SAQ Detail Modal */}
      <Dialog open={!!selectedSAQ} onOpenChange={(open) => !open && handleCloseDetailView()}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Questionnaire Details</DialogTitle>
            <DialogDescription>
              View your responses and assessment details
            </DialogDescription>
          </DialogHeader>
          
          {selectedSAQ && <SaqDetailView saq={selectedSAQ} onClose={handleCloseDetailView} />}
        </DialogContent>
      </Dialog>
    </>
  );
}