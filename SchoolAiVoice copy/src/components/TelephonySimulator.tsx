import React, { useState } from 'react';
import {
  PhoneCall,
  Code,
  CheckCircle2,
  Volume2,
  Smartphone,
} from 'lucide-react';

export const TelephonySimulator: React.FC = () => {
  const [callerPhone, setCallerPhone] = useState('9876543210');
  const [speechInput, setSpeechInput] = useState('What is the attendance and fee status for my student Aarav Sharma?');
  const [isCalling, setIsCalling] = useState(false);
  const [callResponse, setCallResponse] = useState<any>(null);

  const handleSimulateCall = async () => {
    setIsCalling(true);
    setCallResponse(null);

    try {
      const res = await fetch('/api/telephony/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          CallerPhone: callerPhone,
          CallSid: `CA-${Date.now()}`,
          SpeechResult: speechInput,
          LanguageCode: 'en-IN',
        }),
      });

      const data = await res.json();
      setCallResponse(data);
    } catch (e) {
      setCallResponse({ speechText: 'Telephony webhook connection error.' });
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="editorial-card p-6 md:p-8 space-y-8 animate-fade-in text-[#1A1A1A]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E1DB] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#B19361] font-bold block mb-1">
            Single Phone Hotline Protocol
          </span>
          <h1 className="text-3xl font-bold serif text-[#1A1A1A] flex items-center">
            <Smartphone className="w-6 h-6 mr-3 text-[#B19361]" />
            Telephony Integration Architecture
          </h1>
          <p className="text-xs text-[#5C5855] mt-1">
            Decoupled telephony webhook layer at <code className="font-mono text-[#1A1A1A] font-bold">/api/telephony/webhook</code> ready for Twilio/SIP/Asterisk providers.
          </p>
        </div>

        <div className="editorial-card-muted px-4 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
            Production Standard
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Call Simulator Inputs */}
        <div className="editorial-card-muted p-6 space-y-6">
          <h3 className="text-xl font-bold serif text-[#1A1A1A] flex items-center">
            <PhoneCall className="w-5 h-5 mr-2 text-[#B19361]" />
            Simulate Incoming Call to School AI Hotline
          </h3>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">Caller Phone Number:</label>
            <input
              type="text"
              value={callerPhone}
              onChange={(e) => setCallerPhone(e.target.value)}
              className="w-full bg-[#FDFCFB] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">Caller Spoken Utterance / DTMF Input:</label>
            <textarea
              rows={3}
              value={speechInput}
              onChange={(e) => setSpeechInput(e.target.value)}
              className="w-full bg-[#FDFCFB] border border-[#E5E1DB] p-3 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <button
            onClick={handleSimulateCall}
            disabled={isCalling}
            className="w-full bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold py-3 uppercase tracking-wider text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isCalling ? 'Dialing & Processing AI Webhook...' : 'Dial Hotline (Test Webhook)'}</span>
          </button>
        </div>

        {/* Telephony Output TwiML / Speech Response */}
        <div className="editorial-card p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold serif text-[#1A1A1A] flex items-center mb-4">
              <Code className="w-5 h-5 mr-2 text-[#B19361]" />
              Telephony AI Response Payload
            </h3>

            {callResponse ? (
              <div className="space-y-4">
                <div className="editorial-card-muted p-4 space-y-2">
                  <p className="text-[10px] text-[#B19361] font-bold uppercase tracking-wider flex items-center">
                    <Volume2 className="w-3.5 h-3.5 mr-1" />
                    AI Text-To-Speech Output for Phone Caller:
                  </p>
                  <p className="text-xs text-[#1A1A1A] leading-relaxed font-medium serif">{callResponse.speechText}</p>
                </div>

                {callResponse.twimlXml && (
                  <div className="bg-[#1A1A1A] text-[#FDFCFB] p-4 text-[10px] font-mono overflow-x-auto space-y-2">
                    <p className="text-[10px] text-[#B19361] font-sans font-bold uppercase tracking-wider">
                      Generated TwiML XML Telephony Format:
                    </p>
                    <pre className="text-emerald-300">{callResponse.twimlXml}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-[#E5E1DB] p-8 text-center text-[#8C8885] text-xs leading-relaxed italic">
                Click "Dial Hotline" on the left to simulate a telephone call. The AI will authenticate via caller phone, query Django REST APIs, and return spoken audio TwiML response.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E5E1DB] text-[10px] uppercase tracking-wider font-bold text-[#8C8885] flex items-center justify-between">
            <span>Provider Compatibility: Twilio, Plivo, Asterisk SIP</span>
            <CheckCircle2 className="w-4 h-4 text-[#B19361]" />
          </div>
        </div>

      </div>
    </div>
  );
};

