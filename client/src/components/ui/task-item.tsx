import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn, formatDateRelative, classifyTaskStatus, getInitials } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export interface Task {
  id: number;
  title: string;
  assignedTo: number;
  dueDate?: string;
  status: string;
  priority: string;
  completed: boolean;
}

interface TaskItemProps {
  task: Task;
  assigneeName?: string;
}

export default function TaskItem({ task, assigneeName }: TaskItemProps) {
  const [isCompleted, setIsCompleted] = useState(task.completed);
  
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number, completed: boolean }) => {
      const res = await apiRequest("PUT", `/api/tasks/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    }
  });
  
  const handleToggleComplete = async () => {
    const newCompletedState = !isCompleted;
    setIsCompleted(newCompletedState); // Optimistic update
    
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        completed: newCompletedState
      });
    } catch (error) {
      // Revert on error
      setIsCompleted(isCompleted);
      console.error("Failed to update task status:", error);
    }
  };
  
  const taskStatus = classifyTaskStatus(
    task.dueDate ? new Date(task.dueDate) : null, 
    isCompleted
  );
  
  const getStatusLabel = () => {
    if (isCompleted) return { text: "Completed", color: "text-gray-400" };
    
    switch (taskStatus) {
      case "overdue":
        return { text: "Overdue", color: "text-danger" };
      case "today":
        return { text: "Today", color: "text-warning" };
      default:
        return { text: "Upcoming", color: "text-gray-500" };
    }
  };
  
  const statusInfo = getStatusLabel();
  
  // Get initials for assignee avatar
  const assigneeInitials = assigneeName ? getInitials(assigneeName) : "?";
  
  // Determine avatar color based on priority
  const getAvatarColorClass = () => {
    switch (task.priority) {
      case "high": return "bg-danger";
      case "medium": return "bg-warning";
      case "low": return "bg-success";
      default: return "bg-primary";
    }
  };
  
  return (
    <div className="flex items-start pt-3 first:pt-0 border-t first:border-t-0 border-gray-100">
      <div className="flex-shrink-0">
        <Checkbox 
          checked={isCompleted} 
          onCheckedChange={handleToggleComplete}
          className="h-4 w-4 text-primary border-gray-300 rounded"
        />
      </div>
      <div className="ml-3 flex-1">
        <div className="flex justify-between">
          <h4 className={cn(
            "text-sm font-medium", 
            isCompleted ? "line-through text-gray-400" : "text-gray-900"
          )}>
            {task.title}
          </h4>
          <span className={cn("text-xs font-medium", statusInfo.color)}>
            {statusInfo.text}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xs text-gray-500">Assigned to:</span>
            <div className={cn(
              "ml-2 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs",
              getAvatarColorClass()
            )}>
              {assigneeInitials}
            </div>
          </div>
          <span className="text-xs text-gray-500">
            Due: {task.dueDate ? formatDateRelative(task.dueDate) : "No date"}
          </span>
        </div>
      </div>
    </div>
  );
}
