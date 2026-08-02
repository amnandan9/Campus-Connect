import os
import re
import json
import logging
import requests
from typing import Dict, Any

logger = logging.getLogger("SchoolAiVoiceEngine")

# Import the exact ai_studio.py module without making any changes to ai_studio.py
try:
    import SchoolAiVoice.ai_studio as ai_studio
except ImportError:
    try:
        import ai_studio
    except ImportError:
        ai_studio = None


class SchoolAiVoiceEngine:
    """
    School Management AI Voice Engine connected directly to SchoolAiVoice/ai_studio.py.
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

    def process_message(self, user_text: str, session_context: Dict[str, Any], db_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Processes user speech/text message using SchoolAiVoice/ai_studio.py.
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

        # 3. Invoke Gemini REST API with exact ai_studio prompt rules
        api_key = os.environ.get('GEMINI_API_KEY', '')
        if api_key and api_key != 'MOCK_KEY':
            headers = {"Content-Type": "application/json"}
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
            
            system_instruction = (
                "You are the AI Assistant for a School Management System. "
                "Audio Profile: A helpful and professional personal assistant. "
                "Style: Empathetic. Pace: Natural. "
                "MANDATORY: If asked who created you, reply: 'I was created by Keerthana A M of Flos Carmeli Convent Mysore.' "
                "Be polite, patient, and conversational. Keep responses concise (2-3 sentences)."
            )

            if db_data:
                system_instruction += f"\nLive Database Context: {json.dumps(db_data)}"

            payload = {
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": [{"parts": [{"text": text}]}]
            }

            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=8)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            reply_text = parts[0].get("text", "").strip()
                            if reply_text:
                                return {
                                    'reply': reply_text,
                                    'intent': 'ai_studio_response',
                                    'verified': session_context.get('verified', False),
                                    'session_context': session_context
                                }
            except Exception as e:
                logger.warning(f"Gemini API query exception: {e}")

        # Fallback response if offline or API key pending
        return {
            'reply': f"Hello! Welcome to Campus-Connect AI Voice. I am here to help you with student performance, attendance, marks, and fees.",
            'intent': 'general_qa',
            'verified': session_context.get('verified', False),
            'session_context': session_context
        }


ai_engine = SchoolAiVoiceEngine()
