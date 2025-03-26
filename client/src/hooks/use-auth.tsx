import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
}

// Create a mock user for demo purposes
const mockUser: User = {
  id: 1,
  username: "demo_user",
  email: "demo@example.com",
  fullName: "Demo User",
  role: "Admin",
  avatar: ""
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(mockUser);
  const isAuthenticated = true; // Always authenticated in this demo
  
  // Simplified login function (not actually used since we removed login screens)
  const login = async (username: string, password: string) => {
    // No actual login - just for interface compatibility
    setUser(mockUser);
  };
  
  // Simplified logout function
  const logout = async () => {
    // No actual logout - just for interface compatibility
    toast({
      title: "User session",
      description: "This is a demo application with no authentication",
    });
  };
  
  // Simplified register function (not actually used since we removed registration)
  const register = async (username: string, email: string, password: string, fullName?: string) => {
    // No actual registration - just for interface compatibility
  };
  
  return (
    <AuthContext.Provider value={{
      user, 
      isLoading: false, 
      isAuthenticated, 
      login, 
      logout, 
      register 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
