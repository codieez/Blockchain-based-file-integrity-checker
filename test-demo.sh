#!/bin/bash

echo "=========================================="
echo "Blockchain File Integrity Checker - Demo"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000/api"
ADMIN_KEY="admin123"

echo "[1] Checking Blockchain Status..."
echo ""
curl -s "$BASE_URL/blockchain" | jq '.stats' --tab
echo ""

echo "[2] Creating Test File..."
echo "This is a test file for blockchain integrity verification." > /tmp/test_file.txt
echo "Test file created at /tmp/test_file.txt"
echo ""

echo "[3] Uploading Test File to Blockchain..."
echo ""
UPLOAD_RESPONSE=$(curl -s -X POST -H "X-Admin-Key: $ADMIN_KEY" -F "file=@/tmp/test_file.txt" "$BASE_URL/admin/upload-original")
echo "$UPLOAD_RESPONSE" | jq '.'
FILE_HASH=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.fileHash')
BLOCK_INDEX=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.blockIndex')
echo ""

echo "[4] Verifying File Integrity..."
echo ""
curl -s -X POST -F "file=@/tmp/test_file.txt" "$BASE_URL/verify-file" | jq '.'
echo ""

echo "[5] Checking Updated Blockchain..."
echo ""
curl -s "$BASE_URL/blockchain" | jq '.stats' --tab
echo ""

echo "[6] Getting Detailed Block Information..."
echo ""
curl -s "$BASE_URL/block/$BLOCK_INDEX" | jq '.'
echo ""

echo "[7] Mining Statistics..."
echo ""
curl -s "$BASE_URL/mining-stats" | jq '.difficultyHistory, .totalBlocksMined, .averageMiningTime'
echo ""

echo "[8] Getting All Uploaded Files..."
echo ""
curl -s "$BASE_URL/files/registered" | jq '.files[] | {filename, fileHash: .fileHash[0:32] + "...", verifications, integrity}'
echo ""

echo "=========================================="
echo "Demo Complete!"
echo "=========================================="
