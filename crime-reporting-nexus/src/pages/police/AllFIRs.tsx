import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { FIR } from '@/types';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AllFIRs = () => {
  const [firList, setFIRList] = useState<FIR[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [filteredFIRs, setFilteredFIRs] = useState<FIR[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFIRs = async () => {
      setIsLoading(true);
      try {
        const firCollection = collection(db, 'My fir');
        const querySnapshot = await getDocs(firCollection);
        const firs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || 'pending', // Ensure default status
          priority: doc.data().priority || 'low', // Ensure default priority
          reportedBy: doc.data().reportedBy || { name: 'Unknown', phone: 'N/A' }, // Ensure default reportedBy
        }));
        setFIRList(firs);
        setFilteredFIRs(firs);
      } catch (error) {
        console.error('Error fetching FIRs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFIRs();
  }, []);

  const updateFIRStatus = async (id: string, newStatus: string) => {
    try {
      const firDocRef = doc(db, 'My fir', id);
      await updateDoc(firDocRef, { status: newStatus });
      setFIRList(prev => prev.map(fir => (fir.id === id ? { ...fir, status: newStatus } : fir)));
      setFilteredFIRs(prev => prev.map(fir => (fir.id === id ? { ...fir, status: newStatus } : fir)));
    } catch (error) {
      console.error('Error updating FIR status:', error);
    }
  };

  useEffect(() => {
    let filtered = [...firList];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(fir => fir.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(fir => fir.priority === priorityFilter);
    }

    if (searchQuery.trim() !== '') {
      const normalizedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(fir =>
        fir.title.toLowerCase().includes(normalizedQuery) ||
        fir.description.toLowerCase().includes(normalizedQuery) ||
        fir.id.toLowerCase().includes(normalizedQuery) ||
        fir.location.toLowerCase().includes(normalizedQuery) ||
        fir.reportedBy.name.toLowerCase().includes(normalizedQuery)
      );
    }

    setFilteredFIRs(filtered);
  }, [searchQuery, statusFilter, priorityFilter, firList]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All FIRs</h1>
          <p className="text-gray-500">Manage and review all filed complaints</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild className="bg-fir-700 hover:bg-fir-800">
            <Link to="/police/file-fir">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              File New Voice FIR
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="relative w-full md:w-auto md:flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <Input
            type="search"
            placeholder="Search by title, description, location or name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <svg className="animate-spin h-10 w-10 text-fir-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-500">Loading FIRs...</span>
          </div>
        </div>
      ) : filteredFIRs.length > 0 ? (
        <div className="space-y-4">
          {filteredFIRs.map(fir => (
            <Card key={fir.id} className="hover:border-fir-200 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-2 mb-2">
                      <h2 className="text-xl font-medium">{fir.title}</h2>
                      <div className="flex flex-wrap gap-2 mt-1 md:mt-0">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-md ${getStatusColor(fir.status)}`}>
                          {fir.status.charAt(0).toUpperCase() + fir.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-md ${getPriorityColor(fir.priority)}`}>
                          {fir.priority.charAt(0).toUpperCase() + fir.priority.slice(1)} Priority
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-gray-500 text-sm mb-2">
                      Filed on {formatDate(fir.createdAt)} • FIR #{fir.id}
                    </div>
                    
                    <p className="text-gray-700 line-clamp-2 mb-3">{fir.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-4 md:mb-0">
                      <div className="flex items-start space-x-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400 mt-0.5"><path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/></svg>
                        <span className="text-gray-600">Reported by: {fir.reportedBy.name}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400 mt-0.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="text-gray-600">{fir.location}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400 mt-0.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        <span className="text-gray-600">Incident date: {formatDate(fir.date)}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400 mt-0.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span className="text-gray-600">{fir.assignedOfficer || 'Not assigned yet'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-4 md:flex md:flex-col md:justify-between md:items-end">
                    <div>
                      {fir.updates && fir.updates.length > 0 && (
                        <div className="bg-gray-50 border border-gray-100 rounded-md p-3 text-sm text-gray-700 mb-3 max-w-md">
                          <p className="font-medium text-gray-900 text-xs mb-1">Latest Update:</p>
                          <p className="line-clamp-2">{fir.updates[fir.updates.length - 1].comment}</p>
                        </div>
                      )}
                    </div>
                    
                    <Select value={fir.status} onValueChange={(value) => updateFIRStatus(fir.id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full md:w-auto"
                      asChild
                    >
                      <Link to={`/police/fir/${fir.id}`}>
                        Review FIR
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mx-auto text-gray-400 mb-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Results Found</h2>
            <p className="text-gray-500">
              No FIRs match your search criteria. Try different filters or clear the search.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllFIRs;
