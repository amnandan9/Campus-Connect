import React, { useState } from 'react';
import {
  Mic,
  QrCode,
  ShieldCheck,
  BookCheck,
  Clock,
  CreditCard,
  UserCheck,
  Sparkles,
  ArrowRight,
  Database,
  Smartphone,
} from 'lucide-react';
import { Role } from '../types';

interface PublicLandingProps {
  onOpenAiAssistant: () => void;
  onNavigateRole: (role: Role) => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  onOpenAiAssistant,
  onNavigateRole,
}) => {
  const [activeQrMode, setActiveQrMode] = useState<'attendance' | 'notebook' | 'exit'>('notebook');
  const [scanResult, setScanResult] = useState<string | null>(null);

  const handleSimulateScan = (studentId: string, name: string) => {
    if (activeQrMode === 'notebook') {
      setScanResult(`Notebook QR Scanned for ${name} (${studentId}). Verified timestamp logged in Django DB at ${new Date().toLocaleTimeString()}.`);
    } else if (activeQrMode === 'exit') {
      setScanResult(`Classroom Exit/Return QR Scanned for ${name} (${studentId}). Time logged & duration calculated in Django DB.`);
    } else {
      setScanResult(`Attendance QR Scanned for ${name} (${studentId}). Period 1 attendance recorded.`);
    }
  };

  return (
    <div className="space-y-12 pb-12 animate-fade-in text-[#1A1A1A]">
      
      {/* Editorial Hero Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-4 pb-8 border-b border-[#E5E1DB]">
        
        {/* Left Headline & AI Voice Callout (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-[11px] uppercase tracking-[0.35em] text-[#B19361] font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#B19361]" />
              <span>Intelligence Reimagined • Voice AI</span>
            </div>

            <h1 className="text-4xl sm:text-6xl xl:text-7xl leading-[0.95] serif font-light tracking-tight mb-6 text-[#1A1A1A]">
              The Voice <br />of <span className="italic font-normal text-[#B19361]">EduCore.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#5C5855] leading-relaxed serif italic max-w-xl">
              A bridge between campus data and natural dialogue. Query attendance, notebook verification status, exam marks, and fee status instantly through voice or text.
            </p>
          </div>

          {/* Large Editorial AI Voice Button */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={onOpenAiAssistant}
                className="w-20 h-20 rounded-full bg-[#1A1A1A] hover:bg-[#B19361] text-white flex items-center justify-center shadow-xl relative group transition-all duration-300 transform hover:scale-105 cursor-pointer border border-[#1A1A1A]"
              >
                <div className="absolute -inset-2 rounded-full border border-[#1A1A1A] opacity-20 group-hover:border-[#B19361] group-hover:opacity-40 transition-all"></div>
                <Mic className="w-8 h-8 text-[#FDFCFB]" />
              </button>

              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#B19361] font-bold">
                  Voice Assistant Online
                </span>
                <span className="text-xl sm:text-2xl serif italic text-[#1A1A1A]">
                  "Say 'Check attendance' or 'Fee status'"
                </span>
                <span className="text-xs text-[#8C8885] mt-0.5">Click microphone or talk outside login</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-[#F2EDE8] border border-[#E5E1DB] text-[10px] uppercase tracking-wider text-[#5C5855] font-semibold">
                Multilingual AI
              </span>
              <span className="px-3 py-1 bg-[#F2EDE8] border border-[#E5E1DB] text-[10px] uppercase tracking-wider text-[#5C5855] font-semibold">
                Django REST Connected
              </span>
              <span className="px-3 py-1 bg-[#F2EDE8] border border-[#E5E1DB] text-[10px] uppercase tracking-wider text-[#5C5855] font-semibold">
                Parent & Staff Security
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Editorial Metrics Grid (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-6 border-t lg:border-t-0 lg:border-l border-[#E5E1DB] pt-6 lg:pt-0 lg:pl-10">
          
          <div className="border-b border-[#E5E1DB] pb-6">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8C8885] font-bold mb-2">
              Attendance Metrics
            </h3>
            <p className="text-4xl sm:text-5xl serif mb-1 text-[#1A1A1A]">
              98.4<span className="text-2xl text-[#B19361]">%</span>
            </p>
            <p className="text-[11px] text-[#5C5855] uppercase tracking-tighter font-medium">
              Campus presence today
            </p>
          </div>

          <div className="border-b border-[#E5E1DB] pb-6">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8C8885] font-bold mb-2">
              Notebook Verified
            </h3>
            <p className="text-4xl sm:text-5xl serif mb-1 text-[#1A1A1A]">142</p>
            <p className="text-[11px] text-[#5C5855] uppercase tracking-tighter font-medium">
              Scanned behind rear covers
            </p>
          </div>

          <div className="pt-2">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8C8885] font-bold mb-4">
              Recent QR Log
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between items-end border-b border-dotted border-[#D1CDCA] pb-1.5">
                <span className="font-medium text-[#1A1A1A]">A. Sharma <span className="text-[10px] text-[#8C8885] italic">(10-A)</span></span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">Exit @ 14:02</span>
              </li>
              <li className="flex justify-between items-end border-b border-dotted border-[#D1CDCA] pb-1.5 text-[#8C8885]">
                <span className="font-medium">K. Patel <span className="text-[10px] italic">(9-C)</span></span>
                <span className="text-[10px] uppercase tracking-wider font-bold">Return @ 13:58</span>
              </li>
              <li className="flex justify-between items-end border-b border-dotted border-[#D1CDCA] pb-1.5">
                <span className="font-medium text-[#1A1A1A]">S. Iyer <span className="text-[10px] text-[#8C8885] italic">(11-B)</span></span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#B19361]">Verified</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8C8885] font-bold mb-4">
              Fee Ledger Overview
            </h3>
            <div className="p-5 bg-[#1A1A1A] text-[#FDFCFB] rounded-none">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] uppercase tracking-widest opacity-60">Status</span>
                <span className="text-[9px] font-bold text-[#B19361]">REST API</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-[#B19361]"></div>
                <span className="text-base serif italic">72% Cleared</span>
              </div>
              <p className="mt-3 text-[9px] leading-relaxed opacity-60 uppercase tracking-tight border-t border-white/10 pt-2">
                Teachers see Cleared/Pending only.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Core Modules Grid Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#E5E1DB] pb-4 gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#B19361] font-bold block mb-1">
              Backend Architecture
            </span>
            <h2 className="text-2xl font-bold serif text-[#1A1A1A] flex items-center">
              Core Django School Modules
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#5C5855] bg-[#F2EDE8] border border-[#E5E1DB] px-3 py-1 uppercase tracking-wider">
            Django REST Framework APIs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Module 1 */}
          <div
            onClick={() => onNavigateRole('teacher')}
            className="editorial-card p-6 hover:border-[#1A1A1A] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-[#F2EDE8] text-[#1A1A1A] border border-[#E5E1DB] flex items-center justify-center mb-4 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold serif text-lg text-[#1A1A1A] mb-2">Period Attendance</h3>
              <p className="text-xs text-[#5C5855] leading-relaxed mb-4">
                Mark attendance per subject period using unique student QR codes.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-[#B19361] font-bold flex items-center group-hover:text-[#1A1A1A]">
              Open Attendance <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          {/* Module 2 */}
          <div
            onClick={() => onNavigateRole('teacher')}
            className="editorial-card p-6 hover:border-[#1A1A1A] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-[#F2EDE8] text-[#1A1A1A] border border-[#E5E1DB] flex items-center justify-center mb-4 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
                <BookCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold serif text-lg text-[#1A1A1A] mb-2">Notebook Verification</h3>
              <p className="text-xs text-[#5C5855] leading-relaxed mb-4">
                QR scanned behind rear cover. Submission & correction audit stored in Django.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-[#B19361] font-bold flex items-center group-hover:text-[#1A1A1A]">
              Open Notebooks <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          {/* Module 3 */}
          <div
            onClick={() => onNavigateRole('teacher')}
            className="editorial-card p-6 hover:border-[#1A1A1A] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-[#F2EDE8] text-[#1A1A1A] border border-[#E5E1DB] flex items-center justify-center mb-4 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold serif text-lg text-[#1A1A1A] mb-2">Classroom Exit Log</h3>
              <p className="text-xs text-[#5C5855] leading-relaxed mb-4">
                Scans exit and return timestamps. Auto-calculates duration outside.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-[#B19361] font-bold flex items-center group-hover:text-[#1A1A1A]">
              Open Exit Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          {/* Module 4 */}
          <div
            onClick={() => onNavigateRole('admin')}
            className="editorial-card p-6 hover:border-[#1A1A1A] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-[#F2EDE8] text-[#1A1A1A] border border-[#E5E1DB] flex items-center justify-center mb-4 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold serif text-lg text-[#1A1A1A] mb-2">Restricted Fee Desk</h3>
              <p className="text-xs text-[#5C5855] leading-relaxed mb-4">
                Installment balance calculation. Teachers see status only; Admin sees full ledger.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-[#B19361] font-bold flex items-center group-hover:text-[#1A1A1A]">
              Open Fee Desk <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

        </div>
      </div>

      {/* Interactive Public QR Scanner Demo Widget */}
      <div className="editorial-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E1DB] pb-4">
          <div>
            <h3 className="text-xl font-bold serif text-[#1A1A1A] flex items-center">
              <QrCode className="w-5 h-5 mr-2 text-[#B19361]" />
              Interactive QR Code Scanner Test (Public Demo)
            </h3>
            <p className="text-xs text-[#5C5855]">
              Simulate scanning student QR codes attached to ID cards or notebook covers
            </p>
          </div>

          <div className="flex bg-[#F2EDE8] border border-[#E5E1DB] p-1 text-xs">
            <button
              onClick={() => setActiveQrMode('notebook')}
              className={`px-3 py-1.5 uppercase tracking-wider font-semibold text-[10px] transition-colors ${
                activeQrMode === 'notebook' ? 'bg-[#1A1A1A] text-white' : 'text-[#5C5855] hover:text-[#1A1A1A]'
              }`}
            >
              Notebook Verification
            </button>
            <button
              onClick={() => setActiveQrMode('exit')}
              className={`px-3 py-1.5 uppercase tracking-wider font-semibold text-[10px] transition-colors ${
                activeQrMode === 'exit' ? 'bg-[#1A1A1A] text-white' : 'text-[#5C5855] hover:text-[#1A1A1A]'
              }`}
            >
              Exit / Return
            </button>
            <button
              onClick={() => setActiveQrMode('attendance')}
              className={`px-3 py-1.5 uppercase tracking-wider font-semibold text-[10px] transition-colors ${
                activeQrMode === 'attendance' ? 'bg-[#1A1A1A] text-white' : 'text-[#5C5855] hover:text-[#1A1A1A]'
              }`}
            >
              Period Attendance
            </button>
          </div>
        </div>

        {/* Student QR Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { id: 'STU-1001', name: 'Aarav Sharma', grade: 'Grade 10-A', code: 'STU-1001-MATH' },
            { id: 'STU-1002', name: 'Ananya Verma', grade: 'Grade 10-A', code: 'STU-1002-MATH' },
            { id: 'STU-1003', name: 'Rohan Gupta', grade: 'Grade 10-B', code: 'STU-1003-MATH' },
          ].map((s) => (
            <div
              key={s.id}
              className="editorial-card-muted p-5 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-24 h-24 bg-white p-2 border border-[#E5E1DB] flex items-center justify-center shadow-sm">
                {/* SVG Mock QR Code */}
                <svg className="w-full h-full text-[#1A1A1A]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm11 1h2v2h-2v-2zm-3-3h2v2h-2v-2zm4 4h2v2h-2v-2zm2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2 0h2v2h-2v-2z" />
                </svg>
              </div>

              <div>
                <p className="font-bold serif text-base text-[#1A1A1A]">{s.name}</p>
                <p className="text-xs text-[#8C8885] font-mono">{s.grade} • {s.id}</p>
              </div>

              <button
                onClick={() => handleSimulateScan(s.id, s.name)}
                className="w-full bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold text-xs py-2.5 uppercase tracking-wider transition-colors cursor-pointer"
              >
                Scan QR Code
              </button>
            </div>
          ))}
        </div>

        {scanResult && (
          <div className="bg-[#1A1A1A] text-[#FDFCFB] border border-[#B19361] p-4 text-xs flex items-center justify-between font-mono">
            <span>{scanResult}</span>
            <button
              onClick={() => setScanResult(null)}
              className="text-[#B19361] hover:text-white underline font-semibold ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

