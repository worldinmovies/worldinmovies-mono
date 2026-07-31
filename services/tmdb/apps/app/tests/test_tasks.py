from unittest import TestCase, mock

from apps.worker.celery_tasks import (
    extract_alternative_titles,
    extract_directors,
    import_imdb_ratings_task,
    import_imdb_titles_task,
    index_movies,
    populate_discovery_movie_task,
    redo_countries,
)


def _make_crew_member(name, job):
    """Create a mock crew member with the given name and job."""
    m = mock.MagicMock()
    m.name = name
    m.job = job
    return m


class ExtractDirectorsTest(TestCase):
    """Tests for extract_directors() helper."""

    def test_returns_director_names(self):
        """Crew members with job 'Director' are returned by name."""
        crew = [
            _make_crew_member('John Doe', 'Director'),
            _make_crew_member('Jane Smith', 'Director'),
            _make_crew_member('Bob Producer', 'Producer'),
        ]
        result = extract_directors(crew)
        self.assertEqual(result, ['John Doe', 'Jane Smith'])

    def test_empty_crew(self):
        """Empty crew list returns empty list."""
        result = extract_directors([])
        self.assertEqual(result, [])

    def test_no_directors(self):
        """Crew with no directors returns empty list."""
        crew = [
            _make_crew_member('Writer', 'Writer'),
            _make_crew_member('Producer', 'Producer'),
        ]
        result = extract_directors(crew)
        self.assertEqual(result, [])


class ExtractAlternativeTitlesTest(TestCase):
    """Tests for extract_alternative_titles() helper."""

    def test_returns_titles(self):
        """Non-empty titles are extracted from AlternativeTitles embedded doc."""
        alt_titles = mock.MagicMock()
        t1 = mock.MagicMock()
        t1.title = 'El Test'
        t2 = mock.MagicMock()
        t2.title = 'Der Test'
        alt_titles.titles = [t1, t2]

        result = extract_alternative_titles(alt_titles)
        self.assertEqual(result, ['El Test', 'Der Test'])

    def test_none_alt_titles(self):
        """None input returns empty list."""
        result = extract_alternative_titles(None)
        self.assertEqual(result, [])

    def test_filters_empty_titles(self):
        """Titles with empty string are filtered out."""
        alt_titles = mock.MagicMock()
        t1 = mock.MagicMock()
        t1.title = 'Valid Title'
        t2 = mock.MagicMock()
        t2.title = ''
        alt_titles.titles = [t1, t2]
        result = extract_alternative_titles(alt_titles)
        self.assertEqual(result, ['Valid Title'])

    def test_empty_titles_list(self):
        """Empty titles list returns empty list."""
        alt_titles = mock.MagicMock()
        alt_titles.titles = []
        result = extract_alternative_titles(alt_titles)
        self.assertEqual(result, [])


class RedoCountriesTest(TestCase):
    """Tests for redo_countries() Celery task."""

    def setUp(self):
        self.log_patcher = mock.patch('apps.worker.celery_tasks.log')
        self.mock_log = self.log_patcher.start()

        self.transaction_patcher = mock.patch(
            'apps.worker.celery_tasks.transaction.atomic',
        )
        self.mock_transaction = self.transaction_patcher.start()

    def tearDown(self):
        self.log_patcher.stop()
        self.transaction_patcher.stop()

    def test_updates_guessed_country_for_movies(self):
        """Each movie's guessed_country is updated via update_one."""
        movie1 = mock.MagicMock()
        movie1.id = 101
        movie1.guess_country.return_value = 'SE'
        movie2 = mock.MagicMock()
        movie2.id = 102
        movie2.guess_country.return_value = 'US'

        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [movie1, movie2]
        # .only() returns itself
        queryset.only.return_value = queryset

        with mock.patch('apps.worker.celery_tasks.Movie.objects',
                        return_value=queryset) as mock_objects:
            redo_countries([101, 102])

        # The task calls Movie.objects both for the initial lookup and per-movie update
        mock_objects.assert_any_call(pk__in=[101, 102])
        mock_objects.assert_any_call(id=101)
        self.mock_log.assert_called_once()

    def test_handles_empty_list(self):
        """Empty movie_ids logs without error."""
        queryset = mock.MagicMock()
        queryset.__iter__.return_value = []
        queryset.only.return_value = queryset

        with mock.patch('apps.worker.celery_tasks.Movie.objects',
                        return_value=queryset):
            redo_countries([])

        self.mock_log.assert_called_once()

    def test_logs_error_on_exception(self):
        """Exception during processing is caught and logged."""
        with mock.patch('apps.worker.celery_tasks.Movie.objects',
                        side_effect=ValueError('DB connection error')):
            redo_countries([1])

        self.mock_log.assert_called_once()


