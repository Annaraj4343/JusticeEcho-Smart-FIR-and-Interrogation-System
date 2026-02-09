JusticeEcho ⚖️🎙️

AI-Driven FIR Filing & Interrogation Intelligence Platform

📌 Overview

JusticeEcho is an AI-powered platform designed to modernize the FIR (First Information Report) filing and interrogation analysis process. The system allows users to submit FIRs using voice-recorded audio, automatically transcribes speech, extracts key FIR details using Large Language Models (LLMs), and stores structured records securely. It also assists law enforcement during interrogations by generating summaries and insights from recorded sessions.

The project combines a web-based frontend, a Node.js backend, and a Python-based AI service to deliver an end-to-end intelligent solution.

🚀 Key Features

🎙️ Voice-based FIR submission using audio files

📝 Automatic speech-to-text transcription

🤖 AI-based extraction of FIR answers

📄 Structured FIR generation in JSON format

🗄️ Secure and scalable database storage

🔄 CRUD operations for FIR records

📊 Interrogation summaries and insights

🌐 User-friendly web interface

🏗️ Project Architecture

JusticeEcho follows a multi-layer architecture:

Frontend: User interface for FIR submission and record viewing

Backend Server: Handles APIs, file uploads, and database interaction

AI Processing Layer: Performs transcription and NLP-based extraction

📂 Project Structure
JusticeEcho/
│
├── dist/                    # Production build (frontend)
├── public/                  # Static assets
├── src/                     # Frontend source code
│
├── server/                  # Backend logic
│   ├── server.js             # Node.js backend server
│   ├── server.ts             # TypeScript backend
│
├── models/                  # Database models
├── firebase/                # Firebase configuration (if used)
├── uploads/                 # Uploaded audio files
├── temp/                    # Temporary processing files
│
├── app.py                   # Python AI service (Whisper + LLM logic)
├── cleanup.py               # File cleanup utility
├── myenv/                   # Python virtual environment
│
├── .env                     # Environment variables
├── .env.example             # Environment variable template
├── package.json             # Node.js dependencies
├── package-lock.json        # Dependency lock file
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── README.md                # Project documentation

🛠️ Technologies Used
Frontend

HTML, CSS, JavaScript

Vite

Tailwind CSS

Backend

Node.js

Express.js

TypeScript / JavaScript

AI & Processing

Python

Whisper (Speech-to-Text)

LLMs for NLP-based answer extraction

Database

MongoDB (NoSQL)

Others

JSON for structured data

Git for version control

🔄 System Workflow

User uploads a voice-recorded audio file

Audio is sent to the Python AI service

Whisper transcribes speech into text

LLM extracts FIR-related answers

Data is structured into JSON

FIR record is stored in MongoDB

Users can Create, Read, Update, or Delete FIRs

✅ Advantages Over Traditional FIR System
Traditional System	JusticeEcho
Manual paperwork	Voice-based FIR filing
Police station visit required	Remote FIR submission
High human error	AI-driven accuracy
Slow record retrieval	Fast database queries
Limited accessibility	Inclusive & user-friendly
🌍 Societal Impact

JusticeEcho improves accessibility to justice by enabling FIR filing for individuals who are illiterate, disabled, or geographically distant from police stations. By reducing human error and bias, it promotes transparency, fairness, and efficiency in law enforcement processes.

🔮 Future Enhancements

Mobile application support

Multilingual FIR filing

Advanced emotion and stress detection

Crime analytics dashboard

Integration with police case-tracking systems

🏁 Conclusion

JusticeEcho is a scalable, intelligent, and secure solution that transforms the traditional FIR and interrogation process. By integrating AI, voice technology, and modern web systems, it bridges the gap between citizens and law enforcement, ensuring faster, fairer, and more reliable access to justice.
