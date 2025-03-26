import { ReactNode } from "react";
import { Link } from "wouter";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f5f8fa] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">EUDR Compliance Dashboard</h1>
          <p className="text-gray-500 mt-2">European Union Deforestation Regulation</p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-8">
          {children}
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2023 EUDR Comply. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
