import { initDb, closeDb } from './db.js';

console.log('Initializing database...');
initDb()
  .then(() => {
    console.log('Database verification successful! Schema created.');
    return closeDb();
  })
  .catch((err) => {
    console.error('Database verification failed:', err);
    process.exit(1);
  });
