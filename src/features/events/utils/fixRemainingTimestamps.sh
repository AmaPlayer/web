#!/bin/bash

# Fix webSocketConnectionPool.ts
FILE="web/src/features/events/services/webSocketConnectionPool.ts"
sed -i '' 's/connection\.lastActivity = new Date()/connection.lastActivity = Timestamp.now()/g' "$FILE"
sed -i '' 's/connectedAt: new Date()/connectedAt: Timestamp.now()/g' "$FILE"
sed -i '' 's/lastActivity: new Date()/lastActivity: Timestamp.now()/g' "$FILE"
sed -i '' 's/timestamp: new Date()/timestamp: Timestamp.now()/g' "$FILE"
sed -i '' 's/let oldestActivity = new Date()/let oldestActivity = Timestamp.now()/g' "$FILE"
sed -i '' 's/const now = new Date()/const now = Timestamp.now()/g' "$FILE"
sed -i '' 's/this\.cleanupInterval = setInterval/this.cleanupInterval = setInterval as unknown as number/g' "$FILE"

echo "Fixed webSocketConnectionPool.ts"
