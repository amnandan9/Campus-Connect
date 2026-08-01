import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  Bot,
  User,
  ShieldCheck,
  Globe,
  Database,
  KeyRound,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AiChatMessage, ToolCallLog, ParentVerificationState, TeacherAuthState } from '../types';

interface AiVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentState: ParentVerificationState;
  setParentState: React.Dispatch<React.SetStateAction<ParentVerificationState>>;
  teacherState: TeacherAuthState;
  setTeacherState: React.Dispatch<React.SetStateAction<TeacherAuthState>>;
}

export const AiVoiceModal: React.FC<AiVoiceModalProps> = ({
  isOpen,
  onClose,
  parentState,
  setParentState,
  teacherState,
  setTeacherState,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'MSG-INIT',
      sender: 'assistant',
      text: 'Namaste! Welcome to Apex Academy AI Assistant. You can speak or type in any language. Parents: please state your registered phone number & student name to verify identity. Teachers: speak or spell your credentials to log in.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [activeLogs, setActiveLogs] = useState<ToolCallLog[]>([]);

  // Input helpers for Parent verification form quick-fill
  const [parentPhoneInput, setParentPhoneInput] = useState('9876543210');
  const [studentNameInput, setStudentNameInput] = useState('Aarav Sharma');

  // Input helpers for Teacher credentials spell-out form
  const [teacherUserInput, setTeacherUserInput] = useState('teacher1');
  const [teacherPassInput, setTeacherPassInput] = useState('pass123');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeLogs]);

  // Setup Web Speech Recognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = selectedLang === 'auto' ? 'en-IN' : selectedLang;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLang]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert('Speech recognition is not supported in this browser. You can type your voice query in the text box below.');
      }
    }
  };

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined') return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `USER-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          parentState,
          teacherState,
          preferredLanguage: selectedLang,
        }),
      });

      const data = await res.json();

      if (data.toolLogs && data.toolLogs.length > 0) {
        setActiveLogs((prev) => [...data.toolLogs, ...prev]);

        // Check if Parent Verification succeeded in toolLogs
        const verifyLog = data.toolLogs.find((l: ToolCallLog) => l.endpoint.includes('/parent/verify'));
        if (verifyLog) {
          try {
            const parsed = JSON.parse(verifyLog.responseSummary);
            if (parsed.success) {
              setParentState({
                isVerified: true,
                parentPhone: parentPhoneInput,
                studentName: parsed.studentName,
                studentId: parsed.studentId,
              });
            }
          } catch (e) {}
        }

        // Check if Teacher Auth succeeded
        const teacherLog = data.toolLogs.find((l: ToolCallLog) => l.endpoint.includes('/teacher/login'));
        if (teacherLog) {
          try {
            const parsed = JSON.parse(teacherLog.responseSummary);
            if (parsed.success) {
              setTeacherState({
                isAuthenticated: true,
                teacher: parsed.teacher,
                token: parsed.token,
              });
            }
          } catch (e) {}
        }
      }

      if (data.verifiedStudent) {
        setParentState({
          isVerified: true,
          parentPhone: parentPhoneInput,
          studentName: data.verifiedStudent.studentName,
          studentId: data.verifiedStudent.studentId,
        });
      }

      if (data.teacher) {
        setTeacherState({
          isAuthenticated: true,
          teacher: data.teacher,
          token: `token-${Date.now()}`,
        });
      }

      const assistantMsg: AiChatMessage = {
        id: `ASST-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Information retrieved successfully from Django DB.',
        toolCalls: data.toolLogs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(assistantMsg.text);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ERR-${Date.now()}`,
          sender: 'assistant',
          text: 'Sorry, unable to connect to the Django AI backend right now. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParentQuickVerify = () => {
    const voicePrompt = `My registered phone number is ${parentPhoneInput} and student name is ${studentNameInput}. Please verify my parent identity.`;
    handleSendMessage(voicePrompt);
  };

  const handleTeacherQuickLogin = () => {
    const spelledUser = teacherUserInput.split('').join('-');
    const spelledPass = teacherPassInput.split('').join('-');
    const voicePrompt = `I am teacher logging in. My username spelled is ${spelledUser} and my password spelled is ${spelledPass}. Please authenticate me.`;
    handleSendMessage(voicePrompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl h-[90vh] bg-[#FDFCFB] border border-[#E5E1DB] shadow-2xl flex flex-col overflow-hidden text-[#1A1A1A]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F2EDE8] border-b border-[#E5E1DB]">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-[#1A1A1A] flex items-center justify-center text-[#B19361]">
                <Bot className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold serif text-[#1A1A1A]">Apex AI Voice Assistant</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#B19361]">
                  Voice & Multilingual
                </span>
              </div>
              <p className="text-[10px] text-[#8C8885] font-mono">Directly queries Django REST API endpoints</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Picker */}
            <div className="flex items-center space-x-1.5 bg-[#FDFCFB] border border-[#E5E1DB] px-2.5 py-1 text-xs text-[#1A1A1A]">
              <Globe className="w-3.5 h-3.5 text-[#B19361]" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-transparent text-[#1A1A1A] font-medium focus:outline-none cursor-pointer"
              >
                <option value="auto">Auto Detect</option>
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi (हिंदी)</option>
                <option value="es-ES">Spanish (Español)</option>
                <option value="fr-FR">French (Français)</option>
                <option value="mr-IN">Marathi (मराठी)</option>
                <option value="ta-IN">Tamil (தமிழ்)</option>
                <option value="te-IN">Telugu (తెలుగు)</option>
              </select>
            </div>

            {/* Speech Output Toggle */}
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-2 border transition-colors ${
                speechEnabled
                  ? 'bg-[#1A1A1A] text-[#B19361] border-[#1A1A1A]'
                  : 'bg-[#FDFCFB] text-[#8C8885] border-[#E5E1DB]'
              }`}
              title={speechEnabled ? 'Voice output enabled' : 'Voice output muted'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#8C8885] hover:text-[#1A1A1A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 bg-[#F2EDE8]/60 border-b border-[#E5E1DB] text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-[#1A1A1A]">
              <User className="w-3.5 h-3.5 text-[#B19361]" />
              <span className="font-bold">Parent:</span>
              {parentState.isVerified ? (
                <span className="text-emerald-800 font-bold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified ({parentState.studentName})
                </span>
              ) : (
                <span className="text-[#B19361] font-bold">Unverified</span>
              )}
            </div>

            <div className="h-3 w-px bg-[#E5E1DB]"></div>

            <div className="flex items-center space-x-1.5 text-[#1A1A1A]">
              <KeyRound className="w-3.5 h-3.5 text-[#B19361]" />
              <span className="font-bold">Teacher:</span>
              {teacherState.isAuthenticated ? (
                <span className="text-emerald-800 font-bold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Auth ({teacherState.teacher?.name})
                </span>
              ) : (
                <span className="text-[#8C8885]">Logged Out</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono text-[#8C8885]">
            <Database className="w-3.5 h-3.5 text-[#B19361]" />
            <span>Django REST APIs: Connected</span>
          </div>
        </div>

        {/* Body Grid: Chat Area + Side Verification Helpers */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Chat Messages List */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 bg-[#FDFCFB]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#1A1A1A] text-[#FDFCFB]'
                      : 'bg-[#F2EDE8] text-[#1A1A1A] border border-[#E5E1DB]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 space-x-2 border-b border-[#E5E1DB]/40 pb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-75">
                      {msg.sender === 'user' ? 'You (Voice/Text)' : 'Apex AI Assistant'}
                    </span>
                    <span className="text-[10px] font-mono opacity-60">{msg.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-wrap leading-relaxed serif font-medium">{msg.text}</p>

                  {/* Tool execution badge */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#E5E1DB]">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[#B19361] flex items-center mb-1">
                        <Database className="w-3 h-3 mr-1" />
                        Executed Django REST API Calls:
                      </p>
                      {msg.toolCalls.map((log) => (
                        <div
                          key={log.id}
                          className="text-[10px] font-mono bg-[#1A1A1A] text-[#FDFCFB] p-1.5 mb-1"
                        >
                          <span className="text-[#B19361] font-bold">{log.method}</span>{' '}
                          <span className="text-emerald-300">{log.endpoint}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#F2EDE8] border border-[#E5E1DB] p-4 text-xs text-[#1A1A1A] flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#B19361] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#B19361] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-[#B19361] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="font-mono text-[11px]">Querying Django Database via REST APIs...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Sidebar Helper Panels (Parent Verification & Teacher Spell Login) */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#E5E1DB] bg-[#F2EDE8]/60 p-4 space-y-4 overflow-y-auto text-xs">
            
            {/* Quick Parent Verification Card */}
            <div className="editorial-card p-3 space-y-2">
              <div className="flex items-center justify-between text-[#1A1A1A] font-bold">
                <span className="flex items-center serif text-sm">
                  <ShieldCheck className="w-4 h-4 mr-1 text-[#B19361]" />
                  Parent Verification Voice
                </span>
                {parentState.isVerified && (
                  <span className="text-[9px] font-bold uppercase text-emerald-800 bg-[#F2EDE8] px-1.5 py-0.5 border border-[#E5E1DB]">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#5C5855]">
                Verify identity naturally or use preset details:
              </p>

              <div>
                <label className="text-[9px] uppercase tracking-wider font-bold text-[#8C8885]">Parent Phone:</label>
                <input
                  type="text"
                  value={parentPhoneInput}
                  onChange={(e) => setParentPhoneInput(e.target.value)}
                  className="w-full bg-[#F2EDE8] border border-[#E5E1DB] p-1.5 text-xs text-[#1A1A1A] font-mono mt-0.5"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider font-bold text-[#8C8885]">Student Full Name:</label>
                <input
                  type="text"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  className="w-full bg-[#F2EDE8] border border-[#E5E1DB] p-1.5 text-xs text-[#1A1A1A] font-medium mt-0.5"
                />
              </div>

              <button
                onClick={handleParentQuickVerify}
                className="w-full mt-2 bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold py-2 uppercase tracking-wider text-[10px] transition-colors cursor-pointer flex items-center justify-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify Parent via AI</span>
              </button>
            </div>

            {/* Teacher Spell Login Helper */}
            <div className="editorial-card p-3 space-y-2">
              <div className="flex items-center justify-between text-[#1A1A1A] font-bold">
                <span className="flex items-center serif text-sm">
                  <KeyRound className="w-4 h-4 mr-1 text-[#B19361]" />
                  Teacher Voice Login
                </span>
                {teacherState.isAuthenticated && (
                  <span className="text-[9px] font-bold uppercase text-emerald-800 bg-[#F2EDE8] px-1.5 py-0.5 border border-[#E5E1DB]">
                    Auth OK
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#5C5855]">
                Voice input supports character spelling:
              </p>

              <div>
                <label className="text-[9px] uppercase tracking-wider font-bold text-[#8C8885]">Username:</label>
                <input
                  type="text"
                  value={teacherUserInput}
                  onChange={(e) => setTeacherUserInput(e.target.value)}
                  className="w-full bg-[#F2EDE8] border border-[#E5E1DB] p-1.5 text-xs text-[#1A1A1A] font-mono mt-0.5"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider font-bold text-[#8C8885]">Password:</label>
                <input
                  type="password"
                  value={teacherPassInput}
                  onChange={(e) => setTeacherPassInput(e.target.value)}
                  className="w-full bg-[#F2EDE8] border border-[#E5E1DB] p-1.5 text-xs text-[#1A1A1A] font-mono mt-0.5"
                />
              </div>

              <button
                onClick={handleTeacherQuickLogin}
                className="w-full mt-2 bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold py-2 uppercase tracking-wider text-[10px] transition-colors cursor-pointer flex items-center justify-center space-x-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Login Teacher via Voice</span>
              </button>
            </div>

            {/* Quick Voice Prompt Shortcuts */}
            <div className="editorial-card-muted p-3 space-y-2">
              <p className="font-bold text-[#1A1A1A] text-[10px] uppercase tracking-wider">Suggested Questions:</p>
              <button
                onClick={() => handleSendMessage('What is Aarav Sharma attendance percentage?')}
                className="w-full text-left p-2 bg-[#FDFCFB] hover:bg-[#1A1A1A] hover:text-[#FDFCFB] text-[11px] text-[#5C5855] border border-[#E5E1DB] transition-colors"
              >
                • "What is Aarav's attendance?"
              </button>
              <button
                onClick={() => handleSendMessage('What is the fee status for Aarav Sharma?')}
                className="w-full text-left p-2 bg-[#FDFCFB] hover:bg-[#1A1A1A] hover:text-[#FDFCFB] text-[11px] text-[#5C5855] border border-[#E5E1DB] transition-colors"
              >
                • "What is the fee status for Aarav?"
              </button>
              <button
                onClick={() => handleSendMessage('Check notebook verification status for Mathematics.')}
                className="w-full text-left p-2 bg-[#FDFCFB] hover:bg-[#1A1A1A] hover:text-[#FDFCFB] text-[11px] text-[#5C5855] border border-[#E5E1DB] transition-colors"
              >
                • "Check notebook verification."
              </button>
              <button
                onClick={() => handleSendMessage('Please summarize student performance.')}
                className="w-full text-left p-2 bg-[#FDFCFB] hover:bg-[#1A1A1A] hover:text-[#FDFCFB] text-[11px] text-[#5C5855] border border-[#E5E1DB] transition-colors"
              >
                • "Give complete academic summary."
              </button>
            </div>

          </div>
        </div>

        {/* Footer Input Bar */}
        <div className="p-4 bg-[#F2EDE8] border-t border-[#E5E1DB]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-3"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3.5 text-white font-bold transition-colors flex items-center justify-center ${
                isListening
                  ? 'bg-rose-700 animate-pulse'
                  : 'bg-[#1A1A1A] hover:bg-[#B19361]'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input Field */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening to your voice... Speak now...'
                    : 'Speak or type your question in any language (English, Hindi, etc.)...'
                }
                className="w-full bg-[#FDFCFB] border border-[#E5E1DB] px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#8C8885] focus:outline-none focus:border-[#1A1A1A] transition-colors"
              />
              {isListening && (
                <span className="absolute right-3 top-3 text-xs text-rose-600 font-bold animate-pulse">
                  Listening...
                </span>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-3.5 bg-[#1A1A1A] hover:bg-[#B19361] disabled:bg-[#E5E1DB] disabled:text-[#8C8885] text-white font-bold transition-colors disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

