import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/originals.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export class Database {
  constructor() {
    this.originals = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading database:', error);
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.originals, null, 2));
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // Add original file to database
  addOriginal(fileHash, filename, size, uploadedAt) {
    this.originals[fileHash] = {
      fileHash,
      filename,
      size,
      uploadedAt,
      verified: 0,
      integrity: '✓ Valid'
    };
    this.save();
    return this.originals[fileHash];
  }

  // Get all original files
  getAllOriginals() {
    return Object.values(this.originals);
  }

  // Find original file by hash
  findOriginal(fileHash) {
    return this.originals[fileHash] || null;
  }

  // Update verification count
  incrementVerification(fileHash) {
    if (this.originals[fileHash]) {
      this.originals[fileHash].verified = (this.originals[fileHash].verified || 0) + 1;
      this.save();
    }
  }

  // Delete original file
  deleteOriginal(fileHash) {
    if (this.originals[fileHash]) {
      delete this.originals[fileHash];
      this.save();
      return true;
    }
    return false;
  }

  // Check if file exists in database
  exists(fileHash) {
    return !!this.originals[fileHash];
  }
}
