import { useState } from "react";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { personas } from "@/components/persona-switcher";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export default function Header() {
  const { toggle } = useSidebar();
  const { user, logout, switchPersona } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Mobile menu button */}
        <button 
          type="button" 
          className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={toggle}
        >
          <i className="fas fa-bars"></i>
        </button>
        
        {/* Search */}
        <div className="flex-1 flex justify-center lg:justify-end mx-4">
          <div className="w-full max-w-lg lg:max-w-xs relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input 
              id="search" 
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-gray-50 focus:outline-none focus:bg-white focus:border-primary sm:text-sm" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-bell"></i>
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-cog"></i>
          </button>
          
          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.fullName || user?.username} />
                  <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-2 hidden md:block">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.fullName || user?.username}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role?.replace('_', ' ')}
                  </div>
                </div>
                <i className="fas fa-chevron-down ml-1 text-xs text-gray-500"></i>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <i className="fas fa-user mr-2"></i>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <i className="fas fa-cog mr-2"></i>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="cursor-default mt-2">
                <div className="flex items-center">
                  <i className="fas fa-user-friends mr-2"></i>
                  Switch Persona
                  <span className="ml-2 py-0.5 px-1.5 bg-primary/10 text-primary rounded-md text-xs">
                    Test
                  </span>
                </div>
              </DropdownMenuLabel>
              {personas.map(persona => (
                <DropdownMenuItem 
                  key={persona.id}
                  className="cursor-pointer pl-6 flex items-center"
                  onClick={() => switchPersona(persona.id)}
                >
                  <div className={`h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs mr-2 ${user?.email === persona.email ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                    {persona.avatar}
                  </div>
                  {persona.name}
                  {user?.email === persona.email && (
                    <span className="ml-auto text-primary">
                      <i className="fas fa-check"></i>
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
