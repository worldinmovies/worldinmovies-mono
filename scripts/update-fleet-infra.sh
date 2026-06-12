#!/usr/bin/env bash
# update-fleet-infra.sh
#
# Updates fleet-infra to consume Helm charts from GHCR OCI instead of local path.
# Run this AFTER the publish-charts CI workflow has completed successfully
# (check https://github.com/worldinmovies/worldinmovies-mono/actions).
#
# The script:
# 1. Removes local chart source files (Chart.yaml, templates/, values.yaml) from fleet-infra
# 2. Adds a HelmRepository resource pointing to ghcr.io/worldinmovies/charts
# 3. Updates HelmRelease sourceRef from GitRepository → HelmRepository
#
# Usage: bash scripts/update-fleet-infra.sh
# Requires: FLEET_INFRA_DIR env var or defaults to ~/workspace/personal/fleet-infra

set -euo pipefail

FLEET="${FLEET_INFRA_DIR:-$HOME/workspace/personal/fleet-infra}"
MONO="$HOME/workspace/personal/worldinmovies/worldinmovies-mono"

echo "Using fleet-infra at: $FLEET"
echo "Using monorepo at:    $MONO"

# --- 1. Add HelmRepository resource ---
HELMREPO_FILE="$FLEET/flux-system/helmrepository-ghcr-worldinmovies.yaml"
if [ ! -f "$HELMREPO_FILE" ]; then
  cat > "$HELMREPO_FILE" << 'EOF'
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: ghcr-worldinmovies
  namespace: flux-system
spec:
  type: oci
  interval: 1h
  url: oci://ghcr.io/worldinmovies/charts
EOF
  echo "Created: $HELMREPO_FILE"
else
  echo "Exists:  $HELMREPO_FILE (skipping)"
fi

# --- 2. Update HelmRelease files for each app chart ---
declare -A CHART_DEPS
CHART_DEPS[tmdb]="mongodb,rabbitmq"
CHART_DEPS[tmdb-worker]="mongodb,rabbitmq"
CHART_DEPS[webapp]="tmdb,meilisearch"

for NAME in tmdb tmdb-worker webapp; do
  HR_FILE="$FLEET/flux/worldinmovies/$NAME/helmrelease.yaml"

  if [ ! -f "$HR_FILE" ]; then
    echo "Skip:    $HR_FILE (not found)"
    continue
  fi

  # Convert deps string to yaml list
  IFS=',' read -ra DEPS <<< "${CHART_DEPS[$NAME]}"
  DEPS_YAML=""
  for DEP in "${DEPS[@]}"; do
    DEPS_YAML+="    - name: $DEP"$'\n'
  done

  cat > "$HR_FILE" << HR_EOF
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: $NAME
  namespace: worldinmovies
spec:
  interval: 1h
$(if [ -n "$DEPS_YAML" ]; then
  echo "  dependsOn:"
  echo -n "$DEPS_YAML"
fi)
  chart:
    spec:
      chart: $NAME
      version: ">=0.2.0"
      sourceRef:
        kind: HelmRepository
        name: ghcr-worldinmovies
        namespace: flux-system
  install:
    createNamespace: true
  valuesFrom:
    - kind: Secret
      name: $NAME-secrets
      valuesKey: values.yaml
HR_EOF
  echo "Updated: $HR_FILE"

  # --- 3. Remove local chart source files (keep helmrelease.yaml, kustomization.yaml, secrets.yaml) ---
  for FILE in Chart.yaml values.yaml; do
    TARGET="$FLEET/flux/worldinmovies/$NAME/$FILE"
    if [ -f "$TARGET" ]; then
      rm "$TARGET"
      echo "Removed: $TARGET"
    fi
  done
  if [ -d "$FLEET/flux/worldinmovies/$NAME/templates" ]; then
    rm -rf "$FLEET/flux/worldinmovies/$NAME/templates"
    echo "Removed: $FLEET/flux/worldinmovies/$NAME/templates/"
  fi
done

echo ""
echo "Done! Review changes and commit in fleet-infra:"
echo "  cd $FLEET && git add -A && git diff --cached"
echo ""
echo "Note: First-time sync may fail until charts are published to GHCR."
echo "      Flux will retry on its next interval (default: 1h)."
