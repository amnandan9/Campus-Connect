import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  ShieldAlert,
  Search,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { AttendanceRecord, Student, TeacherAuthState } from '../types';

interface AttendanceModuleProps {
  teacherState: TeacherAuthState;
  onOpenAiAssistant: () => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({ teacherState }) => {
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10-A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Period 1 (09:00 AM)');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const assignedClasses = teacherState.teacher?.assignedClasses || ['Grade 10-A', 'Grade 10-B', 'Grade 9-A'];
  const teacherSubject = teacherState.teacher?.subject || 'Mathematics';

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/v1/attendance?student_id=STU-1001');
      const data = await res.json();
      if (data.records) setAttendanceRecords(data.records);
    } catch (e) {}
  };

  const fetchStudents = async () => {
    try {
      const role = teacherState.isAuthenticated ? 'teacher' : 'admin';
      const teacherId = teacherState.teacher?.id || '';
      const res = await fetch(`/api/v1/students?role=${role}&teacher_id=${teacherId}`);
      const data = await res.json();
      if (data.results) setStudents(data.results);
    } catch (e) {}
  };

  useEffect(() => {
    fetchAttendance();
    fetchStudents();
  }, [teacherState]);

  const handleMarkAttendance = async (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    try {
      const res = await fetch('/api/v1/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          subject: selectedSubject,
          status,
          teacher_id: teacherState.teacher?.id || 'TCH-201',
          period: selectedPeriod,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data.message || 'Permission Denied: Cannot mark attendance for unassigned class/subject.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: data.message,
        });
        fetchAttendance();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to communicate with Django REST API.' });
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      `${s.grade}-${s.section}` === selectedClass &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.includes(searchTerm))
  );

  return (
    <div className="space-y-8 animate-fade-in text-[#1A1A1A]">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1DB] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#B19361] font-bold block mb-1">
            Subject Teacher Authorization
          </span>
          <h1 className="text-3xl font-bold serif text-[#1A1A1A]">
            Period-wise Attendance Management
          </h1>
          <p className="text-xs text-[#5C5855] mt-1">
            Teacher Permission Rules: Teachers mark attendance ONLY for assigned classes ({assignedClasses.join(', ')}).
          </p>
        </div>

        {/* Teacher Auth Badge */}
        <div className="editorial-card-muted px-4 py-2.5 flex items-center space-x-3">
          <UserCheck className="w-5 h-5 text-[#B19361]" />
          <div>
            <p className="text-xs font-bold serif text-[#1A1A1A]">
              {teacherState.isAuthenticated ? teacherState.teacher?.name : 'Guest/Teacher Portal'}
            </p>
            <p className="text-[10px] text-[#8C8885] font-mono">
              {teacherState.isAuthenticated ? `Subject: ${teacherSubject}` : 'Read-Only Mode'}
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 border text-xs font-mono flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-[#1A1A1A] text-emerald-400 border-emerald-600'
              : 'bg-[#1A1A1A] text-rose-400 border-rose-600'
          }`}
        >
          <span className="flex items-center">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <ShieldAlert className="w-4 h-4 mr-2" />
            )}
            {statusMessage.text}
          </span>
          <button
            onClick={() => setStatusMessage(null)}
            className="underline text-[11px] font-bold cursor-pointer text-[#B19361] hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Class & Subject Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 editorial-card-muted p-6">
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">
            Assigned Class/Section:
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-[#FDFCFB] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1A1A1A]"
          >
            {assignedClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="Grade 12-A">
              Grade 12-A (Unassigned Class Test)
            </option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">
            Subject Period:
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-[#FDFCFB] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1A1A1A]"
          >
            <option value={teacherSubject}>{teacherSubject}</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="English">English</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">
            Schedule Slot:
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full bg-[#FDFCFB] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1A1A1A]"
          >
            <option value="Period 1 (09:00 AM)">Period 1 (09:00 AM)</option>
            <option value="Period 2 (10:00 AM)">Period 2 (10:00 AM)</option>
            <option value="Period 3 (11:15 AM)">Period 3 (11:15 AM)</option>
            <option value="Period 4 (01:00 PM)">Period 4 (01:00 PM)</option>
          </select>
        </div>
      </div>

      {/* Student List for Selected Class */}
      <div className="editorial-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E1DB] pb-4">
          <div>
            <h3 className="text-xl font-bold serif text-[#1A1A1A] flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-[#B19361]" />
              Roll Ledger for {selectedClass} ({selectedSubject})
            </h3>
            <p className="text-xs text-[#5C5855]">Scan QR or click status buttons to log attendance</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8885]" />
            <input
              type="text"
              placeholder="Search by name or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F2EDE8] border border-[#E5E1DB] pl-9 pr-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1A1A1A]">
            <thead className="bg-[#F2EDE8] text-[#8C8885] font-bold uppercase tracking-wider text-[10px] border-b border-[#E5E1DB]">
              <tr>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Student QR Code</th>
                <th className="px-4 py-3">Fee Status (Teacher View)</th>
                <th className="px-4 py-3 text-right">Mark Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1DB]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#8C8885] serif italic text-sm">
                    No students found for class {selectedClass}.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F2EDE8]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[#1A1A1A]">{student.rollNo}</td>
                    <td className="px-4 py-3 font-bold serif text-[#1A1A1A]">
                      <div className="flex items-center space-x-2">
                        <img
                          src={student.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                          alt={student.name}
                          className="w-7 h-7 rounded-none object-cover border border-[#E5E1DB]"
                        />
                        <span>{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] bg-[#F2EDE8] border border-[#E5E1DB] text-[#1A1A1A]">
                        <QrCode className="w-3 h-3 mr-1 text-[#B19361]" />
                        QR-{student.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Strictly Fee Cleared / Fee Pending badge only! */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          student.feeStatus === 'Cleared'
                            ? 'bg-[#1A1A1A] text-[#FDFCFB] border border-[#1A1A1A]'
                            : 'bg-[#F2EDE8] text-[#8C8885] border border-[#E5E1DB]'
                        }`}
                      >
                        {student.feeStatus === 'Cleared' ? 'Fee Cleared' : 'Fee Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => handleMarkAttendance(student.id, 'Present')}
                          className="px-3 py-1 bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(student.id, 'Absent')}
                          className="px-3 py-1 bg-[#F2EDE8] hover:bg-[#1A1A1A] hover:text-white border border-[#E5E1DB] text-[#1A1A1A] font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(student.id, 'Late')}
                          className="px-3 py-1 bg-[#F2EDE8] hover:bg-[#B19361] hover:text-white border border-[#E5E1DB] text-[#5C5855] font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

