import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, AlertCircle, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import satelliteMapImage from "../../assets/satellite-map.png";

export type ValidationStatus = "compliant" | "non-compliant" | "warning";
export type CheckType = "geometry" | "satellite";

export interface ValidationIssue {
  type: CheckType;
  message: string;
  details?: string;
  severity: "error" | "warning";
}

export interface ValidationPlot {
  id: string;
  name: string;
  plotId: string;
  area: number;
  areaUnit: string;
  perimeter: number;
  perimeterUnit: string;
  coordinates: string;
  vertices: number;
  status: ValidationStatus;
  geometryStatus: ValidationStatus;
  satelliteStatus: ValidationStatus;
  lastValidated: string;
  createdAt: string;
  issues: ValidationIssue[];
}

interface ValidationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationPlots: ValidationPlot[];
}

export const ValidationDetailsDialog: React.FC<ValidationDetailsDialogProps> = ({ 
  open, 
  onOpenChange,
  validationPlots = [] // Default to empty array if not provided
}) => {
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  const [plotSearchTerm, setPlotSearchTerm] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden">
        <div className="h-[80vh] flex flex-col">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
            {/* Left sidebar with plot list and search */}
            <div className="col-span-1 border-r flex flex-col h-full">
              <div className="p-6 border-b flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search plots..."
                    className="pl-8"
                    value={plotSearchTerm}
                    onChange={(e) => setPlotSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Plot list */}
              <div className="flex-1 overflow-y-auto">
                {validationPlots
                  .filter(plot => 
                    plot.name.toLowerCase().includes(plotSearchTerm.toLowerCase()) || 
                    plot.plotId.toLowerCase().includes(plotSearchTerm.toLowerCase())
                  )
                  .map((plot) => (
                    <div 
                      key={plot.id}
                      className={cn(
                        "p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                        selectedPlot === plot.plotId ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      )}
                      onClick={() => setSelectedPlot(plot.plotId)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{plot.name}</div>
                          <div className="text-xs text-gray-500">{plot.plotId}</div>
                        </div>
                        <div className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full",
                          plot.status === "compliant" 
                            ? "bg-green-100 text-green-800" 
                            : plot.status === "warning"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                        )}>
                          {plot.status === "compliant" 
                            ? "Compliant" 
                            : plot.status === "warning"
                              ? "Warning"
                              : "Non-Compliant"}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Right content section with map and details - with scrollable container */}
            <div className="col-span-2 overflow-y-auto h-full">
              {selectedPlot ? (
                <>
                  {(() => {
                    const plot = validationPlots.find(p => p.plotId === selectedPlot);
                    if (!plot) return null;
                    
                    return (
                      <>
                        {/* Map section */}
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                          <h3 className="font-medium">Plot Location</h3>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg"
                                width="18" 
                                height="18" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg"
                                width="18" 
                                height="18" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                              </svg>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Map Display */}
                        <div className="bg-slate-50 relative h-[400px]">
                          <div className="w-full h-full relative">
                            {/* Satellite imagery */}
                            <img 
                              src={satelliteMapImage} 
                              alt="Satellite view of agricultural land"
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Overlay polygon */}
                            <div className={cn(
                              "absolute inset-0 flex items-center justify-center",
                              plot.status === "compliant" 
                                ? "border-4 border-green-500/50" 
                                : plot.status === "warning"
                                  ? "border-4 border-amber-500/50"
                                  : "border-4 border-red-500/50"
                            )}>
                              <div className={cn(
                                "w-2/3 h-2/3 border-2 pointer-events-none",
                                plot.status === "compliant" 
                                  ? "border-green-500" 
                                  : plot.status === "warning"
                                    ? "border-amber-500"
                                    : "border-red-500"
                              )}></div>
                            </div>
                          </div>
                          
                          {/* Map controls */}
                          <div className="absolute right-4 bottom-4 flex flex-col space-y-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-md">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg"
                                width="15" 
                                height="15" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="text-primary"
                              >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-md">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg"
                                width="15" 
                                height="15" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="text-primary"
                              >
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Details panel */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-t bg-white">
                          {/* Left side: Validation Status */}
                          <div>
                            <h3 className="font-medium text-base mb-4">Validation Status</h3>
                            <div className="space-y-3">
                              {/* Geometry Check */}
                              <div className={cn(
                                "p-3 border rounded-md",
                                plot.geometryStatus === "compliant" 
                                  ? "bg-green-50 border-green-100" 
                                  : plot.geometryStatus === "warning"
                                    ? "bg-amber-50 border-amber-100"
                                    : "bg-red-50 border-red-100"
                              )}>
                                <div className="flex items-center">
                                  {plot.geometryStatus === "compliant" ? (
                                    <Check className="h-5 w-5 text-green-600 mr-2" />
                                  ) : plot.geometryStatus === "warning" ? (
                                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                  )}
                                  <div className={cn(
                                    "font-medium",
                                    plot.geometryStatus === "compliant" 
                                      ? "text-green-800" 
                                      : plot.geometryStatus === "warning"
                                        ? "text-amber-800"
                                        : "text-red-800"
                                  )}>Geometry Check</div>
                                </div>
                                
                                {/* Show status message or issues */}
                                {plot.geometryStatus === "compliant" ? (
                                  <p className="text-sm text-green-700 mt-1 pl-7">All geometry validations passed successfully.</p>
                                ) : (
                                  <div className="mt-2 pl-7 space-y-2">
                                    {plot.issues
                                      .filter(issue => issue.type === "geometry")
                                      .map((issue, idx) => (
                                        <div key={idx} className={cn(
                                          "text-sm p-2 rounded",
                                          issue.severity === "warning" ? "bg-amber-100" : "bg-red-100"
                                        )}>
                                          <div className={cn(
                                            "font-medium",
                                            issue.severity === "warning" ? "text-amber-800" : "text-red-800"
                                          )}>{issue.message}</div>
                                          <div className={cn(
                                            "text-xs mt-0.5",
                                            issue.severity === "warning" ? "text-amber-700" : "text-red-700"
                                          )}>{issue.details}</div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                )}
                              </div>
                              
                              {/* Satellite Check */}
                              <div className={cn(
                                "p-3 border rounded-md",
                                plot.satelliteStatus === "compliant" 
                                  ? "bg-green-50 border-green-100" 
                                  : plot.satelliteStatus === "warning"
                                    ? "bg-amber-50 border-amber-100"
                                    : "bg-red-50 border-red-100"
                              )}>
                                <div className="flex items-center">
                                  {plot.satelliteStatus === "compliant" ? (
                                    <Check className="h-5 w-5 text-green-600 mr-2" />
                                  ) : plot.satelliteStatus === "warning" ? (
                                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                  )}
                                  <div className={cn(
                                    "font-medium",
                                    plot.satelliteStatus === "compliant" 
                                      ? "text-green-800" 
                                      : plot.satelliteStatus === "warning"
                                        ? "text-amber-800"
                                        : "text-red-800"
                                  )}>Satellite Check</div>
                                </div>
                                
                                {/* Show status message or issues */}
                                {plot.satelliteStatus === "compliant" ? (
                                  <p className="text-sm text-green-700 mt-1 pl-7">No issues detected in satellite imagery.</p>
                                ) : (
                                  <div className="mt-2 pl-7 space-y-2">
                                    {plot.issues
                                      .filter(issue => issue.type === "satellite")
                                      .map((issue, idx) => (
                                        <div key={idx} className={cn(
                                          "text-sm p-2 rounded",
                                          issue.severity === "warning" ? "bg-amber-100" : "bg-red-100"
                                        )}>
                                          <div className={cn(
                                            "font-medium",
                                            issue.severity === "warning" ? "text-amber-800" : "text-red-800"
                                          )}>{issue.message}</div>
                                          <div className={cn(
                                            "text-xs mt-0.5",
                                            issue.severity === "warning" ? "text-amber-700" : "text-red-700"
                                          )}>{issue.details}</div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                )}
                              </div>
                              
                              {/* Last Validated */}
                              <div className="p-3 border rounded-md">
                                <div className="flex items-center">
                                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                                  <div className="font-medium">Last Validated</div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 pl-7">{plot.lastValidated}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right side: Plot Details */}
                          <div>
                            <h3 className="font-medium text-base mb-4">Plot Details</h3>
                            <dl className="grid grid-cols-2 gap-3">
                              <div className="col-span-1">
                                <dt className="text-sm text-gray-500">Area</dt>
                                <dd className="text-sm font-medium">{plot.area} {plot.areaUnit}</dd>
                              </div>
                              
                              <div className="col-span-1">
                                <dt className="text-sm text-gray-500">Perimeter</dt>
                                <dd className="text-sm font-medium">{plot.perimeter} {plot.perimeterUnit}</dd>
                              </div>
                              
                              <div className="col-span-2">
                                <dt className="text-sm text-gray-500">Coordinates</dt>
                                <dd className="text-sm font-medium">{plot.coordinates}</dd>
                              </div>
                              
                              <div className="col-span-1">
                                <dt className="text-sm text-gray-500">Vertices</dt>
                                <dd className="text-sm font-medium">{plot.vertices}</dd>
                              </div>
                              
                              <div className="col-span-2 mt-4">
                                <h4 className="font-medium text-sm mb-2">Validation History</h4>
                                <div className="text-sm space-y-3">
                                  <div className="flex items-start">
                                    <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <div className="text-sm">Validation Passed</div>
                                      <div className="text-xs text-gray-500">{plot.lastValidated}</div>
                                      <div className="text-xs text-gray-600 mt-0.5">
                                        {plot.issues.length === 0 
                                          ? "All checks passed successfully. No issues found."
                                          : `${plot.issues.length} issues detected and reported.`
                                        }
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-start">
                                    <Clock className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <div className="text-sm">Validation Started</div>
                                      <div className="text-xs text-gray-500">{plot.lastValidated}</div>
                                      <div className="text-xs text-gray-600 mt-0.5">Initial validation process started.</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="32" 
                      height="32" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-gray-500"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select a plot to view details</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a plot from the list on the left to view its location, validation status, and detailed information.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationDetailsDialog;