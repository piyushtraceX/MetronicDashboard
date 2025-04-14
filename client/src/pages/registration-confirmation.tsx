import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckIcon, BookOpenIcon, LifeBuoyIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function RegistrationConfirmation() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // If no user, redirect to login
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);
  
  const handleGoToDashboard = () => {
    setLocation("/onboarding/welcome");
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-12 flex justify-center">
          <div className="w-full max-w-md flex">
            <div className="flex-1">
              <div className="h-1 bg-primary rounded-l"></div>
              <div className="mt-2 text-center text-sm font-medium flex items-center justify-center">
                <span className="w-5 h-5 bg-primary text-white rounded-full inline-flex items-center justify-center mr-2 text-xs">1</span>
                Account Details
              </div>
            </div>
            <div className="flex-1">
              <div className="h-1 bg-primary rounded-r"></div>
              <div className="mt-2 text-center text-sm font-medium flex items-center justify-center">
                <span className="w-5 h-5 bg-primary text-white rounded-full inline-flex items-center justify-center mr-2 text-xs">2</span>
                Confirmation
              </div>
            </div>
          </div>
        </div>
        
        {/* Confirmation Content */}
        <div className="bg-white rounded-lg shadow-sm p-12 max-w-xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Welcome to TraceX Comply!</h1>
          <p className="text-gray-600 mb-8">Your account has been successfully created.</p>
          
          {/* Plan Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Your Plan Details</h2>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="text-gray-600">Selected Plan:</div>
              <div className="font-medium">Free Trial</div>
              
              <div className="text-gray-600">Billing Cycle:</div>
              <div className="font-medium">NA</div>
              
              <div className="text-gray-600">Next Payment:</div>
              <div className="font-medium">NA</div>
            </div>
          </div>
          
          <Button 
            className="w-full mb-6" 
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </Button>
          
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="flex items-center text-gray-600 hover:text-primary">
              <BookOpenIcon className="h-4 w-4 mr-1" />
              View Documentation
            </a>
            <a href="#" className="flex items-center text-gray-600 hover:text-primary">
              <LifeBuoyIcon className="h-4 w-4 mr-1" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>© 2025 ESGCompliance. All rights reserved.</p>
      </footer>
    </div>
  );
}