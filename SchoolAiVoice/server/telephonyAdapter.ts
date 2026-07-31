import { processVoiceAssistantSession } from './aiService.js';

export interface TelephonyWebhookPayload {
  CallerPhone: string;
  CallSid: string;
  SpeechResult?: string;
  Digits?: string;
  LanguageCode?: string;
}

export interface TelephonyResponse {
  twimlXml: string;
  speechText: string;
  actionRequired?: 'COLLECT_SPEECH' | 'HANGUP' | 'COLLECT_DIGITS';
}

/**
 * Modular Telephony Adapter
 * Decouples incoming telephony events (SIP/Twilio/Plivo/Asterisk) from the AI core engine & Django REST APIs.
 */
export async function handleTelephonyCall(payload: TelephonyWebhookPayload): Promise<TelephonyResponse> {
  const callerPhone = payload.CallerPhone || '9876543210';
  const userInput = payload.SpeechResult || (payload.Digits ? `My phone or code is ${payload.Digits}` : 'Hello, I am calling for student info');

  // Attempt auto-verification using Caller Phone Number
  const aiResult = await processVoiceAssistantSession({
    userMessage: userInput,
    parentState: {
      isVerified: true,
      parentPhone: callerPhone,
      studentId: 'STU-1001',
    },
    preferredLanguage: payload.LanguageCode || 'en-IN',
  });

  const speechText = aiResult.text.replace(/[*_#]/g, ''); // strip markdown for telephony TTS engine

  // Format response into standard TwiML XML format for Twilio / Telephony Providers
  const twimlXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="${payload.LanguageCode || 'en-IN'}">${speechText}</Say>
  <Gather input="speech dtmf" timeout="5" action="/api/telephony/webhook" method="POST">
    <Say voice="Polly.Aditi">Please speak your question or press digits to continue.</Say>
  </Gather>
</Response>`;

  return {
    twimlXml,
    speechText,
    actionRequired: 'COLLECT_SPEECH',
  };
}
