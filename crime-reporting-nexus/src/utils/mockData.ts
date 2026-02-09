
import { FIR, InterrogationSession } from '../types';

export const mockFIRs: FIR[] = [
  {
    id: 'fir-001',
    title: 'Stolen Vehicle',
    description: 'My car was stolen from the parking lot of Westfield Mall on July 10th around 6 PM. It\'s a blue Honda Civic 2018 with license plate ABC123.',
    reportedBy: {
      id: '1',
      name: 'John Citizen',
    },
    location: 'Westfield Mall, City Center',
    date: '2023-07-10',
    status: 'reviewing',
    priority: 'medium',
    assignedOfficer: 'Officer Smith',
    updates: [
      {
        date: '2023-07-11T09:30:00',
        comment: 'FIR received and under initial review',
        officerId: '2',
        officerName: 'Officer Smith',
      }
    ],
    createdAt: '2023-07-10T18:30:00',
    updatedAt: '2023-07-11T09:30:00',
  },
  {
    id: 'fir-002',
    title: 'Apartment Break-in',
    description: 'I returned from work to find my apartment door broken and some valuables missing, including my laptop and watch.',
    reportedBy: {
      id: '1',
      name: 'John Citizen',
    },
    location: '123 Elm Street, Apartment 4B',
    date: '2023-07-15',
    status: 'pending',
    priority: 'high',
    createdAt: '2023-07-15T20:15:00',
    updatedAt: '2023-07-15T20:15:00',
  },
  {
    id: 'fir-003',
    title: 'Workplace Harassment',
    description: 'I\'ve been facing verbal harassment from my manager for the past month. Despite complaints to HR, no action has been taken.',
    reportedBy: {
      id: '3',
      name: 'Jane Doe',
    },
    location: 'TechCorp Inc., Tech Park',
    date: '2023-07-05',
    status: 'completed',
    priority: 'medium',
    assignedOfficer: 'Officer Johnson',
    updates: [
      {
        date: '2023-07-06T10:00:00',
        comment: 'FIR received, assigned for investigation',
        officerId: '4',
        officerName: 'Officer Johnson',
      },
      {
        date: '2023-07-12T16:30:00',
        comment: 'Investigation completed, report filed with HR',
        officerId: '4',
        officerName: 'Officer Johnson',
      }
    ],
    createdAt: '2023-07-05T14:20:00',
    updatedAt: '2023-07-12T16:30:00',
  },
  {
    id: 'fir-004',
    title: 'Phone Snatched',
    description: 'My phone was snatched by two men on a motorcycle near Central Park yesterday evening around 7 PM.',
    reportedBy: {
      id: '5',
      name: 'Robert Chen',
    },
    location: 'Central Park East Entrance',
    date: '2023-07-18',
    status: 'approved',
    priority: 'medium',
    assignedOfficer: 'Officer Smith',
    updates: [
      {
        date: '2023-07-19T08:45:00',
        comment: 'FIR registered, CCTV footage requested from park authorities',
        officerId: '2',
        officerName: 'Officer Smith',
      }
    ],
    createdAt: '2023-07-18T19:30:00',
    updatedAt: '2023-07-19T08:45:00',
  }
];

export const mockInterrogationSessions: InterrogationSession[] = [
  {
    id: 'int-001',
    firId: 'fir-001',
    audioUrl: '/interrogation-audio-1.mp3',
    transcript: 'Sample transcript content would appear here with full conversation details...',
    speakers: [
      {
        id: 'speaker-1',
        name: 'Officer Smith',
        segments: [
          {
            start: 0,
            end: 15.5,
            text: 'Can you tell me where you were on the evening of July 10th?',
            emotion: 'neutral'
          },
          {
            start: 30.2,
            end: 45.7,
            text: 'And did you notice anyone suspicious near your vehicle earlier that day?',
            emotion: 'curious'
          }
        ]
      },
      {
        id: 'speaker-2',
        name: 'Suspect',
        segments: [
          {
            start: 16.0,
            end: 29.8,
            text: 'I was at the mall, shopping at the electronics store. I parked my car around 5:30 PM.',
            emotion: 'nervous'
          },
          {
            start: 46.2,
            end: 65.5,
            text: 'Not really, there were a lot of people in the parking lot. I don\'t remember seeing anything unusual.',
            emotion: 'uncertain'
          }
        ]
      }
    ],
    date: '2023-07-12',
    createdBy: '2'
  }
];
