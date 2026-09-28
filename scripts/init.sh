#!/usr/bin/env bash
set -e

ACTION=${1:-"all"}

echo "🚀 Initializing DOGFOOD Hackathon Platform..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

if [ "$ACTION" == "migrate" ] || [ "$ACTION" == "all" ]; then
    echo "📦 Running database migrations..."
    npm --prefix backend run db:migrate
fi

if [ "$ACTION" == "seed" ] || [ "$ACTION" == "all" ]; then
    echo "🌱 Seeding initial platform data..."
    npm --prefix backend run db:seed
fi

echo "✨ DOGFOOD initialization complete!"
