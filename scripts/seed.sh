#!/usr/bin/env bash
set -e

echo "🌱 Running DOGFOOD deterministic seed..."
npm --prefix backend run db:seed
echo "✅ Seeding finished successfully."
