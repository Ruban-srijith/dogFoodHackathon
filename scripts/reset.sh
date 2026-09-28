#!/usr/bin/env bash
set -e

echo "⚠️ Resetting DOGFOOD database and platform state..."
npm --prefix backend run db:reset
echo "✅ Platform reset complete."
