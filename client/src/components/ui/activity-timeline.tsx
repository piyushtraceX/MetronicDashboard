import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getIconForActivityType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document':
        return { icon: 'fa-file-alt', bgColor: 'bg-primary' };
      case 'risk':
        return { icon: 'fa-exclamation-triangle', bgColor: 'bg-warning' };
      case 'compliance':
        return { icon: 'fa-check', bgColor: 'bg-success' };
      case 'issue':
        return { icon: 'fa-times', bgColor: 'bg-danger' };
      default:
        return { icon: 'fa-info-circle', bgColor: 'bg-gray-500' };
    }
  };
  
  const { icon, bgColor } = getIconForActivityType(activity.type);
  
  return (
    <div className="mb-6 ml-6 last:mb-0">
      <div className={cn("absolute w-8 h-8 rounded-full flex items-center justify-center -left-4", bgColor)}>
        <i className={cn(`fas ${icon} text-white text-sm`)}></i>
      </div>
      <div className="flex justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
        </h4>
        <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
      </div>
      <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
    </div>
  );
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="relative">
      <div className="border-l-2 border-gray-200 ml-3">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
