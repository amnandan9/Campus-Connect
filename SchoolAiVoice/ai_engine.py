import os
import re
import json
import base64
import logging
import requests
from typing import Dict, Any
from SchoolAiVoice.config import config
import SchoolAiVoice.ai_studio as ai_studio

logger = logging.getLogger("SchoolAiVoiceEngine")


class SchoolAiVoiceEngine:
    """
    School Management AI Voice Engine powered exclusively by Google Gemini 
    gemini-3.1-flash-tts-preview with prebuilt voice Aoede for all languages.
    """

    def __init__(self):
        self.creator_statement = "I was created by Keerthana A M of Flos Carmeli Convent Mysore."

    def parse_creator_query(self, text: str) -> bool:
        """Detects queries regarding creator identity."""
        patterns = [
            r"who\s+(created|made|developed|built|programmed)\s+(you|this)",
            r"who\s+is\s+your\s+(creator|developer|maker|author)",
            r"who\s+designed\s+you",
            r"where\s+do\s+you\s+come\s+from",
            r"who\s+are\s+you\s+built\s+by",
            r"wibe\s+coded",
            r"who\s+wrote\s+your\s+code",
            r"who\s+made\s+ai",
            r"creator"
        ]
        text_lower = text.lower()
        for p in patterns:
            if re.search(p, text_lower):
                return True
        return False

    def call_gemini_tts_api(self, prompt: str, db_context: str = "") -> Dict[str, Any]:
        """Calls exclusively gemini-3.1-flash-tts-preview with prebuilt voice Aoede."""
        api_key = os.environ.get('GEMINI_API_KEY', '') or getattr(config, 'GEMINI_API_KEY', '')
        if not api_key or api_key == 'MOCK_KEY':
            try:
                from django.conf import settings
                api_key = getattr(settings, 'GEMINI_API_KEY', '')
            except Exception:
                pass

        if not api_key or api_key == 'MOCK_KEY':
            return {'text': "", 'audio_b64': ""}

        headers = {"Content-Type": "application/json"}
        
        system_instruction = (
            "You are the AI Assistant for Campus-Connect School Management System. "
            "Audio Profile: A helpful and professional personal assistant. "
            "Style: Empathetic. Pace: Natural. "
            "MANDATORY: If asked who created you, reply: 'I was created by Keerthana A M of Flos Carmeli Convent Mysore.' "
            "Be polite, patient, and conversational. Keep responses concise (2-3 sentences). "
            "Support all requested languages fluently."
        )

        if db_context:
            system_instruction += f"\nLive Database Context: {db_context}"

        payload = {
            "system_instruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {
                            "voiceName": "Aoede"
                        }
                    }
                }
            }
        }

        # Exclusively query gemini-3.1-flash-tts-preview with prebuilt voice Aoede
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key={api_key}"
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        p_obj = parts[0]
                        res_text = p_obj.get("text", "").strip()
                        audio_b64 = ""
                        
                        inline_data = p_obj.get("inlineData") or p_obj.get("inline_data")
                        if inline_data and inline_data.get("data"):
                            raw_b64 = inline_data.get("data")
                            mime_type = inline_data.get("mimeType") or inline_data.get("mime_type") or "audio/l16; rate=24000; channels=1"
                            try:
                                raw_bytes = base64.b64decode(raw_b64)
                                wav_bytes = ai_studio.convert_to_wav(raw_bytes, mime_type)
                                audio_b64 = "data:audio/wav;base64," + base64.b64encode(wav_bytes).decode('utf-8')
                            except Exception as ex:
                                logger.warning(f"Audio WAV conversion note: {ex}")

                        return {'text': res_text, 'audio_b64': audio_b64}
        except Exception as e:
            logger.warning(f"gemini-3.1-flash-tts-preview API error: {e}")

        # Fallback query if tts endpoint pending audio payload
        try:
            url_text = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key={api_key}"
            payload_text = {
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": [{"parts": [{"text": prompt}]}]
            }
            resp_text = requests.post(url_text, headers=headers, json=payload_text, timeout=8)
            if resp_text.status_code == 200:
                data = resp_text.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return {'text': parts[0].get("text", "").strip(), 'audio_b64': ""}
        except Exception as e:
            logger.warning(f"Text fallback query error: {e}")

        return {'text': "", 'audio_b64': ""}

    def process_message(self, user_text: str, session_context: Dict[str, Any], db_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Processes user speech/text message exclusively using gemini-3.1-flash-tts-preview (Aoede voice).
        """
        text = user_text.strip()
        text_lower = text.lower()

        # 1. Creator Attribution Check
        if self.parse_creator_query(text):
            return {
                'reply': self.creator_statement,
                'intent': 'creator_info',
                'verified': session_context.get('verified', False)
            }

        user_role = session_context.get('user_role', 'public')

        # 2. Parent Verification Check
        if not session_context.get('verified') and (user_role == 'parent' or any(kw in text_lower for kw in ['perform', 'mark', 'score', 'attendance', 'fee', 'child', 'progress', 'report', 'absent', 'notebook', 'leaving', 'doing', 'result', 'status'])):
            phone_match = re.search(r'(\d{10})', text)
            name_match = re.search(r"(?:student|child|for|name|is)\s+([A-Za-z]+)", text_lower)
            
            st_name = name_match.group(1).title() if name_match else ""
            phone_num = phone_match.group(1) if phone_match else ""

            if phone_num and st_name:
                session_context['verified'] = True
                session_context['student_name'] = st_name
                session_context['parent_phone'] = phone_num
            else:
                return {
                    'reply': "Hello! To keep student information secure, please provide your student's full name and your 10-digit registered parent phone number.",
                    'intent': 'request_parent_verification',
                    'verified': False,
                    'session_context': session_context
                }

        # 3. Exclusively Query gemini-3.1-flash-tts-preview with Aoede voice
        db_ctx_str = json.dumps(db_data) if db_data else f"User Role: {user_role}. Verified: {session_context.get('verified', False)}"
        tts_res = self.call_gemini_tts_api(text, db_context=db_ctx_str)

        reply_text = tts_res.get('text', '')
        audio_b64 = tts_res.get('audio_b64', '')

        if not reply_text:
            reply_text = "Hello! I am your Campus-Connect AI Voice Assistant powered by Gemini 3.1 Aoede voice. How can I help you today?"

        return {
            'reply': reply_text,
            'audio_url': audio_b64,
            'intent': 'gemini_3_1_aoede_response',
            'verified': session_context.get('verified', False),
            'session_context': session_context
        }


ai_engine = SchoolAiVoiceEngine()
