import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Note: In production, these should be environment variables
const supabaseUrl = 'https://xaxqwyhsupbhvkwwsyxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhheHF3eWhzdXBiaHZrd3dzeXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3Nzc4OTgsImV4cCI6MjA1ODM1Mzg5OH0.BxykIBlbJfl6ELfiBvawEmG3xg8-FykG4jxwRr3RpUU';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Search for stocks by name
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise} - Promise resolving to search results
 */
export const searchStocks = async (query, limit = 5) => {
  try {
    if (!query || query.trim() === '') {
      return { data: [], error: null };
    }
    
    const trimmedQuery = query.trim();
    
    // Ensure we properly return the promise chain
    const { data, error } = await supabase
      .from("Assets")
      .select("name, symbol, class, exchange")
      .ilike('name', `%${trimmedQuery}%`)
      .limit(limit);
      
    if (error) {
      console.error("Supabase search error:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error searching stocks:", error);
    return { data: null, error: error.message };
  }
};

/**
 * Handler for the stock search API endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleStockSearch = async (query, limit, res) => {
  try {
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const { data, error } = await searchStocks(query, limit);
    
    if (error) {
      return res.status(500).json({ message: "Error searching stocks", error });
    }
    
    return res.status(200).json({ results: data });
  } catch (error) {
    console.error("Error in stock search handler:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
