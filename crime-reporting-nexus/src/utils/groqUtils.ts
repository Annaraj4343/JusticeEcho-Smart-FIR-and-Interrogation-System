import { db } from '@/lib/firebase';

const API_BASE_URL = 'http://localhost:3001/api';

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

export const transcribeAudio = async (audioFile: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await fetch(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to transcribe audio');
    }

    const data = await response.json();

    if (!data.text) {
      throw new Error('No transcription text received from server');
    }

    return data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error instanceof Error ? error : new Error('Failed to transcribe audio');
  }
};

// Function to extract name from transcript
const extractNameFromTranscript = (transcript: string): string | null => {
  // Common Hindi and English name patterns with proper boundaries
  const patterns = [
    // "मेरा नाम" (my name is) followed by name with proper boundary
    /मेरा\s+नाम\s+([^\s,।.]+(?:\s+[^\s,।.]+){0,3})(?:\s+(?:है|हूँ|हैं|और|एंड|and|is)|\s*[,।.]|$)/i,
    
    // "नाम" (name) followed by name with proper boundary
    /नाम\s+([^\s,।.]+(?:\s+[^\s,।.]+){0,3})(?:\s+(?:है|हूँ|हैं|और|एंड|and|is)|\s*[,।.]|$)/i,
    
    // English: "My name is" pattern with proper boundaries
    /my\s+name\s+is\s+([^\s,।.]+(?:\s+[^\s,।.]+){0,3})(?:\s+(?:और|एंड|and)|\s*[,।.]|$)/i,
    
    // English: "name is" pattern with proper boundaries
    /name\s+is\s+([^\s,।.]+(?:\s+[^\s,।.]+){0,3})(?:\s+(?:और|एंड|and)|\s*[,।.]|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted name
      let rawName = match[1].trim();
      
      // Remove trailing conjunctions and prepositions that might get included
      rawName = rawName.replace(/\s+(?:और|एंड|and|my|मेरा|मेरी|का|की|के)\s*$/, '');
      
      // Remove specific Hindi words that might get captured but aren't part of the name
      const cleanName = rawName
        .replace(/है|हूँ|हूं|का|की|के|से|को|और|एक|में|पर|हे|अपना|कि|से|उनका|उनकी/g, '')
        .trim();
      
      if (cleanName && cleanName.length > 1) {
        console.log('Client-side extracted name:', cleanName);
        return cleanName;
      }
    }
  }
  
  // Fallback: Parse the transcript for standard English patterns
  const fallbackPatterns = [
    // Beginning of transcript with name followed by "and"
    /^(?:My\s+name\s+is\s+|I\s+am\s+)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})(?:\s+and\b|,|\.|$)/i
  ];
  
  for (const pattern of fallbackPatterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      console.log('Client extracted name from fallback pattern:', match[1]);
      return match[1].trim();
    }
  }
  
  return null;
};

// Function to extract phone number from transcript
const extractPhoneFromTranscript = (transcript: string): string | null => {
  console.log('Client attempting to extract phone number from transcript');
  
  // First attempt: Look for phone numbers with context
  const contextPatterns = [
    // Hindi patterns with context
    /(?:फोन|मोबाइल|संपर्क|कॉन्टैक्ट|कांटेक्ट|नंबर|फ़ोन)[^\d+]*((?:\+?\d{1,3}[-\.\s]?)?(?:\d{3,4}[-\.\s]?)?\d{3,4}[-\.\s]?\d{3,4})/gi,
    
    // English patterns with context
    /(?:phone|mobile|contact|cell|number)[^\d+]*((?:\+?\d{1,3}[-\.\s]?)?(?:\d{3,4}[-\.\s]?)?\d{3,4}[-\.\s]?\d{3,4})/gi,
    
    // Number pattern with है (is) in Hindi
    /(\d{3,4}[-\.\s]?\d{3,4}[-\.\s]?\d{3,4})\s*है/gi
  ];
  
  for (const pattern of contextPatterns) {
    const matches = Array.from(transcript.matchAll(pattern));
    for (const match of matches) {
      if (match && match[1]) {
        // Clean up the extracted phone
        const cleaned = match[1].replace(/[-\.\s]/g, '');
        if (cleaned.length >= 10 && cleaned.length <= 14) {
          console.log('Client extracted phone with context:', cleaned);
          return cleaned;
        }
      }
    }
  }
  
  // Second attempt: Raw number patterns (less precise but broader catch)
  const rawPatterns = [
    // Common 10-digit Indian phone number
    /\b(?:\+?91)?[-\.\s]?(\d{5}[-\.\s]?\d{5})\b/g,
    /\b(?:\+?91)?[-\.\s]?(\d{4}[-\.\s]?\d{3}[-\.\s]?\d{3})\b/g,
    /\b(?:\+?91)?[-\.\s]?(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4})\b/g,
    
    // Broader pattern as last resort
    /\b(\d{10,12})\b/g
  ];
  
  for (const pattern of rawPatterns) {
    const matches = Array.from(transcript.matchAll(pattern));
    for (const match of matches) {
      // For the broader patterns, we need to verify it's likely a phone number
      const cleaned = match[1] ? match[1].replace(/[-\.\s]/g, '') : 
                    (match[0] ? match[0].replace(/[-\.\s]/g, '') : '');
      
      if (cleaned.length >= 10 && cleaned.length <= 13) {
        console.log('Client extracted raw phone:', cleaned);
        return cleaned;
      }
    }
  }
  
  // Very basic fallback: extract any sequence of 10-12 digits
  const digitMatches = transcript.match(/\d{10,12}/g);
  if (digitMatches && digitMatches.length > 0) {
    console.log('Client extracted digits as fallback:', digitMatches[0]);
    return digitMatches[0];
  }
  
  return null;
};

