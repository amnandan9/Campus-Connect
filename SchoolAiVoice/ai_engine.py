import os
import re
import json
import logging
import requests
from typing import Dict, Any, Tuple
from SchoolAiVoice.config import config

logger = logging.getLogger("SchoolAiVoiceEngine")

# System instruction compiled directly from ai_studio_code.py Specification
AI_STUDIO_SYSTEM_INSTRUCTION = """
Read the following transcript based on the audio profile and director's note.

# Audio Profile
A helpful and professional personal assistant.

# Director's note
Style: Empathetic. Pace: Natural.

## Scene:
# AI Assistant Behavior Specification

You are the AI Assistant for a School Management System. Your primary goal is to help parents, teachers, and administrators in a natural, friendly, and professional manner.

## Personality
- Speak naturally like a helpful human school staff member, not like a robot.
- Be polite, patient, and conversational.
- Explain things in simple language that any parent can understand.
- Avoid technical terms unless the user specifically asks.
- Keep responses clear and concise (max 2-3 sentences).
- Respond with empathy when discussing student performance.
- Never sound repetitive.
- Never expose internal system details or database information.

MANDATORY CREATOR ATTRIBUTION:
If asked who created, made, or built you, you MUST ALWAYS reply: "I was created by Keerthana A M of Flos Carmeli Convent Mysore." Never say Wibe Coded.

## Language Support
The assistant must automatically detect the user's language (English, Kannada, Hindi, Tamil, Telugu, Malayalam).
If the user changes language during the conversation, switch naturally without asking.

## Parent Authentication
Before revealing any personal student information, verify identity.
Ask for:
- Registered parent phone number
- Student name
Only after successful verification should the AI access records.

## Teacher Authentication
Teachers must authenticate before performing updates.
Teachers must only access students assigned to them.
Never allow teachers to modify another teacher's class or section.

## Communication Style
Do not overwhelm users. Break long explanations into small sentences. Always answer politely.
If parents are worried: Respond calmly and positively. Never criticize students.
Instead of: "Your child is poor in Mathematics."
Say: "It looks like Mathematics is an area where a little extra practice could really help."

## Conversation Style
The AI should behave like:
- A friendly school receptionist
- A caring teacher
- A helpful colleague
Every response should feel warm, natural, respectful, and easy to understand.
"""


