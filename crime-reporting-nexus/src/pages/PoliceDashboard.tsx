import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { toast } from 'react-hot-toast';

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
  };
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

const PoliceDashboard: React.FC = () => {
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

  useEffect(() => {
    const fetchFIRs = async () => {
      try {
        const firsRef = collection(db, 'My fir');
        const q = query(firsRef);
        const querySnapshot = await getDocs(q);
        
        const firsData: FIR[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Parse the description string to extract JSON data if it exists
          let parsedDescription = data.description;
          try {
            if (typeof data.description === 'string' && data.description.includes('json')) {
              const jsonMatch = data.description.match(/json\s*{([^}]+)}/);
              if (jsonMatch) {
                const jsonStr = '{' + jsonMatch[1] + '}';
                const parsed = JSON.parse(jsonStr);
                parsedDescription = parsed.description || parsed.title || data.description;
              }
            }
          } catch (e) {
            console.error('Error parsing description:', e);
          }

          firsData.push({
            id: doc.id,
            title: data.title || parsedDescription?.title || 'Untitled FIR',
            description: parsedDescription || '',
            status: data.status || 'pending',
            createdAt: data.createdAt,
            date: data.date || '',
            location: data.location || 'Location not specified',
            priority: data.priority || 'medium',
            reportedBy: {
              name: data.reportedBy?.name || 'Anonymous',
              phone: data.reportedBy?.phone || 'Unknown'
            }
          });
        });

        // Sort FIRs by createdAt timestamp in descending order (most recent first)
        firsData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setFirs(firsData);
        
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
        
        setStats(newStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching FIRs:', error);
        toast.error('Failed to fetch FIR data');
        setLoading(false);
      }
    };

    fetchFIRs();
  }, []);

  const getStatusBadgeStyle = (status: FIR['status']) => {
    switch (status) {
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

  const getPriorityStyle = (priority: FIR['priority']) => {
    switch (priority) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Police Dashboard</h1>
          <p className="text-gray-500">Welcome back, Officer Smith</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Link 
            to="/police/file-fir"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground h-10 px-4 py-2 bg-fir-700 hover:bg-fir-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
              <path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" x2="12" y1="19" y2="22"></line>
            </svg>
            File New Voice FIR
          </Link>
          <Link
            to="/police/interrogation"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
              <path d="M21 15V6m-4-3v18m-8-6v6m-4-9v9"></path>
              <circle cx="17" cy="3" r="1"></circle>
              <circle cx="9" cy="9" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
            Interrogation
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold tracking-tight text-lg">Total FIRs</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-4xl font-bold">{stats.total}</div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold tracking-tight text-lg">Pending Review</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-4xl font-bold">{stats.pendingReview.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              <span className="inline-block mr-2">New: {stats.pendingReview.new}</span>
              <span>In Review: {stats.pendingReview.inReview}</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold tracking-tight text-lg">Resolved</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-4xl font-bold">{stats.resolved.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              <span className="inline-block mr-2">Approved: {stats.resolved.approved}</span>
              <span>Completed: {stats.resolved.completed}</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold tracking-tight text-lg">High Priority</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-4xl font-bold">{stats.highPriority}</div>
            <div className="text-xs text-gray-500 mt-1">Requires immediate attention</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm lg:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Recent FIRs</h3>
            <p className="text-sm text-muted-foreground">Recently filed complaints requiring attention</p>
          </div>
          <div className="p-6 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Case ID</th>
                    <th className="text-left py-3 px-2 font-medium">Title</th>
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Priority</th>
                    <th className="text-right py-3 px-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {firs.map((fir) => (
                    <tr key={fir.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{fir.id}</td>
                      <td className="py-3 px-2">{fir.title}</td>
                      <td className="py-3 px-2">{fir.date || new Date(fir.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeStyle(fir.status)}`}>
                          {fir.status.charAt(0).toUpperCase() + fir.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`font-medium ${getPriorityStyle(fir.priority)}`}>
                          {fir.priority.charAt(0).toUpperCase() + fir.priority.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          to={`/police/fir/${fir.id}`}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 text-fir-600"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-center">
              <Link
                to="/police/all-firs"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
              >
                View All FIRs
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">FIR Statistics</h3>
            <p className="text-sm text-muted-foreground">Overview of FIR status distribution</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {Object.entries(stats.statusDistribution).map(([status, percentage]) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'pending' ? 'bg-yellow-500' :
                        status === 'reviewing' ? 'bg-blue-500' :
                        status === 'approved' ? 'bg-green-500' :
                        status === 'completed' ? 'bg-green-700' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Priority: High</span>
                  <span className="text-sm text-gray-600">{stats.priorityDistribution.high}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Priority: Medium</span>
                  <span className="text-sm text-gray-600">{stats.priorityDistribution.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Priority: Low</span>
                  <span className="text-sm text-gray-600">{stats.priorityDistribution.low}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard; 