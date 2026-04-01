#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Blockchain File Integrity Checker - Starting...        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if uploads directory exists
if [ ! -d "./uploads" ]; then
  mkdir -p ./uploads
  echo "✓ Created uploads directory"
fi

# Start server
echo "Starting backend server..."
cd server && node index.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "✓ Server started (PID: $SERVER_PID)"

# Wait for server to start
sleep 3

# Start client
echo "Starting frontend client..."
cd ../client && npm run dev > /tmp/client.log 2>&1 &
CLIENT_PID=$!
echo "✓ Client started (PID: $CLIENT_PID)"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Ready to Use!                           ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  🖥️  Server:  http://localhost:5000                         ║"
echo "║  🌐 Client:  http://localhost:3000                         ║"
echo "║                                                            ║"
echo "║  📋 API Docs: Check server/index.js for all endpoints      ║"
echo "║  🚀 Features: Upload → Mine → Verify → Explore           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop both services..."
echo ""

# Keep process alive
wait
