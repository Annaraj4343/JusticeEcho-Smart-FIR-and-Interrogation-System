export interface FIR {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  date: string;
  location: string;
  priority: string;
  reportedBy: {
    name: string;
    phone: string;
  };
  category?: string;
  evidence?: any[];
  assignedTo?: string;
  latestUpdate?: string;
} 