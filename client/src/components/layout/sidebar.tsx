import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface SidebarItemProps {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => {
  return (
    <div className="sidebar-item">
      <Link href={href}>
        <div
          className={cn(
            "group flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-[#1b1b28] cursor-pointer",
            active ? "bg-[#1b1b28] text-white" : "text-[#9899ac]"
          )}
        >
          <i className={cn(`fas ${icon} w-5 h-5 mr-3`)}></i>
          {label}
        </div>
      </Link>
    </div>
  );
};

interface SidebarSubItemProps {
  label: string;
  href: string;
  active?: boolean;
}

const SidebarSubItem = ({ label, href, active }: SidebarSubItemProps) => {
  return (
    <div className="sidebar-sub-item ml-7">
      <Link href={href}>
        <div
          className={cn(
            "group flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-[#1b1b28] cursor-pointer",
            active ? "bg-[#1b1b28] text-white" : "text-[#9899ac]"
          )}
        >
          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-3"></span>
          {label}
        </div>
      </Link>
    </div>
  );
};

interface SidebarSectionProps {
  icon: string;
  label: string;
  href?: string;
  active?: boolean;
  subItems?: { label: string; href: string; active?: boolean }[];
  defaultOpen?: boolean;
}

const SidebarSection = ({ icon, label, href, active, subItems, defaultOpen = false }: SidebarSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || active);
  
  if (subItems && subItems.length > 0) {
    return (
      <div className="sidebar-section">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "sidebar-menu-item flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md hover:bg-[#1b1b28] cursor-pointer",
            (active || subItems.some(item => item.active)) ? "bg-[#1b1b28] text-white" : "text-[#9899ac]"
          )}
        >
          <div className="flex items-center">
            <i className={cn(`fas ${icon} w-5 h-5 mr-3`)}></i>
            {label}
          </div>
          <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} text-xs`}></i>
        </div>
        
        {isOpen && (
          <div className="mt-1 mb-1">
            {subItems.map((item, index) => (
              <SidebarSubItem 
                key={index}
                label={item.label}
                href={item.href}
                active={item.active}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="sidebar-section">
      <Link href={href || "#"}>
        <div
          className={cn(
            "sidebar-menu-item flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md hover:bg-[#1b1b28] cursor-pointer",
            active ? "bg-[#1b1b28] text-white" : "text-[#9899ac]"
          )}
        >
          <div className="flex items-center">
            <i className={cn(`fas ${icon} w-5 h-5 mr-3`)}></i>
            {label}
          </div>
          <i className="fas fa-chevron-right text-xs"></i>
        </div>
      </Link>
    </div>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  
  // Check user roles
  const isSupplier = user?.role === 'supplier';
  const isCustomer = user?.role === 'customer';
  const isEuOperator = user?.role === 'eu_operator';
  
  return (
    <aside className={`bg-[#1e1e2d] text-[#9899ac] w-64 flex-shrink-0 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block fixed md:static z-30 h-screen`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
            <span className="ml-3 text-white text-lg font-semibold">EUDR Comply</span>
          </div>
        </Link>
      </div>
      
      {/* Navigation Menu */}
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {/* Dashboard - Available to all users */}
          <SidebarItem
            icon="fa-home"
            label="Dashboard"
            href="/"
            active={location === "/"}
          />
          
          {/* Supply Chain - Available to EU Operators and internal roles */}
          {!isSupplier && !isCustomer && (
            <SidebarSection
              icon="fa-sitemap"
              label="Supply Chain"
              href="/supply-chain"
              active={location === "/supply-chain"}
            />
          )}
          
          {/* Due Diligence section removed as requested */}
          
          {/* Risk Assessment and Documents tabs removed as requested */}
          
          {/* Compliance section with EUDR Declarations submenu */}
          <SidebarSection
            icon="fa-check-circle"
            label="Compliance"
            active={location === "/declarations"}
            subItems={[
              {
                label: isSupplier 
                  ? "Outbound EUDR Declarations" 
                  : isCustomer 
                    ? "Inbound EUDR Declarations" 
                    : "EUDR Declarations",
                href: "/declarations",
                active: location === "/declarations"
              }
            ]}
            defaultOpen={true}
          />
          
          {/* Customers - Not available to suppliers or customers */}
          {!isSupplier && !isCustomer && (
            <SidebarSection
              icon="fa-users"
              label="Customers"
              href="/customers"
              active={location === "/customers"}
            />
          )}
          
          {/* Suppliers section removed as requested */}
          
          {/* Supplier Assessment Questionnaires - Only available to suppliers */}
          {isSupplier && (
            <SidebarSection
              icon="fa-clipboard-check"
              label="Supplier Assessment"
              href="/saqs"
              active={location === "/saqs"}
            />
          )}
          
          {/* Regulatory Updates section removed as requested */}
          
          {/* Compliance and Reports tabs removed as requested */}
          
          {/* Settings - Available to all */}
          <SidebarSection
            icon="fa-cog"
            label="Settings"
            href="/settings"
            active={location === "/settings"}
          />
        </div>
      </nav>
    </aside>
  );
}