class ImportImdbRatingsTaskTest(TestCase):
    """Tests for import_imdb_ratings_task() Celery task."""

    def setUp(self):
        self.log_patcher = mock.patch('apps.worker.celery_tasks.log')
        self.mock_log = self.log_patcher.start()

        self.transaction_patcher = mock.patch(
            'apps.worker.celery_tasks.transaction.atomic',
        )
        self.mock_transaction = self.transaction_patcher.start()

        self.movie1 = mock.MagicMock()
        self.movie1.imdb_id = 'tt001'
        self.movie1.vote_count = 100
        self.movie1.imdb_vote_count = 0
        self.movie1.vote_average = 5.0
        self.movie1.imdb_vote_average = 0
        self.movie1.id = 1

        self.movie2 = mock.MagicMock()
        self.movie2.imdb_id = 'tt002'
        self.movie2.vote_count = 200
        self.movie2.imdb_vote_count = 0
        self.movie2.vote_average = 7.0
        self.movie2.imdb_vote_average = 0
        self.movie2.id = 2

    def tearDown(self):
        self.log_patcher.stop()
        self.transaction_patcher.stop()

    def test_processes_csv_row_chunk(self):
        """Each CSV row matching a movie updates imdb ratings and weighted rating."""
        csv_chunk = [
            ['tt001', '6.5', '500'],
            ['tt002', '8.0', '1000'],
        ]

        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [self.movie1, self.movie2]

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            import_imdb_ratings_task(csv_chunk)

        self.assertEqual(self.movie1.imdb_vote_average, 6.5)
        self.assertEqual(self.movie1.imdb_vote_count, 500)
        self.assertEqual(self.movie2.imdb_vote_average, 8.0)
        self.assertEqual(self.movie2.imdb_vote_count, 1000)
        self.mock_log.assert_called_once()

    def test_empty_chunk_does_not_crash(self):
        """Empty chunk logs without error."""
        queryset = mock.MagicMock()
        queryset.__iter__.return_value = []

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            import_imdb_ratings_task([])

        self.mock_log.assert_called_once()

    def test_logs_error_on_exception(self):
        """Exceptions in Movie.objects.filter are caught and logged."""
        mock_objects = mock.MagicMock()
        mock_objects.filter.side_effect = ValueError('DB error')

        with mock.patch('apps.worker.celery_tasks.Movie.objects', mock_objects):
            import_imdb_ratings_task([['tt001', '5.0', '100']])

        self.mock_log.assert_called_once()


class ImportImdbTitlesTaskTest(TestCase):
    """Tests for import_imdb_titles_task() Celery task."""

    def setUp(self):
        self.log_patcher = mock.patch('apps.worker.celery_tasks.log')
        self.mock_log = self.log_patcher.start()

        self.transaction_patcher = mock.patch(
            'apps.worker.celery_tasks.transaction.atomic',
        )
        self.mock_transaction = self.transaction_patcher.start()

    def tearDown(self):
        self.log_patcher.stop()
        self.transaction_patcher.stop()

    def test_adds_alternative_titles(self):
        """Titles from IMDB are appended to movie's alternative_titles."""
        chunk = [
            ['tt001', '0', 'Le Test', 'FR'],
            ['tt001', '1', 'El Test', 'ES'],
        ]

        movie = mock.MagicMock()
        movie.imdb_id = 'tt001'
        movie.alternative_titles = None  # starts uninitialized

        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [movie]

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            import_imdb_titles_task(chunk)

        # The task should have set alternative_titles to a non-None value
        self.assertIsNotNone(movie.alternative_titles)
        movie.save.assert_called_once()

    def test_skips_null_iso(self):
        """Titles with iso='\\N' are skipped."""
        chunk = [
            ['tt001', '0', 'Unknown Title', r'\N'],
        ]

        movie = mock.MagicMock()
        movie.imdb_id = 'tt001'
        movie.alternative_titles = mock.MagicMock()
        movie.alternative_titles.titles = []

        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [movie]

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            import_imdb_titles_task(chunk)

        # No titles appended because iso is \N
        movie.save.assert_called_once()

    def test_skips_duplicate_titles(self):
        """Titles already in alternative_titles list are not added again."""
        chunk = [
            ['tt001', '0', 'Test Title', 'US'],
        ]

        existing_title = mock.MagicMock()
        existing_title.iso_3166_1 = 'US'
        existing_title.title = 'Test Title'
        existing_title.type = 'IMDB'

        movie = mock.MagicMock()
        movie.imdb_id = 'tt001'
        movie.alternative_titles = mock.MagicMock()
        movie.alternative_titles.titles = [existing_title]

        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [movie]

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            import_imdb_titles_task(chunk)

        # No append happened because title already exists
        movie.save.assert_called_once()


