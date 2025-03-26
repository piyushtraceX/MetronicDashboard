import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RiskCategoryProps {
  name: string;
  score: number;
  color: string;
}

export default function RiskIndicator({ name, score, color }: RiskCategoryProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={cn("w-3 h-3 rounded-full mr-2")} style={{ backgroundColor: color }}></div>
        <span className="text-sm font-medium text-gray-700">{name}</span>
      </div>
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-900">{score}%</span>
        <div className="ml-2 w-16 h-2 bg-gray-100 rounded-full">
          <div 
            className="h-2 rounded-full" 
            style={{ width: `${score}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
    </div>
  );
}
