import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateFIRPDF } from '@/utils/pdfUtils';

const FIRDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [fir, setFIR] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadFIR = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, 'My fir', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const firData = { id: docSnap.id, ...docSnap.data() };
          console.log('Fetched FIR Data:', firData); // Debugging log
          setFIR(firData);
        } else {
          toast({
            title: 'Error',
            description: 'FIR not found.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading FIR:', error);
        toast({
          title: 'Error',
          description: 'Failed to load FIR details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadFIR();
  }, [id, toast]);

  const handleExport = () => {
    if (!fir) return;

    try {
      const downloadPDF = async () => {
        const pdfBlob = await generateFIRPDF(fir);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `FIR_${fir.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      downloadPDF();
      toast({
        title: 'Success',
        description: 'FIR report exported as PDF.',
      });

      const sendWhatsAppNotification = async () => {
        try {
          const pdfBlob = await generateFIRPDF(fir);
          const pdfUrl = URL.createObjectURL(pdfBlob);

          const response = await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: fir.contactNumber,
              message: `Your FIR has been successfully filed. You can download the PDF here: ${pdfUrl}`,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to send WhatsApp message');
          }

          toast({
            title: 'WhatsApp Notification Sent',
            description: 'The FIR PDF has been sent to the user via WhatsApp.',
          });
        } catch (error) {
          console.error('Error sending WhatsApp message:', error);
          toast({
            title: 'Error',
            description: 'Failed to send WhatsApp notification.',
            variant: 'destructive',
          });
        }
      };

      sendWhatsAppNotification();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report.',
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
          <p className="text-gray-500">The requested FIR could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FIR Details</h1>
          <p className="text-gray-500">FIR #{fir.id}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleExport} className="bg-fir-700 hover:bg-fir-800">
            Export as PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>First Information Report (FIR)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">District</h3>
              <p className="text-gray-700">{fir.district || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-medium">Police Station</h3>
              <p className="text-gray-700">{fir.policeStation || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-medium">FIR Number</h3>
              <p className="text-gray-700">{fir.firNumber || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-medium">Date/Time of FIR</h3>
              <p className="text-gray-700">{fir.dateTime || 'Not specified'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium">Complainant Details</h3>
            <p className="text-gray-700">Name: {fir.fullName || 'Not specified'}</p>
            <p className="text-gray-700">Address: {fir.address || 'Not specified'}</p>
            <p className="text-gray-700">Contact Number: {fir.contactNumber || 'Not specified'}</p>
          </div>

          <div>
            <h3 className="font-medium">Crime Type</h3>
            <p className="text-gray-700">{fir.crimeType || 'Not specified'}</p>
          </div>

          <div>
            <h3 className="font-medium">Additional Details</h3>
            <p className="text-gray-700">{fir.additionalDetails || 'Not specified'}</p>
          </div>

          <div>
            <h3 className="font-medium">Details of Accused</h3>
            {fir.accusedDetails && fir.accusedDetails.length > 0 ? (
              <ul className="list-disc pl-5">
                {fir.accusedDetails.map((accused, index) => (
                  <li key={index} className="text-gray-700">
                    {accused.name} - {accused.details}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">No details provided</p>
            )}
          </div>

          <div>
            <h3 className="font-medium">Description of Incident</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{fir.description || 'No description provided'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FIRDetails;
