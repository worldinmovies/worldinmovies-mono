"""Authentication decorator for backend API endpoints.

Usage:
    from apps.api.auth import require_admin_token

    # In urls.py:
    path('import/base', require_admin_token(views.base_fetch)),

The decorator checks the `X-API-Key` header against the `ADMIN_API_KEY`
environment variable. Returns 401 JSON on mismatch.

Read-only public endpoints (genres, search, movie detail, status, health)
do NOT need this decorator.
"""

import os
import json
from functools import wraps
from django.http import HttpResponse

def require_admin_token(view_func):
    """Decorator that requires a valid X-API-Key header.

    Reads ADMIN_API_KEY from env at request time so tests can set
    it via environment.py's before_all fixture.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        expected = os.environ.get('ADMIN_API_KEY', '')
        token = request.headers.get('X-API-Key', '')
        if not token or token != expected:
            return HttpResponse(
                json.dumps({"error": "Unauthorized"}),
                status=401,
                content_type='application/json',
            )
        return view_func(request, *args, **kwargs)
    return wrapper
