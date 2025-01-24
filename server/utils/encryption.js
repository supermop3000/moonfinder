import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes for AES-256
const IV_LENGTH = 16; // Initialization vector must be 16 bytes

// Encrypt a string
export const encrypt = (text) => {
  console.log(ENCRYPTION_KEY);
  const iv = crypto.randomBytes(IV_LENGTH); // Generate random IV
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

// Decrypt an encrypted string
export const decrypt = (encryptedText) => {
  const [iv, encrypted] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