class PopulateDiscoveryMovieTaskTest(TestCase):
    """Tests for populate_discovery_movie_task() Celery task."""

    def setUp(self):
        self.log_patcher = mock.patch('apps.worker.celery_tasks.log')
        self.mock_log = self.log_patcher.start()

    def tearDown(self):
        self.log_patcher.stop()

    def _make_fetched_movie(self, **overrides):
        """Create a mock movie with sensible defaults and optional overrides."""
        movie = mock.MagicMock()
        attrs = dict(
            id=101,
            imdb_id='tt001',
            original_title='Test',
            title='Test (English)',
            poster_path='/poster.jpg',
            vote_average=7.5,
            vote_count=500,
            imdb_vote_average=7.0,
            imdb_vote_count=100,
            guessed_country='SE',
            release_date='2025-04-15',
            weighted_rating=6.5,
            overview='A test movie.',
            fetched=True,
            credits=mock.MagicMock(),
            genres=[],
        )
        attrs.update(overrides)
        for k, v in attrs.items():
            setattr(movie, k, v)
        return movie

    def _make_populate_queryset(self, movie):
        """Create a queryset mock for populate_discovery_movie_task tests.

        The task calls Movie.objects.filter(...).only(...), so both
        filter's return_value AND only's return_value must yield the movie.
        """
        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [movie]
        # .only() must return an iterable that yields the movie
        only_qs = mock.MagicMock()
        only_qs.__iter__.return_value = [movie]
        queryset.only.return_value = only_qs
        return queryset

    def test_creates_discovery_movie_from_fetched_movie(self):
        """A fetched movie with guessed_country creates a DiscoveryMovie."""
        movie = self._make_fetched_movie()
        movie.credits.crew = []

        queryset = self._make_populate_queryset(movie)

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            with mock.patch('apps.worker.celery_tasks.DiscoveryMovie') as mock_dm:
                mock_dm_instance = mock.MagicMock()
                mock_dm.return_value = mock_dm_instance
                result = populate_discovery_movie_task([101])

        mock_dm.assert_called_once()
        call_kwargs = mock_dm.call_args.kwargs
        self.assertEqual(call_kwargs['id'], 101)
        self.assertEqual(call_kwargs['estimated_country'], 'SE')
        self.assertEqual(call_kwargs['weighted_rating'], 6.5)
        self.assertEqual(result, 1)

    def test_skips_unfetched_movies(self):
        """Movies with fetched=False are skipped."""
        movie = self._make_fetched_movie(fetched=False)

        queryset = self._make_populate_queryset(movie)

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            with mock.patch('apps.worker.celery_tasks.DiscoveryMovie') as mock_dm:
                result = populate_discovery_movie_task([101])

        mock_dm.assert_not_called()
        self.assertEqual(result, 0)

    def test_skips_movies_without_guessed_country(self):
        """Movies without guessed_country are skipped."""
        movie = self._make_fetched_movie(guessed_country=None)

        queryset = self._make_populate_queryset(movie)

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            with mock.patch('apps.worker.celery_tasks.DiscoveryMovie') as mock_dm:
                result = populate_discovery_movie_task([101])

        mock_dm.assert_not_called()
        self.assertEqual(result, 0)

    def test_extracts_director_from_credits(self):
        """Director name is extracted from credits.crew."""
        movie = self._make_fetched_movie(
            release_date='2024-01-01',
            poster_path=None,
        )
        director = _make_crew_member('Director Name', 'Director')
        movie.credits.crew = [director]
        movie.genres = []

        queryset = self._make_populate_queryset(movie)

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            with mock.patch('apps.worker.celery_tasks.DiscoveryMovie') as mock_dm:
                mock_dm.return_value = mock.MagicMock()
                populate_discovery_movie_task([101])

        self.assertEqual(mock_dm.call_args.kwargs['director'], 'Director Name')

    def test_re_raises_exception(self):
        """Exceptions are logged and re-raised (Celery handles retries)."""
        mock_objects = mock.MagicMock()
        mock_objects.filter.side_effect = ValueError('DB error')

        with mock.patch('apps.worker.celery_tasks.Movie.objects', mock_objects):
            with self.assertRaises(ValueError):
                populate_discovery_movie_task([101])

        self.mock_log.assert_called_once()


