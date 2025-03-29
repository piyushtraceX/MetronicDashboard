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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  switchPersona: (personaId: number) => Promise<void>;
}

// Default user for when the app first loads
const defaultUser: User = {
  id: 1,
  username: "admin",
  email: "admin@eudrportal.com",
  fullName: "Administrator",
  role: "admin",
  avatar: "A"
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
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
  
  // Enhanced login function that also supports persona switching
  const login = async (email: string, password: string) => {
    try {
      // Find the persona with matching email
      const matchingPersona = personas.find(p => p.email === email);
      
      if (matchingPersona) {
        // Create user from persona
        const newUser: User = {
          id: matchingPersona.id,
          username: matchingPersona.role,
          email: matchingPersona.email,
          fullName: matchingPersona.name,
          role: matchingPersona.role,
          avatar: matchingPersona.avatar
        };
        
        setUser(newUser);
        
        toast({
          title: "Persona Changed",
          description: `You are now using the ${matchingPersona.name} persona`,
        });
      } else {
        // If no matching persona, use default
        setUser(defaultUser);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Failed to switch persona",
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
  
  // Register function (not actually used but included for API completeness)
  const register = async (username: string, email: string, password: string, fullName?: string) => {
    toast({
      title: "Registration",
      description: "This is a demo application with simplified authentication",
    });
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
