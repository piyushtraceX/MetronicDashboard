import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BadgeProps {
  value: string | number;
  color: "primary" | "success" | "warning" | "danger";
}

function Badge({ value, color }: BadgeProps) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };
  
  return (
    <div className={cn("text-xs font-medium px-2 py-1 rounded-md", colorMap[color])}>
      {value}
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  badge?: {
    value: string | number;
    color: "primary" | "success" | "warning" | "danger";
  };
  value: string | number;
  trend?: {
    value: string | number;
    direction: "up" | "down";
  };
  progress?: {
    value: number;
    color?: string;
  };
  footer?: string;
  icon?: ReactNode;
}

export default function DashboardCard({
  title,
  badge,
  value,
  trend,
  progress,
  footer,
  icon,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {badge && <Badge value={badge.value} color={badge.color} />}
      </div>
      
      <div className="flex items-end">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {trend && (
          <div className={cn(
            "ml-2 text-xs font-medium",
            trend.direction === "up" ? "text-success" : "text-danger"
          )}>
            <i className={cn(
              "fas",
              trend.direction === "up" ? "fa-arrow-up" : "fa-arrow-down",
              "mr-1"
            )}></i>
            {trend.value}
          </div>
        )}
        
        {icon && <div className="ml-auto">{icon}</div>}
      </div>
      
      {progress && (
        <div className="mt-3">
          <Progress 
            value={progress.value} 
            className="h-2" 
            indicatorColor={progress.color}
          />
        </div>
      )}
      
      {footer && <div className="mt-2 text-xs text-gray-500">{footer}</div>}
    </div>
  );
}
