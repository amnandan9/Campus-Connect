import React from 'react';
import { Mic, Shield, User, CheckCircle2, Bot } from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onOpenAiAssistant: () => void;
  parentVerified: boolean;
  teacherAuth: boolean;
  teacherName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onOpenAiAssistant,
  parentVerified,
  teacherAuth,
  teacherName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FDFCFB] border-b border-[#E5E1DB] text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => onRoleChange('public')}>
            <span className="text-2xl sm:text-3xl font-bold tracking-tighter serif italic text-[#1A1A1A]">
              EduCore.
            </span>
            <span className="h-5 w-px bg-[#D1CDCA] hidden sm:inline-block"></span>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C8885] font-bold">
                School Management System v4.2
              </span>
              <span className="text-[10px] font-mono text-[#B19361]">
                Django REST Backend • Gemini Voice AI
              </span>
            </div>
          </div>

          {/* Actions & Role Switcher */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              id="nav-voice-ai-btn"
              onClick={onOpenAiAssistant}
              className="flex items-center space-x-2.5 px-4 py-2 border border-[#1A1A1A] bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#B19361] hover:border-[#B19361] transition-all cursor-pointer shadow-sm text-xs font-bold uppercase tracking-wider"
            >
              <Mic className="w-4 h-4 text-[#B19361] group-hover:text-white" />
              <span>Voice AI Assistant</span>
            </button>

            {/* Role Switcher */}
            <div className="hidden lg:flex items-center border border-[#E5E1DB] bg-[#F2EDE8] p-1">
              <button
                id="role-btn-public"
                onClick={() => onRoleChange('public')}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold transition-all ${
                  currentRole === 'public'
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]'
                }`}
              >
                Campus View
              </button>

              <button
                id="role-btn-teacher"
                onClick={() => onRoleChange('teacher')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold transition-all ${
                  currentRole === 'teacher'
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]'
                }`}
              >
                <User className="w-3 h-3 text-[#B19361]" />
                <span>Teacher Portal</span>
                {teacherAuth && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />}
              </button>

              <button
                id="role-btn-parent"
                onClick={() => onRoleChange('parent')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold transition-all ${
                  currentRole === 'parent'
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]'
                }`}
              >
                <Bot className="w-3 h-3 text-[#B19361]" />
                <span>Parent Portal</span>
                {parentVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />}
              </button>

              <button
                id="role-btn-admin"
                onClick={() => onRoleChange('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-[#5C5855] hover:text-[#1A1A1A] hover:bg-[#E5E1DB]'
                }`}
              >
                <Shield className="w-3 h-3 text-[#B19361]" />
                <span>Staff Portal</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

