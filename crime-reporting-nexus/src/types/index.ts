export type FIRStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';
export type FIRPriority = 'low' | 'medium' | 'high';

export interface FIR {
  id: string;
  title: string;
  description: string;
  reportedBy: {
    id: string;
    name: string;
  };
  location: string;
  date: string;
  status: FIRStatus;
  priority: FIRPriority;
  assignedOfficer?: string;
  updates?: {
    date: string;
    comment: string;
    officerId: string;
    officerName: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface InterrogationSession {
  id: string;
  firId: string;
  audioUrl: string;
  transcript?: string;
  speakers?: {
    id: string;
    name: string;
    segments: {
      start: number;
      end: number;
      text: string;
      emotion?: string;
    }[];
  }[];
  date: string;
  createdBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'police' | 'admin';
  phone?: string;
}
