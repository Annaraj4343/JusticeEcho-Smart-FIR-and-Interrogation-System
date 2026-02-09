import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { useAuthStore } from '@/utils/auth';
import { db } from '../firebase/clientApp.ts';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AadharData {
  name: string;
  dob: string;
  gender: string;
  aadharNumber: string;
  vid: string;
  issueDate: string;
  verified?: boolean;
  verificationDate?: string;
}

const AadharVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharData, setAadharData] = useState<AadharData | null>(null);

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

    if (!user || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to verify your Aadhar card",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', aadharFile);

    try {
      // Process the Aadhar card
      const response = await fetch('http://localhost:5000/process-aadhar', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process Aadhar card');
      }

      const data = await response.json();
      console.log('Received Aadhar data:', data);
      
      if (!data || !data.name) {
        throw new Error('Invalid response from server: Missing required data');
      }

      // Store Aadhar data in Firebase
      const aadharRef = doc(db, 'users', user.id, 'documents', 'aadhar');
      await setDoc(aadharRef, {
        ...data,
        verified: true,
        verificationDate: new Date().toISOString()
      });

      // Update local state
      setAadharData({
        ...data,
        verified: true,
        verificationDate: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Aadhar card verified and profile updated successfully",
      });

      // Navigate to profile page after successful verification
      navigate('/profile');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load existing Aadhar data if available
  const loadExistingAadharData = async () => {
    if (!user) return;

    try {
      const aadharRef = doc(db, 'users', user.id, 'documents', 'aadhar');
      const aadharDoc = await getDoc(aadharRef);
      
      if (aadharDoc.exists()) {
        setAadharData(aadharDoc.data() as AadharData);
      }
    } catch (error) {
      console.error('Error loading Aadhar data:', error);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadExistingAadharData();
  }, [user]);

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Aadhar Verification</CardTitle>
          <CardDescription>Upload your Aadhar card for verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aadhar">Upload Aadhar Card</Label>
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
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-gray-600">Name:</p>
                <p className="text-sm font-medium">{aadharData.name}</p>
                <p className="text-sm text-gray-600">Date of Birth:</p>
                <p className="text-sm font-medium">{aadharData.dob}</p>
                <p className="text-sm text-gray-600">Gender:</p>
                <p className="text-sm font-medium">{aadharData.gender}</p>
                <p className="text-sm text-gray-600">Aadhar Number:</p>
                <p className="text-sm font-medium">{aadharData.aadharNumber}</p>
                <p className="text-sm text-gray-600">VID:</p>
                <p className="text-sm font-medium">{aadharData.vid}</p>
                <p className="text-sm text-gray-600">Issue Date:</p>
                <p className="text-sm font-medium">{aadharData.issueDate}</p>
                {aadharData.verificationDate && (
                  <>
                    <p className="text-sm text-gray-600">Verification Date:</p>
                    <p className="text-sm font-medium">
                      {new Date(aadharData.verificationDate).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AadharVerification; 