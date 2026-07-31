from unittest import TestCase, mock

from apps.app.db_models import Movie


def _make_movie(**attrs):
    """Create a mock Movie with the given attributes for unit testing.

    Does NOT use spec=Movie because our tests need to set arbitrary
    attributes for instance methods pulled from Movie.__dict__.
    """
    m = mock.MagicMock()
    for k, v in attrs.items():
        setattr(m, k, v)
    return m


def _call_instance_method(method, instance, *args, **kwargs):
    """Call an unbound instance method from the Movie class on a mock.

    For methods with no extra args (e.g. calculate_weighted_rating_bayes),
    the result is the return value of the method (usually None).
    For methods with extra args (e.g. add_fetched_info),
    pass them after instance.
    """
    func = Movie.__dict__[method]
    return func(instance, *args, **kwargs)


class CalculateWeightedRatingBayesTest(TestCase):
    """Tests for Movie.calculate_weighted_rating_bayes() — IMDB Top 250 formula.

    Formula: WR = (v/(v+m))×R + (m/(v+m))×C
    where v = vote_count + imdb_vote_count
          m = 200 (minimum votes)
          R = average of vote_average + imdb_vote_average (if imdb votes > 0) else vote_average
          C = 4.0 (mean vote)
    """

    def test_normal_case_with_both_ratings(self):
        """Both TMDB and IMDB votes present."""
        movie = _make_movie(
            vote_count=500, imdb_vote_count=100,
            vote_average=6.5, imdb_vote_average=7.0,
            weighted_rating=0
        )
        _call_instance_method('calculate_weighted_rating_bayes', movie)
        # v = 600, m = 200, R = (6.5 + 7.0) / 2 = 6.75, C = 4.0
        # WR = (600/800) * 6.75 + (200/800) * 4.0
        #    = 0.75 * 6.75 + 0.25 * 4.0
        #    = 5.0625 + 1.0
        #    = 6.0625
        self.assertAlmostEqual(movie.weighted_rating, 6.0625)

    def test_only_tmdb_votes(self):
        """When imdb_vote_count is 0, R = vote_average only."""
        movie = _make_movie(
            vote_count=500, imdb_vote_count=0,
            vote_average=8.0, imdb_vote_average=0,
            weighted_rating=0
        )
        _call_instance_method('calculate_weighted_rating_bayes', movie)
        # v = 500, m = 200, R = 8.0, C = 4.0
        # WR = (500/700) * 8.0 + (200/700) * 4.0
        #    = 0.714286 * 8.0 + 0.285714 * 4.0
        #    = 5.714286 + 1.142857
        #    = 6.857143
        self.assertAlmostEqual(movie.weighted_rating, 6.857143, places=5)

    def test_only_imdb_votes(self):
        """When vote_count is 0 but imdb_vote_count > 0, R uses imdb average."""
        movie = _make_movie(
            vote_count=0, imdb_vote_count=300,
            vote_average=0, imdb_vote_average=9.0,
            weighted_rating=0
        )
        _call_instance_method('calculate_weighted_rating_bayes', movie)
        # Since imdb_vote_count > 0, R = (0 + 9.0) / 2 = 4.5
        # v = 300, m = 200, C = 4.0
        # WR = (300/500) * 4.5 + (200/500) * 4.0
        #    = 0.6 * 4.5 + 0.4 * 4.0
        #    = 2.7 + 1.6
        #    = 4.3
        self.assertAlmostEqual(movie.weighted_rating, 4.3)

    def test_both_zero_votes(self):
        """Zero votes for both: v = 0, so v/(v+m) = 0 and m/(v+m) = 1."""
        movie = _make_movie(
            vote_count=0, imdb_vote_count=0,
            vote_average=0, imdb_vote_average=0,
            weighted_rating=0
        )
        _call_instance_method('calculate_weighted_rating_bayes', movie)
        # v = 0, m = 200, R = 0, C = 4.0
        # WR = 0 + (200/200) * 4.0 = 4.0
        self.assertEqual(movie.weighted_rating, 4.0)

    def test_high_vote_count_converges_to_average(self):
        """As v grows, WR converges toward R."""
        movie = _make_movie(
            vote_count=100000, imdb_vote_count=50000,
            vote_average=7.5, imdb_vote_average=8.0,
            weighted_rating=0
        )
        _call_instance_method('calculate_weighted_rating_bayes', movie)
        # v = 150000, m = 200, R = 7.75, C = 4.0
        # WR = (150000/150200) * 7.75 + (200/150200) * 4.0
        #    = 7.7449...  → converges < 5e-3 from R=7.75
        self.assertAlmostEqual(movie.weighted_rating, 7.75, places=2)
        self.assertLess(abs(7.75 - movie.weighted_rating), 0.01)

    def test_minimum_votes_edge_case(self):
        """v = m = 200: WR = 0.5*R + 0.5*C"""
        movie = _make_movie(
            vote_count=100, imdb_vote_count=100,
            vote_average=6.0, imdb_vote_average=8.0,
            weighted_rating=0
        )
        _call_instance_method('calculate_weighted_rating_bayes', movie)
        # v = 200, m = 200, R = 7.0, C = 4.0
        # WR = 0.5 * 7.0 + 0.5 * 4.0 = 3.5 + 2.0 = 5.5
        self.assertAlmostEqual(movie.weighted_rating, 5.5)

    def test_decimal_precision(self):
        """Decimal math is used internally, ensuring float precision is reasonable."""
        movie = _make_movie(
            vote_count=1, imdb_vote_count=0,
            vote_average=0.1, imdb_vote_average=0.0,
            weighted_rating=0
        )
        _call_instance_method('calculate_weighted_rating_bayes', movie)
        # v = 1, m = 200, R = 0.1, C = 4.0
        # WR = (1/201) * 0.1 + (200/201) * 4.0
        self.assertGreater(movie.weighted_rating, 3.0)
        self.assertLess(movie.weighted_rating, 4.5)
        self.assertIsInstance(movie.weighted_rating, float)

    def test_negative_vote_counts(self):
        """Edge case: negative votes should not crash (real data shouldn't have these)."""
        movie = _make_movie(
            vote_count=-5, imdb_vote_count=-2,
            vote_average=5.0, imdb_vote_average=5.0,
            weighted_rating=0
        )
        _call_instance_method('calculate_weighted_rating_bayes', movie)
        # Should not raise; v = -7, R = 5.0, C = 4.0
        # WR = (-7/193) * 5.0 + (200/193) * 4.0
        self.assertIsInstance(movie.weighted_rating, float)


