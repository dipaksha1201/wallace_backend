

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
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    })
        .then(data => data.json())
        .then(data => {
            if (data[0] !== undefined && data[0] !== null) {
                return (data[0].id)
            }
        }).catch(err => { console.log(err) })
}

export const doesExist = (account_id) => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    })
        .then(data => data.json())
        .then(data => {
            if (data[0] !== undefined) {
                return (true)
            }
        })
        .catch(err => { return (false) })
}

export const getWatchlist = (account_id, res) => {
    const watchListId = fetchWatchlistId(account_id);
    if (watchListId != undefined && watchListId.length > 0) {
        fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists/${watchlistID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
            }
        })
            .then(data => data.json())
            .then(data => res.staus(200).json({ assets: data.assets, id: watchListId }))
            .catch((err) => res.status(500).json("Internal Server Error"))
    } else {
        res.status(404).json("No Watchlists Found");
    }
}

// const updateWatchlist = (accountId, stock) => {
//     if (!exists(watchList)) {
//         return createNewList(stock);
//     }
//     else if (watchlist.size == 0 && !isFirst && watchlistId === "") {
//             fetchWatchlist();
//             alert("Please try adding the stock again")
//     } else if (watchlist.has(stock)) {
//         removeFromWatchlist(stock);
//     } else {
//         addToWatchlist(stock);
//     }
// }

// const exists = (watchlist) => {
//     if (watchlist.length > 0) {
//         fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists/${watchlist}`, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
//             }
//         })
//         .then(data => data.json())
//         .then(data => {
//             if (data.length > 0)
//                 return true;
//             else return false;
//         }).catch(err => )}
// }

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
                const watchListId = fetchWatchlistId(account_id);
                if (watchListId != undefined)
                    res.status(200).json("Succesfully added to watchlist", watchListId);
                else res.status(400).json("Invalid Request")
            }
        })
        .catch(err => res.status(500).json("Server Error"))
}

export const updateWatchlist = (stock, action, account_id, watchlistName, res) => {
    if (!doesExist(account_id)) {
        const list = [];
        list.push(stock);
        createNewList(account_id, list, res);
    } else {
        let list = [];
        const watchlistId = fetchWatchlistId(account_id);
        if (watchlistId != undefined && watchlistId.length > 0) {
            fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists/${watchlistID}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
                }
            })
                .then(data => data.json())
                .then(data => { list = data.assets; list.push(stock); return list; })
                .then(submitWatchlist(account_id, watchlistId, watchlistName, list, res))
        } else {
            res.status(400).json("Try again")
        }
    }
}

const submitWatchlist = (accountid, watchlistId, watchlistName, watchlist, res) => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${accountid}/watchlists/${watchlistId}`, {
        method: 'PUT',
        headers: {
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
        .catch(err => res.status(500).json("Server Error"))
}

// const fetchPrices = (assets) => {
//     let portfolioArray = [];
//     assets.forEach((value) => {
//         portfolioArray.push(value.symbol);
//     });
//     if (portfolioArray.length === 0) return;
//     let queryString = "";
//     portfolioArray.forEach((symbol) => {
//         queryString = queryString + symbol + ",";
//     });
//     const URL = "https://data.sandbox.alpaca.markets/v2/stocks/snapshots?symbols=" + queryString;
//     fetch(URL, {
//         method: 'GET',
//         headers: {
//             'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
//         }
//     }).then(data => data.json()).then(data => {
//         const stockData = {};
//         if (data !== undefined && data !== null && Object.entries(data).length > 0) {
//             Object.entries(data).forEach(([key, value]) => {
//                 const stock = { price: "", percentChange: "", dailyChange: "" };
//                 stock.price = value.latestTrade.p;
//                 stock.dailyChange = Number(parseFloat(value.latestTrade.p) - parseFloat(value.prevDailyBar.c)).toFixed(2);
//                 stock.percentChange = Number((parseFloat(value.latestTrade.p) - parseFloat(value.prevDailyBar.c)) / parseFloat(value.prevDailyBar.c) * 100).toFixed(2);
//                 stockData[key] = stock;
//             })
//         } return stockData;
//     }).then(stockData => setPortfolioState(stockData)).catch(err => console.log(err));
// }

// const removeFromWatchlist = (stock) => {
//     let updatedList = [];
//     for (const item of watchlistAssets) {
//         if (item.symbol !== stock) {
//             updatedList.push(item.symbol);
//         }
//     }
//     fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/watchlists/${watchlistID}`, {
//         method : 'PUT',
//         headers : {
//             'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
//         },
//         body : JSON.stringify({
//             name : "",
//             symbols : updatedList
//         })
//     })
//     .then(data => {
//         if (data.status == 200) {
//             getWatchlist();
//         }
//     })
//     .catch(err => console.log(err))
//     console.log("FD ",updatedList);
// }