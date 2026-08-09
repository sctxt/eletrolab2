require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
