import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/utils/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface UserData {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  aadharData: {
    name: string;
    dob: string;
    gender: string;
    aadharNumber: string;
    vid: string;
    issueDate: string;
  };
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-gray-500">Your profile information and verification details</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Full Name</h3>
                <p className="text-gray-700">{userData?.fullName}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Email</h3>
                <p className="text-gray-700">{userData?.email}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Phone</h3>
                <p className="text-gray-700">{userData?.phone}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Account Type</h3>
                <p className="text-gray-700 capitalize">{userData?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aadhar Verification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {userData?.aadharData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Aadhar Name</h3>
                  <p className="text-gray-700">{userData.aadharData.name}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Date of Birth</h3>
                  <p className="text-gray-700">{userData.aadharData.dob}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Gender</h3>
                  <p className="text-gray-700">{userData.aadharData.gender}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Aadhar Number</h3>
                  <p className="text-gray-700">
                    {userData.aadharData.aadharNumber.replace(/(\d{4})/g, '$1 ').trim()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">VID</h3>
                  <p className="text-gray-700">{userData.aadharData.vid}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Issue Date</h3>
                  <p className="text-gray-700">{userData.aadharData.issueDate}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M34 40h10v-4a10 10 0 00-10-10M4 40h10m20-24a10 10 0 11-20 0 10 10 0 0120 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Aadhar Details Found</h3>
                <p className="text-gray-500 mb-4">
                  Please complete your Aadhar verification to see your profile information.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/aadhar-verification">
                    Complete Verification
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-x-4">
              <Button variant="outline" asChild>
                <Link to="/update-profile">
                  Update Profile
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/change-password">
                  Change Password
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