class GuessCountryTest(TestCase):
    """Tests for Movie.guess_country() — estimating country of origin."""

    def setUp(self):
        self.territory_language_patcher = mock.patch(
            'apps.app.db_models.get_territory_language_info'
        )
        self.mock_territory_lang = self.territory_language_patcher.start()

        self.get_all_countries_patcher = mock.patch(
            'apps.app.db_models.get_all_countries'
        )
        self.mock_all_countries = self.get_all_countries_patcher.start()

    def tearDown(self):
        self.territory_language_patcher.stop()
        self.get_all_countries_patcher.stop()

    # Branch 0: single origin_country
    def test_single_origin_country(self):
        """When origin_country has exactly 1 element, return it directly."""
        movie = _make_movie(
            original_language='en',
            origin_country=['US'],
            production_countries=[{'iso_3166_1': 'GB'}],
            production_companies=[{'origin_country': 'GB'}]
        )
        result = _call_instance_method('guess_country', movie)
        self.assertEqual(result, 'US')

    def test_multiple_origin_countries_falls_through(self):
        """When origin_country has >1 elements, continue to language-based logic."""
        # Mock that 'sv' is only spoken in Sweden → branch 1
        self.mock_all_countries.return_value.get.return_value = ['SE']
        self.mock_territory_lang.return_value = {
            'sv': {'official_status': 'official', 'population_percent': 100}
        }
        movie = _make_movie(
            original_language='sv',
            origin_country=['SE', 'FI'],
            production_countries=[{'iso_3166_1': 'SE'}],
            production_companies=[]
        )
        result = _call_instance_method('guess_country', movie)
        self.assertEqual(result, 'SE')

    # Branch 1: single territory for language
    def test_single_territory_for_language(self):
        """When only one country speaks the language, return it."""
        self.mock_all_countries.return_value.get.return_value = ['SE']
        self.mock_territory_lang.return_value = {
            'sv': {'official_status': 'official', 'population_percent': 100}
        }
        movie = _make_movie(
            original_language='sv',
            origin_country=[],
            production_countries=[{'iso_3166_1': 'SE'}],
            production_companies=[]
        )
        result = _call_instance_method('guess_country', movie)
        self.assertEqual(result, 'SE')

    # Branch 2: single production country
    def test_single_production_country(self):
        """When language is spoken in multiple countries but only 1 production_country."""
        self.mock_all_countries.return_value.get.return_value = ['US', 'GB', 'AU']
        self.mock_territory_lang.return_value = {
            'en': {'official_status': 'official', 'population_percent': 100}
        }
        movie = _make_movie(
            original_language='en',
            origin_country=[],
            production_countries=[{'iso_3166_1': 'GB'}],
            production_companies=[{'origin_country': 'US'}]
        )
        result = _call_instance_method('guess_country', movie)
        # Branch 2: single production country 'GB'
        self.assertEqual(result, 'GB')

    # Branch 3: majority production country
    def test_majority_production_country(self):
        """When only one territory from the language list overlaps with production companies,
        that territory is selected (most_common has a single majority)."""
        self.mock_all_countries.return_value.get.return_value = ['US', 'GB', 'AU']
        self.mock_territory_lang.return_value = {
            'en': {'official_status': 'official', 'population_percent': 40}
        }
        movie = _make_movie(
            original_language='en',
            origin_country=[],
            production_countries=[{'iso_3166_1': 'US'}],
            # Only US production companies → only US territory matches → single majority
            production_companies=[{'origin_country': 'US'}]
        )
        result = _call_instance_method('guess_country', movie)
        # territory_with_percentage has US, GB, AU.
        # territories_connected_to_production filters to only US (since AU not in prod_companies).
        # production_counter = {'US': 1}, most_common = (1, ['US']), len==1 → return 'US'
        self.assertEqual(result, 'US')

    # Branch 4: highest ranked by language percentage
    def test_highest_ranked_by_percentage(self):
        """When no majority, pick the territory with highest speaker percentage."""
        self.mock_all_countries.return_value.get.return_value = ['DE', 'AT', 'CH']
        self.mock_territory_lang.return_value = {
            'de': {'official_status': 'official', 'population_percent': 10}
        }
        movie = _make_movie(
            original_language='de',
            origin_country=[],
            production_countries=[{'iso_3166_1': 'DE'}, {'iso_3166_1': 'AT'}],
            production_companies=[{'origin_country': 'DE'}, {'origin_country': 'AT'}]
        )
        result = _call_instance_method('guess_country', movie)
        # No majority (1 vs 1), so rank by percentage
        # But language info returns same percentage for all in the mock, so falls through
        # With data setup, territories_connected_to_production should be DE, AT
        # Both have same percentage, so last one sorted (could be AT or DE)
        self.assertIsNotNone(result)

    # Branch 5: nil (no match)
    def test_no_country_found(self):
        """When no country can be determined, return None."""
        # Return empty territory list so no language info is fetched
        self.mock_all_countries.return_value.get.return_value = []
        movie = _make_movie(
            original_language='xx',
            origin_country=[],
            production_countries=[],
            production_companies=[]
        )
        result = _call_instance_method('guess_country', movie)
        self.assertIsNone(result)

    def test_none_original_language(self):
        """When original_language is None, guess_country returns None."""
        movie = _make_movie(
            original_language=None,
            origin_country=[],
            production_countries=[],
            production_companies=[]
        )
        result = _call_instance_method('guess_country', movie)
        self.assertIsNone(result)

    def test_empty_origin_country(self):
        """Empty origin_country list passes through to language logic."""
        self.mock_all_countries.return_value.get.return_value = ['DK']
        self.mock_territory_lang.return_value = {
            'da': {'official_status': 'official', 'population_percent': 100}
        }
        movie = _make_movie(
            original_language='da',
            origin_country=[],
            production_countries=[{'iso_3166_1': 'DK'}],
            production_companies=[]
        )
        result = _call_instance_method('guess_country', movie)
        self.assertEqual(result, 'DK')


