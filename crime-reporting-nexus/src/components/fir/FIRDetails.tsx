import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FIR } from '@/types';
import { useAuthStore } from '@/utils/auth';
import { generateFIRPDF } from '@/utils/pdfUtils';

interface FIRDetailsProps {
  firId: string;
}

const FIRDetails = ({ firId }: FIRDetailsProps) => {
  const [fir, setFir] = useState<FIR | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isPoliceOrAdmin = user?.role === 'police' || user?.role === 'admin';
  
  useEffect(() => {
    const loadFIR = async () => {
      try {
        console.debug('Fetching FIR with ID:', firId); // Debugging log for FIR ID
        const firDoc = await getDoc(doc(db, 'My fir', firId)); // Updated collection name to 'My fir'
        if (firDoc.exists()) {
          const firData = firDoc.data();
          const formattedFir: FIR = {
            id: firId,
            title: firData.title || '',
            description: firData.description || '',
            reportedBy: firData.reportedBy || { name: 'Unknown' },
            date: firData.date || '',
            location: firData.location || '',
            priority: firData.priority || 'low',
            status: firData.status || 'pending',
            updates: firData.updates || [],
            createdAt: firData.createdAt || '',
            updatedAt: firData.updatedAt || '',
            assignedOfficer: firData.assignedOfficer || null,
          };
          setFir(formattedFir);
          setStatus(formattedFir.status);
        } else {
          console.error('FIR not found in Firebase for ID:', firId); // Log error with FIR ID
        }
      } catch (error) {
        console.error('Error fetching FIR from Firebase:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFIR();
  }, [firId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateStatus = async () => {
    if (!comment.trim() && status !== fir?.status) {
      toast({
        title: "Comment Required",
        description: "Please provide a comment explaining the status change.",
        variant: "destructive",
      });
      return;
    }
    
    setUpdating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update local state to simulate the update
    if (fir) {
      const updatedFir = {...fir};
      updatedFir.status = status as any;
      
      if (comment.trim()) {
        const newUpdate = {
          date: new Date().toISOString(),
          comment: comment,
          officerId: user?.id || '',
          officerName: user?.name || '',
        };
        
        updatedFir.updates = updatedFir.updates 
          ? [...updatedFir.updates, newUpdate]
          : [newUpdate];
        
        updatedFir.updatedAt = new Date().toISOString();
      }
      
      setFir(updatedFir);
      setComment('');
    }
    
    setUpdating(false);
    
    toast({
      title: "FIR Updated",
      description: "The FIR status has been updated successfully.",
    });
  };

  const handleGeneratePDF = () => {
    if (fir) {
      generateFIRPDF(fir);
    } else {
      toast({
        title: 'Error',
        description: 'FIR details are not available to generate a PDF.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-fir-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading FIR details...</span>
        </div>
      </div>
    );
  }

  if (!fir) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mx-auto text-gray-400 mb-4"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">FIR Not Found</h2>
          <p className="text-gray-500">
            The requested FIR could not be found. It may have been removed or you may have entered an incorrect ID.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h1 className="text-2xl font-bold">{fir.title}</h1>
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(fir.status)}`}>
              {fir.status.charAt(0).toUpperCase() + fir.status.slice(1)}
            </span>
          </div>
          <div className="text-gray-500">
            FIR ID: {fir.id} • Filed on {formatDate(fir.createdAt)}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          <span className={`px-3 py-1 rounded-md text-sm font-medium ${getPriorityColor(fir.priority)}`}>
            {fir.priority.charAt(0).toUpperCase() + fir.priority.slice(1)} Priority
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>FIR Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">Title</h3>
                  <p className="text-gray-700">{fir.title || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Priority</h3>
                  <p className="text-gray-700 capitalize">{fir.priority || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Location</h3>
                  <p className="text-gray-700">{fir.location || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Reported By</h3>
                  <p className="text-gray-700">{fir.reportedBy?.name || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Incident Date</h3>
                  <p className="text-gray-700">{formatDate(fir.date) || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Assigned Officer</h3>
                  <p className="text-gray-700">{fir.assignedOfficer || 'Not assigned yet'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-100">
                  {fir.description || 'No description provided'}
                </p>
              </div>
              
              {isPoliceOrAdmin && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="font-medium mb-4">Update FIR Status</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="comment">Comment</Label>
                      <Textarea 
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment or note about this status update"
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleUpdateStatus}
                        disabled={updating || (status === fir.status && !comment.trim())}
                        className="bg-fir-700 hover:bg-fir-800"
                      >
                        {updating ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </div>
                        ) : (
                          'Update Status'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {fir.updates && fir.updates.length > 0 ? (
                <div className="relative pl-6 border-l border-gray-200 space-y-6">
                  {fir.updates.map((update, index) => (
                    <div key={index} className="relative pb-6">
                      <div className="absolute -left-[25px] w-5 h-5 rounded-full bg-blue-500"></div>
                      <div className="mb-1">
                        <span className="text-gray-500 text-sm">
                          {formatDateTime(update.date)}
                        </span>
                      </div>
                      <p className="text-gray-800">{update.comment}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        By: {update.officerName}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No updates yet
                </div>
              )}
            </CardContent>
          </Card>
          
          {isPoliceOrAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => {
                    toast({
                      title: "WhatsApp Notification",
                      description: "A notification would be sent to the complainant",
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  Send WhatsApp Update
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => {
                    toast({
                      title: "Interrogation",
                      description: "This would link to the interrogation module",
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M21 15V6m-4-3v18m-8-6v6m-4-9v9"/><circle cx="17" cy="3" r="1"/><circle cx="9" cy="9" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  Start Interrogation Session
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleGeneratePDF}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                  Print FIR
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FIRDetails;
