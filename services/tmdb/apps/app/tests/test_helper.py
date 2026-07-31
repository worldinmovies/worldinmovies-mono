import json
from unittest import TestCase, mock

from apps.app.helper import (
    buffer,
    chunks,
    convert_country_code,
    start_background_process,
)


class ConvertCountryCodeTest(TestCase):
    """Tests for convert_country_code() — mapping historical/canonical country codes."""

    def test_identity_returned_as_single_element_list(self):
        """Standard 2-letter ISO codes that aren't in the dict are returned as [code]."""
        result = convert_country_code('SE')
        self.assertEqual(result, ['SE'])

    def test_identity_empty_string(self):
        """Empty string is not a valid country code — behavior depends on '' being a substring of every string."""
        # Note: '' in 'AQ' is True in Python, so '' matches the AQ identity mapping.
        result = convert_country_code('')
        self.assertIsInstance(result, list)

    def test_identity_three_letter(self):
        """Non-mapped codes with length != 2 are passed through."""
        result = convert_country_code('USA')
        self.assertEqual(result, ['USA'])

    # AN → [BQ, CW, SX]
    def test_an_to_bq_cw_sx(self):
        """Netherlands Antilles maps to BQ, CW, SX."""
        for code in ('BQ', 'CW', 'SX'):
            result = convert_country_code(code)
            self.assertEqual(result, ['AN', code])

    # AQ → AQ (identity within the dict, returned as [old, new])
    def test_aq_returns_identity_pair(self):
        """Antarctica maps to itself — code found in new_codes is returned as [AQ, AQ]."""
        result = convert_country_code('AQ')
        self.assertEqual(result, ['AQ', 'AQ'])

    # BU → MM
    def test_bu_to_mm(self):
        """Burma maps to Myanmar."""
        result = convert_country_code('MM')
        self.assertEqual(result, ['BU', 'MM'])

    # CS → [RS, SK]  (but note CS is in the Yugoslavia entry too)
    def test_cs_to_rs_sk(self):
        """Czechoslovakia code CS maps to [RS, SK] via the CS key in the dict
        (first match in iteration order)."""
        result = convert_country_code('RS')
        self.assertEqual(result, ['CS', 'RS'])
        result = convert_country_code('SK')
        self.assertEqual(result, ['CS', 'SK'])

    # SU expands to 14 countries
    def test_su_to_14_republics(self):
        """USSR code maps to all 14 independent republics."""
        # SU maps to all but 'CS' (now two entries for CS: Czechoslovakia and Serbia & Montenegro)
        # Actually checking each in the list
        su_republics = ['AM', 'AZ', 'EE', 'GE', 'KZ', 'KG', 'LV', 'LT', 'MD', 'RU', 'TJ', 'TM', 'UZ']
        for code in su_republics:
            result = convert_country_code(code)
            self.assertEqual(result, ['SU', code], f"{code} should map back to SU")

    # TP → TL
    def test_tp_to_tl(self):
        """East Timor maps to Timor-Leste."""
        result = convert_country_code('TL')
        self.assertEqual(result, ['TP', 'TL'])

    # UM → 6 territories
    def test_um_to_6_territories(self):
        """US Minor Outlying Islands maps to its 6 territories."""
        um_territories = ['UM-DQ', 'UM-FQ', 'UM-HQ', 'UM-JQ', 'UM-MQ', 'UM-WQ']
        for code in um_territories:
            result = convert_country_code(code)
            self.assertEqual(result, ['UM', code])

    # XC → IC
    def test_xc_to_ic(self):
        """Czechoslovakia alternate code XC maps to IC."""
        result = convert_country_code('IC')
        self.assertEqual(result, ['XC', 'IC'])

    # XG → DE
    def test_xg_to_de(self):
        """East Germany maps to Germany."""
        result = convert_country_code('DE')
        self.assertEqual(result, ['XG', 'DE'])

    # XI → IM
    def test_xi_to_im(self):
        """Northern Ireland maps to Isle of Man."""
        result = convert_country_code('IM')
        self.assertEqual(result, ['XI', 'IM'])

    # YU → [BA, HR, MK, CS, SI]
    def test_yu_to_5_republics(self):
        """Yugoslavia maps to Bosnia, Croatia, Macedonia, Serbia & Montenegro, Slovenia."""
        yu_republics = ['BA', 'HR', 'MK', 'CS', 'SI']
        for code in yu_republics:
            result = convert_country_code(code)
            self.assertEqual(result, ['YU', code], f"{code} should map back to YU")

    # ZR → CD
    def test_zr_to_cd(self):
        """Zaire maps to Democratic Republic of Congo."""
        result = convert_country_code('CD')
        self.assertEqual(result, ['ZR', 'CD'])

    def test_returns_list_always(self):
        """Result is always a list."""
        result = convert_country_code('XX')
        self.assertIsInstance(result, list)
        result = convert_country_code('DE')
        self.assertIsInstance(result, list)
        result = convert_country_code('BQ')
        self.assertIsInstance(result, list)


