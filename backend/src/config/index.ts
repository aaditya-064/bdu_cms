import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bdu_cms',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  n8nBaseUrl: process.env.N8N_BASE_URL || '',
  n8nApiKey: process.env.N8N_API_KEY || '',
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
