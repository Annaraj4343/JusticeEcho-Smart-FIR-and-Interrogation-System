
import { useState, useEffect, useCallback } from 'react';

interface VoiceRecorderOptions {
  onTranscriptionComplete?: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: (audioBlob: Blob) => void;
}

export const useVoiceRecorder = (options: VoiceRecorderOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      
      recorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });
      
      recorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Mock speech-to-text conversion (in real app, use a proper API)
        mockSpeechToText(audioBlob).then((text) => {
          setTranscript(text);
          if (options.onTranscriptionComplete) {
            options.onTranscriptionComplete(text);
          }
        });
        
        if (options.onRecordingStop) {
          options.onRecordingStop(audioBlob);
        }
      });
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      if (options.onRecordingStart) {
        options.onRecordingStart();
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check your permissions.');
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [mediaRecorder, isRecording]);

  // Mock function to simulate speech-to-text conversion
  const mockSpeechToText = async (blob: Blob): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would send this blob to a speech-to-text API
    // For now, return mock text based on current time to simulate different responses
    const mockTexts = [
      "I would like to report a stolen vehicle. My car was taken from the mall parking lot yesterday evening.",
      "I witnessed a break-in at my neighbor's apartment yesterday around 8 PM.",
      "I need to file a complaint about repeated harassment at my workplace.",
      "My phone was snatched by someone on a motorcycle while I was walking in the park.",
    ];
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  };

  useEffect(() => {
    // Cleanup function to stop recording if component unmounts while recording
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaRecorder, isRecording]);

  return {
    isRecording,
    transcript,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
  };
};
