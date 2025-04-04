import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from '@/lib/utils';
import { Loader2, FileText, CheckCircle2, AlertCircle, Clock, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  dueDate: string | null;
  score: number | null;
  answers: any | null;
}

// Type for questionnaire questions
interface QuestionnaireQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox';
  options?: string[];
  required: boolean;
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

// Mock questionnaire template with various question types
const supplierAssessmentQuestions: QuestionnaireQuestion[] = [
  {
    id: 'eudrCompliance',
    text: 'Are you aware of the EU Deforestation Regulation (EUDR) and its requirements for your products?',
    type: 'select',
    options: ['Yes', 'No', 'Partially'],
    required: true
  },
  {
    id: 'dueProcess',
    text: 'Do you have a documented due diligence process in place for EUDR compliance?',
    type: 'select',
    options: ['Yes, fully implemented', 'Yes, partially implemented', 'In development', 'No'],
    required: true
  },
  {
    id: 'geolocation',
    text: 'Do you collect and maintain geolocation coordinates for your production areas?',
    type: 'select',
    options: ['Yes, for all production areas', 'Yes, for most production areas', 'Yes, for some production areas', 'No'],
    required: true
  },
  {
    id: 'deforestationRisk',
    text: 'Have you conducted a deforestation risk assessment for your supply chain?',
    type: 'select',
    options: ['Yes, comprehensive assessment', 'Yes, partial assessment', 'No, but planned', 'No'],
    required: true
  },
  {
    id: 'supplierMonitoring',
    text: 'How do you monitor your suppliers for EUDR compliance?',
    type: 'multiselect',
    options: ['Regular audits', 'Self-assessment questionnaires', 'Third-party verification', 'Satellite monitoring', 'Field visits', 'We don\'t currently monitor suppliers'],
    required: true
  },
  {
    id: 'certifications',
    text: 'Which of the following certifications do your products have?',
    type: 'multiselect',
    options: ['FSC', 'PEFC', 'Rainforest Alliance', 'RSPO', 'Organic', 'Other', 'None'],
    required: true
  },
  {
    id: 'complianceTimeline',
    text: 'What is your timeline for achieving full EUDR compliance?',
    type: 'select',
    options: ['Already compliant', 'Within 6 months', 'Within 1 year', 'Within 2 years', 'Not determined'],
    required: true
  },
  {
    id: 'challengesDetails',
    text: 'What are your main challenges in achieving EUDR compliance?',
    type: 'text',
    required: false
  },
  {
    id: 'consentToShare',
    text: 'Do you consent to sharing this information with relevant customers and authorities when required?',
    type: 'checkbox',
    required: true
  }
];

// Form component for supplier assessment
function SupplierAssessmentForm({ saq, onClose }: { saq: Saq, onClose: () => void }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get questions for current step (we'll show 3 questions per step)
  const questionsPerStep = 3;
  const totalSteps = Math.ceil(supplierAssessmentQuestions.length / questionsPerStep);
  const currentQuestions = supplierAssessmentQuestions.slice(
    currentStep * questionsPerStep, 
    (currentStep + 1) * questionsPerStep
  );
  
  // Handle input changes
  const handleInputChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Move to next step
  const handleNextStep = () => {
    // Validate required fields for current step
    const missingRequired = currentQuestions
      .filter(q => q.required)
      .some(q => !answers[q.id]);
      
    if (missingRequired) {
      toast({
        title: "Required Fields Missing",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Move to previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Submit the form
  const handleSubmit = async () => {
    // Check if all required questions are answered
    const missingRequired = supplierAssessmentQuestions
      .filter(q => q.required)
      .some(q => !answers[q.id]);
      
    if (missingRequired) {
      toast({
        title: "Required Fields Missing",
        description: "Please complete all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit the answers to the server
      const response = await fetch(`/api/supplier/${saq.supplierId}/saqs/${saq.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'in-progress',
          answers: answers
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }
      
      toast({
        title: "Assessment Started",
        description: "Your progress has been saved. You can continue later.",
      });
      
      onClose();
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your assessment.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render a question based on its type
  const renderQuestion = (question: QuestionnaireQuestion) => {
    switch (question.type) {
      case 'text':
        return (
          <div className="space-y-2" key={question.id}>
            <Label htmlFor={question.id} className="flex items-center">
              {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea 
              id={question.id}
              value={answers[question.id] || ''}
              onChange={e => handleInputChange(question.id, e.target.value)}
              placeholder="Enter your answer"
              className="w-full"
            />
          </div>
        );
        
      case 'select':
        return (
          <div className="space-y-2" key={question.id}>
            <Label htmlFor={question.id} className="flex items-center">
              {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
              id={question.id}
              value={answers[question.id] || ''}
              onChange={e => handleInputChange(question.id, e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select an option</option>
              {question.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
        
      case 'multiselect':
        return (
          <div className="space-y-2" key={question.id}>
            <Label className="flex items-center">
              {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {question.options?.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${question.id}-${option}`}
                    checked={Array.isArray(answers[question.id]) && answers[question.id]?.includes(option)}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(answers[question.id]) ? [...answers[question.id]] : [];
                      if (checked) {
                        handleInputChange(question.id, [...currentValues, option]);
                      } else {
                        handleInputChange(question.id, currentValues.filter(v => v !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="space-y-2" key={question.id}>
            <div className="flex items-start space-x-2">
              <Checkbox 
                id={question.id}
                checked={!!answers[question.id]}
                onCheckedChange={checked => handleInputChange(question.id, !!checked)}
              />
              <Label htmlFor={question.id} className="flex items-center">
                {question.text}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex justify-between mb-1 text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round((currentStep + 1) / totalSteps * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Questions for current step */}
      <div className="space-y-6">
        {currentQuestions.map(question => renderQuestion(question))}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handlePrevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        
        {currentStep < totalSteps - 1 ? (
          <Button onClick={handleNextStep}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Start Assessment'
            )}
          </Button>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground mt-4">
        <p>* Indicates required field</p>
      </div>
    </div>
  );
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
  const [assessmentFormOpen, setAssessmentFormOpen] = useState(false);
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState<Saq | null>(null);
  
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
  
  // Start the assessment
  const handleStartAssessment = (saq: Saq) => {
    setCurrentQuestionnaire(saq);
    setAssessmentFormOpen(true);
  };

  // Close the assessment form
  const handleCloseAssessmentForm = () => {
    setAssessmentFormOpen(false);
    setCurrentQuestionnaire(null);
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
                        <TableHead>Due Date</TableHead>
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
                            <TableCell>
                              {saq.dueDate ? (
                                <span className={`${
                                  new Date(saq.dueDate) < new Date() ? 'text-red-500 font-medium' : ''
                                }`}>
                                  {formatDate(new Date(saq.dueDate))}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(saq.status)}</TableCell>
                            <TableCell>
                              <Button 
                                variant={saq.status === 'pending' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => saq.status === 'in-progress' 
                                  ? handleViewSAQ(saq) 
                                  : handleStartAssessment(saq)
                                }
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

      {/* Supplier Assessment Form Modal */}
      <Dialog open={assessmentFormOpen} onOpenChange={(open) => !open && handleCloseAssessmentForm()}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Supplier Assessment</DialogTitle>
            <DialogDescription>
              {currentQuestionnaire?.title}
            </DialogDescription>
          </DialogHeader>
          
          {currentQuestionnaire && <SupplierAssessmentForm saq={currentQuestionnaire} onClose={handleCloseAssessmentForm} />}
        </DialogContent>
      </Dialog>
    </>
  );
}