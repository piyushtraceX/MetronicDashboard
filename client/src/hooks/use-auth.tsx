import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { personas } from "@/components/persona-switcher";

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: string;
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionStatus?: "trial" | "active" | "expired";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<User>;
  switchPersona: (personaId: number) => Promise<void>;
}

// Default user for when the app first loads
const defaultUser: User = {
  id: 1,
  username: "admin",
  email: "admin@eudrportal.com",
  fullName: "Administrator",
  role: "admin",
  avatar: "A",
  trialStartDate: new Date().toISOString(),
  trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
  subscriptionStatus: "trial"
};

// Create a dummy User for the context default
const dummyUser: User = {
  id: 0,
  username: "dummy",
  email: "dummy@example.com",
  role: "user"
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  register: async () => dummyUser, // Return dummy user to satisfy TypeScript
  switchPersona: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Try to load user from localStorage or use default
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : defaultUser;
  });
  
  const isAuthenticated = !!user; // User is authenticated if user object exists
  
  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }, [user]);
  
  // Enhanced login function that supports persona switching and registered users
  const login = async (email: string, password: string) => {
    try {
      // First, check if this is a registered user
      const registeredUserJson = localStorage.getItem('registeredUser:' + email);
      if (registeredUserJson) {
        const registeredUser = JSON.parse(registeredUserJson);
        
        // Check if trial has expired
        const now = new Date();
        const trialEndDate = new Date(registeredUser.trialEndDate);
        
        if (now > trialEndDate && registeredUser.subscriptionStatus === 'trial') {
          // Trial expired - update the subscription status
          registeredUser.subscriptionStatus = 'expired';
          localStorage.setItem('registeredUser:' + email, JSON.stringify(registeredUser));
          
          setUser(registeredUser);
          
          toast({
            title: "Trial Expired",
            description: "Your trial period has ended. Please upgrade to continue using all features.",
            variant: "destructive",
          });
          
          // Could redirect to a subscription page here
          return;
        }
        
        // Valid registered user - log them in
        setUser(registeredUser);
        
        const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (registeredUser.subscriptionStatus === 'trial') {
          toast({
            title: "Logged In Successfully",
            description: `Welcome back! You have ${daysLeft} days left in your trial.`,
          });
        } else {
          toast({
            title: "Logged In Successfully",
            description: "Welcome back!",
          });
        }
        
        return;
      }
      
      // If not registered, check if it's a persona
      const matchingPersona = personas.find(p => p.email === email);
      
      if (matchingPersona) {
        // Create user from persona
        const newUser: User = {
          id: matchingPersona.id,
          username: matchingPersona.role,
          email: matchingPersona.email,
          fullName: matchingPersona.name,
          role: matchingPersona.role,
          avatar: matchingPersona.avatar,
          // Add trial info to personas too for consistency
          trialStartDate: new Date().toISOString(),
          trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: "trial"
        };
        
        setUser(newUser);
        
        toast({
          title: "Persona Changed",
          description: `You are now using the ${matchingPersona.name} persona`,
        });
      } else {
        // If no registered user or matching persona, show error
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Failed to log in",
        variant: "destructive",
      });
    }
  };
  
  // Logout function
  const logout = async () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setLocation("/login");
    
    toast({
      title: "Logged Out",
      description: "You have been logged out",
    });
  };
  
  // Register function with 15-day trial
  const register = async (username: string, email: string, password: string, fullName?: string) => {
    try {
      // In a real app, this would make a POST request to the server
      // For our demo, we'll create a new user with trial information locally
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
      
      const newUser: User = {
        id: Math.floor(Math.random() * 1000) + 10, // Random ID (not 1-9 which are reserved for personas)
        username,
        email,
        fullName: fullName || username,
        role: 'user',
        avatar: fullName ? fullName.charAt(0).toUpperCase() : username.charAt(0).toUpperCase(),
        trialStartDate: now.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        subscriptionStatus: 'trial'
      };
      
      // Store the user information (this would normally be done by the server)
      localStorage.setItem('registeredUser:' + email, JSON.stringify(newUser));
      
      // But don't log in automatically - redirect to login
      
      return newUser;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error creating your account.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Function specifically for switching personas
  const switchPersona = async (personaId: number) => {
    const persona = personas.find(p => p.id === personaId);
    if (persona) {
      await login(persona.email, "password123");
    }
  };
  
  return (
    <AuthContext.Provider value={{
      user, 
      isLoading: false, 
      isAuthenticated, 
      login, 
      logout, 
      register,
      switchPersona
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
