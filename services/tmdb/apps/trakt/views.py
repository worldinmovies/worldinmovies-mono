import json
import os

import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

TRAKT_CLIENT_ID = os.environ.get('TRAKT_CLIENT_ID', '284dd0bd619c3cbd73ce225fd4ee12cb1332cc515d4b8da81aaf992093bd2a26')
TRAKT_CLIENT_SECRET = os.environ.get('TRAKT_CLIENT_SECRET', '')
TRAKT_REDIRECT_URI = os.environ.get('TRAKT_REDIRECT_URI', 'http://localhost:8081/trakt-callback')
SESSION_COOKIE_NAME = 'trakt_auth'
SESSION_COOKIE_MAX_AGE = 7776000  # 90 days

def _parse_trakt_auth(request):
    """Extract and parse the trakt_auth cookie, or return None."""
    raw = request.COOKIES.get(SESSION_COOKIE_NAME)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None


@csrf_exempt
@require_http_methods(['POST'])
def trakt_callback(request):
    """Receive OAuth code from frontend, exchange with Trakt, set httpOnly cookie."""
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'invalid body'}, status=400)

    code = body.get('code')
    code_verifier = body.get('code_verifier')
    if not code or not code_verifier:
        return JsonResponse({'error': 'missing code or code_verifier'}, status=400)

    # Exchange code for token with Trakt
    payload = {
        'code': code,
        'client_id': TRAKT_CLIENT_ID,
        'redirect_uri': body.get('redirect_uri', TRAKT_REDIRECT_URI),
        'grant_type': 'authorization_code',
        'code_verifier': code_verifier,
    }
    if TRAKT_CLIENT_SECRET:
        payload['client_secret'] = TRAKT_CLIENT_SECRET

    try:
        resp = requests.post(
            'https://api.trakt.tv/oauth/token',
            json=payload,
            timeout=15,
        )
    except requests.RequestException as e:
        return JsonResponse({'error': 'trakt api unreachable', 'detail': str(e)}, status=502)

    if resp.status_code != 200:
        return JsonResponse({'error': 'trakt rejected code', 'detail': resp.text}, status=502)

    token_data = resp.json()

    # Set httpOnly cookie with token data
    response = JsonResponse({'status': 'ok'})
    response.set_cookie(
        SESSION_COOKIE_NAME,
        json.dumps(token_data),
        httponly=True,
        secure=False,  # TODO: set based on DEBUG/ENVIRONMENT
        samesite='Lax',
        max_age=SESSION_COOKIE_MAX_AGE,
    )
    return response


@require_http_methods(['GET'])
def trakt_session(request):
    """Check if user has an active Trakt session."""
    token_data = _parse_trakt_auth(request)
    return JsonResponse({'connected': token_data is not None})


@require_http_methods(['DELETE', 'POST'])
def trakt_logout(request):
    """Clear the Trakt auth cookie."""
    response = JsonResponse({'status': 'disconnected'})
    response.delete_cookie(SESSION_COOKIE_NAME)
    return response


@require_http_methods(['GET'])
def trakt_import(request):
    """Proxy: fetch watched + rated movies from Trakt using stored token."""
    token_data = _parse_trakt_auth(request)
    if not token_data:
        return JsonResponse({'error': 'not authenticated'}, status=401)

    access_token = token_data.get('access_token')
    if not access_token:
        return JsonResponse({'error': 'token not found in session'}, status=401)

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_CLIENT_ID,
    }

    results = {}

    try:
        watched_resp = requests.get(
            'https://api.trakt.tv/sync/watched/movies',
            headers=headers,
            timeout=30,
        )
        if watched_resp.status_code == 401:
            # Token expired — clear cookie and ask user to re-auth
            response = JsonResponse({'error': 'token_expired', 'detail': 'Session expired, please reconnect'}, status=401)
            response.delete_cookie(SESSION_COOKIE_NAME)
            return response
        watched_resp.raise_for_status()
        results['watched'] = watched_resp.json()
    except requests.RequestException as e:
        return JsonResponse({'error': 'failed to fetch watched movies', 'detail': str(e)}, status=502)

    try:
        rated_resp = requests.get(
            'https://api.trakt.tv/sync/ratings/movies',
            headers=headers,
            timeout=30,
        )
        rated_resp.raise_for_status()
        results['rated'] = rated_resp.json()
    except requests.RequestException:
        # Non-fatal: rated movies are optional
        results['rated'] = []

    return JsonResponse(results)
