import logging
import re
from typing import Dict, Any, Tuple
from django_client import DjangoRestClient

logger = logging.getLogger("PipecatVoiceBot")


class PipecatVoiceBotService:
    """
    Pipecat Voice Agent Service.
    Parses natural language speech commands, interacts with Django REST API over HTTPS,
    and formats conversational audio/speech responses.
    """
    def __init__(self, django_client: DjangoRestClient):
        self.client = django_client

    def process_command(self, user_transcript: str) -> Tuple[str, Dict[str, Any]]:
        """
        Processes a transcript from STT / LLM pipeline and triggers appropriate Django REST APIs.
        Example: "Update Rahul's Mathematics marks to 35."
        """
        logger.info(f"Processing Voice Command: '{user_transcript}'")
        text = user_transcript.strip()

        # 1. Pattern: Update [Name]'s [Subject] marks to [Score]
        marks_match = re.search(
            r"(?:update|set|mark)\s+([A-Za-z0-9_\s]+?)(?:'s|s)?\s+([A-Za-z]+)?\s*(?:marks?|score|grade)s?\s+(?:to|as|=)\s*(\d+(?:\.\d+)?)",
            text, re.IGNORECASE
        )
        if not marks_match:
            marks_match = re.search(
                r"(?:update|set|mark)\s+([A-Za-z0-9_\s]+?)(?:'s|s)?\s+(\d+(?:\.\d+)?)\s*(?:marks?|score)?\s+in\s+([A-Za-z]+)",
                text, re.IGNORECASE
            )

        if marks_match:
            if marks_match.lastindex == 3 and marks_match.group(3).replace('.', '', 1).isdigit():
                student_name = marks_match.group(1).strip()
                subject_name = marks_match.group(2).strip() if marks_match.group(2) else "Mathematics"
                score = float(marks_match.group(3))
            else:
                student_name = marks_match.group(1).strip()
                score = float(marks_match.group(2))
                subject_name = marks_match.group(3).strip()

            res = self.client.update_marks(
                student_name=student_name,
                subject=subject_name,
                marks_obtained=score,
                max_marks=100.0,
                work_type='test'
            )

            if res.get('success'):
                reply = f"The student's marks have been updated successfully."
                if res.get('parent_call_required'):
                    reply += f" Attention: Score is {res.get('percentage')}%, below threshold. Parent call initiated for {res.get('parent_contact')}."
                return reply, res
            else:
                return f"Sorry, could not update marks: {res.get('error', 'Unknown Error')}.", res

        # 2. Pattern: Mark [Name] present/absent
        att_match = re.search(
            r"(?:mark|set)\s+([A-Za-z0-9_\s]+?)\s+(?:as\s+)?(present|absent|late)",
            text, re.IGNORECASE
        )
        if att_match:
            student_name = att_match.group(1).strip()
            status = att_match.group(2).lower()
            res = self.client.update_attendance(student_name=student_name, status=status)
            if res.get('success'):
                return res.get('message', 'Attendance updated successfully.'), res
            else:
                return f"Could not update attendance: {res.get('error')}.", res

        # 3. Pattern: Get academic summary / info for [Name]
        info_match = re.search(
            r"(?:get|show|check|tell\s+me\s+about)\s+(?:academic\s+summary|info|details?|record)s?\s+(?:for|of)?\s*([A-Za-z0-9_\s]+)",
            text, re.IGNORECASE
        )
        if info_match:
            student_name = info_match.group(1).strip()
            res = self.client.get_academic_summary(student_name)
            if res.get('success'):
                reply = f"{res.get('student_name')} in section {res.get('section')} has {res.get('attendance_percentage')}% attendance, average score of {res.get('average_score_percentage')}%, and fee status is {res.get('fee_status')}."
                return reply, res
            else:
                return f"Could not find student details: {res.get('error')}.", res

        # Default fallback: Get student info
        res = self.client.get_student(text)
        if res.get('success'):
            return f"Found profile for {res.get('full_name')} in section {res.get('section')}. Remaining fee is ₹{res.get('remaining_balance')}.", res

        return f"Understood command '{text}'. No specific REST action matched.", {'success': False}
