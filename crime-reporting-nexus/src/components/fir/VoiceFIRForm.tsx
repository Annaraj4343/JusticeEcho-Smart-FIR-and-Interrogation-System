import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/utils/auth';
import { transcribeAudio, generateFIRFromTranscript } from '@/utils/groqUtils';
import { Loader2, Upload, Mic, StopCircle } from 'lucide-react';
import { generateFIRPDF, sendFIRViaWhatsApp } from '@/utils/pdfUtils';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FIRDetails {
  title: string;
  description: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  fullName?: string;
  address?: string;
  contactNumber?: string;
  crimeType?: string;
  incidentDetails?: string;
  witnesses?: string;
  additionalDetails?: string;
  date?: string;
}

const VoiceFIRForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [firDetails, setFirDetails] = useState<FIRDetails | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (WAV, MP3, or M4A)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Audio file must be less than 25MB",
        variant: "destructive",
      });
      return;
    }

    setAudioFile(file);
  };

  const processAudio = async () => {
    if (!audioFile) {
      toast({
        title: "No audio file",
        description: "Please record or upload an audio file first",
        variant: "destructive",
      });
      return;
    }

    setProcessingAudio(true);
    try {
      // Step 1: Get transcript
      toast({
        title: "Processing",
        description: "Transcribing audio...",
      });
      
      const transcription = await transcribeAudio(audioFile);
      setTranscript(transcription);
      
      // Enhanced phone number extraction
      const extractPhoneNumber = (text: string): string | null => {
        // First try patterns with context
        const contextPatterns = [
          // Hindi patterns with context
          /(?:फोन|मोबाइल|संपर्क|कॉन्टैक्ट|कांटेक्ट|नंबर|फ़ोन)[^\d+]*((?:\+?\d{1,3}[-\.\s]?)?(?:\d{3,4}[-\.\s]?)?\d{3,4}[-\.\s]?\d{3,4})/gi,
          
          // English patterns with context
          /(?:phone|mobile|contact|cell|number)[^\d+]*((?:\+?\d{1,3}[-\.\s]?)?(?:\d{3,4}[-\.\s]?)?\d{3,4}[-\.\s]?\d{3,4})/gi
        ];
        
        for (const pattern of contextPatterns) {
          const matches = Array.from(text.matchAll(pattern));
          for (const match of matches) {
            if (match && match[1]) {
              const cleaned = match[1].replace(/[-\.\s]/g, '');
              if (cleaned.length >= 10 && cleaned.length <= 14) {
                return cleaned;
              }
            }
          }
        }
        
        // Then try direct number patterns
        const numberPatterns = [
          /\b(?:\+?91)?[-\.\s]?(\d{5}[-\.\s]?\d{5})\b/g,
          /\b(?:\+?91)?[-\.\s]?(\d{4}[-\.\s]?\d{3}[-\.\s]?\d{3})\b/g,
          /\b(?:\+?91)?[-\.\s]?(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4})\b/g,
          /\b(\d{10,12})\b/g
        ];
        
        for (const pattern of numberPatterns) {
          const matches = Array.from(text.matchAll(pattern));
          for (const match of matches) {
            const cleaned = match[1] ? match[1].replace(/[-\.\s]/g, '') : 
                           (match[0] ? match[0].replace(/[-\.\s]/g, '') : '');
            
            if (cleaned.length >= 10 && cleaned.length <= 13) {
              return cleaned;
            }
          }
        }
        
        // Last resort: just find any 10-digit sequence
        const digitMatches = text.match(/\d{10,12}/g);
        return digitMatches && digitMatches.length > 0 ? digitMatches[0] : null;
      };
      
      const extractedPhone = extractPhoneNumber(transcription);
      
      // Extract name with enhanced patterns and boundary detection
      const extractName = (text: string): string | null => {
        // Common patterns with proper boundaries
        const patterns = [
          // "My name is" pattern with proper boundary detection
          /my\s+name\s+is\s+([^\s,।.]+(?:\s+[^\s,।.]+){0,3})(?:\s+(?:and|और|एंड)|\s*[,।.]|$)/i,
          
          // Hindi: "मेरा नाम" with proper boundary
          /मेरा\s+नाम\s+([^\s,।.]+(?:\s+[^\s,।.]+){0,3})(?:\s+(?:है|और|एंड|and)|\s*[,।.]|$)/i,
          
          // Name at beginning with clear ending
          /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})(?:\s+and\b|,|\.|$)/i
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            // Remove trailing conjunctions or prepositions
            let name = match[1].trim();
            name = name.replace(/\s+(?:और|एंड|and|my|मेरा|मेरी|का|की|के)$/, '');
            
            if (name && name.length > 1) {
              return name;
            }
          }
        }
        
        return null;
      };
      
      const extractedName = extractName(transcription);
      
      if (extractedName) {
        console.log('Name extracted in component:', extractedName);
      }
      
      if (extractedPhone) {
        console.log('Phone extracted in component:', extractedPhone);
      }
      
      // Step 2: Generate FIR from transcript
      toast({
        title: "Processing",
        description: "Generating FIR from transcript...",
      });
      
      try {
        const firDetails = await generateFIRFromTranscript(transcription);
        
        // If we have locally extracted info that wasn't found by the API, add it
        if (extractedPhone && (!firDetails.contactNumber || firDetails.contactNumber === 'Not provided')) {
          firDetails.contactNumber = extractedPhone;
        }
        
        if (extractedName && (!firDetails.fullName || firDetails.fullName === 'Not provided')) {
          firDetails.fullName = extractedName;
        }
        
        setFirDetails(firDetails);

        // Auto-fill form fields with generated FIR details
        setTitle(firDetails.crimeType || 'Incident Report');
        setDate(firDetails.date || new Date().toISOString().split('T')[0]);
        setDescription(firDetails.incidentDetails || '');
        setLocation(firDetails.location || '');
        setPriority(firDetails.priority || 'medium');

        toast({
          title: "FIR Generated",
          description: "Form fields have been automatically filled based on your audio recording",
        });
        
        // Provide feedback if contact info was extracted directly
        if (extractedPhone && firDetails.contactNumber === extractedPhone) {
          console.log("Phone number was extracted directly from the transcript:", extractedPhone);
        }
        
        if (extractedName && firDetails.fullName === extractedName) {
          console.log("Name was extracted directly from the transcript:", extractedName);
        }
      } catch (firError) {
        console.error('Error generating FIR from transcript:', firError);
        
        // We still have the transcript, so show it to the user
        toast({
          title: "Partial Success",
          description: "Audio transcribed successfully, but we couldn't generate an FIR automatically. Please fill in the details manually.",
        });
        
        // Set default values
        const today = new Date().toISOString().split('T')[0];
        setTitle('Incident Report');
        setDate(today);
        setDescription(transcription.substring(0, 500) + (transcription.length > 500 ? '...' : ''));
        setLocation('');
        setPriority('medium');
        
        // Create a basic FIR details object with whatever we extracted
        setFirDetails({
          title: 'Incident Report',
          description: transcription.substring(0, 500) + (transcription.length > 500 ? '...' : ''),
          location: '',
          priority: 'medium',
          fullName: extractedName || 'Not provided',
          contactNumber: extractedPhone || 'Not provided',
          date: today
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process the audio file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingAudio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !location || !date) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Ensure FIR data is saved to the correct collection
      const firData = {
        title,
        description,
        location,
        date,
        priority,
        status: 'pending',
        reportedBy: {
          name: user?.name || firDetails?.fullName || 'Anonymous',
          phone: (user as any)?.phone || firDetails?.contactNumber || 'Unknown',
        },
        fullName: firDetails?.fullName || 'Not provided',
        address: firDetails?.address || 'Not provided',
        contactNumber: firDetails?.contactNumber || 'Not provided',
        crimeType: firDetails?.crimeType || 'Not provided',
        incidentDetails: firDetails?.incidentDetails || 'Not provided',
        witnesses: firDetails?.witnesses || 'Not provided',
        additionalDetails: firDetails?.additionalDetails || 'Not provided',
        createdAt: new Date().toISOString(),
      };

      console.log('Saving FIR data:', firData); // Debugging log
      const docRef = await addDoc(collection(db, 'My fir'), firData);
      console.log('FIR saved with ID:', docRef.id); // Debugging log

      toast({
        title: "FIR filed successfully",
        description: "Your FIR has been submitted.",
      });

      // Redirect based on user role
      if (user?.role === 'police') {
        navigate('/police/all-firs');
      } else {
        navigate('/my-firs');
      }
    } catch (error) {
      console.error('Error submitting FIR:', error);
      toast({
        title: "Error",
        description: "Failed to submit FIR. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice FIR Form</CardTitle>
          <CardDescription>
            Record or upload an audio file containing your FIR details. Please include the following information in your recording:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">Required Information:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Your full name</li>
              <li>Your address</li>
              <li>Your contact number</li>
              <li>Type of crime reporting</li>
              <li>Incident details</li>
              <li>Where the incident occurred</li>
              <li>When did it occur</li>
              <li>Any witnesses</li>
              <li>Additional details</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                disabled={processingAudio}
              >
                {isRecording ? (
                  <>
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>

              <div className="relative">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-upload"
                  disabled={processingAudio}
                />
                <Label
                  htmlFor="audio-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Audio
                </Label>
              </div>
            </div>

            {audioFile && (
              <Button
                onClick={processAudio}
                disabled={processingAudio}
                className="w-full"
              >
                {processingAudio ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Generate FIR'
                )}
              </Button>
            )}
          </div>

          {transcript && (
            <div className="space-y-4">
              <div>
                <Label>Transcript</Label>
                <Textarea
                  value={transcript}
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {firDetails && (
            <div className="space-y-4">
              <div className="bg-card border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold">Generated FIR Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">Your Full Name</Label>
                    <p className="text-muted-foreground">{firDetails.fullName || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Your Address</Label>
                    <p className="text-muted-foreground">{firDetails.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Your Contact Number</Label>
                    <p className="text-muted-foreground">{firDetails.contactNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Type of Crime Reporting</Label>
                    <p className="text-muted-foreground">{firDetails.crimeType || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Incident Details</Label>
                    <p className="text-muted-foreground whitespace-pre-wrap">{firDetails.incidentDetails || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Where the Incident Occurred</Label>
                    <p className="text-muted-foreground">{firDetails.location || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">When Did It Occur</Label>
                    <p className="text-muted-foreground">{firDetails.date || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Any Witnesses</Label>
                    <p className="text-muted-foreground">{firDetails.witnesses || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Additional Details</Label>
                    <p className="text-muted-foreground whitespace-pre-wrap">{firDetails.additionalDetails || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">FIR Title</Label>
                  <Input 
                    id="title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief title describing the incident"
                    required
                    readOnly={!!firDetails}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Date of Incident</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    readOnly={!!firDetails}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where did the incident take place?"
                    required
                    readOnly={!!firDetails}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={priority} 
                    onValueChange={setPriority}
                    disabled={!!firDetails}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed account of the incident"
                  className="min-h-[150px]"
                  required
                  readOnly={!!firDetails}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => {
                    if (user?.role === 'police') {
                      navigate('/police/dashboard');
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-fir-700 hover:bg-fir-800"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    'Submit FIR'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceFIRForm;
