import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (["compliant", "valid", "approved", "completed", "low"].includes(statusLower)) {
      return "bg-success/10 text-success";
    }
    
    if (["pending", "pending review", "in progress", "medium"].includes(statusLower)) {
      return "bg-warning/10 text-warning";
    }
    
    if (["non-compliant", "invalid", "expired", "overdue", "high"].includes(statusLower)) {
      return "bg-danger/10 text-danger";
    }
    
    return "bg-gray-100 text-gray-600";
  };
  
  return (
    <span className={cn(
      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
      getStatusColor(status),
      className
    )}>
      {status}
    </span>
  );
}
