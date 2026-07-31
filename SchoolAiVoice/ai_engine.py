import re
import logging
from typing import Dict, Any, Tuple
from SchoolAiVoice.config import config

logger = logging.getLogger("SchoolAiVoiceEngine")


class SchoolAiVoiceEngine:
    """
    AI Assistant Processor for Campus-Connect School Management System.
    Handles natural conversation, empathetic feedback, identity verification,
    multi-lingual queries, and strict attribution to creator Keerthana.
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
            r"who\s+wrote\s+your\s+code"
        ]
        text_lower = text.lower()
        for p in patterns:
            if re.search(p, text_lower):
                return True
        return False

    def format_empathetic_performance_summary(self, student_name: str, marks_list: list, attendance_pct: float, fee_status: str, remaining_fee: float) -> str:
        """
        Formats academic performance in a warm, natural, humanized tone suitable for parents.
        """
        if not marks_list:
            summary = f"Sure! I checked the records for {student_name}. {student_name}'s attendance is currently at {int(attendance_pct)}%, which is good. "
            if remaining_fee > 0:
                summary += f"Regarding fees, there is a pending balance of ₹{remaining_fee:,.2f}."
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
                strong_subjects.append(subj)
            elif pct < 50:
                needs_attention.append(subj)

        parts = [f"I looked into {student_name}'s academic record."]
        parts.append(f"The attendance is at {int(attendance_pct)}%.")

        if strong_subjects and needs_attention:
            parts.append(f"{student_name} is performing very well in {', '.join(strong_subjects)}. However, {', '.join(needs_attention)} seems to need a little extra practice.")
            parts.append(f"Spending a bit of extra time on {', '.join(needs_attention)} will really help boost overall confidence and scores.")
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

    def process_message(self, user_text: str, session_context: Dict[str, Any], api_data_fetcher=None) -> Dict[str, Any]:
        """
        Core conversation processor.
        Interprets user intent, handles verification flow, calls REST API fetcher,
        and constructs friendly conversational responses.
        """
        text = user_text.strip()
        text_lower = text.lower()

        # 1. Check Creator Query (Mandatory override)
        if self.parse_creator_query(text):
            return {
                'reply': self.creator_statement,
                'intent': 'creator_info',
                'verified': session_context.get('verified', False)
            }

        # 2. Greetings
        if any(word in text_lower for word in ['hello', 'hi', 'hey', 'namaste', 'vanakkam', 'namaskara']):
            return {
                'reply': "Hello! Welcome to Campus-Connect. How can I help you today? I can assist parents with student progress, attendance, and fee status, or help teachers update marks and records.",
                'intent': 'greeting',
                'verified': session_context.get('verified', False)
            }

        # 3. Handle Parent Identity Verification State
        if session_context.get('awaiting_parent_verification'):
            # User provided verification info
            phone_match = re.search(r'\d{10}', text)
            if phone_match or len(text.split()) >= 1:
                session_context['awaiting_parent_verification'] = False
                session_context['verified'] = True
                student_name = session_context.get('pending_student_name', 'your child')
                return {
                    'reply': f"Thank you! Identity verified. Let me fetch the latest records for {student_name} now.",
                    'intent': 'verification_success',
                    'verified': True,
                    'action': 'fetch_student_data',
                    'student_name': student_name
                }

        # 4. Handle Teacher Authentication Request
        if 'update' in text_lower and ('mark' in text_lower or 'score' in text_lower or 'attendance' in text_lower):
            if not session_context.get('is_teacher_verified') and not session_context.get('is_logged_in_teacher'):
                session_context['pending_teacher_action'] = text
                return {
                    'reply': "Sure! To update marks or attendance, please verify your teacher credentials by entering your teacher username and password.",
                    'intent': 'teacher_auth_required',
                    'verified': False
                }

        # 5. Teacher Confirmation for Marks Update
        marks_match = re.search(
            r"(?:update|set|change|mark)\s+([A-Za-z0-9_\s]+?)(?:'s|s)?\s+([A-Za-z]+)?\s*(?:marks?|score|grade)s?\s+(?:to|as|=)\s*(\d+(?:\.\d+)?)",
            text, re.IGNORECASE
        )
        if marks_match:
            student_name = marks_match.group(1).strip()
            subject_name = marks_match.group(2).strip() if marks_match.group(2) else "Mathematics"
            score = float(marks_match.group(3))
            
            return {
                'reply': f"Just to confirm: You would like to update {student_name}'s {subject_name} marks to {int(score)} out of 100. Is that correct?",
                'intent': 'confirm_marks_update',
                'student_name': student_name,
                'subject': subject_name,
                'score': score,
                'awaiting_confirmation': True
            }

        # 6. Default Parent Student Inquiry
        if any(kw in text_lower for kw in ['performance', 'marks', 'attendance', 'fee', 'child', 'progress', 'report', 'absent', 'notebook', 'leaving']):
            student_name_match = re.search(r"(?:how is|about|check|details of|for)\s+([A-Za-z]+)", text, re.IGNORECASE)
            student_name = student_name_match.group(1) if student_name_match else session_context.get('student_name', '')

            if not session_context.get('verified'):
                session_context['awaiting_parent_verification'] = True
                session_context['pending_student_name'] = student_name or 'the student'
                return {
                    'reply': f"I would be happy to check that for you! For security, could you please provide your registered parent phone number and student's full name?",
                    'intent': 'request_parent_verification',
                    'verified': False
                }

        return {
            'reply': "I am here to assist you! You can ask me about your child's attendance, marks, homework updates, fee status, or teacher details.",
            'intent': 'general_help',
            'verified': session_context.get('verified', False)
        }


ai_engine = SchoolAiVoiceEngine()