export const generateFIRFromTranscript = async (transcript: string): Promise<FIRDetails> => {
  try {
    console.log('Sending transcript for FIR generation:', transcript.substring(0, 100) + '...');
    
    // Direct phone number extraction as a backup
    const extractedPhone = extractPhoneFromTranscript(transcript);
    
    // Direct name extraction as a backup
    const extractedName = extractNameFromTranscript(transcript);
    
    if (extractedPhone) {
      console.log('Client-side extracted phone:', extractedPhone);
    }
    
    if (extractedName) {
      console.log('Client-side extracted name:', extractedName);
    }
    
    const response = await fetch(`${API_BASE_URL}/generate-fir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    const responseText = await response.text();
    console.log('FIR generation raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing FIR generation response:', parseError);
      throw new Error(`Failed to parse server response: ${responseText.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Server error generating FIR');
    }
    
    // For direct API responses without server processing
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('Detected direct API response, processing content...');
      const content = data.choices[0].message.content;
      
      let extractedJson = null;
      
      // Method 1: Extract JSON from markdown code blocks if present
      try {
        const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = content.match(codeBlockRegex);
        
        if (match && match[1]) {
          extractedJson = JSON.parse(match[1]);
          console.log('Extracted JSON from code block');
        }
      } catch (err) {
        console.error('Error extracting from code block:', err);
      }
      
      // Method 2: Try direct JSON parsing if method 1 failed
      if (!extractedJson) {
        try {
          extractedJson = JSON.parse(content);
          console.log('Parsed content directly as JSON');
        } catch (err) {
          console.error('Error parsing content directly:', err);
        }
      }
      
      // Method 3: Find JSON using regex if other methods failed
      if (!extractedJson) {
        try {
          const jsonRegex = /(\{[\s\S]*\})/;
          const match = content.match(jsonRegex);
          if (match && match[1]) {
            extractedJson = JSON.parse(match[1]);
            console.log('Extracted JSON using regex');
          }
        } catch (err) {
          console.error('Error extracting with regex:', err);
        }
      }
      
      if (extractedJson) {
        // Create a properly formatted response
        data = {
          success: true,
          data: {
            title: extractedJson.title || '',
            description: extractedJson.description || '',
            location: extractedJson.location || '',
            priority: extractedJson.priority || 'medium',
            witnesses: extractedJson.witnesses || [],
            evidence: extractedJson.evidence || [],
            fullName: extractedJson.fullName || extractedName || 'Not provided',
            contactNumber: extractedJson.contactNumber || extractedPhone || 'Not provided',
            address: extractedJson.address || 'Not provided',
            date: extractedJson.date || null,
            time: extractedJson.time || null
          }
        };
      } else {
        throw new Error('No valid JSON found in API response content');
      }
    }
    
    if (!data.success && !data.data) {
      console.error('Invalid FIR generation response structure:', data);
      
      // Last resort: Create basic data with extracted phone
      if (extractedPhone || extractedName) {
        data = {
          success: true,
          data: {
            title: 'Incident Report',
            description: transcript.substring(0, 500),
            location: 'Location not specified',
            priority: 'medium',
            witnesses: [],
            evidence: [],
            fullName: extractedName || 'Not provided',
            contactNumber: extractedPhone || 'Not provided',
            address: 'Not provided',
            date: new Date().toISOString().split('T')[0],
            time: null
          }
        };
      } else {
        throw new Error('Invalid response from FIR generation');
      }
    }

    // Map the server response to our expected format
    const firDetails: FIRDetails = {
      title: data.data.title || 'Incident Report',
      description: data.data.description || '',
      location: data.data.location || '',
      priority: (data.data.priority as any) || 'medium',
      fullName: data.data.fullName || extractedName || 'Not provided',
      address: data.data.address || 'Not provided',
      contactNumber: data.data.contactNumber || extractedPhone || 'Not provided',
      crimeType: data.data.title || 'Not provided',
      incidentDetails: data.data.description || 'Not provided',
      date: data.data.date || new Date().toISOString().split('T')[0],
      witnesses: Array.isArray(data.data.witnesses) ? data.data.witnesses.join(', ') : 'Not provided',
      additionalDetails: Array.isArray(data.data.evidence) ? data.data.evidence.join(', ') : 'Not provided'
    };

  return firDetails;
  } catch (error) {
    console.error('Error generating FIR from transcript:', error);
    throw error instanceof Error ? error : new Error('Failed to generate FIR from transcript');
  }
};

