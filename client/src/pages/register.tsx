import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { GoogleIcon, MicrosoftIcon } from "@/components/icons";

const registerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  industryType: z.string().min(1, "Industry type is required"),
  complianceFocus: z.array(z.string()).default([]), // Make compliance focus optional
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Industry options from the provided image
const industryOptions = [
  "Agriculture",
  "Forestry & Timber",
  "Food & Beverage",
  "Retail & Consumer Goods",
  "Textile & Apparel",
  "Automotive",
  "Chemicals",
  "Energy & Utilities",
  "Oil & Gas",
  "Pharmaceuticals",
  "Construction",
  "Electronics",
  "Financial Services",
  "Transportation & Logistics",
  "Mining & Metals",
  "Waste Management",
  "Education",
  "Healthcare",
  "Telecommunications"
];

export default function Register() {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedComplianceFocus, setSelectedComplianceFocus] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      industryType: "",
      complianceFocus: [],
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  // Handle industry selection
  const handleIndustryChange = (value: string) => {
    setValue('industryType', value, { shouldValidate: true });
  };

  // Handle compliance focus selection
  const handleComplianceFocusChange = (value: string) => {
    const currentValues = [...selectedComplianceFocus];
    const index = currentValues.indexOf(value);
    
    if (index === -1) {
      currentValues.push(value);
    } else {
      currentValues.splice(index, 1);
    }
    
    // Update the selected values
    setSelectedComplianceFocus(currentValues);
    setValue('complianceFocus', currentValues, { shouldValidate: true });
    
    // Show a toast if removing the last option (but still allow it)
    if (currentValues.length === 0 && index !== -1) {
      toast({
        title: "Note",
        description: "At least one compliance focus is required",
      });
    }
  };
  
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Create a username from the first name and last name
      const username = `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`;
      const fullName = `${data.firstName} ${data.lastName}`;
      
      // Register with all collected data
      const newUser = await registerUser(
        username, 
        data.email, 
        data.password, 
        fullName,
        data.companyName,
        data.industryType,
        data.complianceFocus
      );
      
      // Save user ID for the confirmation page
      localStorage.setItem('registeredUserId', String(newUser.id));
      
      toast({
        title: "Registration Successful",
        description: "Your 15-day trial has started.",
      });
      
      // Redirect to registration confirmation page
      setLocation("/registration-confirmation");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error registering your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-end">
        <div>
          <span className="text-sm text-gray-600">Already have an account?</span>{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log In →
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Heading Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Get Started with TraceX Comply</h1>
            <p className="text-gray-600">
              Register your business and automate ESG reporting with AI-driven compliance solutions.
            </p>
          </div>
          
          {/* Progress Indicator */}
          <div className="mb-8 flex justify-center">
            <div className="w-full max-w-md flex">
              <div className="flex-1">
                <div className="h-1 bg-primary rounded"></div>
                <div className="mt-2 text-center text-sm font-medium">Account Details</div>
              </div>
              <div className="flex-1">
                <div className="h-1 bg-gray-200 rounded"></div>
                <div className="mt-2 text-center text-sm text-gray-500">Confirmation</div>
              </div>
            </div>
          </div>
          
          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Enter your company name"
                  {...register("companyName")}
                  className={errors.companyName ? "border-red-300" : ""}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500">{errors.companyName.message}</p>
                )}
              </div>
              
              {/* First Name & Last Name - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    {...register("firstName")}
                    className={errors.firstName ? "border-red-300" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    {...register("lastName")}
                    className={errors.lastName ? "border-red-300" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              {/* Business Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  {...register("email")}
                  className={errors.email ? "border-red-300" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              
              {/* Industry Type */}
              <div className="space-y-2">
                <Label htmlFor="industryType">Industry Type</Label>
                <Select onValueChange={handleIndustryChange}>
                  <SelectTrigger className={errors.industryType ? "border-red-300" : ""}>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industryType && (
                  <p className="text-sm text-red-500">{errors.industryType.message}</p>
                )}
              </div>
              
              {/* ESG Compliance Focus */}
              <div className="space-y-3">
                <Label>ESG Compliance Focus</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="eudr" 
                      checked={selectedComplianceFocus.includes('EUDR')}
                      onCheckedChange={() => handleComplianceFocusChange('EUDR')}
                    />
                    <Label htmlFor="eudr" className="font-normal">EUDR</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fsma" 
                      checked={selectedComplianceFocus.includes('FSMA')}
                      onCheckedChange={() => handleComplianceFocusChange('FSMA')}
                    />
                    <Label htmlFor="fsma" className="font-normal">FSMA</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="csrd" 
                      checked={selectedComplianceFocus.includes('CSRD')}
                      onCheckedChange={() => handleComplianceFocusChange('CSRD')}
                    />
                    <Label htmlFor="csrd" className="font-normal">CSRD</Label>
                  </div>
                </div>
                {errors.complianceFocus && (
                  <p className="text-sm text-red-500">{errors.complianceFocus.message}</p>
                )}
              </div>
              
              {/* Password with Show/Hide */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    {...register("password")}
                    className={errors.password ? "border-red-300 pr-10" : "pr-10"}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
              
              {/* Confirm Password with Show/Hide */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-red-300 pr-10" : "pr-10"}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
              
              {/* Terms and Conditions */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={watch("acceptTerms")}
                  onCheckedChange={(checked) => {
                    setValue("acceptTerms", checked === true, { shouldValidate: true });
                  }}
                />
                <Label 
                  htmlFor="acceptTerms" 
                  className="text-sm font-normal cursor-pointer"
                  onClick={() => setValue("acceptTerms", !watch("acceptTerms"), { shouldValidate: true })}
                >
                  I accept the <a href="#" className="text-primary underline">Terms of Service</a> and <a href="#" className="text-primary underline">Privacy Policy</a>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-500 -mt-4">{errors.acceptTerms.message}</p>
              )}
              
              {/* Create Account Button */}
              <Button 
                type="submit" 
                className="w-full bg-primary" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              
              {/* Or continue with */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5">
                    <GoogleIcon />
                  </span>
                  <span>Google</span>
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5">
                    <MicrosoftIcon />
                  </span>
                  <span>Microsoft</span>
                </Button>
              </div>
            </form>
          </div>
          
          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary text-xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2">Automated ESG Reporting</h3>
              <p className="text-sm text-gray-600">
                Save time with AI-powered report generation and analysis
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary text-xl">📈</span>
              </div>
              <h3 className="font-semibold mb-2">Real-time Compliance Dashboard</h3>
              <p className="text-sm text-gray-600">
                Monitor your ESG metrics in real-time with interactive dashboards
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary text-xl">🔒</span>
              </div>
              <h3 className="font-semibold mb-2">Secure & GDPR Compliant</h3>
              <p className="text-sm text-gray-600">
                Your data is protected with enterprise-grade security
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="#" className="hover:text-gray-800">Privacy Policy</a>
          <a href="#" className="hover:text-gray-800">Terms of Service</a>
          <a href="#" className="hover:text-gray-800">Contact Support</a>
        </div>
        <p>Copyright © ESGCompliance 2025</p>
      </footer>
    </div>
  );
}