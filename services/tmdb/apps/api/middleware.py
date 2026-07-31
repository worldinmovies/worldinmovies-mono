"""Middleware to keep Kubernetes health probes from being rejected by Django.

Kubernetes liveness/readiness probes hit ``/health/`` using the pod IP as the
Host header (e.g. ``10.42.2.156:8020``). ``django.middleware.common.CommonMiddleware``
validates ``request.get_host()`` against ``ALLOWED_HOSTS`` on *every* request and
raises ``django.security.DisallowedHost`` for unknown hosts, which crash-loops
the pod before the health check can ever respond.

This middleware is registered FIRST in ``MIDDLEWARE`` and rewrites the Host
header to ``localhost`` (an already-allowed host) for ``/health/`` requests
only, so host validation in downstream middleware always succeeds. All other
paths are left untouched and keep the normal ALLOWED_HOSTS enforcement.
"""


class HealthCheckHostBypassMiddleware:
    """Rewrite the Host header to ``localhost`` for ``/health/`` requests."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/health/'):
            request.META['HTTP_HOST'] = 'localhost'
        return self.get_response(request)
