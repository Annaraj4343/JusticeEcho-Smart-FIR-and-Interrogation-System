import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import FormData from 'form-data';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import twilio from 'twilio';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with existing config
const firebaseConfig = {
  apiKey: "AIzaSyCpszU3qqpaPKNjtX-yxI29urLJxLPHZSM",
  authDomain: "justiceecho-168ea.firebaseapp.com",
  projectId: "justiceecho-168ea",
  storageBucket: "justiceecho-168ea.appspot.com",
  messagingSenderId: "1048109030048",
  appId: "1:1048109030048:web:0ecdf8237d200fa78007c5",
  measurementId: "G-FPMGY28RH4"
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: firebaseConfig.projectId
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // Initialize with API key

const app = express();

// Configure Twilio

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Audio file must be less than 25MB'
      });
    }
  }
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Proxy endpoint for audio transcription
app.post('/api/transcribe', multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(__dirname, 'temp');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, `audio-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    const allowedTypes = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Only WAV, MP3, or M4A files are allowed'));
    } else {
      cb(null, true);
    }
  }
}).single('file'), async (req, res) => {
  let filePath;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    filePath = req.file.path;

    // Create a file stream from the uploaded file
    const fileStream = fs.createReadStream(filePath);

    // Use Groq SDK for transcription
    const transcription = await groq.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    res.json({
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration
    });
  } catch (error) {
    console.error('Error in transcription:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Clean up the uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
  }
});

// Function to extract name from Hindi transcript
const extractNameFromTranscript = (transcript) => {
  console.log('Attempting to extract name from transcript directly');
  
  // Common Hindi name patterns with proper boundaries
  const patterns = [
    // "मेरा नाम" (my name is) followed by name ending with clear boundaries
    /मेरा\s+नाम\s+([^\s,।.]+(?:\s+[^\s,।.]+){0,3})(?:\s+(?:है|हूँ|हैं|और|एंड|and|is)|\s*[,।.]|$)/i,
    
    // "नाम" (name) followed by name ending with clear boundaries
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
        console.log('Extracted name:', cleanName);
        return cleanName;
      }
    }
  }
  
  // Fallback: look for simple name introduction with fewer words
  const simplePatterns = [
    // Simple "I am [Name]" pattern in English
    /I\s+am\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
    
    // Name at the beginning of sentence with clear ending
    /^My\s+name\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i
  ];
  
  for (const pattern of simplePatterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      console.log('Extracted name from simple pattern:', match[1]);
      return match[1].trim();
    }
  }
  
  return null;
};

// Function to extract phone number from transcript
const extractPhoneFromTranscript = (transcript) => {
  console.log('Attempting to extract phone number from transcript directly');
  
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
    const matches = transcript.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        // Clean up the extracted phone
        const cleaned = match[1].replace(/[-\.\s]/g, '');
        if (cleaned.length >= 10 && cleaned.length <= 14) {
          console.log('Extracted phone with context:', cleaned);
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
    const matches = transcript.matchAll(pattern);
    for (const match of matches) {
      // For the broader patterns, we need to verify it's likely a phone number
      const cleaned = match[1] ? match[1].replace(/[-\.\s]/g, '') : 
                      (match[0] ? match[0].replace(/[-\.\s]/g, '') : '');
      
      if (cleaned.length >= 10 && cleaned.length <= 13) {
        console.log('Extracted raw phone:', cleaned);
        return cleaned;
      }
    }
  }
  
  // Very basic fallback: extract any sequence of 10-12 digits
  const digitMatches = transcript.match(/\d{10,12}/g);
  if (digitMatches && digitMatches.length > 0) {
    console.log('Extracted digits as fallback:', digitMatches[0]);
    return digitMatches[0];
  }
  
  return null;
};

// Proxy endpoint for FIR generation
app.post('/api/generate-fir', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    console.log('Processing transcript:', transcript.substring(0, 100) + '...');
    
    // Detect language and adjust prompt accordingly
    const isHindi = /[\u0900-\u097F]/.test(transcript); // Check for Hindi Unicode range
    console.log('Detected language:', isHindi ? 'Hindi' : 'English');

    // Direct extraction of key information from transcript
    const extractedPhone = extractPhoneFromTranscript(transcript);
    
    // Extract name from transcript
    const extractedName = extractNameFromTranscript(transcript);
    
    if (extractedPhone) {
      console.log('Phone number extracted directly:', extractedPhone);
    }
    
    if (extractedName) {
      console.log('Name extracted directly:', extractedName);
    }

    // Try different models based on the language
    // Claude-3 Haiku handles multilingual content better for some cases
    const model = isHindi ? "claude-3-haiku-20240307" : "llama-3.3-70b-versatile";
    
    try {
      // Use Groq SDK for chat completion with the selected model
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps generate structured FIR (First Information Report) details from a transcript.
            The transcript is in ${isHindi ? 'Hindi' : 'English'}.
            
            MOST IMPORTANT: Your primary task is to identify and extract:
            1. The full name of the person reporting (in English)
            2. Their contact number/phone number (if present)
            
            Then also extract:
            3. Their address (in English)
            4. Information about the incident including:
               - Title: A concise summary of the incident (in English)
               - Description: Detailed account of what happened (in English)
               - Location: Where the incident occurred (in English)
               - Priority: Assess the severity (high/medium/low)
            
            For Hindi names, transliterate them into English (don't translate, keep the same pronunciation).
            
            Format your response as a valid JSON object with this structure:
            {
              "fullName": string,
              "contactNumber": string,
              "address": string,
              "title": string,
              "description": string,
              "location": string,
              "priority": "high" | "medium" | "low",
              "date": string | null,
              "time": string | null,
              "witnesses": string[],
              "evidence": string[]
            }
            
            Important: Ensure your response contains ONLY the JSON object and nothing else. Do not include any explanations, markdown formatting, or additional text.`
          },
          {
            role: "user",
            content: `Transcript: ${transcript}`
          }
        ],
        model: model,
        temperature: 0.5,
        max_tokens: 1500,
      });

      console.log('Groq API response for model', model, ':', completion.choices[0].message.content.substring(0, 100) + '...');

      // Try to extract and enhance the result before sending
      try {
        const contentStr = completion.choices[0].message.content;
        let jsonContent;
        
        // Try to extract JSON from potential markdown code blocks
        const jsonMatch = contentStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || contentStr.match(/(\{[\s\S]*\})/);
        
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = JSON.parse(jsonMatch[1]);
        } else {
          jsonContent = JSON.parse(contentStr);
        }
        
        // Add directly extracted information if it wasn't found by the model
        if (extractedPhone && (!jsonContent.contactNumber || jsonContent.contactNumber === "Not provided")) {
          jsonContent.contactNumber = extractedPhone;
        }
        
        if (extractedName && (!jsonContent.fullName || jsonContent.fullName === "Not provided")) {
          jsonContent.fullName = extractedName;
        }
        
        // Format and send the response
        const enhancedCompletion = {
          ...completion,
          choices: [{
            ...completion.choices[0],
            message: {
              ...completion.choices[0].message,
              content: JSON.stringify(jsonContent)
            }
          }]
        };
        
        res.json(enhancedCompletion);
      } catch (jsonError) {
        console.error('Error enhancing API response:', jsonError);
        
        // If JSON extraction failed but we have directly extracted information,
        // create a basic response with that information
        if (extractedName || extractedPhone) {
          const basicJson = {
            fullName: extractedName || "Not provided",
            contactNumber: extractedPhone || "Not provided",
            title: "Incident Report",
            description: transcript.substring(0, 300) + "...",
            location: "Not specified",
            priority: "medium",
            date: null,
            time: null,
            witnesses: [],
            evidence: []
          };
          
          const basicResponse = {
            ...completion,
            choices: [{
              ...completion.choices[0],
              message: {
                role: "assistant",
                content: JSON.stringify(basicJson)
              }
            }]
          };
          
          res.json(basicResponse);
        } else {
          // Fall back to sending the original response
          res.json(completion);
        }
      }
    } catch (apiError) {
      console.error(`Error with ${model} model:`, apiError);
      
      // If the first model fails, try the fallback model
      const fallbackModel = isHindi ? "llama-3.3-70b-versatile" : "claude-3-haiku-20240307";
      console.log(`Trying fallback model: ${fallbackModel}`);
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps generate structured FIR (First Information Report) details from a transcript. 
            The transcript is in ${isHindi ? 'Hindi' : 'English'}.
            
            Your PRIMARY task is to extract:
            1. The full name of the person reporting
            2. Their contact number/phone number
            
            Then also extract:
            3. Title: A concise summary of the incident (in English)
            4. Description: Detailed account of what happened (in English)
            5. Location: Where the incident occurred (in English)
            6. Priority: Assess the severity (high/medium/low)
            
            Format your response as a valid JSON object with this structure:
            {
              "fullName": string,
              "contactNumber": string,
              "title": string,
              "description": string,
              "location": string,
              "priority": "high" | "medium" | "low"
            }
            
            Important: Ensure your response contains ONLY the JSON object and nothing else.`
          },
          {
            role: "user",
            content: `Transcript: ${transcript}`
          }
        ],
        model: fallbackModel,
        temperature: 0.5,
        max_tokens: 1000,
      });
      
      console.log('Fallback response:', completion.choices[0].message.content.substring(0, 100) + '...');
      
      // Try to enhance the fallback response
      try {
        const contentStr = completion.choices[0].message.content;
        let jsonContent;
        
        // Try to extract JSON
        const jsonMatch = contentStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || contentStr.match(/(\{[\s\S]*\})/);
        
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = JSON.parse(jsonMatch[1]);
        } else {
          jsonContent = JSON.parse(contentStr);
        }
        
        // Add directly extracted information
        if (extractedPhone && (!jsonContent.contactNumber || jsonContent.contactNumber === "Not provided")) {
          jsonContent.contactNumber = extractedPhone;
        }
        
        if (extractedName && (!jsonContent.fullName || jsonContent.fullName === "Not provided")) {
          jsonContent.fullName = extractedName;
        }
        
        // Update the completion with enhanced content
        const enhancedCompletion = {
          ...completion,
          choices: [{
            ...completion.choices[0],
            message: {
              ...completion.choices[0].message,
              content: JSON.stringify(jsonContent)
            }
          }]
        };
        
        res.json(enhancedCompletion);
      } catch (jsonError) {
        console.error('Error enhancing fallback response:', jsonError);
        
        // If all parsing fails but we have direct extractions, create a basic response
        if (extractedName || extractedPhone) {
          const basicJson = {
            fullName: extractedName || "Not provided",
            contactNumber: extractedPhone || "Not provided",
            title: "Incident Report",
            description: transcript.substring(0, 300) + "...",
            location: "Not specified",
            priority: "medium"
          };
          
          const basicResponse = {
            ...completion,
            choices: [{
              ...completion.choices[0],
              message: {
                role: "assistant",
                content: JSON.stringify(basicJson)
              }
            }]
          };
          
          res.json(basicResponse);
        } else {
          // Fall back to sending the original response
          res.json(completion);
        }
      }
    }
  } catch (error) {
    console.error('Error in FIR generation:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add new endpoint for audio diarization
app.post('/api/diarize', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a conversation analyzer. Your task is to:
1. Identify different speakers in the conversation
2. Create a chronological flow of the conversation
3. Return the result as a JSON object with the following structure:
{
  "conversation": [
    {
      "speaker": "Speaker 1",
      "text": "The exact text spoken",
      "timestamp": "Estimated time in the conversation (e.g., '0:00', '0:30')"
    }
  ],
  "speakers": [
    {
      "id": "speaker1",
      "name": "Speaker 1",
      "role": "Their role in the conversation"
    }
  ],
  "summary": "A brief summary of the conversation"
}

Important:
- Maintain the exact chronological order of the conversation
- Keep the original text as spoken
- Identify speakers consistently throughout the conversation
- Return ONLY the JSON object, no additional text`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    console.log('Groq API Response:', response);

    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('Parsed JSON:', result);

    // Validate response structure
    if (!result.conversation || !Array.isArray(result.conversation) || !result.speakers || !Array.isArray(result.speakers) || !result.summary) {
      throw new Error('Invalid response structure');
    }

    res.json(result);
  } catch (error) {
    console.error('Error in diarization:', error);
    res.status(500).json({ 
      error: 'Failed to process transcription',
      details: error.message 
    });
  }
});

