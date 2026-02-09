import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FIR, FIRStatus } from '../types';
import { toast } from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userFIRs, setUserFIRs] = useState<FIR[]>([]);
  const [userStats, setUserStats] = useState<any>({});

  const fetchFIRs = async () => {
    try {
      if (!user?.uid) return;

      const q = query(
        collection(db, 'firs'),
        where('reportedBy.uid', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const firs: FIR[] = [];
      querySnapshot.forEach((doc) => {
        firs.push({ id: doc.id, ...doc.data() } as FIR);
      });

      // Sort the FIRs by createdAt in descending order after fetching
      const sortedFirs = firs.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setUserFIRs(sortedFirs);

      // Calculate statistics using correct FIRStatus values
      const stats = {
        total: sortedFirs.length,
        pending: sortedFirs.filter(fir => fir.status === 'pending').length,
        reviewing: sortedFirs.filter(fir => fir.status === 'reviewing').length,
        approved: sortedFirs.filter(fir => fir.status === 'approved').length,
        rejected: sortedFirs.filter(fir => fir.status === 'rejected').length,
        completed: sortedFirs.filter(fir => fir.status === 'completed').length
      };
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching FIRs:', error);
      toast.error('Failed to fetch FIRs');
    }
  };

  useEffect(() => {
    fetchFIRs();
  }, [user]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default Dashboard; 