import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function OrganizationProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data (pre-populated from registration)
  const [formData, setFormData] = useState({
    companyName: "",
    complianceScope: "",
    domain: "www.tracex.com",
  });
  
  // If no user, redirect to login
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    } else {
      // In a real app, we would fetch company details from the API
      // For now, we'll use dummy data based on the user
      setFormData(prev => ({
        ...prev,
        companyName: user.companyName || "Auto-Populated",
        complianceScope: "Auto-Populated",
      }));
    }
  }, [user, setLocation]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert the file to a data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCompanyLogo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGoToDashboard = () => {
    setIsLoading(true);
    // In a real app, we would save the organization profile here
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/"); // Go to dashboard
    }, 1000);
  };
  
  const handleBack = () => {
    setLocation("/onboarding/welcome");
  };
  
  // Get user's initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return "U";
    const nameParts = user.fullName.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-8">Setup Organization Profile</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Company Logo */}
          <div className="mb-8">
            <Label className="mb-2 block">Company Logo</Label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 border border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                {companyLogo ? (
                  <img src={companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  <UploadCloud className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <Button variant="secondary" className="mb-2" onClick={() => document.getElementById('logo-upload')?.click()}>
                  <UploadCloud className="h-4 w-4 mr-2" /> Upload Logo
                </Button>
                <input 
                  id="logo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500">Recommended: 400x400px, Max 2MB</p>
              </div>
            </div>
          </div>
          
          {/* Company Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  value={formData.companyName} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="complianceScope">ESG Compliance Scope</Label>
                <Input 
                  id="complianceScope" 
                  value={formData.complianceScope} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="domain">Organization Domain</Label>
                <Input 
                  id="domain" 
                  value={formData.domain} 
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          {/* About You */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">About You</h2>
            
            <div className="border border-gray-200 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user?.avatar} alt={user?.fullName || "User"} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user?.fullName}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Owner</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleGoToDashboard} disabled={isLoading}>
              {isLoading ? "Processing..." : "Go to Dashboard"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}