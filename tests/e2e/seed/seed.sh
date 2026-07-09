#!/bin/bash
# Seed script for E2E test data.
# Populates MongoDB (discoverymovie collection) and Meilisearch (movies index)
# with a known set of movies for deterministic flow-based testing.
#
# Usage: ./seed.sh              # defaults to localhost
# Usage: HOST_PREFIX=container  ./seed.sh   # from inside docker network
#
# Extending: To add more movies, edit seed-data.json and re-run this script.
# No schema changes needed — just append a new record to the JSON array.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_FILE="$SCRIPT_DIR/seed-data.json"

# --- Config ---
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_USER="${MONGO_USER:-seppa}"
MONGO_PASS="${MONGO_PASS:-password}"
MONGO_DB="${MONGO_DB:-tmdb}"
MONGO_COLLECTION="${MONGO_COLLECTION:-discoverymovie}"

MEILI_HOST="${MEILI_HOST:-localhost}"
MEILI_PORT="${MEILI_PORT:-7700}"
MEILI_KEY="${MEILI_KEY:-***REMOVED***}"
MEILI_INDEX="${MEILI_INDEX:-movies}"

# If HOST_PREFIX=container is set, use docker exec for mongo and container names for meili
if [ "${HOST_PREFIX:-}" = "container" ]; then
  MONGO_EXEC="docker exec -i mongo"
  MONGO_HOST_LOCAL="mongo"  # for mongoimport inside container
  MEILI_URL="http://meilisearch:${MEILI_PORT}"
else
  MONGO_EXEC=""
  MONGO_HOST_LOCAL="${MONGO_HOST}"
  MEILI_URL="http://${MEILI_HOST}:${MEILI_PORT}"
fi

echo "=== Seeding DiscoveryMovie data into MongoDB ==="

$MONGO_EXEC mongoimport \
  --host "${MONGO_HOST_LOCAL}" \
  --authenticationDatabase admin \
  --authenticationMechanism SCRAM-SHA-256 \
  -u "${MONGO_USER}" \
  -p "${MONGO_PASS}" \
  -d "${MONGO_DB}" \
  -c "${MONGO_COLLECTION}" \
  --mode upsert \
  --jsonArray \
  --file - < "$SEED_FILE"

echo "=== Configuring Meilisearch index settings ==="

curl -sf -X PATCH "${MEILI_URL}/indexes/${MEILI_INDEX}/settings" \
  -H "Authorization: Bearer ${MEILI_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "searchableAttributes": [
      "title",
      "original_title",
      "alternative_titles",
      "directors"
    ],
    "filterableAttributes": [
      "guessed_country",
      "original_language"
    ],
    "sortableAttributes": [
      "weighted_rating",
      "vote_average",
      "vote_count"
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
      "year"
    ]
  }' > /dev/null && echo "Meilisearch index settings updated"

echo "=== Indexing movies in Meilisearch ==="

# Transform seed-data.json from DiscoveryMovie format to Meilisearch document format
jq -c '.[] | {
  id: ._id,
  title: .english_title,
  original_title: .original_title,
  alternative_titles: [],
  overview: .overview,
  directors: [.director],
  weighted_rating: .weighted_rating,
  vote_average: .vote_average,
  vote_count: .vote_count,
  guessed_country: .estimated_country,
  original_language: (
    if .estimated_country == "JP" then "ja"
    elif .estimated_country == "KR" then "ko"
    elif .estimated_country == "FR" then "fr"
    elif .estimated_country == "IT" then "it"
    elif .estimated_country == "FI" then "fi"
    elif .estimated_country == "SE" then "sv"
    elif .estimated_country == "HK" then "zh"
    else "en"
    end
  ),
  poster: .poster_path,
  year: .year
}' "$SEED_FILE" | jq -s '.' | \
curl -sf -X POST "${MEILI_URL}/indexes/${MEILI_INDEX}/documents" \
  -H "Authorization: Bearer ${MEILI_KEY}" \
  -H "Content-Type: application/json" \
  -d @- > /dev/null
TOTAL=$(jq '. | length' "$SEED_FILE")
echo "Meilisearch indexed ${TOTAL} documents"

echo ""
echo "=== Seeding complete ==="
