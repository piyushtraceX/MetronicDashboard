import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function OnboardingWelcome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // If no user, redirect to login
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);
  
  const handleGetStarted = () => {
    setLocation("/onboarding/organization-profile");
  };
  
  // Extract first name for personalized greeting
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-sm p-10 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-3">Welcome, {firstName}!</h1>
        <p className="text-gray-600 mb-8">
          Let's get you set up for ESG Compliance Success
        </p>
        
        <Button 
          onClick={handleGetStarted}
          className="w-full"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}