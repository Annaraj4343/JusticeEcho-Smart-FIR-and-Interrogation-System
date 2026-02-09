import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Settings, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  aadharData: {
    name: string;
    dob: string;
    gender: string;
    aadharNumber: string;
    vid: string;
    issueDate: string;
  };
  role: string;
  createdAt: string;
  lastUpdated?: string;
  address?: string;
}

const Profile = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const docRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfileData({
            ...docSnap.data() as UserProfile,
          });
        } else {
          throw new Error('Profile data not found');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, navigate, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const maskAadharNumber = (number: string) => {
    return `XXXX XXXX ${number.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-fir-600" />
          <span className="text-gray-500">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mx-auto text-gray-400 mb-4">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"/>
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Profile Not Found</h2>
          <p className="text-gray-500 mb-4">We couldn't find your profile information.</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-fir-800">Your Profile</h1>
        <p className="text-gray-600 mt-2">View and manage your account details</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate('/edit-profile')} className="text-fir-600 hover:text-fir-700">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" onClick={() => navigate('/change-password')} className="text-fir-600 hover:text-fir-700">
                <KeyRound className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1 text-lg font-semibold">{profileData.fullName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-lg font-semibold">{profileData.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                <p className="mt-1 text-lg font-semibold">{profileData.phone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                <p className="mt-1 text-lg font-semibold capitalize">{profileData.role}</p>
              </div>
              {profileData.address && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1 text-lg font-semibold">{profileData.address}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                <p className="mt-1 text-lg font-semibold">{formatDate(profileData.createdAt)}</p>
              </div>
              {profileData.lastUpdated && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1 text-lg font-semibold">{formatDate(profileData.lastUpdated)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Aadhar Card Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name on Aadhar</h3>
                <p className="mt-1 text-lg font-semibold">{profileData.aadharData.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                <p className="mt-1 text-lg font-semibold">{profileData.aadharData.dob}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                <p className="mt-1 text-lg font-semibold">{profileData.aadharData.gender}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Aadhar Number</h3>
                <p className="mt-1 text-lg font-semibold">{maskAadharNumber(profileData.aadharData.aadharNumber)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">VID</h3>
                <p className="mt-1 text-lg font-semibold">{profileData.aadharData.vid}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issue Date</h3>
                <p className="mt-1 text-lg font-semibold">{profileData.aadharData.issueDate}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => navigate('/aadhar-verification')}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Update Aadhar Details</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;