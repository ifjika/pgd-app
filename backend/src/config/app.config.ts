import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  simulatorEnabled: process.env.SIMULATOR_ENABLED === 'true',
  simulatorIntervalMs: parseInt(process.env.SIMULATOR_INTERVAL_MS || '15000', 10),
}));
