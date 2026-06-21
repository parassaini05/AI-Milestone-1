import { Readable } from 'stream';
import csv from 'csv-parser';
import { initDb, insertRestaurant, clearAllRestaurants, closeDb } from './db.js';

const DATASET_URL = 'https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation/resolve/main/zomato.csv';
const MAX_RECORDS = 15000; // Limit records to keep database lightweight

// Helper to clean rating string (e.g., "4.1/5" -> 4.1, "NEW" -> null)
function cleanRating(rateStr) {
  if (!rateStr) return null;
  const cleaned = rateStr.trim();
  if (cleaned === 'NEW' || cleaned === '-' || cleaned === '') return null;
  
  // Extract number before the slash
  const match = cleaned.match(/^([0-9.]+)\/5/);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? null : val;
  }
  
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// Helper to clean and categorize cost
function cleanCostAndCategorize(costStr) {
  if (!costStr) return { cost: null, category: 'medium' };
  
  // Remove commas, spaces, currency symbols
  const cleaned = costStr.replace(/[, ₹$]/g, '').trim();
  const cost = parseInt(cleaned, 10);
  
  if (isNaN(cost)) {
    return { cost: null, category: 'medium' };
  }
  
  // Data-driven thresholds from HuggingFace Zomato Bangalore dataset
  // (approx_cost is "cost for two people" in INR):
  //   Low:    ≤ ₹500   — street food, dhabas, fast food counters
  //   Medium: ₹501–₹1500 — casual dining, cafes, mid-range restaurants
  //   High:   > ₹1500  — premium / fine dining
  let category = 'medium';
  if (cost <= 500) {
    category = 'low';
  } else if (cost > 1500) {
    category = 'high';
  }
  
  return { cost, category };
}

// Helper to clean and truncate reviews list to keep DB and LLM context size small
function cleanReviews(reviewsStr) {
  if (!reviewsStr) return '';
  
  // Basic cleanups for reviews list format
  let cleaned = reviewsStr.trim();
  
  // Truncate to first 1000 characters to prevent excessive DB bloat and token waste
  if (cleaned.length > 1000) {
    cleaned = cleaned.substring(0, 1000) + '...';
  }
  
  return cleaned;
}

async function runIngestion() {
  try {
    console.log('Initializing database schema...');
    await initDb();
    
    console.log('Clearing existing restaurant data...');
    await clearAllRestaurants();
    
    console.log(`Fetching Zomato dataset from: ${DATASET_URL}`);
    const response = await fetch(DATASET_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset. Status: ${response.status} ${response.statusText}`);
    }
    
    console.log('Dataset stream connected. Processing and seeding database...');
    
    const nodeStream = Readable.fromWeb(response.body);
    let recordCount = 0;
    let successCount = 0;
    
    const parser = nodeStream.pipe(csv());
    
    // Track insertion promises to run them concurrently in batches
    let batchPromises = [];
    const BATCH_SIZE = 100;
    
    for await (const row of parser) {
      recordCount++;
      
      const { cost, category } = cleanCostAndCategorize(row['approx_cost(for two people)']);
      const rating = cleanRating(row['rate']);
      
      const restaurant = {
        name: row['name'] ? row['name'].trim() : 'Unknown Restaurant',
        location: row['location'] ? row['location'].trim() : 'Unknown Location',
        cuisines: row['cuisines'] ? row['cuisines'].trim() : 'Other',
        average_cost: cost,
        budget_category: category,
        rating: rating,
        reviews_list: cleanReviews(row['reviews_list'])
      };
      
      // Add insertion to current batch
      batchPromises.push(
        insertRestaurant(restaurant)
          .then(() => successCount++)
          .catch(err => console.error(`Failed to insert record: ${restaurant.name}. Error:`, err.message))
      );
      
      // If batch size is met, await insertion and print progress
      if (batchPromises.length >= BATCH_SIZE) {
        await Promise.all(batchPromises);
        batchPromises = [];
        console.log(`Ingested ${recordCount} rows... (Saved: ${successCount})`);
      }
      
      // Stop ingestion if maximum limit is reached
      if (recordCount >= MAX_RECORDS) {
        console.log(`Reached limit of ${MAX_RECORDS} records. Stopping ingestion.`);
        break;
      }
    }
    
    // Await any remaining records
    if (batchPromises.length > 0) {
      await Promise.all(batchPromises);
    }
    
    console.log(`\nIngestion Completed successfully!`);
    console.log(`Total rows processed from stream: ${recordCount}`);
    console.log(`Total rows written to database: ${successCount}`);
    
  } catch (error) {
    console.error('Ingestion failed with error:', error);
  } finally {
    await closeDb();
  }
}

runIngestion();
