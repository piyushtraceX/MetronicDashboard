import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
  index: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}

function Step({ index, title, isActive, isCompleted }: StepProps) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border transition-colors",
          isActive ? "bg-primary border-primary text-white" : 
          isCompleted ? "bg-primary/10 border-primary text-primary" : 
          "bg-gray-100 border-gray-300 text-gray-500"
        )}
      >
        {isCompleted ? <Check className="h-4 w-4" /> : index}
      </div>
      <span 
        className={cn(
          "mt-2 text-xs font-medium", 
          isActive ? "text-primary" : 
          isCompleted ? "text-primary" : 
          "text-gray-500"
        )}
      >
        {title}
      </span>
    </div>
  );
}

interface StepConfig {
  label: string;
  completed?: boolean;
}

interface StepperProps {
  steps: (string | StepConfig)[];
  currentStep: number;
  completedSteps?: number[];
}

export default function Stepper({ steps, currentStep, completedSteps = [] }: StepperProps) {
  return (
    <div className="flex justify-between items-start w-full">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        
        // Handle both formats of completed steps
        let isCompleted = false;
        if (typeof step === 'object' && 'completed' in step) {
          isCompleted = !!step.completed;
        } else if (completedSteps) {
          isCompleted = completedSteps.includes(stepNumber);
        }
        
        const stepTitle = typeof step === 'string' ? step : step.label;
        
        return (
          <div key={index} className="flex items-center flex-1">
            <Step 
              index={stepNumber}
              title={stepTitle}
              isActive={isActive}
              isCompleted={isCompleted}
            />
            
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  isCompleted || (completedSteps && completedSteps.includes(stepNumber) && isActive) ? 
                  "bg-primary" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}