import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/clientApp';
import { Toaster, toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

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

const FIRDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fir, setFir] = useState<FIR | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchFIR = async () => {
      try {
        if (!id) return;
        const firDoc = await getDoc(doc(db, 'My fir', id));
        if (firDoc.exists()) {
          setFir({ id: firDoc.id, ...firDoc.data() } as FIR);
        } else {
          toast.error('FIR not found');
          navigate('/police/dashboard');
        }
      } catch (error) {
        console.error('Error fetching FIR:', error);
        toast.error('Failed to fetch FIR details');
      } finally {
        setLoading(false);
      }
    };

    fetchFIR();
  }, [id, navigate]);

  const updateStatus = async (newStatus: string) => {
    if (!id || !fir) return;
    
    setUpdating(true);
    try {
      const firRef = doc(db, 'My fir', id);
      await updateDoc(firRef, {
        status: newStatus,
        lastUpdated: Timestamp.now()
      });
      
      setFir({ ...fir, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
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

  const getPriorityStyle = (priority: string) => {
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

  if (!fir) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">FIR Not Found</h1>
        <button
          onClick={() => navigate('/police/dashboard')}
          className="text-blue-600 hover:text-blue-800"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">FIR Details</h1>
          <button
            onClick={() => navigate('/police/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">{fir.title}</h2>
              <p className="text-gray-600 mb-4">{fir.description}</p>
              
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Status: </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeStyle(fir.status)}`}>
                    {fir.status.charAt(0).toUpperCase() + fir.status.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Priority: </span>
                  <span className={`font-medium ${getPriorityStyle(fir.priority)}`}>
                    {fir.priority.charAt(0).toUpperCase() + fir.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Location: </span>
                  <span>{fir.location}</span>
                </div>
                <div>
                  <span className="font-medium">Date Filed: </span>
                  <span>{fir.date || new Date(fir.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium">Reported By: </span>
                  <span>{fir.reportedBy.name} ({fir.reportedBy.phone})</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2">Update Status</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateStatus('pending')}
                  disabled={updating || fir.status === 'pending'}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    fir.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  Mark as Pending
                </button>
                <button
                  onClick={() => updateStatus('reviewing')}
                  disabled={updating || fir.status === 'reviewing'}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    fir.status === 'reviewing'
                      ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Mark as Reviewing
                </button>
                <button
                  onClick={() => updateStatus('approved')}
                  disabled={updating || fir.status === 'approved'}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    fir.status === 'approved'
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  Approve FIR
                </button>
                <button
                  onClick={() => updateStatus('completed')}
                  disabled={updating || fir.status === 'completed'}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    fir.status === 'completed'
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-green-700 text-white hover:bg-green-800'
                  }`}
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => updateStatus('rejected')}
                  disabled={updating || fir.status === 'rejected'}
                  className={`px-4 py-2 rounded-md text-sm font-medium col-span-2 ${
                    fir.status === 'rejected'
                      ? 'bg-red-100 text-red-800 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Reject FIR
                </button>
              </div>

              <div className="mt-4">
                <Button 
                  onClick={() => navigate('/police/interrogation/new')}
                  className="w-full bg-police-blue hover:bg-police-blue/90 gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M21 15V6m-4-3v18m-8-6v6m-4-9v9"/>
                    <circle cx="17" cy="3" r="1"/>
                    <circle cx="9" cy="9" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                  </svg>
                  Start Interrogation Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FIRDetail; 