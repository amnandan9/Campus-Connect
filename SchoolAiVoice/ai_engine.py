import os
import re
import json
import logging
import requests
from typing import Dict, Any, Tuple
from SchoolAiVoice.config import config

logger = logging.getLogger("SchoolAiVoiceEngine")


class SchoolAiVoiceEngine:
    """
    Advanced Smart Multilingual AI Assistant Processor for Campus-Connect.
    Handles real-time Django database context parsing, creator attribution,
    empathetic performance summaries, parent/teacher verification, and section scoping.
    """

    def __init__(self):
        self.creator_statement = config.CREATOR_INFO

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
        # Kannada unicode range: \u0C80-\u0CFF
        if re.search(r'[\u0C80-\u0CFF]', text) or any(w in text.lower() for w in ['hegiddiyabya', 'hegiddira', 'kannada', 'namaskara']):
            return 'kn'
        # Hindi unicode range: \u0900-\u097F
        if re.search(r'[\u0900-\u097F]', text) or any(w in text.lower() for w in ['kaise', 'kya', 'namaste', 'hindi']):
            return 'hi'
        # Tamil unicode range: \u0B80-\u0BFF
        if re.search(r'[\u0B80-\u0BFF]', text) or any(w in text.lower() for w in ['vanakkam', 'tamil']):
            return 'ta'
        # Telugu unicode range: \u0C00-\u0C7F
        if re.search(r'[\u0C00-\u0C7F]', text) or any(w in text.lower() for w in ['namaskaram', 'telugu']):
            return 'te'
        # Malayalam unicode range: \u0D00-\u0D7F
        if re.search(r'[\u0D00-\u0D7F]', text) or any(w in text.lower() for w in ['namaskaram', 'malayalam']):
            return 'ml'
        return 'en'

    def format_empathetic_performance_summary(self, student_name: str, marks_list: list, attendance_pct: float, fee_status: str, remaining_fee: float, lang: str = 'en') -> str:
        """
        Formats academic performance in a warm, natural, humanized tone.
        """
        if lang == 'kn':
            reply = f"ಖಂಡಿತ! {student_name} ಅವರ ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಿದ್ದೇನೆ. ಹಾಜರಾತಿ {int(attendance_pct)}% ಇದೆ."
            if marks_list:
                subj_str = ", ".join([f"{m.get('subject')}: {m.get('marks_obtained')}/{m.get('max_marks')}" for m in marks_list[:3]])
                reply += f" ಅಂಕಗಳು: {subj_str}."
            if remaining_fee > 0:
                reply += f" ಬಾಕಿ ಶುಲ್ಕ ₹{remaining_fee:,.2f} ಆಗಿದೆ."
            else:
                reply += " ಶುಲ್ಕ ಸಂಪೂರ್ಣವಾಗಿ ಪಾವತಿಸಲಾಗಿದೆ."
            return reply

        if lang == 'hi':
            reply = f"नमस्ते! मैंने {student_name} का रिकॉर्ड चेक किया है। उपस्थिति {int(attendance_pct)}% है।"
            if marks_list:
                subj_str = ", ".join([f"{m.get('subject')}: {m.get('marks_obtained')}/{m.get('max_marks')}" for m in marks_list[:3]])
                reply += f" प्राप्त अंक: {subj_str}।"
            if remaining_fee > 0:
                reply += f" शेष शुल्क ₹{remaining_fee:,.2f} है।"
            else:
                reply += " फीस पूरी तरह जमा है।"
            return reply

        # Default English
        if not marks_list:
            summary = f"Sure! I checked the records for {student_name}. {student_name}'s attendance is currently at {int(attendance_pct)}%, which is quite good. "
            if remaining_fee > 0:
                summary += f"Regarding fees, there is a remaining balance of ₹{remaining_fee:,.2f}."
            else:
                summary += "The fee records are completely clear."
            return summary

        strong_subjects = []
        needs_attention = []

        for m in marks_list:
            subj = m.get('subject', 'Subject')
            score = m.get('marks_obtained', 0)
            max_m = m.get('max_marks', 100)
            pct = (score / max_m * 100.0) if max_m > 0 else 0
            if pct >= 70:
                strong_subjects.append(f"{subj} ({int(score)}/{int(max_m)})")
            elif pct < 50:
                needs_attention.append(f"{subj} ({int(score)}/{int(max_m)})")

        parts = [f"I looked into {student_name}'s academic record."]
        parts.append(f"The attendance is at {int(attendance_pct)}%.")

        if strong_subjects and needs_attention:
            parts.append(f"{student_name} is performing very well in {', '.join(strong_subjects)}. However, {', '.join(needs_attention)} seems to need a little extra practice.")
            parts.append(f"Spending a bit of extra time on {', '.join(needs_attention)} will really help boost overall confidence and results!")
        elif strong_subjects:
            parts.append(f"{student_name} is doing fantastically well across subjects, particularly in {', '.join(strong_subjects)}!")
        elif needs_attention:
            parts.append(f"It looks like {', '.join(needs_attention)} could use some extra attention and revision at home.")
        else:
            parts.append(f"Performance is steady across all subjects.")

        if fee_status == 'Cleared' or remaining_fee <= 0:
            parts.append("All fee payments are up to date.")
        else:
            parts.append(f"The remaining fee balance is ₹{remaining_fee:,.2f}.")

        return " ".join(parts)

    def process_message(self, user_text: str, session_context: Dict[str, Any], db_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Processes user text/voice input message.
        Parses parent/teacher verification, fetches student records, checks section authorization,
        and constructs friendly conversational responses.
        """
        text = user_text.strip()
        text_lower = text.lower()
        lang = self.detect_language(text)

        # 1. Creator Query Rule (Mandatory System Override)
        if self.parse_creator_query(text):
            return {
                'reply': self.creator_statement,
                'intent': 'creator_info',
                'verified': session_context.get('verified', False)
            }

        # 2. Greetings
        if any(word in text_lower for word in ['hello', 'hi', 'hey', 'namaste', 'vanakkam', 'namaskara']):
            if lang == 'kn':
                greeting = "ನಮಸ್ಕಾರ! ಕ್ಯಾಂಪಸ್-ಕನೆಕ್ಟ್ AI ಸಹಾಯಕ್‌ಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
            elif lang == 'hi':
                greeting = "नमस्ते! कैंपस-कनेक्ट AI असिस्टेंट में आपका स्वागत है। मैं आपकी क्या मदद कर सकता हूँ?"
            else:
                greeting = "Hello! Welcome to Campus-Connect. How can I help you today? I can assist parents with student progress, attendance, and fee status, or help teachers update marks and records."
            
            return {
                'reply': greeting,
                'intent': 'greeting',
                'verified': session_context.get('verified', False)
            }

        # 3. If DB data for a student was fetched
        if db_data and db_data.get('student_found'):
            student_name = db_data.get('student_name', 'the student')
            marks_list = db_data.get('marks_list', [])
            att_rate = db_data.get('attendance_rate', 100.0)
            fee_status = db_data.get('fee_status', 'Not Cleared')
            rem_fee = db_data.get('remaining_fee', 0.0)

            reply = self.format_empathetic_performance_summary(
                student_name=student_name,
                marks_list=marks_list,
                attendance_pct=att_rate,
                fee_status=fee_status,
                remaining_fee=rem_fee,
                lang=lang
            )

            return {
                'reply': reply,
                'intent': 'student_summary',
                'verified': True,
                'student_name': student_name
            }

        # 4. Handle Parent Identity Verification Prompt
        if any(kw in text_lower for kw in ['perform', 'mark', 'score', 'attendance', 'fee', 'child', 'progress', 'report', 'absent', 'notebook', 'leaving', 'doing', 'result', 'status']):
            # Extract student name
            name_match = re.search(r"(?:how is|about|check|details of|for|status of)\s+([A-Za-z]+)", text, re.IGNORECASE)
            student_name = name_match.group(1) if name_match else ""

            if not session_context.get('verified'):
                session_context['awaiting_parent_verification'] = True
                session_context['pending_student_name'] = student_name or 'the student'
                return {
                    'reply': f"I would be happy to check that for you! To keep student information secure, could you please provide your registered parent phone number and student's full name?",
                    'intent': 'request_parent_verification',
                    'verified': False,
                    'student_name': student_name
                }

        return {
            'reply': "I am here to assist you! You can ask about student progress, attendance rates, fee details, homework verification, or teacher assignments.",
            'intent': 'general_help',
            'verified': session_context.get('verified', False)
        }


ai_engine = SchoolAiVoiceEngine()