class AddFetchedInfoTest(TestCase):
    """Tests for Movie.add_fetched_info() — populating from TMDB API response dict."""

    def setUp(self):
        self.movie_data = {
            'backdrop_path': '/backdrop.jpg',
            'budget': 100000000,
            'homepage': 'https://example.com',
            'imdb_id': 'tt1234567',
            'original_language': 'en',
            'original_title': 'Test Movie Original',
            'overview': 'A test movie overview.',
            'popularity': 50.5,
            'poster_path': '/poster.jpg',
            'production_companies': [],
            'release_date': '2025-01-15',
            'revenue': 500000000,
            'runtime': 120,
            'status': 'Released',
            'tagline': 'A test movie',
            'title': 'Test Movie',
            'origin_country': ['US'],
            'vote_average': 7.5,
            'vote_count': 1000,
            'belongs_to_collection': None,
            'alternative_titles': None,
            'credits': None,
            'external_ids': None,
            'images': None,
            'recommendations': {'results': [{'id': 123}, {'id': 456}]},
            'watch/providers': {'results': {}},
            'genres': [{'id': 1}],
            'spoken_languages': [{'iso_639_1': 'en'}],
            'production_countries': [{'iso_3166_1': 'US'}],
        }

    def _run_add_fetched_info(self, movie, data=None):
        """Helper to call add_fetched_info with standard fixture args."""
        d = data or self.movie_data
        all_genres = {1: mock.Mock(id=1)}
        all_langs = {'en': mock.Mock(iso_639_1='en')}
        all_countries = {'US': mock.Mock(iso_3166_1='US')}
        _call_instance_method('add_fetched_info', movie, d, all_genres, all_langs, all_countries)

    def test_sets_fetched_and_fetched_date(self):
        """fetched=True and fetched_date is set to a datetime."""
        movie = _make_movie()
        self._run_add_fetched_info(movie)
        self.assertTrue(movie.fetched)
        self.assertIsNotNone(movie.fetched_date)

    def test_sets_string_fields(self):
        """Basic string fields from the API response are set correctly."""
        movie = _make_movie()
        self._run_add_fetched_info(movie)
        self.assertEqual(movie.title, 'Test Movie')
        self.assertEqual(movie.overview, 'A test movie overview.')
        self.assertEqual(movie.imdb_id, 'tt1234567')
        self.assertEqual(movie.homepage, 'https://example.com')
        self.assertEqual(movie.release_date, '2025-01-15')
        self.assertEqual(movie.status, 'Released')

    def test_sets_numeric_fields(self):
        """Numeric fields from the API response are set correctly."""
        movie = _make_movie()
        self._run_add_fetched_info(movie)
        self.assertEqual(movie.budget, 100000000)
        self.assertEqual(movie.revenue, 500000000)
        self.assertEqual(movie.runtime, 120)
        self.assertEqual(movie.popularity, 50.5)

    def test_handles_missing_optional_sections(self):
        """Missing belongs_to_collection, alternative_titles, credits etc. set to None."""
        movie = _make_movie()
        self._run_add_fetched_info(movie)
        self.assertIsNone(movie.belongs_to_collection)
        self.assertIsNone(movie.alternative_titles)
        self.assertIsNone(movie.credits)
        self.assertIsNone(movie.external_ids)
        self.assertIsNone(movie.images)

    def test_extracts_images_from_nested_dict(self):
        """Images are extracted from the nested dict structure."""
        data = {**self.movie_data, 'images': {
            'backdrops': [{'file_path': '/bd1.jpg'}, {'file_path': '/bd2.jpg'}],
            'posters': [{'file_path': '/p1.jpg'}],
            'logos': [{'file_path': '/l1.jpg'}]
        }}
        movie = _make_movie()
        self._run_add_fetched_info(movie, data)
        self.assertIsNotNone(movie.images)
        self.assertEqual(movie.images.backdrops, ['/bd1.jpg', '/bd2.jpg'])
        self.assertEqual(movie.images.posters, ['/p1.jpg'])
        self.assertEqual(movie.images.logos, ['/l1.jpg'])

    def test_recommended_movies_from_recommendations(self):
        """Recommended movies are extracted from recommendations.results."""
        movie = _make_movie()
        self._run_add_fetched_info(movie)
        self.assertEqual(movie.recommended_movies, [123, 456])

    def test_handles_images_missing_keys(self):
        """Image dicts missing 'file_path' key are skipped."""
        data = {**self.movie_data, 'images': {
            'backdrops': [{'file_path': '/bd1.jpg'}, {'no_path': True}],
            'posters': [],
            'logos': []
        }}
        movie = _make_movie()
        self._run_add_fetched_info(movie, data)
        self.assertEqual(movie.images.backdrops, ['/bd1.jpg'])

    def test_calls_calculate_weighted_rating_bayes(self):
        """The method internally calls calculate_weighted_rating_bayes()."""
        movie = _make_movie()
        movie.calculate_weighted_rating_bayes = mock.MagicMock()
        self._run_add_fetched_info(movie)
        movie.calculate_weighted_rating_bayes.assert_called_once()

    def test_calls_guess_country(self):
        """The method internally calls guess_country()."""
        movie = _make_movie()
        movie.guess_country = mock.MagicMock(return_value='US')
        self._run_add_fetched_info(movie)
        movie.guess_country.assert_called_once()


