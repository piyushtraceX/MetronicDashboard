import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface SAQResponseViewerProps {
  open: boolean;
  onClose: () => void;
  supplierName: string;
  responseId: string;
}

export default function SAQResponseViewer({ open, onClose, supplierName, responseId }: SAQResponseViewerProps) {
  if (!open) return null;

  // Mock form response data based on the supplied form
  const formResponses = [
    { 
      section: "Supplier Information (Article 9 and 10)",
      questions: [
        { id: 1, question: "Company Name", answer: "ABC Corp", required: true },
        { id: 2, question: "Business Registration Number", answer: "BRN12345678", required: false },
        { id: 3, question: "Country of Operation", answer: "Germany\nFrance\nBelgium", required: true },
        { id: 4, question: "Contact Information (Email and Phone)", answer: "john.doe@abccorp.com, +49 123 4567890", required: true },
        { 
          id: 5, 
          question: "Which EUDR Commodities do you supply?", 
          answer: ["Timber or its derivative", "Rubber or its derivative"], 
          required: true,
          type: "multiple-select"
        },
        { 
          id: 6, 
          question: "Overall, what is your level of knowledge regarding the EU Deforestation-free product Regulation (EUDR)?", 
          answer: "Good", 
          type: "single-select",
          options: ["None", "Basic", "Good", "Full"]
        },
        { 
          id: 7,
          question: "Do you have a competent authority identified in your organization in charge of implementing EUDR?",
          answer: "Yes",
          type: "boolean"
        },
        {
          id: 8,
          question: "What do you foresee as your challenges to implement the EUDR Compliance in your supply chain?",
          answer: ["Support from the Supply chain", "Costs are very high"],
          type: "multiple-select"
        },
        {
          id: 9,
          question: "By when will you be ready to comply with EUDR Legislation?",
          answer: "6 Months",
          type: "single-select"
        },
        {
          id: 10,
          question: "What is your business category (tick all that apply)?",
          answer: ["Trader/Exporter", "Secondary Processor (Manufacturer of Finished goods to EU)"],
          type: "multiple-select"
        },
        {
          id: 11,
          question: "Do you directly export to EU?",
          answer: "Yes",
          type: "single-select"
        },
        {
          id: 12,
          question: "Which countries you source your products from?",
          answer: "Malaysia, Indonesia, Vietnam",
          type: "text"
        }
      ]
    },
    {
      section: "EUDR Compliance and Due Diligence (Article 9)",
      questions: [
        {
          id: 13,
          question: "Do you conduct due diligence to ensure that your products are not linked to deforestation or forest degradation?",
          answer: "Yes - We use RSPO certification and perform annual audits of our supply chain. We also use satellite monitoring for high-risk areas.",
          required: true,
          type: "text-long"
        },
        {
          id: 14,
          question: "Do you have a documented deforestation-free policy for your supply chain?",
          answer: "Yes",
          type: "boolean"
        },
        {
          id: 15,
          question: "Are your raw materials sourced from high-risk areas for deforestation?",
          answer: "Yes (Southeast Asia, particularly Borneo)",
          type: "single-select-with-text"
        },
        {
          id: 16,
          question: "Do you require your suppliers to provide evidence of deforestation-free sourcing (e.g., certifications like RFA, FSC, RSPO, or other third-party verifications)?",
          answer: "Yes (FSC and RSPO certifications required for all suppliers)",
          type: "single-select-with-text"
        },
        {
          id: 17,
          question: "Do you have a supply chain traceability system in place?",
          answer: "Yes (We can trace back to plantation level for 85% of our supply)",
          type: "single-select-with-text"
        },
        {
          id: 18,
          question: "How ready are you to register farms, identify polygons/geolocations?",
          answer: "Somewhat Ready",
          type: "single-select"
        },
        {
          id: 19,
          question: "How ready are you to implement traceability systems in your supply chain?",
          answer: "Ready",
          type: "single-select"
        },
        {
          id: 20,
          question: "How ready are you to monitor deforestation risk at the plot level?",
          answer: "Somewhat Ready",
          type: "single-select"
        },
        {
          id: 21,
          question: "How ready are you to submit relevant information (DDS) via geoJson to your down stream customer?",
          answer: "Somewhat Ready",
          type: "single-select"
        },
        {
          id: 22,
          question: "Do you use any of the tools as below to prove your compliance to EUDR?",
          answer: ["Certificate of Origin", "3rd Party Certificate"],
          type: "multiple-select"
        },
        {
          id: 23,
          question: "Do you have any farmer/plot registration system in use currently?",
          answer: "Yes",
          type: "boolean"
        },
        {
          id: 24,
          question: "Do you hold any certifications related to sustainable sourcing (e.g., RFA, FSC, PEFC, RSPO, FairTrade, or similar)?",
          answer: "Yes (FSC certification for timber products, RSPO for palm oil derivatives)",
          type: "single-select-with-text"
        },
        {
          id: 25,
          question: "Do you report on your deforestation impact or sustainable sourcing in any public reports (e.g., annual sustainability reports)?",
          answer: "Yes (Annual Sustainability Report available at www.abccorp.com/sustainability)",
          type: "single-select-with-text"
        },
        {
          id: 26,
          question: "Do you have any future plans to enhance your deforestation risk management practices?",
          answer: "Yes (Implementing real-time satellite monitoring and blockchain traceability by 2026)",
          type: "single-select-with-text"
        },
        {
          id: 27,
          question: "Are you willing to collaborate with us to improve deforestation-related practices and supply chain transparency?",
          answer: "Yes",
          type: "boolean"
        },
        {
          id: 28,
          question: "Are you segregating your inventory from EU to non EU markets?",
          answer: "Yes",
          type: "boolean"
        },
        {
          id: 29,
          question: "Are you processing your inventory separately for EU to non EU markets?",
          answer: "Yes",
          type: "boolean"
        },
        {
          id: 30,
          question: "What assistance would you require to comply with EUDR?",
          answer: ["Training and Capacity building", "Technology Solutions"],
          type: "multiple-select"
        }
      ]
    }
  ];

  // Function to render different answer types
  const renderAnswer = (question: any) => {
    switch (question.type) {
      case "multiple-select":
        return (
          <div className="space-y-2">
            {Array.isArray(question.answer) ? 
              question.answer.map((item: string, i: number) => (
                <div key={i} className="flex items-center">
                  <Checkbox checked readOnly className="mr-2" />
                  <span>{item}</span>
                </div>
              )) : 
              <span className="text-gray-600">No selection</span>
            }
          </div>
        );
      
      case "single-select":
        return <span className="text-gray-800">{question.answer}</span>;
      
      case "boolean":
        return question.answer === "Yes" ? 
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Yes</span>
          </div> : 
          <div className="flex items-center text-red-600">
            <XCircle className="h-4 w-4 mr-1" />
            <span>No</span>
          </div>;
      
      case "single-select-with-text":
        return <div className="text-gray-800">{question.answer}</div>;
      
      case "text-long":
        return <div className="text-gray-800 whitespace-pre-wrap">{question.answer}</div>;
      
      default:
        return <div className="text-gray-800 whitespace-pre-wrap">{question.answer}</div>;
    }
  };

  const calculateComplianceScore = () => {
    // Simple mock algorithm for demonstration
    // In a real app, this would be based on the actual answers and weighted scoring
    return 72; // This is just a mock value
  };

  const score = calculateComplianceScore();
  let complianceStatus = "";
  let statusColor = "";

  if (score >= 80) {
    complianceStatus = "Approved";
    statusColor = "bg-green-500";
  } else if (score >= 60) {
    complianceStatus = "Review";
    statusColor = "bg-yellow-500";
  } else {
    complianceStatus = "Rejected";
    statusColor = "bg-red-500";
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center z-10">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold">Supplier SAQ Response</h2>
              <div className="flex items-center mt-1">
                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                  <span className="text-xs font-medium">AC</span>
                </div>
                <span className="font-medium">{supplierName}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-500">ID: {responseId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="default" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Make Decision
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <Tabs defaultValue="response">
              <TabsList>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="response" className="pt-4">
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-4 border flex-1">
                    <h3 className="text-lg font-medium mb-2">Submission Information</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                      <div>
                        <span className="text-gray-500">Submitted on</span>
                        <p className="font-medium">Oct 25, 2024</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Submitted by</span>
                        <p className="font-medium">John Doe (john.doe@abccorp.com)</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status</span>
                        <p className="font-medium">
                          <Badge className={statusColor}>{complianceStatus}</Badge>
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Response ID</span>
                        <p className="font-medium">{responseId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4 border flex-1">
                    <h3 className="text-lg font-medium mb-2">Compliance Score</h3>
                    <div className="flex items-center space-x-4">
                      <div className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-2xl text-white ${statusColor}`}>
                        {score}%
                      </div>
                      <div>
                        <h4 className="font-medium">EUDR Readiness</h4>
                        <p className="text-sm text-gray-600 mt-1">Based on response analysis</p>
                        <div className="mt-2">
                          <Badge className={statusColor}>{complianceStatus}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {formResponses.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="bg-white rounded-lg shadow border mb-6">
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="text-lg font-medium">{section.section}</h3>
                    </div>
                    <div className="divide-y">
                      {section.questions.map((question, qIndex) => (
                        <div key={qIndex} className="p-4">
                          <div className="flex items-start">
                            <span className="text-gray-500 mr-2">{question.id}.</span>
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h4 className="font-medium text-gray-900">{question.question}</h4>
                                {question.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </div>
                              <div className="ml-4">{renderAnswer(question)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="analysis" className="pt-4">
                <div className="bg-white rounded-lg shadow border p-4 mb-6">
                  <h3 className="text-lg font-medium mb-4">Compliance Analysis</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Readiness Assessment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium">Traceability Systems</h5>
                            <Badge className="bg-green-500">Ready</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Supplier has robust systems in place with 85% traceability to plantation level.
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium">Geolocation Capability</h5>
                            <Badge className="bg-yellow-500">Partial</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Somewhat ready to implement farm registration and polygon mapping.
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium">Documentation</h5>
                            <Badge className="bg-green-500">Complete</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Has required certifications and maintains deforestation-free policy.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Risk Assessment</h4>
                      <div className="bg-gray-50 p-4 rounded border">
                        <div className="flex items-center mb-2">
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <h5 className="font-medium">Medium Risk</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Supplier sources from high-risk deforestation areas but has adequate controls in place. 
                          Implementation of full traceability and real-time monitoring recommended.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Recommended Actions</h4>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                        <li>Request implementation plan for full supply chain traceability</li>
                        <li>Provide training and capacity building for geolocation data collection</li>
                        <li>Schedule quarterly review of deforestation monitoring data</li>
                        <li>Require additional evidence of segregated processing for EU market</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow border p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Decision</h3>
                    <Button variant="default" size="sm">
                      Record Decision
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" className="flex items-center border-green-500 text-green-700 hover:bg-green-50">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button variant="outline" className="flex items-center border-yellow-500 text-yellow-700 hover:bg-yellow-50">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Review with Conditions
                      </Button>
                      <Button variant="outline" className="flex items-center border-red-500 text-red-700 hover:bg-red-50">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="p-4 border rounded bg-gray-50">
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-gray-600 italic">No decision has been recorded yet.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}