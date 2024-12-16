// Node cryptography module (provides us modern encryption methods)
const crypto = require('crypto');

// Creating a secure hash using HMAC with SHA-256 encryption methods
function encryptPassword(password) {
    // Generate a 16-byte random salt
    const salt = crypto.randomBytes(16).toString('hex');
    // Using SHA-256 secure hashing method
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    // The final output is a hashed password which is secure
    return `${salt}:${hash}`;
}

// Verifying a plain password (just text) against the stored hashed password
function verifyPassword(inputPassword, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const inputHash = crypto.pbkdf2Sync(inputPassword, salt, 100000, 64, 'sha256').toString('hex');
    return inputHash === hash; // Compare hashes
}

module.exports = { encryptPassword, verifyPassword };