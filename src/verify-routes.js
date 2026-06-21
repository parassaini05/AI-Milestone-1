import { app } from './server.js';

// Start server on a test port 3001
const PORT = 3001;
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}...`);
  
  try {
    console.log('Sending mock POST request to /api/recommendations...');
    const response = await fetch(`http://localhost:${PORT}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: 'Banashankari',
        cuisine: 'Cafe',
        budget: 'medium',
        minRating: 3.5,
        specialNotes: 'wants outdoor seating'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('\n--- API Route Test Successful ---');
    console.log('Response body:');
    console.log(JSON.stringify(data, null, 2));
    console.log('---------------------------------');
    
  } catch (err) {
    console.error('API Route Test Failed with error:', err.message);
  } finally {
    server.close(() => {
      console.log('Test server closed.');
      process.exit(0);
    });
  }
});
