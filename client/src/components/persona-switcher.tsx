import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/use-auth';
import { UserCircle } from 'lucide-react';

// Define available personas
export const personas = [
  {
    id: 1,
    name: "Admin",
    role: "admin",
    description: "Full access to all features",
    avatar: "A",
    email: "admin@eudrportal.com"
  },
  {
    id: 2,
    name: "Compliance Officer",
    role: "compliance_officer",
    description: "Reviews and approves declarations",
    avatar: "C",
    email: "compliance@eudrportal.com"
  },
  {
    id: 3,
    name: "Supplier Manager",
    role: "supplier_manager",
    description: "Manages supplier relationships",
    avatar: "S",
    email: "supplier@eudrportal.com"
  },
  {
    id: 4,
    name: "Declaration Specialist",
    role: "declaration_specialist",
    description: "Creates and manages declarations",
    avatar: "D",
    email: "declarations@eudrportal.com"
  },
  {
    id: 5,
    name: "Auditor",
    role: "auditor",
    description: "Reviews compliance data",
    avatar: "Au",
    email: "auditor@eudrportal.com"
  },
  {
    id: 6,
    name: "Supplier",
    role: "supplier",
    description: "External supplier with limited access",
    avatar: "Su",
    email: "external@supplier.com"
  },
  {
    id: 7,
    name: "Customer",
    role: "customer",
    description: "Receives and processes inbound declarations",
    avatar: "Cu",
    email: "customer@eudrportal.com"
  }
];

export default function PersonaSwitcher() {
  const { user, switchPersona } = useAuth();
  
  const handlePersonaChange = async (personaId: number) => {
    await switchPersona(personaId);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-full h-14 w-14 shadow-lg bg-primary flex items-center justify-center persona-switcher-button">
            <div className="flex flex-col items-center justify-center">
              <UserCircle className="h-6 w-6" />
              <span className="text-xs mt-1">Persona</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 p-2">
          <div className="text-sm font-medium px-2 py-1.5 text-muted-foreground">
            Switch Persona
          </div>
          {personas.map((persona) => (
            <DropdownMenuItem 
              key={persona.id} 
              className={`flex items-center px-2 py-2 cursor-pointer ${user?.email === persona.email ? 'bg-muted' : ''}`}
              onClick={() => handlePersonaChange(persona.id)}
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-2">
                {persona.avatar}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{persona.name}</span>
                <span className="text-xs text-muted-foreground">{persona.description}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}