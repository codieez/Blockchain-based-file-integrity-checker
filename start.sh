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

# Kill any existing processes on ports
echo "Cleaning up existing processes..."
lsof -i :8545 2>/dev/null | grep -v COMMAND | awk '{print $2}' | xargs kill -9 2>/dev/null
lsof -i :5000 2>/dev/null | grep -v COMMAND | awk '{print $2}' | xargs kill -9 2>/dev/null
lsof -i :3000 2>/dev/null | grep -v COMMAND | awk '{print $2}' | xargs kill -9 2>/dev/null
sleep 1

# Start Hardhat blockchain node
echo "Starting Hardhat blockchain node..."
npm run chain:node > /tmp/hardhat.log 2>&1 &
HARDHAT_PID=$!
echo "✓ Hardhat node started (PID: $HARDHAT_PID)"

# Wait for hardhat to be ready
sleep 5

# Deploy smart contract
echo "Deploying smart contract..."
WRITE_ENV=true npm run chain:deploy:local:enable > /tmp/deploy.log 2>&1
echo "✓ Contract deployed"

# Wait a bit for contract deployment
sleep 2

# Start backend server
echo "Starting backend server..."
node server/index.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "✓ Server started (PID: $SERVER_PID)"

# Wait for server to start
sleep 3

# Start frontend client
echo "Starting frontend client..."
cd client && npm run dev > /tmp/client.log 2>&1 &
CLIENT_PID=$!
echo "✓ Client started (PID: $CLIENT_PID)"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Ready to Use!                           ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  ⛓️  Blockchain: http://localhost:8545                     ║"
echo "║  🖥️  Server:    http://localhost:5000                     ║"
echo "║  🌐 Client:    http://localhost:3000                     ║"
echo "║                                                            ║"
echo "║  📋 API Docs: Check server/index.js for all endpoints      ║"
echo "║  🚀 Features: Upload → Mine → Verify → Explore           ║"
echo "║                                                            ║"
echo "║  Process IDs:                                              ║"
echo "║  - Hardhat:  $HARDHAT_PID                                      ║"
echo "║  - Backend:  $SERVER_PID                                      ║"
echo "║  - Frontend: $CLIENT_PID                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "View logs:"
echo "  tail -f /tmp/hardhat.log"
echo "  tail -f /tmp/server.log"
echo "  tail -f /tmp/client.log"
echo ""
echo "Press Ctrl+C to stop all services..."
echo ""

# Keep process alive
wait
