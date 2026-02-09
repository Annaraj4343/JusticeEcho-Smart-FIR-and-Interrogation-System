import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateInterrogationPDF } from '@/utils/pdfUtils';

const EmotionBadge = ({ emotion }: { emotion: string }) => {
  const getEmotionColor = () => {
    switch(emotion.toLowerCase()) {
      case 'nervous': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'uncertain': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'curious': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getEmotionColor()}`}>
      {emotion}
    </span>
  );
};

const InterrogationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadSession = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'interrogations', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSession({
            id: docSnap.id,
            ...docSnap.data()
          });
        }
      } catch (error) {
        console.error('Error loading interrogation:', error);
        toast({
          title: "Error",
          description: "Failed to load interrogation details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
  }, [id, toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handlePlay = (segmentIndex: number) => {
    setCurrentSegment(segmentIndex);
    setIsPlaying(true);
    
    // Simulate audio playing for a few seconds, then stop
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };
  
  const handlePlayAll = () => {
    toast({
      title: "Playback",
      description: "This would play the entire interrogation audio",
    });
  };
  
  const handleExport = () => {
    if (!session) return;

    try {
      generateInterrogationPDF(session);
      toast({
        title: "Success",
        description: "Report has been exported as PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-police-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading interrogation details...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mx-auto text-gray-400 mb-4"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Session Not Found</h2>
          <p className="text-gray-500 mb-4">
            The requested interrogation session could not be found.
          </p>
          <Button onClick={() => navigate('/police/interrogation')}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interrogation Analysis</h1>
          <p className="text-gray-500">
            Session #{session.id.slice(0, 8)} • {new Date(session.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePlayAll}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Play Full Recording
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversation Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {session.diarizedContent?.speakers?.map((speaker: any, index: number) => (
                <div key={speaker.id} className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${speaker.name.includes('Officer') ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                    {speaker.name}
                  </h3>
                  
                  {session.diarizedContent.conversation
                    .filter((segment: any) => segment.speaker === speaker.name)
                    .map((segment: any, segmentIndex: number) => (
                      <div 
                        key={`${speaker.id}-${segmentIndex}`}
                        className={`p-4 rounded-lg border flex flex-col ${
                          speaker.name.includes('Officer') ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'
                        } ${currentSegment === segmentIndex ? 'ring-2 ring-offset-2 ring-police-blue' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            {segment.timestamp}
                          </span>
                          {session.emotionalAnalysis?.interrogation_analysis[segmentIndex]?.emotional_state?.primary_emotion && (
                            <EmotionBadge emotion={session.emotionalAnalysis.interrogation_analysis[segmentIndex].emotional_state.primary_emotion} />
                          )}
                        </div>
                        <p className="text-gray-700">{segment.text}</p>
                        <div className="flex justify-end mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handlePlay(segmentIndex)}
                            disabled={isPlaying}
                          >
                            {isPlaying && currentSegment === segmentIndex ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            )}
                            {isPlaying && currentSegment === segmentIndex ? 'Playing...' : 'Play'}
                          </Button>
                        </div>
                      </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {session.emotionalAnalysis && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Overall Assessment</h3>
                    <div className="space-y-2">
                      <div className="px-3 py-2 rounded-md bg-gray-50 text-sm">
                        <span className="font-medium">Effectiveness:</span>{' '}
                        {session.emotionalAnalysis.overall_assessment.interrogation_effectiveness}
                      </div>
                      <div className="px-3 py-2 rounded-md bg-gray-50 text-sm">
                        <span className="font-medium">Key Patterns:</span>{' '}
                        {session.emotionalAnalysis.overall_assessment.key_behavioral_patterns.join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Areas of Concern</h3>
                    <div className="space-y-2">
                      {session.emotionalAnalysis.overall_assessment.areas_of_concern.map((concern: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2">!</span>
                          <span className="text-sm">{concern}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Recommendations</h3>
                    <div className="space-y-2">
                      {session.emotionalAnalysis.overall_assessment.recommendations.map((recommendation: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">✓</span>
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {session.audioFile && (
            <Card>
              <CardHeader>
                <CardTitle>Audio File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {session.audioFile.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Size:</span> {(session.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Type:</span> {session.audioFile.type}
                  </p>
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" size="sm" className="w-full" onClick={handlePlayAll}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Play Recording
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justfy-start text-left" onClick={handleExport}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Export Full Report
              </Button>
              <Button variant="outline" className="w-full justfy-start text-left" onClick={() => navigate('/police/interrogation')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                Back to All Sessions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterrogationDetails;
