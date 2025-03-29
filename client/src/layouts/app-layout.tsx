import { ReactNode } from "react";
import { SidebarContext } from "@/hooks/use-sidebar";
import { useSidebarProvider } from "@/hooks/use-sidebar";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import PersonaSwitcher from "@/components/persona-switcher";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const sidebarProps = useSidebarProvider();
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <div className="bg-[#1e1e2d] text-[#9899ac] w-64 flex-shrink-0 hidden md:block">
          <div className="h-16 flex items-center px-6 border-b border-gray-700">
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="p-4 space-y-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
          <main className="flex-1 overflow-y-auto p-5">
            <div className="flex flex-col space-y-5">
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Skeleton className="h-80 w-full lg:col-span-2" />
                <Skeleton className="h-80 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <SidebarContext.Provider value={sidebarProps}>
      <div className="flex h-screen overflow-hidden bg-[#f5f8fa]">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-5">
            {children}
          </main>
          {/* Add persona switcher */}
          <PersonaSwitcher />
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
