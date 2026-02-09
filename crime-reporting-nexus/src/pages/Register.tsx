import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { useAuthStore } from '@/utils/auth';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AadharData {
  name: string;
  dob: string;
  gender: string;
  aadharNumber: string;
  vid: string;
  issueDate: string;
}

const Register = () => {
  const { user } = useAuthStore(); // Access the logged-in user's information
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharData, setAadharData] = useState<AadharData | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadharFile(file);
    }
  };

  const handleAadharUpload = async () => {
    if (!aadharFile) {
      toast({
        title: "No file selected",
        description: "Please select an Aadhar card image to upload",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', aadharFile);

    try {
      const response = await fetch('http://localhost:5000/process-aadhar', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('Authentication required. Please try again.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process Aadhar card');
      }

      const data = await response.json();
      console.log('Received Aadhar data:', data); // Debug log
      
      if (!data || !data.name) {
        throw new Error('Invalid response from server: Missing required data');
      }

      // Update the aadhar data state with the received data
      setAadharData({
        name: data.name || '',
        dob: data.dob || '',
        gender: data.gender || '',
        aadharNumber: data.aadharNumber || '',
        vid: data.vid || '',
        issueDate: data.issueDate || '',
      });
      
      // Update form data with the name from Aadhar
      setFormData(prev => ({
        ...prev,
        fullName: data.name || prev.fullName, // Keep existing name if no new name is provided
      }));
      
      toast({
        title: "Success",
        description: "Aadhar card processed successfully",
      });
    } catch (error) {
      console.error('Error processing Aadhar card:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process Aadhar card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aadharData) {
      toast({
        title: "Aadhar Verification Required",
        description: "Please upload and verify your Aadhar card first",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        aadharData: {
          name: aadharData.name,
          dob: aadharData.dob,
          gender: aadharData.gender,
          aadharNumber: aadharData.aadharNumber,
          vid: aadharData.vid,
          issueDate: aadharData.issueDate,
        },
        role: 'user',
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully",
      });

      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = "An error occurred during registration. Please try again.";
      
      if (error instanceof Error) {
        // Handle specific Firebase Auth errors
        switch (error.message) {
          case 'auth/email-already-in-use':
            errorMessage = "This email is already registered. Please use a different email or login.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid email address. Please check and try again.";
            break;
          case 'auth/operation-not-allowed':
            errorMessage = "Email/password registration is not enabled. Please contact support.";
            break;
          case 'auth/weak-password':
            errorMessage = "Password is too weak. Please use a stronger password.";
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 bg-fir-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">JE</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-fir-800">JusticeEcho</h1>
        <p className="text-gray-600 mt-2">Register for the Crime Reporting System</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Fill in the details below to create your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aadhar">Aadhar Card Verification</Label>
              <div className="flex gap-2">
                <Input
                  id="aadhar"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={handleAadharUpload}
                  disabled={!aadharFile || loading}
                  className="shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </div>

            {aadharData && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">Verified Aadhar Details</h4>
                <p className="text-sm text-gray-600">
                  Name: <span className="font-medium">{aadharData.name || 'Not available'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Date of Birth: <span className="font-medium">{aadharData.dob || 'Not available'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Gender: <span className="font-medium">{aadharData.gender || 'Not available'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Aadhar Number: <span className="font-medium">{aadharData.aadharNumber || 'Not available'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  VID: <span className="font-medium">{aadharData.vid || 'Not available'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Issue Date: <span className="font-medium">{aadharData.issueDate || 'Not available'}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              className="w-full bg-fir-700 hover:bg-fir-800"
              disabled={loading || !aadharData}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            <p className="text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-fir-600 hover:text-fir-700">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
