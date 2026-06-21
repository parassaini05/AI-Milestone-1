import { app } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3002;
const hasApiKey = !!process.env.GROQ_API_KEY;

const server = app.listen(PORT, async () => {
  console.log(`\n========================================`);
  console.log(`Verification Server running on port ${PORT}...`);
  console.log(`GROQ_API_KEY is ${hasApiKey ? 'PRESENT' : 'MISSING (Expecting Fallback Mode)'}`);
  console.log(`========================================\n`);

  try {
    console.log('Sending recommendation request for "Banashankari", "Cafe", budget "medium"...');
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
        specialNotes: 'likes outdoor seating, quiet atmosphere'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('\n--- Verification Result ---');
    console.log(`Candidate Count from DB: ${data.candidateCount}`);
    console.log(`AI Offline Status: ${data.aiOffline}`);
    console.log(`Relaxed Filters Used: ${data.relaxedFiltersUsed}`);
    console.log(`Number of Recommendations Returned: ${data.recommendations.length}`);
    console.log('---------------------------');
    
    if (data.recommendations.length > 0) {
      console.log('Sample Recommendation:');
      console.log(JSON.stringify(data.recommendations[0], null, 2));
    } else {
      console.log('No recommendations returned.');
    }

    // Assert correct structure
    if (typeof data.aiOffline !== 'boolean') {
      throw new Error('Assertion Failed: "aiOffline" is not a boolean.');
    }
    if (!Array.isArray(data.recommendations)) {
      throw new Error('Assertion Failed: "recommendations" is not an array.');
    }

    if (hasApiKey) {
      if (data.aiOffline) {
        console.warn('\n[WARNING]: API key was provided, but AI recommendations fell back to database default. Check server logs.');
      } else {
        console.log('\n[SUCCESS]: AI recommendations ranked and generated successfully by Groq!');
      }
    } else {
      if (!data.aiOffline) {
        throw new Error('Assertion Failed: aiOffline should be true when GROQ_API_KEY is missing.');
      }
      console.log('\n[SUCCESS]: Fallback mechanism executed correctly because GROQ_API_KEY was missing.');
    }

  } catch (err) {
    console.error('\n[ERROR]: Verification failed with error:', err.message);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      console.log('\nVerification Server closed.');
      process.exit(process.exitCode || 0);
    });
  }
});
