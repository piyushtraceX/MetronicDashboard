import { cn, getInitials } from "@/lib/utils";

interface SupplierAvatarProps {
  name: string;
  products?: string;
  riskLevel?: string;
  className?: string;
}

export default function SupplierAvatar({ name, products, riskLevel, className }: SupplierAvatarProps) {
  const getBackgroundColor = () => {
    if (!riskLevel) return "bg-primary/10 text-primary";
    
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "bg-success/10 text-success";
      case "medium":
        return "bg-warning/10 text-warning";
      case "high":
        return "bg-danger/10 text-danger";
      default:
        return "bg-primary/10 text-primary";
    }
  };
  
  return (
    <div className="flex items-center">
      <div className={cn(
        "flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center",
        getBackgroundColor(),
        className
      )}>
        <span className="font-semibold">{getInitials(name)}</span>
      </div>
      {(name || products) && (
        <div className="ml-4">
          {name && <div className="text-sm font-medium text-gray-900">{name}</div>}
          {products && <div className="text-sm text-gray-500">{products}</div>}
        </div>
      )}
    </div>
  );
}
