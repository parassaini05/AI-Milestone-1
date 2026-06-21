import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const modelName = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// Initialize Groq client only if API key is provided
let groq = null;
if (apiKey) {
  groq = new Groq({ apiKey });
} else {
  console.warn('Warning: GROQ_API_KEY is not defined in .env file. Groq Client will operate in dry-run/mock mode.');
}

/**
 * Generate AI-ranked restaurant recommendations with custom explanations.
 * 
 * @param {Array} candidates - Array of restaurant records from SQLite database
 * @param {Object} preferences - User preferences
 * @param {string} preferences.location - Target location
 * @param {string} [preferences.cuisine] - Target cuisine
 * @param {string} [preferences.budget] - 'low', 'medium', or 'high'
 * @param {number} [preferences.minRating] - Minimum rating
 * @param {string} [preferences.specialNotes] - Custom preferences / notes
 * @returns {Promise<Array>} Ranked recommendations list with AI explanations
 */
export async function generateAiRecommendations(candidates, preferences) {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  if (!groq) {
    throw new Error('Groq client is not initialized due to missing GROQ_API_KEY.');
  }

  const { location, cuisine, budget, minRating, specialNotes } = preferences;

  // Format candidate list for LLM context
  const candidatesContext = candidates.map((c, index) => {
    const shortReview = c.reviews_list ? c.reviews_list.substring(0, 150) + '...' : 'No reviews available.';
    return `Candidate #${index + 1}:
Name: ${c.name}
Cuisine: ${c.cuisines}
Rating: ${c.rating || 'N/A'}
Cost: ₹${c.average_cost || 'N/A'}
Reviews: ${shortReview}
---`;
  }).join('\n');

  const systemPrompt = `You are a professional culinary guide and local restaurant expert. 
Your task is to rank a list of candidate restaurants based on user preferences and return the result in structured JSON format.

Return a JSON object containing a single key "recommendations" which is an array of objects.
Each object must have the following keys:
- "name": The exact name of the restaurant as provided in the candidate list.
- "matchScore": An integer from 0 to 100 indicating how well this restaurant matches the user's specific preferences.
- "highlightTags": An array of 2 to 3 short strings (e.g., ["Cozy", "Great Value"]) highlighting key features.
- "explanation": A personalized, 1-2 sentence explanation of why this restaurant matches the user's preferences, specifically referencing details in their reviews and how it fits the user's special notes/keywords.

You must only return a valid JSON object. Do not include any markdown backticks (like \`\`\`json), comments, or extra text. Start the response with '{' and end with '}'.`;

  const userPrompt = `Here are the user preferences:
- Location: ${location}
- Preferred Cuisine: ${cuisine || 'Any'}
- Budget Category: ${budget || 'Any'}
- Minimum Rating: ${minRating || 'Any'}
- Special Notes / Preferences: "${specialNotes || 'None'}"

Here are the candidate restaurants found in the database:
${candidatesContext}

Please rank these candidates in order of relevance to the user's preferences. Prioritize candidates that best match the special notes. 
Provide a tailored explanation, matchScore, and highlightTags for each recommended restaurant. Only include candidates that are in the candidate list provided.`;

  console.log(`Sending query to Groq using model: ${modelName}...`);

  const response = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2, // Low temperature for consistent JSON structuring
    max_tokens: 2000
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Groq returned an empty response.');
  }

  // Parse the JSON response
  let result;
  try {
    result = JSON.parse(content);
  } catch (err) {
    console.error('Failed to parse JSON response from Groq:', content);
    throw new Error(`Invalid JSON format in Groq response: ${err.message}`);
  }

  if (!result || !Array.isArray(result.recommendations)) {
    console.error('Groq response does not contain recommendations array:', result);
    throw new Error('Groq response format is missing "recommendations" array.');
  }

  // Map and align LLM ranked list with DB candidates to ensure data integrity
  const rankedResults = [];
  
  for (const rec of result.recommendations) {
    if (!rec.name) continue;

    // Look for exact or case-insensitive match in candidates list
    let matchedCandidate = candidates.find(
      c => c.name.trim().toLowerCase() === rec.name.trim().toLowerCase()
    );

    // If no exact match, try substring match
    if (!matchedCandidate) {
      matchedCandidate = candidates.find(
        c => c.name.toLowerCase().includes(rec.name.toLowerCase()) || 
             rec.name.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    if (matchedCandidate) {
      rankedResults.push({
        name: matchedCandidate.name,
        cuisine: matchedCandidate.cuisines,
        rating: matchedCandidate.rating || 'N/A',
        cost: formatCost(matchedCandidate),
        location: matchedCandidate.location,
        matchScore: rec.matchScore || 85,
        highlightTags: rec.highlightTags || ['Recommended', 'Good Match'],
        explanation: rec.explanation || `Matches your preferences in ${matchedCandidate.location}.`
      });
    }
  }

  // Append any candidate that wasn't included by the LLM at the end, just in case
  for (const candidate of candidates) {
    const alreadyIncluded = rankedResults.some(r => r.name === candidate.name);
    if (!alreadyIncluded) {
      rankedResults.push({
        name: candidate.name,
        cuisine: candidate.cuisines,
        rating: candidate.rating || 'N/A',
        cost: formatCost(candidate),
        location: candidate.location,
        matchScore: 70,
        highlightTags: ['Additional Option'],
        explanation: `Matches your preferences in ${candidate.location}.`
      });
    }
  }

  return rankedResults;
}

/**
 * Format cost for display — returns budget symbol string.
 * Prefers numeric cost, falls back to budget_category label.
 */
function formatCost(restaurant) {
  const cost = restaurant.average_cost;
  if (cost && !isNaN(cost)) {
    return `₹${cost} for two`;
  }
  // Fallback to budget category symbol
  const catMap = { low: '₹', medium: '₹₹', high: '₹₹₹' };
  return catMap[restaurant.budget_category] || '₹₹';
}
