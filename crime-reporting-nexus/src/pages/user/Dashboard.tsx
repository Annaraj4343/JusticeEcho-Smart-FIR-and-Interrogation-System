import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from '@/utils/auth';

interface FIR {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: Timestamp;
  date: string;
  location: string;
  priority: string;
  reportedBy: {
    name: string;
    phone: string;
    uid: string;
  };
  assignedTo?: string;
  latestUpdate?: string;
}

interface DashboardStats {
  total: number;
  pendingReview: {
    new: number;
    inReview: number;
    total: number;
  };
  resolved: {
    approved: number;
    completed: number;
    total: number;
  };
  highPriority: number;
  statusDistribution: {
    pending: number;
    reviewing: number;
    approved: number;
    completed: number;
    rejected: number;
  };
  priorityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

const Dashboard: React.FC = () => {
  const [firs, setFirs] = useState<FIR[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pendingReview: { new: 0, inReview: 0, total: 0 },
    resolved: { approved: 0, completed: 0, total: 0 },
    highPriority: 0,
    statusDistribution: {
      pending: 0,
      reviewing: 0,
      approved: 0,
      completed: 0,
      rejected: 0
    },
    priorityDistribution: {
      high: 0,
      medium: 0,
      low: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const fetchAndProcessFIRs = async () => {
      setLoading(true);
      setError(null);
      try {
        const firCollection = collection(db, 'My fir');
        const q = query(firCollection, where('reportedBy.name', '==', user.name));
        const querySnapshot = await getDocs(q);

        const firsData: FIR[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as FIR[];

        // Calculate stats
        const newStats: DashboardStats = {
          total: firsData.length,
          pendingReview: {
            new: firsData.filter(fir => fir.status === 'pending').length,
            inReview: firsData.filter(fir => fir.status === 'reviewing').length,
            total: firsData.filter(fir => ['pending', 'reviewing'].includes(fir.status)).length
          },
          resolved: {
            approved: firsData.filter(fir => fir.status === 'approved').length,
            completed: firsData.filter(fir => fir.status === 'completed').length,
            total: firsData.filter(fir => ['approved', 'completed'].includes(fir.status)).length
          },
          highPriority: firsData.filter(fir => fir.priority === 'high').length,
          statusDistribution: {
            pending: (firsData.filter(fir => fir.status === 'pending').length / firsData.length) * 100 || 0,
            reviewing: (firsData.filter(fir => fir.status === 'reviewing').length / firsData.length) * 100 || 0,
            approved: (firsData.filter(fir => fir.status === 'approved').length / firsData.length) * 100 || 0,
            completed: (firsData.filter(fir => fir.status === 'completed').length / firsData.length) * 100 || 0,
            rejected: (firsData.filter(fir => fir.status === 'rejected').length / firsData.length) * 100 || 0
          },
          priorityDistribution: {
            high: firsData.filter(fir => fir.priority === 'high').length,
            medium: firsData.filter(fir => fir.priority === 'medium').length,
            low: firsData.filter(fir => fir.priority === 'low').length
          }
        };

        setFirs(firsData);
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching FIRs:', error);
        setError('Failed to fetch FIR data. Please try again later.');
        toast.error('Failed to fetch FIR data');
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessFIRs();
  }, [user, isAuthenticated, navigate]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp?.seconds) return 'Invalid Date';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Error Loading Dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* User Dashboard Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
            <p className="text-blue-100">Welcome back, {user?.name || 'User'}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/file-fir"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 bg-white hover:bg-blue-100 text-blue-700 border-2 border-blue-100 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                <path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
              File New FIR
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Your Total FIRs</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-500">Under Review</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingReview.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Resolved FIRs</h3>
          <p className="text-3xl font-bold text-green-600">{stats.resolved.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
          <p className="text-3xl font-bold text-red-600">{stats.highPriority}</p>
        </div>
      </div>

      {/* Recent FIRs */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Your Recent FIRs</h3>
          <Link to="/my-firs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All FIRs →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">FIR ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Priority</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {firs.slice(0, 5).map((fir) => (
                <tr key={fir.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{fir.id}</td>
                  <td className="py-3 px-4 text-sm">{fir.title}</td>
                  <td className="py-3 px-4 text-sm">{formatDate(fir.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(fir.status)}`}>
                      {fir.status.charAt(0).toUpperCase() + fir.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${getPriorityStyle(fir.priority)}`}>
                      {fir.priority.charAt(0).toUpperCase() + fir.priority.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/fir/${fir.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 