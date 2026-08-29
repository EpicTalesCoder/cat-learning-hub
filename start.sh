#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo "⚠️  No .env file found. Please create one before starting the app."
  echo "Example: cp .env.example .env"
  exit 1
fi

echo "🚀 Starting Cat Learning Hub..."
npm run dev
