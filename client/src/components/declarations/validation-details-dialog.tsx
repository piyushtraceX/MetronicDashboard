import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import satelliteMapReal from "../../assets/satellite-map-real.jpg";
import satelliteMapAgricultural from "../../assets/satellite-map-agricultural.jpg";

type ValidationDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  validationType: "geometry" | "satellite" | null;
};

export default function ValidationDetailsDialog({
  open,
  onClose,
  validationType,
}: ValidationDetailsDialogProps) {
  const [selectedPlot, setSelectedPlot] = useState<string | null>("POL-001");

  // Plot data with area values
  const plotData = [
    { id: "POL-001", area: "147.23", status: "Compliant" },
    { id: "POL-002", area: "129.85", status: "Compliant" },
    { id: "POL-003", area: "148.92", status: "Compliant" },
    { id: "POL-004", area: "122.55", status: "Compliant" },
  ];

  const validationText = validationType === "geometry" 
    ? "geometry validation" 
    : "satellite imagery validation";

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>
            {validationType === "geometry" 
              ? "Geometry Validation Details"
              : "Satellite Check Details"
            }
          </DialogTitle>
          <DialogDescription>
            Detailed {validationText} results for each polygon in the GeoJSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-12 h-[700px]">
          {/* Left sidebar with plot list */}
          <div className="col-span-4 border-r overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-medium">Plot List</h3>
            </div>
            
            <div>
              {plotData.map((plot) => (
                <div 
                  key={plot.id}
                  className={cn(
                    "flex items-center justify-between p-4 border-b cursor-pointer hover:bg-slate-50",
                    selectedPlot === plot.id ? "bg-slate-100" : ""
                  )}
                  onClick={() => setSelectedPlot(plot.id)}
                >
                  <div>
                    <div className="font-medium">{plot.id}</div>
                    <div className="text-sm text-gray-500">{plot.area} hectares</div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    "bg-green-50 text-green-700 border border-green-100"
                  )}>
                    {plot.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side - split into Map (top) and Details (bottom) */}
          <div className="col-span-8 flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Plot Information and Validation Results */}
              <div className="grid grid-cols-2 p-6 bg-white border-b">
                <div>
                  <h3 className="text-lg font-medium mb-4">Plot Information</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Polygon ID</div>
                      <div className="font-medium">POL-001</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Area</div>
                      <div className="font-medium">245 hectares</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Perimeter</div>
                      <div className="font-medium">2.5 km</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Coordinates</div>
                      <div className="font-medium">12.3456, -78.9012</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Validation Results</h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                      <div className="flex items-center">
                        <svg 
                          className="h-5 w-5 text-green-600 mr-2" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="font-medium text-green-800">Geometry Check</div>
                      </div>
                      <p className="text-sm text-green-700 mt-1 pl-7">All geometry validations passed successfully.</p>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                      <div className="flex items-center">
                        <svg 
                          className="h-5 w-5 text-green-600 mr-2" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="font-medium text-green-800">Satellite Check</div>
                      </div>
                      <p className="text-sm text-green-700 mt-1 pl-7">No issues detected in satellite imagery.</p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mt-4 mb-2">Validation History</h4>
                  <div className="text-sm space-y-3">
                    <div className="flex items-start">
                      <svg 
                        className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div>Validation Completed</div>
                        <div className="text-gray-500 mt-0.5">March 15, 2025</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg 
                        className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div>Plot Uploaded</div>
                        <div className="text-gray-500 mt-0.5">March 14, 2025</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map - Scrollable area */}
              <div className="flex-1 flex flex-col bg-white overflow-auto">
                <div className="flex-1">
                  <div className="min-w-[800px] min-h-[400px] relative">
                    <img 
                      src={satelliteMapReal} 
                      alt="Satellite view of agricultural land"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay polygon for visualization */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1/3 h-1/3 border-2 border-yellow-400 bg-yellow-400/10 pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="p-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}