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
    toast({
      title: "Template downloaded",
      description: "The template file has been downloaded successfully."
    });
    // In a real application, this would trigger a download
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
          <DialogTitle>Bulk Upload Suppliers</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Download Template</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              Download Template
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Use our standard format for bulk upload
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border'
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
              <div className="bg-primary/10 rounded-full p-3">
                <CloudUpload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-sm font-medium">
                {fileName ? fileName : "Drop your file here"}
              </div>
              <div className="text-xs text-muted-foreground">
                or click to browse from your computer
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Supported formats: .CSV, .XLSX (max 5MB)
              </div>
            </div>
          </div>
          
          {file && validation && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Validation Results</div>
                <Button variant="ghost" size="sm" onClick={clearFile} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {validation.success ? (
                <div className="space-y-2">
                  {validation.successCount && validation.successCount > 0 && (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <AlertDescription>
                        {validation.successCount} rows parsed successfully
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {validation.warningCount && validation.warningCount > 0 && (
                    <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                      <AlertDescription>
                        {validation.warningCount} rows with warnings
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {validation.errorCount && validation.errorCount > 0 && (
                    <Alert className="bg-red-50 text-red-800 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <AlertDescription>
                        {validation.errorCount} row with errors
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{validation.message}</AlertDescription>
                </Alert>
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
            className="gap-2"
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