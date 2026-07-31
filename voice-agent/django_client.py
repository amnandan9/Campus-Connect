import logging
import requests
import time
from typing import Dict, Any, Optional
from config import settings

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL, logging.INFO))
logger = logging.getLogger("DjangoVoiceClient")


class DjangoRestClient:
    """
    Robust REST API client for communicating with Django backend server over HTTPS.
    Includes automatic retries, headers authentication, timeouts, and error handling.
    """
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None, timeout: int = 8, max_retries: int = 3):
        self.base_url = (base_url or settings.DJANGO_API_BASE_URL).rstrip('/')
        self.api_key = api_key or settings.VOICE_AGENT_API_KEY
        self.timeout = timeout
        self.max_retries = max_retries

    def _headers(self) -> Dict[str, str]:
        return {

            'X-API-KEY': self.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Pipecat-Voice-Microservice/1.0'
        }

    def _request(self, method: str, endpoint: str, params: Optional[Dict[str, Any]] = None, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        last_exception = None

        for attempt in range(1, self.max_retries + 1):
            try:
                logger.debug(f"[Attempt {attempt}/{self.max_retries}] {method} {url}")
                response = requests.request(
                    method=method,
                    url=url,
                    headers=self._headers(),
                    params=params,
                    json=payload,
                    timeout=self.timeout
                )

                if response.status_code in (200, 201):
                    return response.json()
                elif response.status_code == 401:
                    logger.error(f"Unauthorized request to Django API (401). Check VOICE_AGENT_API_KEY.")
                    return {'success': False, 'error': 'Unauthorized', 'message': 'Invalid API Key'}
                elif response.status_code == 404:
                    logger.warning(f"Resource not found (404) at {url}: {response.text}")
                    return response.json() if response.headers.get('Content-Type') == 'application/json' else {'success': False, 'error': 'Not Found'}
                else:
                    logger.error(f"Django API Error ({response.status_code}) on {url}: {response.text}")
                    if response.status_code >= 500 and attempt < self.max_retries:
                        time.sleep(0.5 * attempt)
                        continue
                    return {'success': False, 'error': f"HTTP {response.status_code}", 'message': response.text}

            except requests.RequestException as e:
                logger.warning(f"Network failure connecting to Django API ({url}): {e}")
                last_exception = e
                if attempt < self.max_retries:
                    time.sleep(0.5 * attempt)

        logger.error(f"Failed to communicate with Django REST API after {self.max_retries} attempts: {last_exception}")
        return {'success': False, 'error': 'Network Failure', 'message': str(last_exception)}

    def get_student(self, query: str) -> Dict[str, Any]:
        """Fetch student details by name or username."""
        return self._request('GET', '/api/v1/voice/student/', params={'query': query})

    def update_marks(self, student_name: str, subject: str, marks_obtained: float, max_marks: float = 100.0, work_type: str = 'test', remarks: str = '') -> Dict[str, Any]:
        """Update student marks and receive threshold outreach evaluation."""
        payload = {
            'student_name': student_name,
            'subject': subject,
            'marks_obtained': marks_obtained,
            'max_marks': max_marks,
            'work_type': work_type,
            'remarks': remarks
        }
        return self._request('POST', '/api/v1/voice/marks/', payload=payload)

    def update_attendance(self, student_name: str, status: str = 'present', date_str: Optional[str] = None) -> Dict[str, Any]:
        """Mark student attendance."""
        payload = {
            'student_name': student_name,
            'status': status,
            'date': date_str
        }
        return self._request('POST', '/api/v1/voice/attendance/', payload=payload)

    def get_parent_contact(self, name: str) -> Dict[str, Any]:
        """Retrieve parent contact info and performance summary for phone outreach."""
        return self._request('GET', '/api/v1/voice/parent/', params={'query': name})

    def create_notification(self, student_name: str, title: str, message: str) -> Dict[str, Any]:
        """Log a call notification or message in Django."""
        payload = {
            'student_name': student_name,
            'title': title,
            'message': message
        }
        return self._request('POST', '/api/v1/voice/notification/', payload=payload)

    def get_teacher_info(self, username: str) -> Dict[str, Any]:
        """Retrieve teacher information."""
        return self._request('GET', '/api/v1/voice/teacher/', params={'username': username})

    def get_academic_summary(self, name: str) -> Dict[str, Any]:
        """Retrieve student academic performance and attendance summary."""
        return self._request('GET', '/api/v1/voice/academic-summary/', params={'query': name})
