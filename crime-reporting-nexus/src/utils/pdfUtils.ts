import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface FIRData {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  priority: string;
  status: string;
  reportedBy: {
    name: string;
    phone: string;
  };
}

interface InterrogationReport {
  id: string;
  createdAt: string;
  transcript: string;
  diarizedContent: {
    speakers: Array<{
      id: string;
      name: string;
      role: string;
    }>;
    conversation: Array<{
      speaker: string;
      text: string;
      timestamp: string;
    }>;
    summary: string;
  };
  emotionalAnalysis: {
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
  };
}

export async function generateFIRPDF(firData: FIRData): Promise<Blob> {
  const doc = new jsPDF();
  
  // Add FIR header
  doc.setFontSize(20);
  doc.text('FIRST INFORMATION REPORT', 105, 20, { align: 'center' });
  
  // Add FIR details
  doc.setFontSize(12);
  const details = [
    ['FIR ID:', firData.id],
    ['Title:', firData.title],
    ['Date:', firData.date],
    ['Location:', firData.location],
    ['Priority:', firData.priority.toUpperCase()],
    ['Status:', firData.status.toUpperCase()],
    ['Reported By:', firData.reportedBy.name],
  ];

  // Add details table using autoTable
  autoTable(doc, {
    startY: 30,
    head: [['Field', 'Value']],
    body: details,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Add description
  doc.setFontSize(12);
  doc.text('Description:', 20, (doc as any).lastAutoTable.finalY + 20);
  doc.setFontSize(11);
  const splitDescription = doc.splitTextToSize(firData.description, 170);
  doc.text(splitDescription, 20, (doc as any).lastAutoTable.finalY + 30);

  // Convert to blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

export async function sendFIRViaWhatsApp(pdfBlob: Blob, firData: FIRData) {
  try {
    // First, upload the PDF to a temporary storage
    const formData = new FormData();
    formData.append('pdf', pdfBlob, `FIR_${firData.id}.pdf`);

    const uploadResponse = await fetch('http://localhost:3001/api/upload-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload PDF');
    }

    const { pdfUrl } = await uploadResponse.json();

    // Send WhatsApp message with Twilio
    const response = await fetch('http://localhost:3001/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: '919890130821', // Hardcoded phone number
        firData: {
          id: firData.id,
          title: firData.title,
          date: firData.date,
          pdfUrl: pdfUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send WhatsApp message');
    }

    return true;
  } catch (error) {
    console.error('Error sending FIR via WhatsApp:', error);
    throw error;
  }
}

export const generateInterrogationPDF = (session: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper function to add text and advance yPos
  const addText = (text: string, size: number = 12, isBold: boolean = false) => {
    doc.setFontSize(size);
    if (isBold) doc.setFont(undefined, 'bold');
    doc.text(text, margin, yPos);
    if (isBold) doc.setFont(undefined, 'normal');
    yPos += (size / 2) + 4;
  };

  // Header
  addText('INTERROGATION REPORT', 24, true);
  addText(`Session ID: ${session.id.slice(0, 8)}`, 12);
  addText(`Date: ${new Date(session.createdAt).toLocaleDateString()}`, 12);
  yPos += 10;

  // Summary Section
  addText('SUMMARY', 16, true);
  const summaryLines = doc.splitTextToSize(session.diarizedContent.summary, pageWidth - 40);
  doc.text(summaryLines, margin, yPos);
  yPos += (summaryLines.length * 7) + 15;

  // Participants Section
  addText('PARTICIPANTS', 16, true);
  session.diarizedContent.speakers.forEach((speaker: any) => {
    addText(`${speaker.name} - ${speaker.role}`);
  });
  yPos += 10;

  // Conversation Analysis
  addText('CONVERSATION & EMOTIONAL ANALYSIS', 16, true);
  
  const analysisData = session.diarizedContent.conversation.map((entry: any, index: number) => {
    const analysis = session.emotionalAnalysis.interrogation_analysis[index];
    if (!analysis) return [];

    return [
      entry.timestamp,
      entry.speaker,
      entry.text,
      `Stress Level: ${analysis.behavioral_indicators.stress_level}
Cooperation: ${analysis.behavioral_indicators.cooperation_level}
Defensiveness: ${analysis.behavioral_indicators.defensiveness}
Consistency: ${analysis.behavioral_indicators.consistency}`,
      `Primary: ${analysis.emotional_state.primary_emotion}
Secondary: ${analysis.emotional_state.secondary_emotion}
Intensity: ${analysis.emotional_state.emotional_intensity}
Control: ${analysis.emotional_state.emotional_control}`
    ];
  }).filter((row: any) => row.length > 0);

  autoTable(doc, {
    startY: yPos,
    head: [['Time', 'Speaker', 'Statement', 'Behavioral Indicators', 'Emotional State']],
    body: analysisData,
    headStyles: { fillColor: [66, 66, 66] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 }
    },
    styles: { overflow: 'linebreak', cellPadding: 5, fontSize: 8 }
  });

  // Add new page for overall analysis
  doc.addPage();
  yPos = 20;

  // Overall Assessment
  addText('OVERALL ASSESSMENT', 16, true);
  const assessment = session.emotionalAnalysis.overall_assessment;

  addText('Interrogation Effectiveness:', 12, true);
  addText(assessment.interrogation_effectiveness);
  yPos += 5;

  addText('Key Behavioral Patterns:', 12, true);
  assessment.key_behavioral_patterns.forEach((pattern: string) => {
    addText(`• ${pattern}`);
  });
  yPos += 5;

  addText('Emotional Progression:', 12, true);
  const progressionLines = doc.splitTextToSize(assessment.emotional_progression, pageWidth - 40);
  doc.text(progressionLines, margin, yPos);
  yPos += (progressionLines.length * 7) + 10;

  addText('Areas of Concern:', 12, true);
  assessment.areas_of_concern.forEach((concern: string) => {
    addText(`• ${concern}`);
  });
  yPos += 5;

  addText('Recommendations:', 12, true);
  assessment.recommendations.forEach((recommendation: string) => {
    const recLines = doc.splitTextToSize(`• ${recommendation}`, pageWidth - 40);
    doc.text(recLines, margin, yPos);
    yPos += (recLines.length * 7);
  });

  // Professional Analysis Section
  if (yPos > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 15;
  addText('PROFESSIONAL ANALYSIS', 16, true);

  const analysisTableData = session.emotionalAnalysis.interrogation_analysis.map((analysis: any) => [
    analysis.speaker,
    analysis.professional_analysis.interrogation_technique,
    analysis.professional_analysis.effectiveness,
    analysis.professional_analysis.suggested_follow_up,
    analysis.analysis_notes
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Speaker', 'Technique Used', 'Effectiveness', 'Suggested Follow-up', 'Analysis Notes']],
    body: analysisTableData,
    headStyles: { fillColor: [66, 66, 66] },
    styles: { overflow: 'linebreak', cellPadding: 5, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 40 },
      4: { cellWidth: 'auto' }
    }
  });

  // Generate PDF
  const fileName = `interrogation-${session.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};