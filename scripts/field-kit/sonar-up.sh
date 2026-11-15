#!/usr/bin/env sh
# field-kit: start the local SonarQube container and wait until it is UP, then run the scan command.
# Used only when a brief lists the quality scan in its gates (off by default).
# Usage: sh scripts/field-kit/sonar-up.sh <scan command…>   e.g. sh scripts/field-kit/sonar-up.sh pnpm sonar
set -e
SERVICE="${SONAR_SERVICE:-sonarqube}"
URL="${SONAR_HOST_URL:-http://localhost:9000}"
docker compose up -d "$SERVICE"
printf 'waiting for SonarQube'
i=0
until curl -fsS "$URL/api/system/status" 2>/dev/null | grep -q '"status":"UP"'; do
  i=$((i+1)); [ "$i" -gt 60 ] && { echo; echo "❌ SonarQube not UP after 5 min ($URL)"; exit 1; }
  printf '.'; sleep 5
done
echo " UP"
[ "$#" -gt 0 ] && exec "$@"
