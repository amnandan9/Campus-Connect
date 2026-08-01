import React, { useState, useEffect } from 'react';
import {
  Clock,
  QrCode,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ExitRecord } from '../types';

export const ExitModule: React.FC = () => {
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>([]);
  const [studentQr, setStudentQr] = useState<string>('STU-1001');
  const [reason, setReason] = useState<string>('Washroom / Medical');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchExits = async () => {
    try {
      const res = await fetch('/api/v1/exits');
      const data = await res.json();
      if (data.results) setExitRecords(data.results);
    } catch (e) {}
  };

  useEffect(() => {
    fetchExits();
  }, []);

  const handleScanExit = async () => {
    if (!studentQr.trim()) return;

    try {
      const res = await fetch('/api/v1/exits/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code_or_id: studentQr,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.message || 'QR Scan failed.' });
      } else {
        setStatusMsg({ type: 'success', text: data.message });
        fetchExits();
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Django REST API connection error.' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#1A1A1A]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E1DB] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#B19361] font-bold block mb-1">
            Disciplinary & Duration Audit
          </span>
          <h1 className="text-3xl font-bold serif text-[#1A1A1A]">
            Classroom Exit & Return Ledger
          </h1>
          <p className="text-xs text-[#5C5855] mt-1">
            First QR scan records exit time. Second QR scan records return time and automatically calculates exact duration outside.
          </p>
        </div>

        <div className="editorial-card-muted px-4 py-2.5 flex items-center space-x-3">
          <Clock className="w-5 h-5 text-[#B19361]" />
          <div>
            <p className="text-xs font-bold serif text-[#1A1A1A]">Threshold Policy</p>
            <p className="text-[10px] text-[#8C8885] font-mono">&gt;15 Mins Outside Flagged</p>
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
          Classroom Exit / Return QR Scanner
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">
              Scan Student QR Code / ID:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={studentQr}
                onChange={(e) => setStudentQr(e.target.value)}
                placeholder="e.g. STU-1001 or STU-1003"
                className="flex-1 bg-[#F2EDE8] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:border-[#1A1A1A]"
              />
              <button
                onClick={handleScanExit}
                className="bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold text-xs px-6 py-2.5 uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Scan Exit / Return</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">
              Exit Reason / Pass:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#FDFCFB] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1A1A1A]"
            >
              <option value="Washroom / Water Break">Washroom / Water Break</option>
              <option value="Medical Room Visit">Medical Room Visit</option>
              <option value="Administrative Office">Administrative Office</option>
              <option value="Library Access">Library Access</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exit History Table */}
      <div className="editorial-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E5E1DB] pb-4 gap-2">
          <h3 className="text-xl font-bold serif text-[#1A1A1A]">
            Classroom Exit Logs & Duration Audit
          </h3>
          <span className="text-[10px] font-mono text-[#8C8885]">Duration calculated automatically</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1A1A1A]">
            <thead className="bg-[#F2EDE8] text-[#8C8885] font-bold uppercase tracking-wider text-[10px] border-b border-[#E5E1DB]">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Exit Time</th>
                <th className="px-4 py-3">Return Time</th>
                <th className="px-4 py-3">Duration Outside</th>
                <th className="px-4 py-3">Status / Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1DB]">
              {exitRecords.map((ext) => (
                <tr key={ext.id} className="hover:bg-[#F2EDE8]/60 transition-colors">
                  <td className="px-4 py-3 font-bold serif text-[#1A1A1A]">{ext.studentName}</td>
                  <td className="px-4 py-3 font-mono text-[#5C5855]">{ext.gradeSection}</td>
                  <td className="px-4 py-3 text-[#5C5855]">{ext.reason}</td>
                  <td className="px-4 py-3 text-[#8C8885] font-mono text-[11px]">{ext.exitTime}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    {ext.returnTime ? (
                      <span className="text-emerald-700 font-semibold">{ext.returnTime}</span>
                    ) : (
                      <span className="text-[#B19361] font-bold italic animate-pulse">Currently Outside</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[#1A1A1A]">
                    {ext.durationMinutes !== null ? `${ext.durationMinutes} mins` : 'In Progress...'}
                  </td>
                  <td className="px-4 py-3">
                    {ext.flaggedExcessive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-rose-400 border border-rose-600">
                        <AlertTriangle className="w-3 h-3 mr-1 text-rose-400" />
                        Flagged (&gt;15m)
                      </span>
                    ) : ext.status === 'Returned' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#FDFCFB]">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-[#B19361]" />
                        Returned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F2EDE8] text-[#B19361] border border-[#E5E1DB]">
                        Outside
                      </span>
                    )}
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