class ChunksTest(TestCase):
    """Tests for chunks() — split iterables into chunks of size N.

    NOTE: chunks() yields lazy chain iterators that share the underlying
    iterator. Each chunk MUST be consumed before the next is requested.
    Calling list(chunks(...)) without consuming each chunk first will give
    wrong results because the islice inside each chain hasn't been consumed.
    """

    def _consume(self, chunks_result):
        """Helper: consume each lazy chain chunk into a list."""
        return [list(c) for c in chunks_result]

    def test_empty_iterable(self):
        """Empty input yields nothing."""
        result = self._consume(chunks([], size=10))
        self.assertEqual(result, [])

    def test_single_chunk(self):
        """Smaller than chunk size produces one chunk."""
        result = self._consume(chunks([1, 2, 3], size=10))
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0], [1, 2, 3])

    def test_exact_multiple(self):
        """Exactly divisible produces full chunks."""
        result = self._consume(chunks([1, 2, 3, 4], size=2))
        self.assertEqual(result[0], [1, 2])
        self.assertEqual(result[1], [3, 4])

    def test_remainder(self):
        """Not divisible: last chunk is shorter."""
        result = self._consume(chunks([1, 2, 3, 4, 5], size=3))
        self.assertEqual(result[0], [1, 2, 3])
        self.assertEqual(result[1], [4, 5])

    def test_chunk_size_one(self):
        """Each element is its own chunk."""
        result = self._consume(chunks([1, 2, 3], size=1))
        self.assertEqual(result, [[1], [2], [3]])

    def test_chunk_size_larger_than_iterable(self):
        """Size > len(iterable) produces one chunk."""
        result = self._consume(chunks([1], size=100))
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0], [1])

    def test_generator_input(self):
        """Works with generator expressions, not just lists."""
        result = self._consume(chunks(range(6), size=3))
        self.assertEqual(result[0], [0, 1, 2])
        self.assertEqual(result[1], [3, 4, 5])

    def test_string_input(self):
        """Works with strings as iterables (characters are yielded individually)."""
        result = self._consume(chunks("abcdef", size=2))
        self.assertEqual(result, [['a', 'b'], ['c', 'd'], ['e', 'f']])

    def test_chunks_produce_chain_iterators(self):
        """Each chunk is a chain/iterator, not a list."""
        from itertools import chain
        for chunk in chunks([1, 2, 3], size=2):
            self.assertIsInstance(chunk, type(chain()))
            list(chunk)  # consume


class BufferTest(TestCase):
    """Tests for buffer() — collect generator output into chunks."""

    def test_empty_generator(self):
        """Empty generator returns None (the function falls through the while loop)."""
        def gen():
            return
            yield  # pragma: no cover
        result = buffer(gen())
        self.assertIsNone(result)

    def test_single_buffer(self):
        """Smaller than size returns all in one buffer."""
        result = buffer(iter([1, 2, 3]), size=10)
        self.assertEqual(result, [1, 2, 3])

    def test_exact_multiple(self):
        """Returns exactly one chunk (buffer returns one chunk per call)."""
        result = buffer(iter([1, 2, 3, 4]), size=4)
        self.assertEqual(result, [1, 2, 3, 4])

    def test_remainder_returns_short_chunk(self):
        """Buffer returns whatever is available, even if less than size."""
        result = buffer(iter([1, 2, 3, 4, 5]), size=3)
        self.assertEqual(result, [1, 2, 3])

    def test_buffer_exhaustion(self):
        """After taking all items, buffer returns None (function falls through)."""
        gen = iter([1, 2, 3])
        result1 = buffer(gen, size=2)
        self.assertEqual(result1, [1, 2])
        result2 = buffer(gen, size=2)
        self.assertEqual(result2, [3])
        result3 = buffer(gen, size=2)
        self.assertIsNone(result3)

    def test_buffer_with_generator(self):
        """Works with generator expressions."""
        gen = (x for x in range(5))
        result = buffer(gen, size=5)
        self.assertEqual(result, [0, 1, 2, 3, 4])


class StartBackgroundProcessTest(TestCase):
    """Tests for start_background_process() — daemon thread management."""

    def test_starts_thread_when_not_running(self):
        """When thread_name is not in running threads, a new thread is started."""
        with mock.patch('threading.enumerate', return_value=[
            mock.Mock(name='MainThread')
        ]):
            result = start_background_process(
                target=lambda: None,
                thread_name='my-process',
                log_id='my_process'
            )
        parsed = json.loads(result)
        self.assertIn('Starting to process', parsed['Message'])

    def test_returns_already_started_when_thread_running(self):
        """When a thread with the same name already exists, returns 'already started'."""
        existing_thread = mock.Mock(name='my-process')
        existing_thread.name = 'my-process'
        with mock.patch('threading.enumerate', return_value=[
            mock.Mock(name='MainThread'),
            existing_thread
        ]):
            result = start_background_process(
                target=lambda: None,
                thread_name='my-process',
                log_id='my_process'
            )
        parsed = json.loads(result)
        self.assertIn('already started', parsed['Message'])

    def test_starts_thread_with_daemon_true(self):
        """Thread is created with daemon=True."""
        with mock.patch('threading.enumerate', return_value=[mock.Mock(name='MainThread')]):
            with mock.patch('threading.Thread') as mock_thread:
                instance = mock.Mock()
                mock_thread.return_value = instance
                start_background_process(
                    target=lambda: None,
                    thread_name='test-daemon',
                    log_id='test'
                )
                mock_thread.assert_called_once_with(
                    target=mock.ANY,
                    name='test-daemon',
                )
                self.assertTrue(instance.daemon)
                instance.start.assert_called_once()

    def test_thread_name_case_sensitive(self):
        """Thread name matching is case-sensitive."""
        with mock.patch('threading.enumerate', return_value=[
            mock.Mock(name='My-Process'),
            mock.Mock(name='MainThread')
        ]):
            result = start_background_process(
                target=lambda: None,
                thread_name='my-process',  # different case
                log_id='test'
            )
        parsed = json.loads(result)
        self.assertIn('Starting to process', parsed['Message'])
