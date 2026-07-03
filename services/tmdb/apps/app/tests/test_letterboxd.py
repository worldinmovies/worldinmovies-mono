"""Tests for the Letterboxd CSV import pipeline (parse_user_watched).

Tests main-line logic:
  - Finding movies via mocked Meilisearch hits
  - Querying MongoDB for matched movies
  - Grouping results by guessed_country

All I/O is mocked — no real Meilisearch or MongoDB involved.
"""

from io import StringIO
from unittest import mock, TestCase

from apps.letterboxd.letterboxd import parse_user_watched


SAMPLE_CSV = """Date,Name,Year,Letterboxd URI
2020-02-14,Parasite,2019,https://boxd.it/hTha
2020-02-14,The Lighthouse,2019,https://boxd.it/icFU
2020-02-15,Nonexistent Movie,1999,https://boxd.it/xxx
"""


def _make_mock_movie(pk: int, **kwargs) -> mock.MagicMock:
    """Create a MagicMock that looks like a Movie document."""
    m = mock.MagicMock(name=f"Movie_{pk}")
    m.id = pk
    defaults = {
        "imdb_id": f"tt{pk:07d}",
        "original_title": f"Test Movie {pk}",
        "release_date": "2019-01-01",
        "poster_path": f"/poster{pk}.jpg",
        "vote_average": 7.5,
        "vote_count": 100,
        "guessed_country": "KR",
    }
    defaults.update(kwargs)
    for k, v in defaults.items():
        setattr(m, k, v)
    return m


class LetterboxdImporterTest(TestCase):
    """Tests for parse_user_watched()."""

    def setUp(self):
        # Mock Meilisearch client
        self.client_patcher = mock.patch("apps.letterboxd.letterboxd.client")
        self.mock_client = self.client_patcher.start()
        self.mock_index = mock.MagicMock(name="meili_index")
        self.mock_client.index.return_value = self.mock_index
        self.addCleanup(self.client_patcher.stop)

    def _setup_meili_hits(self, hits: list[dict]):
        """Configure the mock Meilisearch index to return hits."""
        self.mock_index.search.return_value = {"hits": hits}

    def _make_file(self, csv_content: str = SAMPLE_CSV):
        """Create a file-like object for the CSV."""
        return StringIO(csv_content)

    def test_finds_movies_by_meili_hits(self):
        """Movies found in Meilisearch are returned grouped by country."""
        # Meilisearch returns hits with movie IDs (string or int)
        self._setup_meili_hits([
            {"id": 101, "imdb_id": "tt0101010", "title": "Parasite"},
            {"id": 102, "imdb_id": "tt0102020", "title": "The Lighthouse"},
        ])

        # MongoDB returns matching documents
        movies = [
            _make_mock_movie(101, original_title="Parasite", guessed_country="KR"),
            _make_mock_movie(102, original_title="The Lighthouse", guessed_country="US"),
        ]

        mock_objects = mock.MagicMock(name="Movie.objects")
        # Movie.objects(pk__in=[...]).only(...) → returns movies
        mock_objects.return_value.only.return_value = movies

        with mock.patch("apps.letterboxd.letterboxd.Movie.objects", mock_objects):
            result = parse_user_watched(self._make_file())

        # Both movies found, grouped by country
        self.assertIn("found", result)
        self.assertIn("KR", result["found"])
        self.assertIn("US", result["found"])
        self.assertEqual(len(result["found"]["KR"]), 1)
        self.assertEqual(len(result["found"]["US"]), 1)
        self.assertEqual(result["found"]["KR"][0]["original_title"], "Parasite")

    def test_no_meili_hits_goes_to_not_found(self):
        """Movies that don't match any Meilisearch hit are reported as not_found."""
        self._setup_meili_hits([])

        with mock.patch("apps.letterboxd.letterboxd.Movie.objects") as mock_objects:
            mock_objects.only.return_value = []
            result = parse_user_watched(self._make_file())

        self.assertEqual(len(result["found"]), 0)
        self.assertEqual(len(result["not_found"]), 3)

    def test_empty_csv(self):
        """Empty CSV file produces empty result."""
        self._setup_meili_hits([])
        with mock.patch("apps.letterboxd.letterboxd.Movie.objects") as mock_objects:
            mock_objects.only.return_value = []
            result = parse_user_watched(self._make_file("Date,Name,Year,Letterboxd URI\n"))

        self.assertEqual(len(result["found"]), 0)
        self.assertEqual(len(result["not_found"]), 0)

    def test_meili_search_uses_year_filter(self):
        """Search is called with year filter when Year is a digit."""
        self._setup_meili_hits([])

        with mock.patch("apps.letterboxd.letterboxd.Movie.objects") as mock_objects:
            mock_objects.only.return_value = []
            parse_user_watched(self._make_file())

        # Meilisearch should be called with a filter containing the year
        search_calls = self.mock_index.search.call_args_list
        # First call for "Parasite" (2019) — expects year filter
        first_call_args = search_calls[0]
        opts = first_call_args[0][1]
        self.assertIn("filter", opts)
        self.assertIn("2019", opts["filter"])

    def test_meili_search_pk_id_extraction(self):
        """IDs are collected from both 'id' and '_id' fields in Meili hits."""
        self._setup_meili_hits([
            {"id": 101, "_id": "201", "imdb_id": "tt0101"},
        ])

        movies = [_make_mock_movie(101, original_title="Parasite", guessed_country="KR")]
        mock_objects = mock.MagicMock(name="Movie.objects")
        mock_objects.only.return_value = movies

        with mock.patch("apps.letterboxd.letterboxd.Movie.objects", mock_objects):
            parse_user_watched(self._make_file())

        # Should query by pk (found_ids takes priority over imdb_ids)
        mock_objects.assert_called_once()
        call_kwargs = mock_objects.call_args[1]
        self.assertIn("pk__in", call_kwargs)

    def test_handles_movie_without_guessed_country(self):
        """Movies without guessed_country grouped under 'unknown'."""
        self._setup_meili_hits([
            {"id": 201, "imdb_id": "tt0201", "title": "Unknown Origin"},
        ])

        movies = [_make_mock_movie(201, guessed_country=None, original_title="Unknown Origin")]
        mock_objects = mock.MagicMock(name="Movie.objects")
        # Movie.objects(pk__in=[...]).only(...) → returns movies
        mock_objects.return_value.only.return_value = movies

        with mock.patch("apps.letterboxd.letterboxd.Movie.objects", mock_objects):
            result = parse_user_watched(self._make_file())

        self.assertIn("unknown", result["found"])
        self.assertEqual(result["found"]["unknown"][0]["original_title"], "Unknown Origin")

    def test_fallback_to_imdb_id_when_no_pk(self):
        """If no pk-like ids found, query falls back to imdb_id."""
        self._setup_meili_hits([
            {"imdb_id": "tt9999999", "title": "No PK Movie"},
        ])

        mock_objects = mock.MagicMock(name="Movie.objects")
        # Movie.objects(pk__in=[...]).only(...) → returns movies
        mock_objects.return_value.only.return_value = [
            _make_mock_movie(999, imdb_id="tt9999999", original_title="No PK Movie", guessed_country="JP"),
        ]

        with mock.patch("apps.letterboxd.letterboxd.Movie.objects", mock_objects):
            result = parse_user_watched(self._make_file())

        self.assertIn("JP", result["found"])
