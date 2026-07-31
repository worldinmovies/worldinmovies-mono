from django.test import Client
from apps.api.views import sitemap
from apps.app.db_models import Movie, Genre
from django.http import HttpResponse
import xml.etree.ElementTree as ET

class DummyRequest:
    pass

r = DummyRequest()
Movie.objects.create(
    id=1,
    title="Test Movie 1",
    year=2024,
    country="Test Country",
    country_code="TC",
    director="Test Director",
    rating=5.0,
    genres=[Genre.objects.create(id=1, name="G")],
    poster="p",
    description="d"
)

response = sitemap(r)
print("Content-Type:", response['Content-Type'])
print("Content:", response.content.decode())