// Add new endpoint for emotion analysis
app.post('/api/analyze-emotions', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert in criminal interrogation and behavioral analysis. Analyze the emotional and behavioral patterns in the provided interrogation transcript.
Format your response as a valid JSON object with the following structure:
{
  "interrogation_analysis": [
    {
      "speaker": "string",
      "text": "string",
      "behavioral_indicators": {
        "stress_level": "low/medium/high",
        "cooperation_level": "low/medium/high",
        "defensiveness": "low/medium/high",
        "consistency": "low/medium/high"
      },
      "emotional_state": {
        "primary_emotion": "string",
        "secondary_emotion": "string",
        "emotional_intensity": "low/medium/high",
        "emotional_control": "poor/fair/good/excellent"
      },
      "professional_analysis": {
        "interrogation_technique": "string",
        "effectiveness": "low/medium/high",
        "suggested_follow_up": "string"
      },
      "confidence": 0.0-1.0,
      "analysis_notes": "string"
    }
  ],
  "overall_assessment": {
    "interrogation_effectiveness": "low/medium/high",
    "key_behavioral_patterns": ["string"],
    "emotional_progression": "string",
    "areas_of_concern": ["string"],
    "recommendations": ["string"]
  }
}`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;

    // Extract JSON from the response and validate it
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);

      // Attempt to clean up common JSON formatting issues
      const cleanedJson = jsonMatch[0]
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/,\s*}/g, '}') // Remove trailing commas in objects
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/([{[,:])\s+/g, '$1') // Remove whitespace after structural characters
        .replace(/\s+([}\],:])/g, '$1'); // Remove whitespace before structural characters

      try {
        result = JSON.parse(cleanedJson);
      } catch (secondError) {
        console.error('Failed to parse cleaned JSON:', secondError);
        throw new Error('Failed to parse response as JSON');
      }
    }

    // Validate the structure
    if (!result.interrogation_analysis || !Array.isArray(result.interrogation_analysis)) {
      throw new Error('Invalid response structure: missing interrogation_analysis array');
    }
    if (!result.overall_assessment) {
      throw new Error('Invalid response structure: missing overall_assessment');
    }

    res.json(result);
  } catch (error) {
    console.error('Error in interrogation analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze interrogation',
      details: error.message 
    });
  }
});

// PDF upload endpoint
app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  const pdfUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ pdfUrl });
});

// WhatsApp notification endpoint
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { to, firData } = req.body;
    
    // Format the message
    const message = `Your FIR has been registered successfully!\n\n` +
                   `FIR ID: ${firData.id}\n` +
                   `Title: ${firData.title}\n` +
                   `Date: ${firData.date}\n\n` +
                   `You can view your FIR PDF here: ${firData.pdfUrl}`;

    // Send WhatsApp message
    const twilioResponse = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
      body: message
    });

    res.json({ success: true, messageSid: twilioResponse.sid });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, aadharData } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Firebase
    const db = admin.firestore();
    const userRef = db.collection('users').doc();
    const userId = userRef.id;

    await userRef.set({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If Aadhar data is provided, store it
    if (aadharData) {
      await userRef.collection('documents').doc('aadhar').set({
        ...aadharData,
        verified: true,
        verificationDate: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        fullName,
        email,
        phone,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in Firebase
    const db = admin.firestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userId,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Update Aadhar data endpoint with Firebase integration
app.post('/api/users/update-aadhar', authenticateToken, async (req, res) => {
  try {
    const { aadharData } = req.body;
    const userId = req.user.userId;

    if (!aadharData) {
      return res.status(400).json({ error: 'Aadhar data is required' });
    }

    // Store Aadhar data in Firebase
    const db = admin.firestore();
    await db.collection('users').doc(userId).collection('documents').doc('aadhar').set({
      ...aadharData,
      verified: true,
      verificationDate: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Aadhar data updated successfully',
      aadharData: {
        ...aadharData,
        verified: true
      }
    });
  } catch (error) {
    console.error('Error updating Aadhar data:', error);
    res.status(500).json({ error: 'Failed to update Aadhar data' });
  }
});

// Get user profile with Aadhar data
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = admin.firestore();
    
    const userDoc = await db.collection('users').doc(userId).get();
    const aadharDoc = await db.collection('users').doc(userId).collection('documents').doc('aadhar').get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const aadharData = aadharDoc.exists ? aadharDoc.data() : null;

    res.json({
      user: {
        id: userId,
        ...userData
      },
      aadharData: aadharData
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Aadhar processing endpoint
app.post('/process-aadhar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create form data to send to Python backend
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    // Forward the file to Python backend
    const response = await fetch('http://localhost:5000/process-aadhar', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Python backend responded with status: ${response.status}`);
    }

    const aadharData = await response.json();

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json(aadharData);
  } catch (error) {
    console.error('Error processing Aadhar card:', error);
    res.status(500).json({ error: 'Failed to process Aadhar card' });
  }
});

// Example: Save FIR without MongoDB
app.post('/api/save-fir', upload.single('audioFile'), async (req, res) => {
  try {
    const { title, description, location, priority, transcript } = req.body;

    // Simulate saving FIR without MongoDB
    const fir = {
      id: Date.now().toString(),
      title,
      description,
      location,
      priority,
      transcript,
      audioFile: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: `/uploads/${req.file.filename}`,
      },
    };

    res.json({ success: true, fir });
  } catch (error) {
    console.error('Error saving FIR:', error);
    res.status(500).json({ error: 'Failed to save FIR' });
  }
});

// Example: Fetch FIRs without MongoDB
app.get('/api/firs', async (req, res) => {
  try {
    // Simulate fetching FIRs without MongoDB
    const firs = []; // Replace with in-memory or mock data
    res.json(firs);
  } catch (error) {
    console.error('Error fetching FIRs:', error);
    res.status(500).json({ error: 'Failed to fetch FIRs' });
  }
});

const PORT = process.env.PORT || 3001;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});