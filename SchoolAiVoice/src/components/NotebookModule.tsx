import React, { useState, useEffect } from 'react';
import {
  BookCheck,
  QrCode,
  CheckCircle2,
  Clock,
  FileCheck,
} from 'lucide-react';
import { NotebookRecord, TeacherAuthState } from '../types';

interface NotebookModuleProps {
  teacherState: TeacherAuthState;
}

export const NotebookModule: React.FC<NotebookModuleProps> = ({ teacherState }) => {
  const [notebooks, setNotebooks] = useState<NotebookRecord[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    teacherState.teacher?.subject || 'Mathematics'
  );
  const [qrInput, setQrInput] = useState<string>('STU-1001');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNotebooks = async () => {
    try {
      const res = await fetch('/api/v1/notebooks?student_id=STU-1001');
      const data = await res.json();
      if (data.records) setNotebooks(data.records);
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotebooks();
  }, [teacherState]);

  const handleVerifyNotebook = async () => {
    if (!qrInput.trim()) return;

    try {
      const res = await fetch('/api/v1/notebooks/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code: qrInput,
          subject: selectedSubject,
          teacher_id: teacherState.teacher?.id || 'TCH-201',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.message || 'Notebook QR verification failed.' });
      } else {
        setStatusMsg({ type: 'success', text: data.message });
        fetchNotebooks();
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Error connecting to Django REST API.' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#1A1A1A]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E1DB] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#B19361] font-bold block mb-1">
            Anti-Tamper Digital Audit
          </span>
          <h1 className="text-3xl font-bold serif text-[#1A1A1A]">
            Notebook Verification Ledger
          </h1>
          <p className="text-xs text-[#5C5855] mt-1">
            Scans QR code attached behind student notebooks. Logs submission timestamp, verification timestamp, & verifying teacher ID.
          </p>
        </div>

        <div className="editorial-card-muted px-4 py-2.5 flex items-center space-x-3">
          <BookCheck className="w-5 h-5 text-[#B19361]" />
          <div>
            <p className="text-xs font-bold serif text-[#1A1A1A]">
              Verifying Teacher: {teacherState.teacher?.name || 'Dr. Sunita Rao'}
            </p>
            <p className="text-[10px] text-[#8C8885] font-mono">
              Subject: {teacherState.teacher?.subject || 'Mathematics'}
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 border text-xs font-mono flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-[#1A1A1A] text-emerald-400 border-emerald-600'
              : 'bg-[#1A1A1A] text-rose-400 border-rose-600'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="underline font-bold cursor-pointer text-[#B19361] hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* QR Scanner Form */}
      <div className="editorial-card p-6 space-y-6">
        <h3 className="text-xl font-bold serif text-[#1A1A1A] flex items-center">
          <QrCode className="w-5 h-5 mr-2 text-[#B19361]" />
          Scan Notebook Rear QR Code
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">
              Scan or Enter Notebook QR Code / Student ID:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="e.g. STU-1001 or STU-1001-NB-MATH"
                className="flex-1 bg-[#F2EDE8] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:border-[#1A1A1A]"
              />
              <button
                onClick={handleVerifyNotebook}
                className="bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold text-xs px-6 py-2.5 uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Verify & Sign</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">Subject Notebook:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-[#FDFCFB] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1A1A1A]"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notebook Audit Table */}
      <div className="editorial-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E5E1DB] pb-4 gap-2">
          <h3 className="text-xl font-bold serif text-[#1A1A1A]">
            Notebook Submission & Verification Audit Log
          </h3>
          <span className="text-[10px] font-mono text-[#8C8885]">Timestamped in Django DB</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1A1A1A]">
            <thead className="bg-[#F2EDE8] text-[#8C8885] font-bold uppercase tracking-wider text-[10px] border-b border-[#E5E1DB]">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Submitted At</th>
                <th className="px-4 py-3">Verified At</th>
                <th className="px-4 py-3">Verifying Teacher</th>
                <th className="px-4 py-3">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1DB]">
              {notebooks.map((nb) => (
                <tr key={nb.id} className="hover:bg-[#F2EDE8]/60 transition-colors">
                  <td className="px-4 py-3 font-bold serif text-[#1A1A1A]">{nb.studentName}</td>
                  <td className="px-4 py-3 font-mono text-[#5C5855]">{nb.gradeSection}</td>
                  <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{nb.subject}</td>
                  <td className="px-4 py-3 text-[#8C8885] font-mono text-[11px]">{nb.submittedAt}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    {nb.verifiedAt ? (
                      <span className="text-emerald-700 font-semibold">{nb.verifiedAt}</span>
                    ) : (
                      <span className="text-[#B19361] italic">Not verified yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5C5855]">
                    {nb.teacherName || <span className="text-[#8C8885]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        nb.status === 'Verified'
                          ? 'bg-[#1A1A1A] text-[#FDFCFB] border border-[#1A1A1A]'
                          : 'bg-[#F2EDE8] text-[#8C8885] border border-[#E5E1DB]'
                      }`}
                    >
                      {nb.status === 'Verified' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1 text-[#B19361]" /> Verified Signature
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" /> Correction Pending
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

