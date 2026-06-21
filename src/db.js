import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the data directory exists
const DB_DIR = join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbPath = join(DB_DIR, 'zomato.db');

// Initialize sqlite3 database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Successfully connected to SQLite database at:', dbPath);
  }
});

/**
 * Initialize database schema
 */
export function initDb() {
  return new Promise((resolve, reject) => {
    const query = `
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        cuisines TEXT,
        average_cost INTEGER,
        budget_category TEXT,
        rating REAL,
        reviews_list TEXT
      );
    `;
    db.run(query, (err) => {
      if (err) {
        console.error('Error creating restaurants table:', err.message);
        reject(err);
      } else {
        console.log('Restaurants table initialized.');
        resolve();
      }
    });
  });
}

/**
 * Insert a single restaurant record
 * @param {Object} restaurant 
 */
export function insertRestaurant(restaurant) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO restaurants (name, location, cuisines, average_cost, budget_category, rating, reviews_list)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      restaurant.name,
      restaurant.location,
      restaurant.cuisines,
      restaurant.average_cost,
      restaurant.budget_category,
      restaurant.rating,
      restaurant.reviews_list
    ];
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

/**
 * Clear all restaurants from the database
 */
export function clearAllRestaurants() {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM restaurants', (err) => {
      if (err) {
        reject(err);
      } else {
        // Reset sqlite_sequence to clear auto-increment count
        db.run("DELETE FROM sqlite_sequence WHERE name='restaurants'", () => {
          resolve();
        });
      }
    });
  });
}

/**
 * Query restaurants based on deterministic filters
 * @param {Object} filters 
 * @param {string} filters.location
 * @param {string} [filters.budget_category] - 'low', 'medium', or 'high'
 * @param {string} [filters.cuisine] - e.g., 'Italian'
 * @param {number} [filters.minRating] - e.g., 3.5
 * @param {number} [filters.limit] - max records to return, defaults to 20
 */
export function queryRestaurants(filters) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM restaurants WHERE 1=1';
    const params = [];

    // Filter by location (case-insensitive fuzzy match)
    if (filters.location) {
      query += ' AND location LIKE ?';
      params.push(`%${filters.location}%`);
    }

    // Filter by budget category
    if (filters.budget_category) {
      query += ' AND budget_category = ?';
      params.push(filters.budget_category.toLowerCase());
    }

    // Filter by rating
    if (filters.minRating !== undefined && filters.minRating !== null) {
      query += ' AND rating >= ?';
      params.push(Number(filters.minRating));
    }

    // Filter by cuisine (case-insensitive fuzzy match)
    if (filters.cuisine) {
      query += ' AND cuisines LIKE ?';
      params.push(`%${filters.cuisine}%`);
    }

    // Capping results for Groq LLM context limits
    const limit = filters.limit || 20;
    query += ' LIMIT ?';
    params.push(limit);

    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Close database connection
 */
export function closeDb() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed.');
        resolve();
      }
    });
  });
}

/**
 * Get all unique restaurant locations
 * @returns {Promise<Array>}
 */
export function getUniqueLocations() {
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT location FROM restaurants WHERE location IS NOT NULL AND location != "" ORDER BY location ASC', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(r => r.location));
      }
    });
  });
}

/**
 * Get all unique restaurant cuisines sorted alphabetically
 * @returns {Promise<Array>}
 */
export function getUniqueCuisines() {
  return new Promise((resolve, reject) => {
    db.all('SELECT cuisines FROM restaurants WHERE cuisines IS NOT NULL AND cuisines != ""', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const cuisinesSet = new Set();
        rows.forEach(row => {
          row.cuisines.split(',').forEach(c => {
            const trimmed = c.trim();
            if (trimmed) cuisinesSet.add(trimmed);
          });
        });
        resolve(Array.from(cuisinesSet).sort());
      }
    });
  });
}

export default db;
