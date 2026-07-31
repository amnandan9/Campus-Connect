from functools import wraps
from django.http import JsonResponse
from django.conf import settings

def require_voice_api_key(view_func):
    """
    Decorator to secure Voice Agent REST API endpoints.
    Accepts X-API-KEY header or Authorization: Bearer <KEY> header.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        api_key = request.headers.get('X-API-KEY')
        if not api_key:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                api_key = auth_header.split(' ', 1)[1].strip()

        expected_key = getattr(settings, 'VOICE_AGENT_API_KEY', 'campus_connect_voice_secret_key_2026')

        if not api_key or api_key != expected_key:
            return JsonResponse({
                'success': False,
                'error': 'Unauthorized',
                'message': 'Invalid or missing API key for Voice Agent endpoint.'
            }, status=401)

        return view_func(request, *args, **kwargs)
    return _wrapped_view
