import xml.etree.ElementTree as ET
from unittest.mock import MagicMock, patch

from django.core.exceptions import DisallowedHost
from django.http import HttpRequest
from django.test import Client, TestCase

from apps.api.middleware import HealthCheckHostBypassMiddleware


class SitemapViewTest(TestCase):
    def setUp(self):
        self.client = Client()

    @patch('apps.api.views.Movie.objects.all')
    def test_sitemap_status_code(self, mock_all):
        """Ensure sitemap endpoint returns 200 OK."""
        mock_all.return_value = []
        response = self.client.get('/sitemap.xml')
        self.assertEqual(response.status_code, 200)

    def test_sitemap_content_type(self):
        """Ensure sitemap endpoint returns XML content type."""
        response = self.client.get('/sitemap.xml')
        self.assertEqual(response['Content-Type'], 'application/xml')

    @patch('apps.api.views.Movie.objects.all')
    def test_sitemap_xml_structure(self, mock_all):
        """Verify sitemap XML contains correct tags and movie URLs."""
        mock_movie = MagicMock()
        mock_movie.id = 1
        mock_movie.title = "Test Movie"
        mock_all.return_value = [mock_movie]

        response = self.client.get('/sitemap.xml')
        tree = ET.fromstring(response.content)

        namespaces = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

        # Check root element
        self.assertEqual(tree.tag, '{http://www.sitemaps.org/schemas/sitemap/0.9}urlset')

        # Verify number of urls
        urls = tree.findall('ns:url', namespaces)
        self.assertEqual(len(urls), 1)

        # Verify first URL
        first_url = urls[0].find('ns:loc', namespaces).text
        self.assertIn('/movie/1', first_url)


class HealthCheckMiddlewareTest(TestCase):
    """Issue #27: Kubernetes probes hit /health/ with pod-IP Host headers.

    Before the HealthCheckHostBypassMiddleware existed, these requests raised
    django.security.DisallowedHost (via CommonMiddleware host validation) and
    crash-looped the production pod.
    """

    def setUp(self):
        self.client = Client()

    def test_health_check_accepts_pod_ip_host(self):
        """A pod-IP Host on /health/ must not raise DisallowedHost."""
        try:
            response = self.client.get('/health/', HTTP_HOST='10.42.2.156:8020')
        except DisallowedHost:
            self.fail('GET /health/ with pod-IP Host header raised DisallowedHost')
        else:
            # Health checks may pass (200) or report degraded infra (500), but
            # the request must never be rejected because of host validation.
            self.assertIn(response.status_code, (200, 500))

    def test_non_health_requests_still_enforce_allowed_hosts(self):
        """Host validation must still apply to non-health endpoints.

        With DEBUG=False, Django converts DisallowedHost into a 400 response
        instead of raising, so we assert the 400 status here.
        """
        response = self.client.get('/genres', HTTP_HOST='10.42.2.156:8020')
        self.assertEqual(response.status_code, 400)

    def test_middleware_rewrites_host_for_health_path(self):
        request = HttpRequest()
        request.path = '/health/'
        request.META['HTTP_HOST'] = '10.42.2.156:8020'
        response = HealthCheckHostBypassMiddleware(
            lambda req: req.META['HTTP_HOST']
        )(request)
        self.assertEqual(response, 'localhost')

    def test_middleware_leaves_other_paths_untouched(self):
        request = HttpRequest()
        request.path = '/view/random/best'
        request.META['HTTP_HOST'] = 'worldinmovies.labb.site'
        response = HealthCheckHostBypassMiddleware(
            lambda req: req.META['HTTP_HOST']
        )(request)
        self.assertEqual(response, 'worldinmovies.labb.site')
