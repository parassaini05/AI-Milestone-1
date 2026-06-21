import express from 'express';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { queryRestaurants, getUniqueLocations, getUniqueCuisines } from './db.js';
import { generateAiRecommendations } from './groqClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON middleware and serve static frontend assets
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

/**
 * Endpoint to get all unique locations
 */
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await getUniqueLocations();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations.' });
  }
});

/**
 * Endpoint to get all unique cuisines
 */
app.get('/api/cuisines', async (req, res) => {
  try {
    const cuisines = await getUniqueCuisines();
    res.json(cuisines);
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    res.status(500).json({ error: 'Failed to fetch cuisines.' });
  }
});

/**
 * Endpoint to fetch restaurant recommendations.
 * 
 * Request Body format:
 * {
 *   "location": "Banashankari",
 *   "cuisine": "Italian",
 *   "budget": "medium", // "low", "medium", "high"
 *   "minRating": 3.5,
 *   "specialNotes": "likes quiet spaces"
 * }
 */
app.post('/api/recommendations', async (req, res) => {
  try {
    const { location, cuisine, budget, minRating, specialNotes } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required.' });
    }

    // Build database query filters
    const filters = {
      location,
      cuisine,
      budget_category: budget,
      minRating: minRating !== undefined ? parseFloat(minRating) : null,
      limit: 15 // Limit candidates for token efficiency
    };

    console.log('Applying DB Filters:', filters);
    let candidates = await queryRestaurants(filters);

    // [Edge Case Mitigation]: Query Relaxation Protocol
    // If no exact matches are found, relax the minRating and budget constraint to find nearby candidates.
    let relaxedFiltersUsed = false;
    if (candidates.length === 0) {
      console.log('Zero exact matches found. Triggering Query Relaxation Protocol...');
      relaxedFiltersUsed = true;
      const relaxedFilters = {
        location,
        cuisine, // Keep cuisine to match taste
        minRating: filters.minRating, // Strict: Do not relax the rating constraint
        limit: 15
      };
      candidates = await queryRestaurants(relaxedFilters);
    }

    console.log(`Retrieved ${candidates.length} candidates.`);

    // --- PHASE 4: Groq LLM Orchestration & Fallback Mechanism ---
    let recommendations = [];
    let aiOffline = false;

    if (candidates.length > 0) {
      try {
        console.log('Sending candidates to Groq API for personalized ranking & explanation...');
        recommendations = await generateAiRecommendations(candidates, {
          location,
          cuisine,
          budget,
          minRating,
          specialNotes
        });
      } catch (err) {
        console.warn('Groq recommendation service failed. Falling back to database default ranking. Error:', err.message);
        aiOffline = true;

        // Fallback: Sort candidates by rating descending (treat null as 0)
        const sortedCandidates = [...candidates].sort((a, b) => (b.rating || 0) - (a.rating || 0));

        recommendations = sortedCandidates.map((c, index) => ({
          name: c.name,
          cuisine: c.cuisines,
          rating: c.rating || 'N/A',
          cost: `₹${c.average_cost} for two`,
          matchScore: 100 - (index * 5), // Provide a synthetic declining score for the fallback
          highlightTags: ['DB Match', 'Fallback'],
          explanation: specialNotes 
            ? `Matches your preference of ${c.cuisines} in ${c.location}. (AI recommendations currently offline. Note: "${specialNotes}")`
            : `Matches your preference of ${c.cuisines} in ${c.location} with rating of ${c.rating || 'N/A'}. (AI recommendations currently offline)`
        }));
      }
    }

    return res.json({
      relaxedFiltersUsed,
      aiOffline,
      recommendations,
      candidateCount: candidates.length
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching recommendations.' });
  }
});

// Start backend server
const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

export { app, server };
