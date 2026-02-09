import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { useAuthStore } from '@/utils/auth';

interface AadharData {
  name: string;
  dob: string;
  gender: string;
  aadharNumber: string;
  vid: string;
  issueDate: string;
}

const AadharUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [aadharData, setAadharData] = useState<AadharData | null>(null);
  const { toast } = useToast();
  const { user } = useAuthStore(); // Access the logged-in user's information

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Aadhar card image to upload",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "User not logged in",
        description: "Please log in to upload your Aadhar card",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (user?.id) {
      formData.append('user_id', user.id); // Include user_id if logged in
    }

    try {
      const response = await fetch('http://localhost:5000/process-aadhar', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to process Aadhar card');
      }

      const data = await response.json();
      setAadharData(data);
      
      toast({
        title: "Success",
        description: "Aadhar card processed and saved successfully",
      });
    } catch (error) {
      console.error('Error processing Aadhar card:', error);
      toast({
        title: "Error",
        description: "Failed to process Aadhar card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Aadhar Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="aadhar">Aadhar Card Image</Label>
            <Input
              id="aadhar"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload and Process
              </>
            )}
          </Button>
        </div>

        {aadharData && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Extracted Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={aadharData.name} readOnly />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input value={aadharData.dob} readOnly />
              </div>
              <div>
                <Label>Gender</Label>
                <Input value={aadharData.gender} readOnly />
              </div>
              <div>
                <Label>Aadhar Number</Label>
                <Input value={aadharData.aadharNumber} readOnly />
              </div>
              <div>
                <Label>VID</Label>
                <Input value={aadharData.vid} readOnly />
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input value={aadharData.issueDate} readOnly />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AadharUpload;