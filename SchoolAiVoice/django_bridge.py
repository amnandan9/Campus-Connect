import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("SchoolAiDjangoBridge")


class SchoolAiDjangoBridge:
    """
    Bridge connecting SchoolAiVoice engine with Django REST APIs over HTTPS.
    Guarantees Django remains the single source of truth.
    """
    def __init__(self, base_url: str = "https://amkeerthana.pythonanywhere.com", api_key: str = "campus_connect_voice_secret_key_2026"):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key

    def _headers(self) -> Dict[str, str]:
        return {
            'X-API-KEY': self.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

    def verify_parent(self, phone_number: str, student_name: str) -> Dict[str, Any]:
        """Verify registered parent contact phone number and student name via Django API."""
        try:
            res = requests.get(
                f"{self.base_url}/api/v1/voice/parent/",
                params={'name': student_name, 'phone': phone_number},
                headers=self._headers(),
                timeout=6
            )
            if res.status_code == 200:
                return res.json()
            return {'success': False, 'message': 'Parent verification failed or student not found.'}
        except Exception as e:
            logger.error(f"Error connecting to Django parent verification API: {e}")
            return {'success': False, 'message': 'Unable to connect to server.'}

    def update_student_marks(self, student_name: str, subject: str, marks_obtained: float, max_marks: float = 100.0) -> Dict[str, Any]:
        """Update student marks securely via Django REST API."""
        try:
            res = requests.post(
                f"{self.base_url}/api/v1/voice/marks/",
                json={
                    'student_name': student_name,
                    'subject': subject,
                    'marks_obtained': marks_obtained,
                    'max_marks': max_marks
                },
                headers=self._headers(),
                timeout=6
            )
            if res.status_code == 200:
                return res.json()
            return {'success': False, 'message': 'Could not update marks.'}
        except Exception as e:
            logger.error(f"Error updating marks via Django API: {e}")
            return {'success': False, 'message': 'Network error updating marks.'}

    def get_academic_summary(self, student_name: str) -> Dict[str, Any]:
        """Get student academic summary from Django backend."""
        try:
            res = requests.get(
                f"{self.base_url}/api/v1/voice/academic-summary/",
                params={'name': student_name},
                headers=self._headers(),
                timeout=6
            )
            if res.status_code == 200:
                return res.json()
            return {'success': False, 'message': 'Academic summary not available.'}
        except Exception as e:
            logger.error(f"Error fetching academic summary: {e}")
            return {'success': False, 'message': 'Network error.'}


bridge = SchoolAiDjangoBridge()
