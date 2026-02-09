import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Groq from 'groq-sdk';
import fs from 'fs';
import { Readable } from 'stream';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { connectDB, Interrogation, FIR } from './src/utils/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const groq = new Groq();

// Connect to MongoDB
connectDB().catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(cors());
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

// Proxy endpoint for audio transcription
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Create a temporary file with .wav extension
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.wav`);
    await writeFile(tempFilePath, req.file.buffer);

    // Create a file stream from the temporary file
    const fileStream = fs.createReadStream(tempFilePath);

    // Use Groq SDK for transcription
    const transcription = await groq.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    // Clean up the temporary file
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });

    res.json(transcription);
  } catch (error) {
    console.error('Error in transcription:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Proxy endpoint for FIR generation
app.post('/api/generate-fir', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Use Groq SDK for chat completion with the correct model
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that helps generate structured FIR (First Information Report) details from a transcript. Extract the title, description, location, and determine priority (high/medium/low) from the given transcript. Please format your response as a JSON object with the following structure: { title: string, description: string, location: string, priority: 'high' | 'medium' | 'low' }"
        },
        {
          role: "user",
          content: transcript
        }
      ],
      model: "llama-3.3-70b-versatile",  // Using the new model
      temperature: 0.7,
      max_tokens: 1000,
    });

    res.json(completion);
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
          content: `You are an expert in criminal interrogation and behavioral analysis. Your task is to analyze the emotional and behavioral patterns in the interrogation transcript, focusing on:
1. Interrogation-specific emotional indicators
2. Behavioral patterns relevant to truthfulness
3. Stress and deception indicators
4. Professional conduct analysis

Return the result as a JSON object with the following structure:
{
  "interrogation_analysis": [
    {
      "speaker": "Speaker 1",
      "text": "The exact text spoken",
      "behavioral_indicators": {
        "emotional_state": ["primary_state", "secondary_state"],
        "stress_level": "low/medium/high",
        "deception_indicators": ["indicator1", "indicator2"],
        "confidence": 0.0-1.0
      },
      "professional_conduct": {
        "compliance": "high/medium/low",
        "cooperation": "high/medium/low",
        "attitude": "cooperative/resistant/neutral"
      },
      "analysis": "Professional analysis of the behavioral patterns"
    }
  ],
  "overall_assessment": {
    "key_behavioral_patterns": ["pattern1", "pattern2"],
    "stress_pattern": "description of stress pattern",
    "professional_conduct_summary": "summary of professional conduct",
    "recommendations": ["recommendation1", "recommendation2"]
  }
}

Important:
- Focus on professional interrogation analysis
- Identify behavioral patterns relevant to truthfulness
- Consider stress and deception indicators
- Maintain professional and objective tone
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
    console.log('Interrogation Analysis Response:', response);

    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('Parsed Interrogation Analysis:', result);

    // Validate response structure
    if (!result.interrogation_analysis || !Array.isArray(result.interrogation_analysis) || !result.overall_assessment) {
      throw new Error('Invalid response structure');
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

// Save interrogation to database
app.post('/api/save-interrogation', upload.single('audioFile'), async (req, res) => {
  try {
    const { transcript, diarizedContent, emotionalAnalysis } = req.body;
    
    const interrogation = new Interrogation({
      audioFile: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: `/uploads/${req.file.filename}`
      },
      transcript,
      diarizedContent: JSON.parse(diarizedContent),
      emotionalAnalysis: JSON.parse(emotionalAnalysis)
    });

    await interrogation.save();
    res.json({ success: true, interrogation });
  } catch (error) {
    console.error('Error saving interrogation:', error);
    res.status(500).json({ error: 'Failed to save interrogation' });
  }
});

// Get all interrogations
app.get('/api/interrogations', async (req, res) => {
  try {
    const interrogations = await Interrogation.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(interrogations);
  } catch (error) {
    console.error('Error fetching interrogations:', error);
    res.status(500).json({ error: 'Failed to fetch interrogations' });
  }
});

// Save FIR to database
app.post('/api/save-fir', upload.single('audioFile'), async (req, res) => {
  try {
    const { title, description, location, priority, transcript } = req.body;
    
    const fir = new FIR({
      title,
      description,
      location,
      priority,
      audioFile: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: `/uploads/${req.file.filename}`
      },
      transcript
    });

    await fir.save();
    res.json({ success: true, fir });
  } catch (error) {
    console.error('Error saving FIR:', error);
    res.status(500).json({ error: 'Failed to save FIR' });
  }
});

// Get all FIRs
app.get('/api/firs', async (req, res) => {
  try {
    const firs = await FIR.find()
      .sort({ createdAt: -1 })
      .limit(10);
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