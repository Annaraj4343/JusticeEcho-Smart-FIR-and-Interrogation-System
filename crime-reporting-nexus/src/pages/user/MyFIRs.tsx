import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/utils/auth';
import { FIR } from '@/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Correct relative path

const MyFIRs = () => {
  const { user } = useAuthStore(); // Get the authenticated user
  const [firList, setFIRList] = useState<FIR[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFIRs, setFilteredFIRs] = useState<FIR[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFIRs = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Query Firestore to fetch FIRs created by the current user
        const firCollection = collection(db, 'My fir');
        const q = query(firCollection, where('reportedBy.name', '==', user.name));
        const querySnapshot = await getDocs(q);

        const userFIRs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('Fetched FIRs:', userFIRs); // Debugging log

        console.log('State before update:', firList); // Debugging log
        setFIRList(userFIRs);
        console.log('State after update:', userFIRs); // Debugging log

        setFilteredFIRs(userFIRs);
      } catch (error) {
        console.error('Error fetching FIRs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFIRs();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFIRs(firList);
    } else {
      const normalizedQuery = searchQuery.toLowerCase();
      const filtered = firList.filter(fir =>
        fir.title.toLowerCase().includes(normalizedQuery) ||
        fir.description.toLowerCase().includes(normalizedQuery) ||
        fir.id.toLowerCase().includes(normalizedQuery)
      );
      setFilteredFIRs(filtered);
    }
  }, [searchQuery, firList]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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
          <h1 className="text-3xl font-bold tracking-tight">My FIRs</h1>
          <p className="text-gray-500">View and track all your filed complaints</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild className="bg-fir-700 hover:bg-fir-800">
            <Link to="/file-fir">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              File New Voice FIR
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <Input
            type="search"
            placeholder="Search by title, description or ID..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <svg className="animate-spin h-10 w-10 text-fir-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-500">Loading your FIRs...</span>
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
                      <span className={`mt-1 md:mt-0 px-2 py-1 inline-flex text-xs font-semibold rounded-md ${getStatusColor(fir.status)}`}>
                        {fir.status.charAt(0).toUpperCase() + fir.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="text-gray-500 text-sm mb-2">
                      Filed on {formatDate(fir.createdAt)} • FIR #{fir.id}
                    </div>
                    
                    <p className="text-gray-700 line-clamp-2 mb-3">{fir.description}</p>
                    
                    <div className="space-y-1 mb-4 md:mb-0">
                      <div className="flex items-start space-x-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400 mt-0.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="text-gray-600">{fir.location}</span>
                      </div>
                      
                      {fir.assignedOfficer && (
                        <div className="flex items-start space-x-2 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400 mt-0.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          <span className="text-gray-600">Assigned to: {fir.assignedOfficer}</span>
                        </div>
                      )}
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
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full md:w-auto"
                      asChild
                    >
                      <Link to={`/fir/${fir.id}`}>
                        View Details
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
          {firList.length === 0 ? (
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mx-auto text-gray-400 mb-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No FIRs Filed Yet</h2>
              <p className="text-gray-500 mb-4">
                You haven't filed any FIRs yet. Click the button below to file your first FIR.
              </p>
              <Button asChild className="bg-fir-700 hover:bg-fir-800">
                <Link to="/file-fir">
                  File New FIR
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mx-auto text-gray-400 mb-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Results Found</h2>
              <p className="text-gray-500">
                No FIRs match your search query. Try different keywords or clear the search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyFIRs;
