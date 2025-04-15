import { useState, useRef, ChangeEvent } from 'react';
import { UseMutationResult } from '@tanstack/react-query';
import { X, Mail, CloudUpload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface InviteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSent?: (data: any) => void;
  inviteMutation: UseMutationResult<any, Error, { emails: string[], message?: string }>;
}

export default function InviteSupplierDialog({
  open,
  onOpenChange,
  onInviteSent,
  inviteMutation,
}: InviteSupplierDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tab, setTab] = useState<string>('manual');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileValidation, setFileValidation] = useState<{
    valid: boolean;
    emailCount?: number;
    message?: string;
  } | null>(null);
  
  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
  };
  
  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
  };
  
  const addEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (trimmedEmail && isValidEmail(trimmedEmail) && !emails.includes(trimmedEmail)) {
      setEmails([...emails, trimmedEmail]);
      setEmailInput('');
    } else if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address"
      });
    }
  };
  
  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };
  
  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedEmails = pastedText.split(/[\s,;]+/).filter(email => email.trim() && isValidEmail(email.trim()));
    
    if (pastedEmails.length > 0) {
      // Use filter to create a unique list instead of using Set
      const uniqueEmails = [...emails];
      pastedEmails.forEach(email => {
        if (!uniqueEmails.includes(email)) {
          uniqueEmails.push(email);
        }
      });
      setEmails(uniqueEmails);
    }
  };
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
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
      setFileValidation({
        valid: false,
        message: `Invalid file format. Supported formats: ${validExtensions.join(', ')}`
      });
      return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    
    // Simulate file validation for demo
    setTimeout(() => {
      // Mock validation result - in a real app, we would parse the file and count valid emails
      setFileValidation({
        valid: true,
        emailCount: 47
      });
    }, 800);
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const clearFile = () => {
    setFile(null);
    setFileName('');
    setFileValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSendInvitations = () => {
    let emailList: string[] = [];
    
    if (tab === 'manual') {
      if (emails.length === 0) {
        toast({
          variant: "destructive",
          title: "No emails provided",
          description: "Please add at least one email address"
        });
        return;
      }
      emailList = emails;
    } else if (tab === 'bulk' && file && fileValidation?.valid) {
      // In a real app, we would extract emails from the file
      // For demo purposes, we'll just use a placeholder
      emailList = ['bulk@example.com'];
    } else {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a valid file with email addresses"
      });
      return;
    }
    
    inviteMutation.mutate(
      { emails: emailList, message: message.trim() || undefined },
      {
        onSuccess: (data) => {
          toast({
            title: "Invitations sent successfully",
            description: `Sent invitations to ${emailList.length} supplier(s)`
          });
          if (onInviteSent) {
            onInviteSent(data);
          }
          // Reset form
          setEmails([]);
          setMessage('');
          clearFile();
          setTab('manual');
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Failed to send invitations",
            description: error.message || "An error occurred while sending invitations"
          });
        }
      }
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Suppliers</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Supplier Email Addresses*</div>
              <div className="border rounded-md p-2 flex flex-wrap gap-2 min-h-[100px]">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1 py-1.5">
                    {email}
                    <button 
                      onClick={() => removeEmail(email)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  value={emailInput}
                  onChange={handleEmailInputChange}
                  onKeyDown={handleEmailInputKeyDown}
                  onBlur={addEmail}
                  onPaste={handlePaste}
                  placeholder="Type or paste email addresses and press Enter"
                  className="flex-1 min-w-[200px] border-0 focus:ring-0 p-1 text-sm"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Enter multiple email addresses separated by commas or press Enter after each email
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="text-sm font-medium">Message Preview</div>
                <div className="text-xs text-muted-foreground">Default message will be sent if left empty</div>
              </div>
              <div className="border rounded-md p-3 bg-muted/30">
                <div className="text-sm mb-2">Dear Supplier,</div>
                <div className="text-sm mb-2">You are invited to join our compliance platform and submit required data. Please complete your registration using the link below.</div>
                <div className="text-sm text-primary mb-2">https://platform.example.com/register?token=123456</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Custom Message (Optional)</div>
              <Textarea
                placeholder="Add a personal message to your invitation..."
                value={message}
                onChange={handleMessageChange}
                className="min-h-[100px]"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="bulk" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Upload Email List</div>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                onClick={triggerFileSelect}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
                
                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 rounded-full p-2">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-sm font-medium">{fileName}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="bg-primary/10 rounded-full p-3">
                      <CloudUpload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm font-medium">
                      Drop your email list file here
                    </div>
                    <div className="text-xs text-muted-foreground">
                      or click to browse from your computer
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Supported formats: .CSV, .XLSX (max 5MB)
                    </div>
                  </div>
                )}
              </div>
              
              {fileValidation && (
                <div className="mt-2">
                  {fileValidation.valid ? (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <AlertDescription>
                        {fileValidation.emailCount} valid email addresses found
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>{fileValidation.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Custom Message (Optional)</div>
              <Textarea
                placeholder="Add a personal message to your invitation..."
                value={message}
                onChange={handleMessageChange}
                className="min-h-[100px]"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendInvitations}
            disabled={
              (tab === 'manual' && emails.length === 0) || 
              (tab === 'bulk' && (!file || !fileValidation?.valid)) || 
              inviteMutation.isPending
            }
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            {inviteMutation.isPending ? "Sending..." : "Send Invitations"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}