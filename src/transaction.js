import { fetchPortfolio } from './indyfund.js';

/**
 * Places a buy or sell order for a given account using the Alpaca API
 * @param {Object} orderData - The order data containing account_id, symbol, amount, side, etc.
 * @param {Object} res - Express response object
 * @returns {Promise} - Promise that resolves with the order response
 */
const placeOrder = (orderData, res) => {
    const { account_id, symbol, amount, side, portfolioItems } = orderData;
    
    if (!account_id || !symbol || !amount || !side) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // Validate side parameter
    if (side !== 'buy' && side !== 'sell') {
        return res.status(400).json({ error: "Side must be 'buy' or 'sell'" });
    }
    
    // Calculate notional value based on portfolio weights
    let notional = amount;
    
    // If portfolioItems are provided, calculate notional based on percentage
    if (portfolioItems && Array.isArray(portfolioItems)) {
        const item = portfolioItems.find(item => item.symbol === symbol);
        if (item && item.percent) {
            // Calculate notional based on the percentage allocation
            notional = (parseFloat(amount) * (parseFloat(item.percent) / 100)).toFixed(2);
        }
    }
    
    // Prepare the order payload
    const orderPayload = {
        symbol: symbol,
        notional: notional.toString(),
        side: side,
        type: "market",
        time_in_force: "day"
    };
    
    // Make the API request to Alpaca
    return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        },
        body: JSON.stringify(orderPayload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Order placed successfully:", data);
        return res.status(200).json(data);
    })
    .catch(error => {
        console.error("Error placing order:", error);
        return res.status(500).json({ error: "Failed to place order", details: error.message });
    });
};

/**
 * Places multiple orders based on portfolio weights
 * @param {Object} orderData - The order data containing account_id, amount, email, and side
 * @param {Object} res - Express response object
 * @returns {Promise} - Promise that resolves with the order responses
 */
const placePortfolioOrders = async (orderData, res) => {
    const { account_id, amount, email, side = "buy" } = orderData;
    
    if (!account_id || !amount || !email) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // Validate side parameter
    if (side !== 'buy' && side !== 'sell') {
        return res.status(400).json({ error: "Side must be 'buy' or 'sell'" });
    }
    
    try {
        // Create a response object to capture the portfolio data
        const portfolioRes = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.data = data;
                return this;
            }
        };
        
        // Fetch portfolio items using the fetchPortfolio function
        await fetchPortfolio(email, portfolioRes);
        
        // Check if portfolio data was successfully retrieved
        if (!portfolioRes || portfolioRes.statusCode !== 200) {
            throw new Error("Failed to retrieve portfolio data");
        }
        
        console.log("Portfolio data retrieved:", portfolioRes);
        const portfolioItems = portfolioRes.data;
        
        if (!Array.isArray(portfolioItems) || portfolioItems.length === 0) {
            return res.status(400).json({ error: "No portfolio items found" });
        }
        
        const orderPromises = portfolioItems.map(item => {
            if (!item.symbol || !item.percent) {
                console.warn(`Skipping invalid portfolio item: ${JSON.stringify(item)}`);
                return Promise.resolve(null); // Skip invalid items
            }
            
            // Calculate notional value based on percentage
            const notional = (parseFloat(amount) * (parseFloat(item.percent) / 100)).toFixed(2);
            
            // Prepare the order payload
            const orderPayload = {
                symbol: item.symbol,
                notional: notional.toString(),
                side: side, // Use the provided side parameter (defaults to "buy")
                type: "market",
                time_in_force: "day"
            };
            
            console.log(`Placing ${side} order for ${item.symbol}: $${notional} (${item.percent}% of $${amount})`);
            
            // Make the API request to Alpaca
            return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
                },
                body: JSON.stringify(orderPayload)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error for ${item.symbol}! Status: ${response.status}`);
                }
                return response.json();
            });
        });
        
        // Filter out null promises (from invalid items) and wait for all valid orders to complete
        const results = await Promise.all(orderPromises.filter(p => p !== null));
        console.log("All portfolio orders placed successfully");
        return res.status(200).json({ success: true, orders: results });
    } catch (error) {
        console.error("Error placing portfolio orders:", error);
        return res.status(500).json({ error: "Failed to place portfolio orders", details: error.message });
    }
};

/**
 * Fetches current prices for a list of stock symbols
 * @param {Array} symbols - Array of stock symbols
 * @param {Object} res - Express response object
 * @returns {Promise} - Promise that resolves with the prices
 */
const fetchStockPrices = async (symbols, res) => {
    try {
        // Validate input
        console.log("Fetching stock prices for symbols:", symbols);
        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({ error: "Invalid or empty symbols array" });
        }
        
        // Convert array to comma-separated string
        const symbolsString = symbols.join(',');
        
        // Make the API request to Alpaca
        const response = await fetch(`https://data.sandbox.alpaca.markets/v2/stocks/snapshots?symbols=${symbolsString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract closing prices and calculate percent change using previous day's closing price
        const stockData = {};
        for (const symbol of symbols) {
            if (data[symbol] && data[symbol].dailyBar) {
                const dailyBar = data[symbol].dailyBar;
                const currentPrice = dailyBar.c;
                
                // Check if previous day data is available
                let percentChange = null;
                if (data[symbol].prevDailyBar && data[symbol].prevDailyBar.c) {
                    const prevClosePrice = data[symbol].prevDailyBar.c;
                    // Calculate percent change from previous day's close to current price
                    percentChange = ((currentPrice - prevClosePrice) / prevClosePrice) * 100;
                    percentChange = parseFloat(percentChange.toFixed(2));
                }
                
                stockData[symbol] = {
                    price: currentPrice,
                    percentChange: percentChange
                };
            } else {
                stockData[symbol] = {
                    price: null,
                    percentChange: null
                }; // Symbol data not available
            }
        }
        
        return res.status(200).json(stockData);
    } catch (error) {
        console.error("Error fetching stock prices:", error);
        return res.status(500).json({ error: "Failed to fetch stock prices", details: error.message });
    }
};

export { placeOrder, placePortfolioOrders, fetchStockPrices };