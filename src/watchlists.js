

// const searchStock = (partialValue) => {
//     if (partialValue === "") { setMatches({}); return; }
//     const matches = {};
//     Object.keys(Scriplist).forEach((key) => {
//         if (key.includes(partialValue)) {
//             matches[key] = Scriplist[key];
//         }
//     });
//     const filteredObj = Object.fromEntries(Object.entries(matches).slice(0, 5));
//     setMatches(filteredObj);
// }

export const fetchWatchlistId = (account_id) => {
    return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Watchlists data:", data);
            if (data[0] !== undefined && data[0] !== null) {
                return data[0].id;
            }
            return null; // Return null if no watchlist is found
        }).catch(err => { 
            console.error('Error in fetchWatchlistId:', err);
            throw err; // Re-throw to allow handling in the calling function
        });
}

export const doesExist = (account_id) => {
    return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data[0] !== undefined) {
                return true;
            }
            return false;
        })
        .catch(err => { 
            console.error('Error in doesExist:', err);
            return false; 
        });
}

export const getWatchlist = (account_id, res) => {
    fetchWatchlistId(account_id)
        .then(watchListId => {
            console.log("watchListId:", watchListId);
            if (watchListId != null && watchListId.length > 0) {
                return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists/${watchListId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
                    }
                })
                .then(response => response.json())
                .then(data => {
                    res.status(200).json({ assets: data.assets, id: watchListId });
                });
            } else {
                res.status(404).json("No Watchlists Found");
            }
        })
        .catch(err => {
            console.error("Error in getWatchlist:", err);
            res.status(500).json("Internal Server Error");
        });
}

export const createNewList = (account_id, updatedWatchList, res) => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        },
        body: JSON.stringify({
            name: "watchlist",
            symbols: updatedWatchList
        })
    })
        .then(data => {
            if (data.status === 200) {
                fetchWatchlistId(account_id)
                    .then(watchListId => {
                        if (watchListId != null)
                            res.status(200).json("Successfully added to watchlist", watchListId);
                    })
                    .catch(err => {
                        console.error("Error fetching watchlist ID:", err);
                        res.status(500).json("Error fetching watchlist ID");
                    });
            }
        })
        .catch(err => {
            console.error("Error creating new list:", err);
            res.status(500).json("Error creating new list");
        });
}

export const updateWatchlist = (account_id, stock, res, action = 'add') => {
    // Validate action parameter
    if (action !== 'add' && action !== 'remove') {
        return res.status(400).json({ message: "Invalid action. Must be 'add' or 'remove'" });
    }
    
    // If action is remove but no watchlist exists, return error
    doesExist(account_id)
        .then(exists => {
            if (!exists) {
                if (action === 'remove') {
                    return res.status(404).json({ message: "Cannot remove from non-existent watchlist" });
                }
                // For add action, create a new list
                const list = [];
                list.push(stock);
                return createNewList(account_id, list, res);
            } else {
                // Watchlist exists, fetch its ID
                return fetchWatchlistId(account_id)
                    .then(watchlistId => {
                        console.log("watchlistId:", watchlistId);
                        if (watchlistId != null) {
                            // Fetch current watchlist contents
                            return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists/${watchlistId}`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
                                }
                            })
                                .then(data => data.json())
                                .then(data => { 
                                    console.log("data:", data);
                                    let list = data.assets; 
                                    
                                    // Create a new list of symbols for submission
                                    let symbolsList = [];
                                    
                                    // First, extract all existing symbols
                                    if (list && Array.isArray(list)) {
                                        symbolsList = list.map(item => item.symbol);
                                    }
                                    
                                    if (action === 'add') {
                                        // Check if stock already exists in the list
                                        if (!symbolsList.includes(stock)) {
                                            symbolsList.push(stock);
                                        } else {
                                            return res.status(200).json({ message: "Stock already in watchlist" });
                                        }
                                    } else if (action === 'remove') {
                                        // Filter out the stock to remove
                                        const originalLength = symbolsList.length;
                                        symbolsList = symbolsList.filter(symbol => symbol !== stock);
                                        
                                        // If no stock was removed, it wasn't in the list
                                        if (symbolsList.length === originalLength) {
                                            return res.status(404).json({ message: "Stock not found in watchlist" });
                                        }
                                    }
                                    
                                    // Update the watchlist with the new list of symbols
                                    return submitWatchlist(account_id, watchlistId, data.name, symbolsList, res);
                                })
                                .catch(err => {
                                    console.error("Error fetching watchlist:", err);
                                    return res.status(500).json("Error fetching watchlist");
                                });
                        } else {
                            return res.status(400).json("Try again");
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching watchlist ID:", err);
                        return res.status(500).json("Error fetching watchlist ID");
                    });
            }
        })
        .catch(err => {
            console.error("Error checking if watchlist exists:", err);
            return res.status(500).json("Error checking if watchlist exists");
        });
}

const submitWatchlist = (accountid, watchlistId, watchlistName, watchlist, res) => {
    return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${accountid}/watchlists/${watchlistId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        },
        body: JSON.stringify({
            name: watchlistName,
            symbols: watchlist
        })
    })
        .then(data => {
            if (data.status == 200) {
                res.status(200).json("success");
            } else {
                res.status(400).json("Try Again");
            }
        })
        .catch(err => {
            console.error("Error submitting watchlist:", err);
            res.status(500).json("Server Error");
        });
}