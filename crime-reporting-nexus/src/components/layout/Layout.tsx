import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/utils/auth';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="hidden md:block" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          avatarUrl={user?.avatarUrl}
          name={user?.name || ''}
          role={user?.role || ''}
          title="JusticeEcho"
        />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
