import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export function getFileInfo(filePath, originalName) {
  const stats = fs.statSync(filePath);
  const hash = calculateFileHash(filePath);

  return {
    filename: originalName,
    size: stats.size,
    uploadedAt: new Date(stats.mtime).toISOString(),
    fileHash: hash,
    mimeType: getMimeType(originalName)
  };
}

export function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.zip': 'application/zip',
    '.csv': 'text/csv'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
}

export function verifyFileChain(blockchain, fileHash) {
  const block = blockchain.findBlockByFileHash(fileHash);
  if (!block) return null;

  return {
    found: true,
    blockIndex: block.index,
    blockHash: block.hash,
    timestamp: new Date(block.timestamp),
    fileHash: fileHash,
    chainValid: blockchain.isChainValid()
  };
}
