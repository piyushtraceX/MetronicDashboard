import { useState, useRef, ChangeEvent } from 'react';
import { UseMutationResult } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, CloudUpload, FileTextIcon, X, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ValidationResult {
  success: boolean;
  successCount?: number;
  warningCount?: number;
  errorCount?: number;
  message?: string;
}

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: (result: any) => void;
  uploadMutation: UseMutationResult<any, Error, FormData>;
}

export default function BulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  uploadMutation,
}: BulkUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };
  
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };
  
  const validateAndSetFile = (selectedFile: File) => {
    // Check file extension
    const validExtensions = ['csv', 'xlsx', 'xls'];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    
    if (!validExtensions.includes(fileExtension)) {
      setValidation({
        success: false,
        errorCount: 1,
        message: `Invalid file format. Supported formats: ${validExtensions.join(', ')}`
      });
      return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    
    // Simulate file validation for demo
    setTimeout(() => {
      // Mock validation result
      setValidation({
        success: true,
        successCount: 45,
        warningCount: 2,
        errorCount: 1
      });
    }, 800);
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const clearFile = () => {
    setFile(null);
    setFileName('');
    setValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDownloadTemplate = () => {
    // Create a CSV template with the required headers
    const headers = ["Sr No", "Supplier Name", "Supplier Email"];
    const csvContent = headers.join(",") + "\n1,,\n2,,\n3,,"; // Add a few empty rows
    
    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    
    // Create a download link and trigger the download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "supplier_template.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template downloaded",
      description: "The supplier template has been downloaded successfully."
    });
  };
  
  const handleUpload = () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    uploadMutation.mutate(formData, {
      onSuccess: (data) => {
        toast({
          title: "Upload successful",
          description: `${validation?.successCount || 0} suppliers imported successfully.`
        });
        if (onUploadComplete) {
          onUploadComplete(data);
        }
        onOpenChange(false);
        clearFile();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error.message || "An error occurred during the upload."
        });
      }
    });
  };
  
  const handleClose = () => {
    clearFile();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1 rounded">
                <FileTextIcon className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm">Download Template</span>
              <span className="text-xs text-gray-500">Use our standard format for bulk upload</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleDownloadTemplate}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Template
            </Button>
          </div>
          
          <div
            className={`border border-dashed rounded-lg p-6 text-center ${
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
            />
            
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="bg-blue-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <div className="text-sm font-medium">
                {fileName ? fileName : "Drop your file here"}
              </div>
              <div className="text-xs text-gray-500">
                or click to browse from your computer
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Supported formats: .CSV, .XLSX (max 5MB)
              </div>
            </div>
          </div>
          
          {file && validation && (
            <div className="space-y-3">
              {validation.success && fileName && (
                <div className="flex items-center bg-green-50 text-green-700 p-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-sm">{fileName}</span>
                  <Button variant="ghost" size="sm" onClick={clearFile} className="h-6 w-6 p-0 ml-auto">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="text-sm font-medium">Validation Results</div>
              
              {validation.success ? (
                <div className="space-y-2">
                  {validation.successCount && validation.successCount > 0 && (
                    <div className="flex items-center text-sm text-green-700">
                      <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center mr-2 flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <span>{validation.successCount} rows parsed successfully</span>
                    </div>
                  )}
                  
                  {validation.warningCount && validation.warningCount > 0 && (
                    <div className="flex items-center text-sm text-yellow-700">
                      <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center mr-2 flex-shrink-0">
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                      <span>{validation.warningCount} rows with warnings</span>
                    </div>
                  )}
                  
                  {validation.errorCount && validation.errorCount > 0 && (
                    <div className="flex items-center text-sm text-red-700">
                      <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center mr-2 flex-shrink-0">
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                      <span>{validation.errorCount} row with errors</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-sm text-red-700">
                  <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center mr-2 flex-shrink-0">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                  <span>{validation.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !validation?.success || uploadMutation.isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {uploadMutation.isPending ? (
              <UploadCloud className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {uploadMutation.isPending ? "Uploading..." : "Upload & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}