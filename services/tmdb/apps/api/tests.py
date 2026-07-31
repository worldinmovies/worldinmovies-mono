from django.test import TestCase, Client
from django.urls import reverse
from apps.app.db_models import Movie, Genre
from unittest.mock import patch, MagicMock
import xml.etree.ElementTree as ET

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