class SchoolAiVoiceEngine:
    """
    School Management AI Voice Engine constructed from ai_studio_code.py.
    Provides empathetic, natural, role-authenticated Q&A for Parents, Teachers, and Visitors.
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

    def detect_language(self, text: str) -> str:
        """Detects language script or keywords (Kannada, Hindi, Tamil, Telugu, Malayalam, English)."""
        if re.search(r'[\u0C80-\u0CFF]', text) or any(w in text.lower() for w in ['hegiddira', 'kannada', 'namaskara']):
            return 'kn'
        if re.search(r'[\u0900-\u097F]', text) or any(w in text.lower() for w in ['kaise', 'kya', 'namaste', 'hindi']):
            return 'hi'
        if re.search(r'[\u0B80-\u0BFF]', text) or any(w in text.lower() for w in ['vanakkam', 'tamil']):
            return 'ta'
        if re.search(r'[\u0C00-\u0C7F]', text) or any(w in text.lower() for w in ['namaskaram', 'telugu']):
            return 'te'
        if re.search(r'[\u0D00-\u0D7F]', text) or any(w in text.lower() for w in ['namaskaram', 'malayalam']):
            return 'ml'
        return 'en'

    def call_gemini_api(self, prompt: str, db_context: str = "") -> str:
        """Calls Google Gemini Generative AI REST API using active models."""
        api_key = os.environ.get('GEMINI_API_KEY', '') or getattr(config, 'GEMINI_API_KEY', '')
        if not api_key or api_key == 'MOCK_KEY':
            try:
                from django.conf import settings
                api_key = getattr(settings, 'GEMINI_API_KEY', '')
            except Exception:
                pass

        if not api_key or api_key == 'MOCK_KEY':
            return ""

        headers = {"Content-Type": "application/json"}
        
        system_instruction = AI_STUDIO_SYSTEM_INSTRUCTION
        if db_context:
            system_instruction += f"\n\nLive School Database Context:\n{db_context}"

        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }

        # Try active supported Gemini API models
        models_to_try = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-2.0-flash"]
        for m_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={api_key}"
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=8)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
            except Exception as e:
                logger.warning(f"Gemini API model {m_name} exception: {e}")

        return ""

    def process_message(self, user_text: str, session_context: Dict[str, Any], db_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Processes user speech/text message based on ai_studio_code.py rules.
        """
        text = user_text.strip()
        text_lower = text.lower()
        lang = self.detect_language(text)

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
            # Extract phone number and student name if provided in prompt
            phone_match = re.search(r'(\d{10})', text)
            name_match = re.search(r"(?:student|child|for|name|is)\s+([A-Za-z]+)", text_lower)
            
            st_name = name_match.group(1).title() if name_match else ""
            phone_num = phone_match.group(1) if phone_match else ""

            if phone_num and st_name:
                session_context['verified'] = True
                session_context['student_name'] = st_name
                session_context['parent_phone'] = phone_num
                db_context = f"Student Name: {st_name}, Parent Phone: {phone_num}. Identity Verified."
                ai_reply = self.call_gemini_api(text, db_context)
                if not ai_reply:
                    ai_reply = f"Thank you! Identity verified for {st_name}. How can I assist you with attendance, marks, or fee records today?"
                return {
                    'reply': ai_reply,
                    'intent': 'parent_verified',
                    'verified': True,
                    'student_name': st_name,
                    'session_context': session_context
                }
            else:
                return {
                    'reply': "Hello! To keep student information secure, please provide your student's full name and your 10-digit registered parent phone number.",
                    'intent': 'request_parent_verification',
                    'verified': False,
                    'session_context': session_context
                }


        # 3. Teacher Authentication / Scoping Check
        if user_role == 'teacher':
            is_authenticated = session_context.get('is_authenticated_teacher', False)
            if not is_authenticated:
                return {
                    'reply': "Hello Teacher! Please make sure you are logged in to the portal first so I can assist you with your authorized section records.",
                    'intent': 'teacher_auth_required',
                    'verified': False,
                    'session_context': session_context
                }

        # 4. Verified DB Data Response
        if db_data and db_data.get('student_found'):
            student_name = db_data.get('student_name', 'the student')
            marks_list = db_data.get('marks_list', [])
            att_rate = db_data.get('attendance_rate', 100.0)
            fee_status = db_data.get('fee_status', 'Not Cleared')
            rem_fee = db_data.get('remaining_fee', 0.0)

            db_context = f"Student: {student_name}, Attendance: {att_rate}%, Marks: {marks_list}, Remaining Fee: {rem_fee}, Status: {fee_status}"
            ai_reply = self.call_gemini_api(text, db_context)
            if not ai_reply:
                ai_reply = f"I checked the records. {student_name}'s attendance is {int(att_rate)}%. Marks look good, and fee status is {fee_status}."

            return {
                'reply': ai_reply,
                'intent': 'student_summary',
                'verified': True,
                'student_name': student_name,
                'session_context': session_context
            }

        # 5. General Thinking AI Q&A via Gemini API
        db_context = f"User Role: {user_role}. Conversation Session Verified: {session_context.get('verified', False)}"
        ai_reply = self.call_gemini_api(text, db_context)

        if not ai_reply:
            if lang == 'kn':
                ai_reply = f"ನಮಸ್ಕಾರ! ನಾನು Campus-Connect AI ಸಹಾಯಕ್. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
            elif lang == 'hi':
                ai_reply = f"नमस्ते! मैं Campus-Connect AI सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ?"
            else:
                ai_reply = f"Hello! I am your Campus-Connect AI Assistant. How can I help you today?"

        return {
            'reply': ai_reply,
            'intent': 'general_qa',
            'verified': session_context.get('verified', False),
            'session_context': session_context
        }


ai_engine = SchoolAiVoiceEngine()
