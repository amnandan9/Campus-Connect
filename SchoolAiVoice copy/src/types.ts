export type Role = 'public' | 'teacher' | 'parent' | 'admin';

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  grade: string; // e.g. "Grade 10"
  section: string; // e.g. "A"
  parentName: string;
  parentPhone: string;
  admissionDate: string;
  totalFee: number;
  paidFee: number;
  remainingFee: number;
  feeStatus: 'Cleared' | 'Pending';
  avatar?: string;
}

export interface Teacher {
  id: string;
  username: string;
  name: string;
  subject: string;
  assignedClasses: string[]; // e.g. ["Grade 10-A", "Grade 9-B"]
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeSection: string;
  subject: string;
  date: string;
  period: string;
  status: 'Present' | 'Absent' | 'Late';
  teacherId: string;
  teacherName: string;
  markedVia: 'QR' | 'Manual';
  timestamp: string;
}

export interface NotebookRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeSection: string;
  subject: string;
  submittedAt: string;
  verifiedAt: string | null;
  teacherId: string | null;
  teacherName: string | null;
  status: 'Verified' | 'Pending';
  qrCode: string;
}

export interface ExitRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeSection: string;
  reason: string;
  exitTime: string;
  returnTime: string | null;
  durationMinutes: number | null;
  status: 'Outside' | 'Returned';
  flaggedExcessive: boolean; // if > 15 mins
}

export interface FeeTransaction {
  id: string;
  studentId: string;
  studentName: string;
  amountPaid: number;
  date: string;
  paymentMethod: string;
  receiptNo: string;
  remainingBalanceAfter: number;
}

export interface MarkRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeSection: string;
  subject: string;
  examType: 'Midterm' | 'Final' | 'Unit Test 1' | 'Unit Test 2';
  marksObtained: number;
  maxMarks: number;
  grade: string;
}

export interface ToolCallLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT';
  parameters: Record<string, any>;
  responseSummary: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  language?: string;
  audioUrl?: string;
  toolCalls?: ToolCallLog[];
  timestamp: string;
}

export interface ParentVerificationState {
  isVerified: boolean;
  parentPhone?: string;
  studentName?: string;
  studentId?: string;
  verifiedStudent?: Student;
}

export interface TeacherAuthState {
  isAuthenticated: boolean;
  teacher?: Teacher;
  token?: string;
}