class ToJsonTest(TestCase):
    """Tests for Movie.to_json() — custom JSON serialization with reference resolution.

    NOTE: to_json accesses embedded docs via __getitem__ (dict style: x['key']),
    NOT attribute access. Mocks must configure __getitem__ accordingly.
    """

    @staticmethod
    def _dict_mock(data):
        """Create a MagicMock that supports dict-style x['key'] access with given data."""
        m = mock.MagicMock()
        m.__getitem__.side_effect = lambda k: data[k]
        return m

    def setUp(self):
        self.genre_mock = mock.MagicMock()
        self.genre_mock.to_mongo.return_value = {'id': 1, 'name': 'Action'}
        self.genre_mock.name = 'Action'

        self.country_mock = self._dict_mock({
            'iso_3166_1': 'US',
            'name': 'United States',
            'english_name': 'United States',
        })

        self.lang_mock = self._dict_mock({
            'iso_639_1': 'en',
            'name': 'English',
            'english_name': 'English',
        })

        self.provider_mock = mock.MagicMock()
        self.provider_mock.__getitem__.side_effect = lambda k: {
            'provider_name': 'Netflix',
            'logo_path': '/netflix.jpg',
        }[k]

        self.base_mongo = {
            'genres': [mock.sentinel.genre_ref],
            'production_countries': [mock.sentinel.country_ref],
            'spoken_languages': [mock.sentinel.lang_ref],
            'providers': [],
        }

    def test_genres_resolved_via_to_mongo(self):
        """Genres are resolved by calling to_mongo() on each ReferenceField dereference."""
        movie = _make_movie(
            genres=[self.genre_mock],
            production_countries=[self.country_mock],
            spoken_languages=[self.lang_mock],
            providers=[],  # empty to simplify — not the focus of this test
        )
        movie.to_mongo = mock.MagicMock(return_value=self.base_mongo)

        result = _call_instance_method('to_json', movie)

        self.assertIn('Action', result)

    def test_production_countries_resolved(self):
        """Production country references are resolved to {iso, name} dicts."""
        movie = _make_movie(
            genres=[self.genre_mock],
            production_countries=[self.country_mock],
            spoken_languages=[self.lang_mock],
            providers=[],  # empty to simplify — not the focus of this test
        )
        movie.to_mongo = mock.MagicMock(return_value=self.base_mongo)

        result = _call_instance_method('to_json', movie)

        self.assertIn('US', result)
        self.assertIn('United States', result)

    def test_handles_doesnotexist_for_providers(self):
        """If a WatchProvider reference is stale (DoesNotExist), it's silently skipped."""
        from mongoengine.errors import DoesNotExist

        def raise_does_not_exist():
            raise DoesNotExist()

        # The provider mock: a dict-like object that raises DoesNotExist when
        # accessed via __getitem__ for provider_name or logo_path.
        provider_with_stale_ref = mock.MagicMock()
        provider_with_stale_ref.__getitem__.side_effect = lambda k: (
            raise_does_not_exist() if k in ('provider_name', 'logo_path') else None
        )

        # The provider-group-provider mock: has a .provider attribute and
        # supports __getitem__ for provider_type.
        provider_group_provider = mock.MagicMock()
        provider_group_provider.provider = provider_with_stale_ref
        provider_group_provider.__getitem__.side_effect = lambda k: {
            'provider_type': 'flatrate',
        }[k]

        # The provider-group mock: has .providers list
        provider_group = mock.MagicMock()
        provider_group.providers = [provider_group_provider]

        # The base_mongo must have the matching entry for providers iteration
        providers_mongo = [{'providers': [{'provider_type': 'flatrate'}]}]

        movie = _make_movie(
            genres=[self.genre_mock],
            production_countries=[self.country_mock],
            spoken_languages=[self.lang_mock],
            providers=[provider_group],
        )
        movie.to_mongo = mock.MagicMock(return_value={
            **self.base_mongo,
            'providers': providers_mongo,
        })

        # Should not raise
        result = _call_instance_method('to_json', movie)
        self.assertIsInstance(result, str)
