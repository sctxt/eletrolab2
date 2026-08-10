require('dotenv').config();

function parseServiceAccount(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      return null;
    }
  }
  try {
    return JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
  } catch (err) {
    return null;
  }
}

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'eletrolab2',
  firebaseServiceAccount: parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT)
};