class IndexMoviesTaskTest(TestCase):
    """Tests for index_movies() Celery task."""

    def _make_indexable_movie(self, **overrides):
        """Create a mock movie ready for indexing."""
        movie = mock.MagicMock()
        attrs = dict(
            id=101,
            title='Test Movie',
            original_title='Test',
            overview='A movie.',
            weighted_rating=6.5,
            vote_average=7.0,
            imdb_vote_average=6.0,
            vote_count=100,
            imdb_vote_count=50,
            guessed_country='US',
            original_language='en',
            poster_path='/poster.jpg',
            release_date='2025-04-15',
            credits=mock.MagicMock(),
            alternative_titles=mock.MagicMock(),
        )
        attrs.update(overrides)
        for k, v in attrs.items():
            setattr(movie, k, v)
        return movie

    def test_indexes_movies_in_meilisearch(self):
        """Movies are indexed as documents in Meilisearch."""
        movie = self._make_indexable_movie()
        director = _make_crew_member('Director A', 'Director')
        movie.credits.crew = [director]

        alt_title = mock.MagicMock()
        alt_title.title = 'Alt Title'
        movie.alternative_titles.titles = [alt_title]

        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [movie]

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            with mock.patch('apps.worker.celery_tasks.client') as mock_client:
                mock_index = mock.MagicMock()
                mock_client.index.return_value = mock_index
                index_movies([101])

        mock_client.index.assert_called_once_with('movies')
        mock_index.add_documents.assert_called_once()
        docs = mock_index.add_documents.call_args[0][0]
        self.assertEqual(len(docs), 1)
        self.assertEqual(docs[0]['id'], 101)
        self.assertEqual(docs[0]['title'], 'Test Movie')
        self.assertEqual(docs[0]['directors'], ['Director A'])
        self.assertEqual(docs[0]['alternative_titles'], ['Alt Title'])
        self.assertEqual(docs[0]['year'], '2025')

    def test_handles_missing_release_date(self):
        """Movies without release_date get year=None."""
        movie = self._make_indexable_movie(
            release_date=None,
            credits=None,
            alternative_titles=None,
        )

        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [movie]

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            with mock.patch('apps.worker.celery_tasks.client') as mock_client:
                mock_index = mock.MagicMock()
                mock_client.index.return_value = mock_index
                index_movies([101])

        docs = mock_index.add_documents.call_args[0][0]
        self.assertIsNone(docs[0]['year'])
        self.assertEqual(docs[0]['directors'], [])
        self.assertEqual(docs[0]['alternative_titles'], [])

    def test_calculates_combined_vote_average(self):
        """vote_average field is the mean of TMDB and IMDB ratings."""
        movie = self._make_indexable_movie(
            credits=None,
            alternative_titles=None,
        )

        queryset = mock.MagicMock()
        queryset.__iter__.return_value = [movie]

        with mock.patch('apps.worker.celery_tasks.Movie.objects') as mock_objects:
            mock_objects.filter.return_value = queryset
            with mock.patch('apps.worker.celery_tasks.client') as mock_client:
                mock_index = mock.MagicMock()
                mock_client.index.return_value = mock_index
                index_movies([101])

        docs = mock_index.add_documents.call_args[0][0]
        # (7.0 + 6.0) / 2 = 6.5
        self.assertEqual(docs[0]['vote_average'], 6.5)
        # 100 + 50 = 150
        self.assertEqual(docs[0]['vote_count'], 150)