export const diarizeAudio = async (audioFile: File): Promise<{
  speakers: Array<{
    id: string;
    name: string;
    role: string;
    transcript: string;
  }>;
  summary: string;
}> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch('http://localhost:3001/api/diarize', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to diarize audio');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in diarizeAudio:', error);
    throw error instanceof Error ? error : new Error('Failed to diarize audio');
  }
};

export const analyzeEmotions = async (transcript: string) => {
  try {
    const response = await fetch('http://localhost:3001/api/analyze-emotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || 'Failed to analyze emotions');
    }

    const result = await response.json();
    
    // Validate the structure of the response
    if (!result || !result.interrogation_analysis || !result.overall_assessment) {
      throw new Error('Invalid response structure from emotion analysis');
    }

    // Clean and normalize the response
    const cleanedResponse = {
      interrogation_analysis: result.interrogation_analysis.map((analysis: any) => ({
        speaker: analysis.speaker || '',
        text: analysis.text || '',
        behavioral_indicators: {
          stress_level: analysis.behavioral_indicators?.stress_level || 'medium',
          cooperation_level: analysis.behavioral_indicators?.cooperation_level || 'medium',
          defensiveness: analysis.behavioral_indicators?.defensiveness || 'medium',
          consistency: analysis.behavioral_indicators?.consistency || 'medium'
        },
        emotional_state: {
          primary_emotion: analysis.emotional_state?.primary_emotion || 'neutral',
          secondary_emotion: analysis.emotional_state?.secondary_emotion || 'neutral',
          emotional_intensity: analysis.emotional_state?.emotional_intensity || 'medium',
          emotional_control: analysis.emotional_state?.emotional_control || 'good'
        },
        professional_analysis: {
          interrogation_technique: analysis.professional_analysis?.interrogation_technique || '',
          effectiveness: analysis.professional_analysis?.effectiveness || 'medium',
          suggested_follow_up: analysis.professional_analysis?.suggested_follow_up || ''
        },
        confidence: analysis.confidence || 0.5,
        analysis_notes: analysis.analysis_notes || ''
      })),
      overall_assessment: {
        interrogation_effectiveness: result.overall_assessment.interrogation_effectiveness || 'medium',
        key_behavioral_patterns: Array.isArray(result.overall_assessment.key_behavioral_patterns) 
          ? result.overall_assessment.key_behavioral_patterns 
          : [],
        emotional_progression: result.overall_assessment.emotional_progression || '',
        areas_of_concern: Array.isArray(result.overall_assessment.areas_of_concern)
          ? result.overall_assessment.areas_of_concern
          : [],
        recommendations: Array.isArray(result.overall_assessment.recommendations)
          ? result.overall_assessment.recommendations
          : []
      }
    };

    return cleanedResponse;
  } catch (error) {
    console.error('Error analyzing emotions:', error);
    throw error;
  }
};