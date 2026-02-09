import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/utils/auth';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon, label, href, active, onClick
}) => {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-fir-100",
        active ? "bg-fir-100 text-fir-800 font-medium" : "text-gray-600"
      )}
    >
      <span className={active ? "text-fir-600" : "text-gray-500"}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const renderUserMenu = () => (
    <>
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        label="Dashboard"
        href="/dashboard"
        active={location.pathname === '/dashboard'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>}
        label="My FIRs"
        href="/my-firs"
        active={location.pathname === '/my-firs'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>}
        label="File Voice FIR"
        href="/file-fir"
        active={location.pathname === '/file-fir'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        label="Profile"
        href="/profile"
        active={location.pathname === '/profile'}
      />
    </>
  );

  const renderPoliceMenu = () => (
    <>
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        label="Dashboard"
        href="/police/dashboard"
        active={location.pathname === '/police/dashboard'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>}
        label="All FIRs"
        href="/police/all-firs"
        active={location.pathname === '/police/all-firs'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>}
        label="File Voice FIR"
        href="/police/file-fir"
        active={location.pathname === '/police/file-fir'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15V6m-4-3v18m-8-6v6m-4-9v9"/><circle cx="17" cy="3" r="1"/><circle cx="9" cy="9" r="1"/><circle cx="5" cy="12" r="1"/></svg>}
        label="Interrogation"
        href="/police/interrogation"
        active={location.pathname.includes('/police/interrogation')}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        label="Profile"
        href="/profile"
        active={location.pathname === '/profile'}
      />
    </>
  );

  const renderAdminMenu = () => (
    <>
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        label="Admin Dashboard"
        href="/admin/dashboard"
        active={location.pathname === '/admin/dashboard'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        label="Manage Users"
        href="/admin/users"
        active={location.pathname === '/admin/users'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>}
        label="Manage FIRs"
        href="/admin/firs"
        active={location.pathname === '/admin/firs'}
      />
      <SidebarItem 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>}
        label="System Logs"
        href="/admin/logs"
        active={location.pathname === '/admin/logs'}
      />
    </>
  );

  return (
    <div className={cn(
      "flex flex-col justify-between h-screen bg-white border-r border-gray-200 py-6",
      isCollapsed ? "w-[70px]" : "w-[250px]",
      className
    )}>
      <div className="px-3 space-y-2">
        <div className="mb-8">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-3">
              <span className="text-lg font-semibold text-fir-800">JusticeEcho</span>
              <button 
                onClick={() => setIsCollapsed(true)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-5 w-5"
                >
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button 
                onClick={() => setIsCollapsed(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-5 w-5"
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-3 pt-2">
              {user.role === 'user' && (
                <>
                  <Link to="/dashboard" className={cn("p-2 rounded-lg", location.pathname === '/dashboard' ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </Link>
                  <Link to="/my-firs" className={cn("p-2 rounded-lg", location.pathname === '/my-firs' ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1-2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                  </Link>
                  <Link to="/file-fir" className={cn("p-2 rounded-lg", location.pathname === '/file-fir' ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  </Link>
                </>
              )}
              {user.role === 'police' && (
                <>
                  <Link to="/police/dashboard" className={cn("p-2 rounded-lg", location.pathname === '/police/dashboard' ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </Link>
                  <Link to="/police/all-firs" className={cn("p-2 rounded-lg", location.pathname === '/police/all-firs' ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                  </Link>
                  <Link to="/police/interrogation" className={cn("p-2 rounded-lg", location.pathname.includes('/police/interrogation') ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15V6m-4-3v18m-8-6v6m-4-9v9"/><circle cx="17" cy="3" r="1"/><circle cx="9" cy="9" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard" className={cn("p-2 rounded-lg", location.pathname === '/admin/dashboard' ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </Link>
                  <Link to="/admin/users" className={cn("p-2 rounded-lg", location.pathname === '/admin/users' ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </Link>
                  <Link to="/admin/firs" className={cn("p-2 rounded-lg", location.pathname === '/admin/firs' ? "bg-fir-100 text-fir-600" : "text-gray-500 hover:bg-fir-50")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {user.role === 'user' && renderUserMenu()}
              {user.role === 'police' && renderPoliceMenu()}
              {user.role === 'admin' && renderAdminMenu()}
            </>
          )}
        </div>
      </div>
      
      <div className="px-3">
        <div className={cn(
          "bg-fir-50 rounded-lg p-3",
          isCollapsed ? "text-center" : ""
        )}>
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mx-auto text-fir-600"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-fir-600"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                <h3 className="font-medium text-fir-800">Need Help?</h3>
              </div>
              <p className="text-xs text-gray-600">
                Contact our support team for assistance with using the JusticeEcho system.
              </p>
              <button className="w-full bg-fir-600 text-white text-sm font-medium py-1 px-2 mt-3 rounded hover:bg-fir-700 transition-colors">
                Get Support
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
