from apps.api import views
from apps.api.auth import require_admin_token
from apps.trakt import views as trakt_views
from django.urls import path, re_path, include

urlpatterns = [
    # ── Public read-only endpoints (no auth required) ──────────────
    path('genres',                          views.get_genres),
    path('search/movies/<str:query>',       views.search_movies),
    path('view/best/<str:country_code>',    views.get_best_movies_from_country),
    path('view/random/<str:country_code>',  views.get_random_movies_by_country),
    path('view/random/best/<int:movies>',   views.get_best_randoms),
    path('movies/<str:ids>',                views.fetch_movies_data),
    path('movie/<str:id>',                  views.fetch_movie_data),
    path('imdb/ratings',                    views.parse_user_imdb_ratings),     # user CSV upload
    path('letterboxd/ratings',              views.parse_user_letterboxd_ratings), # user CSV upload
    re_path(r'^status$',                    views.import_status),
    path('sitemap.xml',                       views.sitemap),
    re_path(r'^health/',                    include('health_check.urls')),  # k8s probes

    # ── Trakt OAuth proxy (httpOnly cookie via backend) ────────────
    path('trakt/callback',                  trakt_views.trakt_callback),
    path('trakt/session',                   trakt_views.trakt_session),
    path('trakt/logout',                    trakt_views.trakt_logout),
    path('trakt/import',                    trakt_views.trakt_import),

    # ── Admin endpoints (require X-API-Key header) ─────────────────
    path('import/tmdb/daily',               require_admin_token(views.download_file)),
    path('import/tmdb/data',                require_admin_token(views.import_tmdb_data)),
    path('import/base',                     require_admin_token(views.base_fetch)),
    path('import/tmdb/genres',              require_admin_token(views.fetch_genres)),
    path('import/tmdb/countries',           require_admin_token(views.fetch_countries)),
    path('import/tmdb/languages',           require_admin_token(views.fetch_languages)),
    path('import/tmdb/providers',           require_admin_token(views.fetch_providers)),
    path('import/tmdb/changes',             require_admin_token(views.check_tmdb_for_changes)),
    path('import/imdb/ratings',             require_admin_token(views.fetch_imdb_ratings)),
    path('import/imdb/titles',              require_admin_token(views.fetch_imdb_titles)),
    path('index/movies',                    require_admin_token(views.index_meilisearch)),
    path('dump/genres',                     require_admin_token(views.dump_genres)),
    path('dump/langs',                      require_admin_token(views.dump_langs)),
    path('dump/countries',                  require_admin_token(views.dump_countries)),
    path('redo/guestimation',               require_admin_token(views.redo_guestimation)),
    path('redo/populatediscovery',          require_admin_token(views.populate_discovery)),
]
