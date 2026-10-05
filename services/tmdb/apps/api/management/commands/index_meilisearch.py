from django.core.management.base import BaseCommand

from apps.app.db_models import Movie
from apps.app.helper import chunks
from apps.app.meilisearch_client import client
from apps.worker.celery_tasks import index_movies


class Command(BaseCommand):
    help = (
        "Reindex the Meilisearch 'movies' index: delete all documents, "
        "update index settings, and dispatch index_movies Celery tasks "
        "for every chunk of Movie IDs. Requires the tmdb-worker to be "
        "running to actually perform the indexing."
    )

    def handle(self, *args, **options):
        index = client.index("movies")

        self.stdout.write("index_meilisearch: deleting all documents...")
        index.delete_all_documents()

        self.stdout.write("index_meilisearch: updating index settings...")
        index.update_settings({
            "searchableAttributes": [
                "title",
                "original_title",
                "alternative_titles",
                "directors",
            ],
            "filterableAttributes": [
                "guessed_country",
                "original_language",
            ],
            "sortableAttributes": [
                "weighted_rating",
                "vote_average",
                "vote_count",
            ],
            "displayedAttributes": [
                "id",
                "title",
                "original_title",
                "overview",
                "directors",
                "weighted_rating",
                "vote_average",
                "vote_count",
                "guessed_country",
                "original_language",
                "poster",
                "year",
            ],
        })

        self.stdout.write("index_meilisearch: dispatching index_movies chunks...")
        chunk_count = 0
        for chunk in chunks(Movie.objects().all().values_list("id"), 50):
            index_movies.delay(list(chunk))
            chunk_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"index_meilisearch: dispatched {chunk_count} chunk(s) for indexing."
            )
        )