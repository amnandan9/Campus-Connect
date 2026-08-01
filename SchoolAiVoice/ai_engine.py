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
    Advanced Multilingual AI Assistant Processor for Campus-Connect.
    Supports READ operations (fetching performance, attendance, fee, notebook checks)
    and WRITE operations (marking attendance, recording marks, notebook sign-offs)
    with strict section authorization and creator attribution.
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

    def format_empathetic_performance_summary(self, student_name: str, marks_list: list, attendance_pct: float, fee_status: str, remaining_fee: float, lang: str = 'en') -> str:
        """Formats academic performance in a warm, natural, humanized tone."""
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

    def call_gemini_api(self, prompt: str, db_context: str = "") -> str:
        """Calls Google Gemini Generative AI REST API to think and respond dynamically in any language."""
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
        
        system_instruction = (
            "You are Campus-Connect AI Assistant, an empathetic, friendly, and thinking school management AI. "
            "MANDATORY REQUIREMENT: If asked who created, made, or programmed you, you MUST ALWAYS reply: 'I was created by Keerthana A M of Flora Carmeli Convent Mysore.' Never mention Wibe Coded. "
            "Speak naturally like a helpful human school staff member, not like a robot. "
            "Explain things in simple language that any parent or teacher can understand. "
            "Keep responses clear, concise, empathetic, and polite (max 2-3 sentences). "
            "Converse fluently in Kannada, Hindi, English, Tamil, Telugu, Malayalam, or any language the user requests. "
            "If requested to speak in a specific language, switch immediately and fluently!"
        )
        if db_context:
            system_instruction += f" Live School Database Context: {db_context}"


        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }

        # Try supported Gemini API model endpoints sequentially (preferring active flash models)
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
        Processes user speech/text message.
        Uses Gemini Generative AI for thinking and dynamic responses.
        """
        text = user_text.strip()
        text_lower = text.lower()
        lang = self.detect_language(text)

        # 1. Creator Query Rule (Mandatory Override)
        if self.parse_creator_query(text):
            return {
                'reply': self.creator_statement,
                'intent': 'creator_info',
                'verified': session_context.get('verified', False)
            }

        # 2. WRITE Actions: Attendance Update
        mark_att_match = re.search(r"(?:mark|add)\s+([A-Za-z]+)\s+(present|absent)", text_lower)
        if mark_att_match:
            st_name = mark_att_match.group(1).title()
            st_status = mark_att_match.group(2).lower()
            return {
                'action': 'write_attendance',
                'student_name': st_name,
                'status': st_status,
                'reply': f"Updating attendance for {st_name} as {st_status}...",
                'intent': 'write_attendance'
            }

        # 3. WRITE Actions: Marks Update
        mark_score_match = re.search(r"(?:update|add|set)\s+marks\s+for\s+([A-Za-z]+)\s+to\s+([0-9.]+)", text_lower)
        if mark_score_match:
            st_name = mark_score_match.group(1).title()
            score_val = float(mark_score_match.group(2))
            return {
                'action': 'write_marks',
                'student_name': st_name,
                'marks': score_val,
                'reply': f"Updating marks for {st_name} to {score_val}...",
                'intent': 'write_marks'
            }

        # 4. READ Actions: DB data fetched
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

        # 5. Parent Identity Verification Check
        if any(kw in text_lower for kw in ['perform', 'mark', 'score', 'attendance', 'fee', 'child', 'progress', 'report', 'absent', 'notebook', 'leaving', 'doing', 'result', 'status']):
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

        # 6. Try Gemini AI Thinking Engine for all general Q&A / multilingual prompts
        db_context_str = json.dumps(db_data) if db_data and db_data.get('student_found') else ""
        gemini_reply = self.call_gemini_api(text, db_context=db_context_str)
        if gemini_reply:
            return {
                'reply': gemini_reply,
                'intent': 'gemini_thinking_ai',
                'verified': session_context.get('verified', False)
            }

        # 7. Default Multilingual Intelligent Fallback
        if lang == 'kn':
            default_reply = f"ಖಂಡಿತ, ನಾನು ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಬಲ್ಲೆ! ನಾನು ಕ್ಯಾಂಪಸ್-ಕನೆಕ್ಟ್ AI ಸಹಾಯಕ್. ವಿದ್ಯಾರ್ಥಿಗಳ ಹಾಜರಾತಿ, ಅಂಕಗಳು, ಅಥವಾ ಶುಲ್ಕದ ಕುರಿತು ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಬಹುದು."
        elif lang == 'hi':
            default_reply = f"मैं आपकी मदद के लिए यहाँ हूँ! आप छात्रों की उपस्थिति, अंक या फीस से जुड़ा कोई भी सवाल पूछ सकते हैं।"
        else:
            default_reply = f"I am Campus-Connect AI Assistant! I am here to assist you with student attendance, marks, fee records, or any question about our campus portal."

        return {
            'reply': default_reply,
            'intent': 'general_help',
            'verified': session_context.get('verified', False)
        }


ai_engine = SchoolAiVoiceEngine()



