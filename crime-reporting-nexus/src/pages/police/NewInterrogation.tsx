import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { transcribeAudio, analyzeEmotions } from '@/utils/groqUtils';
import { Upload, Loader2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const NewInterrogation = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [diarizedContent, setDiarizedContent] = useState<{
    speakers: Array<{
      id: string;
      name: string;
      role: string;
      transcript: string;
    }>;
    summary: string;
    conversation: Array<{
      speaker: string;
      timestamp: string;
      text: string;
    }>;
  } | null>(null);
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<{
    interrogation_analysis: Array<{
      speaker: string;
      text: string;
      behavioral_indicators: {
        stress_level: string;
        cooperation_level: string;
        defensiveness: string;
        consistency: string;
      };
      emotional_state: {
        primary_emotion: string;
        secondary_emotion: string;
        emotional_intensity: string;
        emotional_control: string;
      };
      professional_analysis: {
        interrogation_technique: string;
        effectiveness: string;
        suggested_follow_up: string;
      };
      confidence: number;
      analysis_notes: string;
    }>;
    overall_assessment: {
      interrogation_effectiveness: string;
      key_behavioral_patterns: string[];
      emotional_progression: string;
      areas_of_concern: string[];
      recommendations: string[];
    };
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (WAV, MP3, or M4A)",
          variant: "destructive",
        });
        return;
      }

      if (selectedFile.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Audio file must be less than 25MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setTranscript('');
      setDiarizedContent(null);
      setEmotionalAnalysis(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an audio file first",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // First, transcribe the audio
      const transcription = await transcribeAudio(file);
      setTranscript(transcription);

      // Then, process the transcription for diarization
      const diarizationResponse = await fetch('http://localhost:3001/api/diarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcription }),
      });

      if (!diarizationResponse.ok) {
        const errorData = await diarizationResponse.json();
        throw new Error(errorData.details || errorData.error || 'Failed to process transcription');
      }

      const diarizationResult = await diarizationResponse.json();
      setDiarizedContent(diarizationResult);

      // Analyze emotions
      const emotionsResult = await analyzeEmotions(transcription);
      setEmotionalAnalysis(emotionsResult);

      toast({
        title: "Success",
        description: "Audio has been transcribed and analyzed successfully",
      });
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process the audio file",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!transcript || !diarizedContent || !emotionalAnalysis) {
      toast({
        title: "Missing information",
        description: "Please process an audio file first",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Save to Firebase
      const interrogationData = {
        createdAt: new Date().toISOString(),
        transcript,
        diarizedContent,
        emotionalAnalysis,
        audioFile: file ? {
          name: file.name,
          type: file.type,
          size: file.size,
        } : null,
      };

      await addDoc(collection(db, 'interrogations'), interrogationData);

      toast({
        title: "Success",
        description: "Interrogation record saved successfully",
      });

      // Navigate to interrogations list
      navigate('/police/interrogation');
    } catch (error) {
      console.error('Error saving interrogation:', error);
      toast({
        title: "Error",
        description: "Failed to save interrogation record",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Interrogation</CardTitle>
          <CardDescription>
            Upload an audio file of the interrogation. The system will transcribe the audio and identify different speakers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Click to select or drag and drop your audio file (.mp3, .wav, .m4a)
              </p>
              <div className="relative">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="audio-upload"
                  disabled={processing}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('audio-upload')?.click()}
                  disabled={processing}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </Button>
              </div>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process Audio'
                  )}
                </Button>
              </div>
            )}

            {transcript && (
              <div className="space-y-4">
                <div>
                  <Label>Raw Transcription</Label>
                  <Textarea
                    value={transcript}
                    readOnly
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {diarizedContent && (
              <div className="space-y-4">
                <div>
                  <Label>Summary</Label>
                  <Textarea
                    value={diarizedContent.summary}
                    readOnly
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Conversation Flow</Label>
                  <div className="space-y-4 mt-2">
                    {diarizedContent.conversation.map((entry, index) => (
                      <Card key={`${entry.speaker}-${index}`} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{entry.speaker}</h4>
                              <p className="text-sm text-muted-foreground">{entry.timestamp}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Speaker Information</Label>
                  <div className="space-y-4 mt-2">
                    {diarizedContent.speakers.map((speaker, index) => (
                      <Card key={`${speaker.id}-${index}`} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{speaker.name}</h4>
                              <p className="text-sm text-muted-foreground">{speaker.role}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Interrogation Analysis</Label>
                  <div className="space-y-4 mt-2">
                    {emotionalAnalysis && (
                      <>
                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">Overall Assessment</h4>
                            <div className="space-y-2">
                              <p className="text-sm">
                                <span className="font-medium">Interrogation Effectiveness:</span>{' '}
                                {emotionalAnalysis.overall_assessment.interrogation_effectiveness}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Key Behavioral Patterns:</span>{' '}
                                {emotionalAnalysis.overall_assessment.key_behavioral_patterns.join(', ')}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Emotional Progression:</span>{' '}
                                {emotionalAnalysis.overall_assessment.emotional_progression}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Areas of Concern:</span>{' '}
                                {emotionalAnalysis.overall_assessment.areas_of_concern.join(', ')}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Recommendations:</span>{' '}
                                {emotionalAnalysis.overall_assessment.recommendations.join(', ')}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {emotionalAnalysis.interrogation_analysis.map((entry, index) => (
                          <Card key={`${entry.speaker}-${index}`} className="bg-muted/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">{entry.speaker}</h4>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                      Stress: {entry.behavioral_indicators.stress_level}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                      Cooperation: {entry.behavioral_indicators.cooperation_level}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                      Defensiveness: {entry.behavioral_indicators.defensiveness}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                      Consistency: {entry.behavioral_indicators.consistency}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                                <div className="mt-2 space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                                      Primary: {entry.emotional_state.primary_emotion}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                                      Secondary: {entry.emotional_state.secondary_emotion}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                                      Intensity: {entry.emotional_state.emotional_intensity}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                                      Control: {entry.emotional_state.emotional_control}
                                    </span>
                                  </div>
                                  <p className="text-sm">
                                    <span className="font-medium">Technique:</span>{' '}
                                    {entry.professional_analysis.interrogation_technique}
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">Effectiveness:</span>{' '}
                                    {entry.professional_analysis.effectiveness}
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">Follow-up:</span>{' '}
                                    {entry.professional_analysis.suggested_follow_up}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {entry.analysis_notes}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {emotionalAnalysis && (
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={processing}
                  className="bg-police-blue hover:bg-police-blue/90"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Interrogation Record'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewInterrogation;
