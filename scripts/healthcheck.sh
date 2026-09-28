#!/usr/bin/env bash
set -e

HOST=${1:-"localhost"}
PORT=${2:-"8080"}
FALLBACK_PORT=${3:-"3000"}

echo "🔍 Checking DOGFOOD platform health on http://${HOST}:${PORT}..."

MAX_RETRIES=30
RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "http://${HOST}:${PORT}/health" > /dev/null 2>&1; then
        HEALTH_RES=$(curl -s "http://${HOST}:${PORT}/health")
        echo "✅ /health OK on port ${PORT}: ${HEALTH_RES}"
        HEALTH_OK=true
        break
    elif curl -sf "http://${HOST}:${FALLBACK_PORT}/health" > /dev/null 2>&1; then
        HEALTH_RES=$(curl -s "http://${HOST}:${FALLBACK_PORT}/health")
        echo "✅ (via port ${FALLBACK_PORT}) /health OK: ${HEALTH_RES}"
        HEALTH_OK=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for health endpoint... (attempt ${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 2
done

if [ "$HEALTH_OK" != "true" ]; then
    echo "❌ /health check FAILED after ${MAX_RETRIES} attempts on http://${HOST}:${PORT} and http://${HOST}:${FALLBACK_PORT}"
    exit 1
fi

if curl -sf "http://${HOST}:${PORT}/ready" > /dev/null 2>&1; then
    READY_RES=$(curl -s "http://${HOST}:${PORT}/ready")
    echo "✅ /ready OK: ${READY_RES}"
elif curl -sf "http://${HOST}:${FALLBACK_PORT}/ready" > /dev/null 2>&1; then
    READY_RES=$(curl -s "http://${HOST}:${FALLBACK_PORT}/ready")
    echo "✅ (via port ${FALLBACK_PORT}) /ready OK: ${READY_RES}"
else
    echo "⚠️ /ready endpoint check pending or database connecting..."
fi

echo "🚀 Health check completed successfully."
