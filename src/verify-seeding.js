import { queryRestaurants, closeDb } from './db.js';

console.log('Querying database to verify seeding...');
queryRestaurants({ location: 'Banashankari', limit: 3 })
  .then((results) => {
    console.log(`Verification: Found ${results.length} sample restaurants in Banashankari:`);
    results.forEach((r, idx) => {
      console.log(`${idx + 1}. Name: ${r.name}, Loc: ${r.location}, Cuisine: ${r.cuisines}, Rating: ${r.rating}, Cost: ${r.average_cost}, Budget: ${r.budget_category}`);
    });
    return closeDb();
  })
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
