import { getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from './Firebase.js';

/**
 * Updates the weights of stocks in a user's portfolio
 * @param {string} email - User's email
 * @param {Array} newWeights - Array of objects with symbol, percent, and confidence
 * @param {Object} res - Express response object
 * @returns {Promise} - Promise that resolves with the updated weights
 */
async function updateWeights(email, newWeights, res) {
    try {
        // Validate input parameters
        if (!email || !newWeights || !Array.isArray(newWeights)) {
            return res.status(400).json({ error: "Invalid parameters" });
        }

        // Validate that newWeights contains required fields
        for (const weight of newWeights) {
            if (!weight.symbol || !weight.percent || !weight.confidence) {
                return res.status(400).json({ 
                    error: "Each weight must have symbol, percent, and confidence",
                    invalidWeight: weight
                });
            }
        }
        
        // Get the document reference
        const docRef = doc(db, "fund", email);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            // Get the current weights
            const currentWeights = docSnap.data().weights || [];
            const updatedWeights = [];
            
            // Process each item in the newWeights array
            for (const newWeight of newWeights) {
                // Find matching symbol in current weights
                const existingWeight = currentWeights.find(w => w.symbol === newWeight.symbol);
                
                if (existingWeight) {
                    // Update existing weight with new values and preserve old percent
                    updatedWeights.push({
                        ...existingWeight,
                        prev_percent: existingWeight.percent, // Store previous percent
                        percent: newWeight.percent, // Update percent
                        confidence: newWeight.confidence // Update confidence
                    });
                } else {
                    // Add new weight (no previous percent)
                    updatedWeights.push({
                        symbol: newWeight.symbol,
                        percent: newWeight.percent,
                        confidence: newWeight.confidence,
                        prev_percent: 0 // Default for new symbols
                    });
                }
            }
            
            // Note: Weights not included in newWeights are intentionally removed
            
            // Update the document in Firestore
            await updateDoc(docRef, { weights: updatedWeights });
            
            return res.status(200).json({
                success: true,
                message: "Weights updated successfully",
                weights: updatedWeights
            });
        } else {
            return res.status(404).json({ error: "User portfolio not found" });
        }
    } catch (err) {
        console.error("Error in updateWeights:", err);
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
}

export { updateWeights };