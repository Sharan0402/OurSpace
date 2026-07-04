#!/usr/bin/env bash
# Creates the 3 DynamoDB tables Our Space uses, on-demand billing (≈ free at
# two users). Safe to re-run: it skips tables that already exist.
#
# Usage:  AWS_REGION=us-east-1 ./create-dynamo-tables.sh
# Requires: awscli v2, configured credentials with DynamoDB create permissions.
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
PREFIX="${TABLE_PREFIX:-our-space}"

create() {
  local name="$1"; shift
  if aws dynamodb describe-table --table-name "$name" --region "$REGION" >/dev/null 2>&1; then
    echo "✓ $name already exists — skipping"
    return
  fi
  echo "Creating $name ..."
  aws dynamodb create-table \
    --table-name "$name" \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" \
    "$@" >/dev/null
  aws dynamodb wait table-exists --table-name "$name" --region "$REGION"
  echo "✓ $name ready"
}

# Chat messages: partition = conversationId, sort = sortKey (createdAt#id)
create "${PREFIX}-messages" \
  --attribute-definitions AttributeName=conversationId,AttributeType=S AttributeName=sortKey,AttributeType=S \
  --key-schema AttributeName=conversationId,KeyType=HASH AttributeName=sortKey,KeyType=RANGE

# Music sync sessions: partition = sessionId
create "${PREFIX}-sync-sessions" \
  --attribute-definitions AttributeName=sessionId,AttributeType=S \
  --key-schema AttributeName=sessionId,KeyType=HASH

# Spotify tokens: partition = userId
create "${PREFIX}-spotify-tokens" \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH

echo
echo "All tables ready in region $REGION."
