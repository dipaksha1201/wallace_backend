import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from './Firebase.js';

const getPositions = (account_id, res) => {
    return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/positions`, {
        headers: {
            Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data !== undefined && data !== null) {
                console.log("Positions data:", data);
                const portfolioAssets = [];
                let stocks = {};
                let portfolioVal = 0;
                
                // First pass to calculate total portfolio value
                for (const obj of data) {
                    portfolioVal += parseFloat(obj.market_value);
                }
                
                // Second pass to store all required data
                for (const obj of data) {
                    portfolioAssets.push(obj.symbol);
                    const symbol = obj.symbol.toUpperCase();
                    
                    // Store the requested data for each position
                    stocks[symbol] = {
                        // percentage: Number(parseFloat(obj.market_value) / parseFloat(portfolioVal) * 100).toFixed(2),
                        qty: obj.qty,
                        change_today: obj.change_today,
                        market_value: obj.market_value,
                        unrealized_pl: obj.unrealized_pl
                    };
                }
                
                res.status(200).json({ stocks: stocks, portfolioVal: portfolioVal });
            } else {
                res.status(400).json("Something went wrong");
            }
        })
        .catch(err => {
            console.error("Error fetching positions:", err);
            res.status(500).json("Internal Server Error");
        });
}

const getEquityVal = (account_id, res) => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/account`, {
        headers: {
            Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data !== undefined && data !== null)
                res.status(200).json(parseFloat(data.equity));
            else res.status(401).json("No Investments Found");
        })
        .catch(err => res.status(500).json("Internal Server Error"));
}

const fetchReturns = (account_id, res) => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${account_id}/transfers`, {
        headers: {
            Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data !== undefined && data !== null)
                res.status(200).json(data.reduce((acc, trx) => (trx.direction === "INCOMING" ? acc = parseFloat(trx.amount) + acc : acc = acc - parseFloat(trx.amount)), 0));
        })
        .catch(err => res.status(500).json("Server Error"));
}

async function fetchPortfolio(email, res) {
    try {
        const docSnap = await getDoc(doc(db, "fund", email));
        
        if (docSnap.exists()) {
            const weights = docSnap.data().weights;
            const enrichedWeights = [];
            
            // Process each item in the weights array
            for (const item of weights) {
                if (item.symbol) {
                    // Fetch company data for this symbol
                    const companyData = await fetchCompanyOverview(item.symbol);
                    
                    // Add company data to the item
                    if (companyData) {
                        enrichedWeights.push({
                            ...item,
                            name: companyData.name,
                            sector: companyData.sector,
                            industry: companyData.industry,
                            market_cap: companyData.market_cap
                        });
                    } else {
                        // If we couldn't get company data, just use the original item
                        enrichedWeights.push(item);
                    }
                } else {
                    // If there's no symbol, just add the original item
                    enrichedWeights.push(item);
                }
            }
            
            res.status(200).json(enrichedWeights);
        } else {
            return res.status(401).json("Doesn't exist");
        }
    } catch (err) {
        console.error("Error in fetchPortfolio:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

const fetchCompanyOverview = async (symbol) => {
    const API_KEY = 'GJDC1XC7GBRFSIHD';
    const symbolUpper = symbol.toUpperCase();
    
    try {
        // First check if data exists in Firestore
        const docRef = doc(db, "stock_metadata", symbolUpper);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            // Data exists in database, return it
            console.log(`Found company data for ${symbolUpper} in database`);
            return docSnap.data();
        } else {
            // Data doesn't exist, fetch from API
            console.log(`Fetching company data for ${symbolUpper} from Alpha Vantage`);
            return fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbolUpper}&apikey=${API_KEY}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(async (data) => {
                    if (data && !data['Error Message'] && data.Symbol) {
                        // Extract only the fields we want to store
                        const metadataToStore = {
                            symbol: data.Symbol,
                            name: data.Name,
                            sector: data.Sector,
                            industry: data.Industry,
                            market_cap: data.MarketCapitalization
                        };
                        
                        // Save to Firestore
                        try {
                            await setDoc(doc(db, "stock_metadata", symbolUpper), metadataToStore);
                            console.log(`Saved ${symbolUpper} metadata to database`);
                        } catch (err) {
                            console.error(`Error saving ${symbolUpper} to database:`, err);
                        }
                        
                        // Return the data to the client
                        return metadataToStore;
                    } else {
                        console.error('Error in Alpha Vantage response:', data);
                        return { error: 'Failed to fetch company overview' };
                    }
                });
        }
    } catch (err) {
        console.error(`Error in fetchCompanyOverview for ${symbolUpper}:`, err);
        return { error: 'Internal Server Error' };
    }
};

export { getPositions, getEquityVal, fetchReturns, fetchPortfolio, fetchCompanyOverview };
