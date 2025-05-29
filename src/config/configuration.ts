export default () => ({
  port: process.env.PORT || 3000,
  db: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/game-saga-guesser',
  },
  ipRateLimit: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1, // limit each IP to 1 request per windowMs
  },
});