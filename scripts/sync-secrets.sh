#!/bin/bash
# Sync .env.production secrets to Fly.io

ENV_FILE="server/.env.production"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

echo "Importing secrets from $ENV_FILE to Fly.io..."
fly secrets import < "$ENV_FILE"

echo "Done! Current secrets:"
fly secrets list
