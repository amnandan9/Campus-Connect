import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AiVoiceModal } from './components/AiVoiceModal';
import { PublicLanding } from './components/PublicLanding';
import { AttendanceModule } from './components/AttendanceModule';
import { NotebookModule } from './components/NotebookModule';
import { ExitModule } from './components/ExitModule';
import { FeeModule } from './components/FeeModule';
import { TelephonySimulator } from './components/TelephonySimulator';
import { Role, ParentVerificationState, TeacherAuthState } from './types';
import {
  QrCode,
  BookCheck,
  Clock,
  CreditCard,
  Mic,
  Database,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('public');
  const [activeTab, setActiveTab] = useState<'attendance' | 'notebook' | 'exit' | 'fee' | 'telephony'>('attendance');
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);

  const [parentState, setParentState] = useState<ParentVerificationState>({
    isVerified: false,
  });

  const [teacherState, setTeacherState] = useState<TeacherAuthState>({
    isAuthenticated: false,
  });

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans flex flex-col selection:bg-[#B19361] selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        onOpenAiAssistant={() => setAiModalOpen(true)}
        parentVerified={parentState.isVerified}
        teacherAuth={teacherState.isAuthenticated}
        teacherName={teacherState.teacher?.name}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* If Public Role selected, render Public Landing Page */}
        {currentRole === 'public' && (
          <PublicLanding
            onOpenAiAssistant={() => setAiModalOpen(true)}
            onNavigateRole={(role) => setCurrentRole(role)}
          />
        )}

        {/* Portals (Teacher / Parent / Admin) Navigation Tabs */}
        {currentRole !== 'public' && (
          <div className="space-y-6">
            
            {/* Tab Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F2EDE8] border border-[#E5E1DB] p-2">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-[#1A1A1A] text-[#FDFCFB]'
                      : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]/60'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-[#B19361]" />
                  <span>Period Attendance</span>
                </button>

                <button
                  onClick={() => setActiveTab('notebook')}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'notebook'
                      ? 'bg-[#1A1A1A] text-[#FDFCFB]'
                      : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]/60'
                  }`}
                >
                  <BookCheck className="w-4 h-4 text-[#B19361]" />
                  <span>Notebook Verification</span>
                </button>

                <button
                  onClick={() => setActiveTab('exit')}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'exit'
                      ? 'bg-[#1A1A1A] text-[#FDFCFB]'
                      : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]/60'
                  }`}
                >
                  <Clock className="w-4 h-4 text-[#B19361]" />
                  <span>Exit Tracker</span>
                </button>

                <button
                  onClick={() => setActiveTab('fee')}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'fee'
                      ? 'bg-[#1A1A1A] text-[#FDFCFB]'
                      : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]/60'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#B19361]" />
                  <span>Fee Ledger</span>
                </button>

                <button
                  onClick={() => setActiveTab('telephony')}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'telephony'
                      ? 'bg-[#1A1A1A] text-[#FDFCFB]'
                      : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]/60'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#B19361]" />
                  <span>Telephony Architecture</span>
                </button>
              </div>

              {/* Voice Assistant Launcher in Portal view */}
              <button
                onClick={() => setAiModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#B19361] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4 text-[#B19361]" />
                <span>Open AI Assistant</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'attendance' && (
              <AttendanceModule
                teacherState={teacherState}
                onOpenAiAssistant={() => setAiModalOpen(true)}
              />
            )}

            {activeTab === 'notebook' && (
              <NotebookModule teacherState={teacherState} />
            )}

            {activeTab === 'exit' && <ExitModule />}

            {activeTab === 'fee' && <FeeModule currentRole={currentRole} />}

            {activeTab === 'telephony' && <TelephonySimulator />}

          </div>
        )}

      </main>

      {/* Persistent Floating Microphone Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setAiModalOpen(true)}
          className="group flex items-center space-x-3 px-6 py-3.5 bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border border-[#B19361]/30 shadow-xl"
        >
          <div className="relative flex items-center justify-center">
            <Mic className="w-4 h-4 text-[#B19361] group-hover:text-white transition-colors" />
          </div>
          <span>Apex AI Assistant</span>
          <Sparkles className="w-3.5 h-3.5 text-[#B19361] group-hover:text-white" />
        </button>
      </div>

      {/* AI Voice Assistant Drawer/Modal */}
      <AiVoiceModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        parentState={parentState}
        setParentState={setParentState}
        teacherState={teacherState}
        setTeacherState={setTeacherState}
      />

      {/* Footer */}
      <footer className="bg-[#F2EDE8] border-t border-[#E5E1DB] py-8 mt-12 text-[#8C8885] text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#B19361]" />
            <span className="serif font-semibold text-[#1A1A1A]">Apex Academy</span>
            <span>• Django School Management System & Voice AI Assistant</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>REST API: <code className="text-[#1A1A1A] font-bold">/api/v1/*</code></span>
            <span>Gemini AI: Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

