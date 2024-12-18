import { getDoc, doc } from "firebase/firestore";
import { db } from './Firebase.js';

const getPositions = (account_id, res) => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/positions`, {
        headers: {
            Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data !== undefined && data !== null) {
                const portfolioAssets = [];
                let stocks = {};
                let portfolioVal = 0;
                for (const obj of data) {
                    portfolioVal += parseFloat(obj.market_value);
                    portfolioAssets.push(obj.symbol);
                    obj.symbol = obj.symbol.toUpperCase();
                    stocks[obj.symbol] = Number(parseFloat(obj.market_value) / parseFloat(portfolioVal) * 100).toFixed(2);
                }
                resizeBy.status(200).json({ stocks: stocks, portfolioVal: portfolioVal });
            } else {
                resizeBy.status(400).json("Something went wrong")
            }
        })
        .catch(err => res.status(500).json("Internal Server Error"));
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
            else res.statu(401).json("No Investments Found")
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
    const docSnap = await getDoc(doc(db, "fund", email));
    if (docSnap.exists()) {
        res.status(200).json(docSnap.data().weights);
    } else {
        return res.status(401).json("Doesn't exist");
    }
}

// const submitInvestment = (e) => {
//     e.preventDefault();
//     const orderValue = investmentAmount;
//     if (!isNaN(orderValue) && orderValue >= 100) {
//         let weights = new Map();
//         //Find Portfolio -> Calculate stock difference -> Place Buy/Sell Orders
//         //Calculate stock difference -> (i) Delta (previous - current)  (ii) If I need to rebalance based on Current weights --> Consider how much I will need to sell everytime 
//         fetchPortfolio()
//             .then((portfolio) => {
//                 if (portfolio.length > 0) {
//                     portfolio.map((stock) => { return weights.set(stock.symbol, Number(parseFloat(stock.percent)).toFixed(2)) });
//                 }
//             })
//             .then(() => findDelta(weights, orderValue))
//             .then(output => placeOrders(output))
//             .catch(err => console.log(err));
//     } else {
//         alert("Please enter an amount greater than 100")
//     }
//     setIsModalOpen(false);
// }

// async function executeOrders(sellOrders, buyOrders) {
//     const sellResponses = [];
//     const buyResponses = [];
//     if (sellOrders.length > 0) {
//         for (const order of sellOrders) {
//             let resp;
//             fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/orders`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
//                 },
//                 body: JSON.stringify(order)
//             })
//                 .then(data => data.json())
//                 .then(data => { resp = data; })
//                 .catch(err => console.log(err));
//             sellResponses.push(resp);
//         }
//     }
//     if (buyOrders.length > 0) {
//         for (const order of buyOrders) {
//             let resp;
//             fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/orders`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
//                 },
//                 body: JSON.stringify(order)
//             })
//                 .then(data => data.json())
//                 .then(data => { resp = data; })
//                 .catch(err => console.log(err));
//             buyResponses.push(resp);
//         }
//     }
// }
// async function placeOrders(orderObject) {
//     let sellOrders = [];
//     let buyOrders = [];
//     let currentPositions = new Map();
//     if (orderObject !== undefined && orderObject !== null) {
//         fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/positions`, {
//             headers: {
//                 Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
//             }
//         })
//             .then(data => data.json())
//             .then(data => {
//                 for (const stock of data) {
//                     currentPositions.set(stock.symbol, parseFloat(stock.qty));
//                 }
//                 return (currentPositions);
//             })
//             .then((currentPositions) => {
//                 for (const stock of orderObject.toSell) {
//                     const order = {
//                         symbol: stock,
//                         qty: currentPositions.get(stock),
//                         side: "sell",
//                         type: "market",
//                         time_in_force: "day"
//                     }
//                     sellOrders.push(order);
//                 }
//                 for (const key in orderObject.toBuy) {
//                     const order = {
//                         symbol: key,
//                         notional: orderObject.toBuy[key],
//                         side: "buy",
//                         type: "market",
//                         time_in_force: "day"
//                     }
//                     buyOrders.push(order);
//                 }
//                 for (let [key, value] of orderObject.increasePosition) {
//                     let order = {
//                         symbol: key,
//                         notional: value,
//                         side: "buy",
//                         type: "market",
//                         time_in_force: "day"
//                     }
//                     buyOrders.push(order);
//                 }
//                 for (let [key, value] of orderObject.decreasedPosition) {
//                     let order = {
//                         symbol: key,
//                         notional: value,
//                         side: "sell",
//                         type: "market",
//                         time_in_force: "day"
//                     }
//                     sellOrders.push(order);
//                 }
//             })
//             .then(() => executeOrders(sellOrders, buyOrders))
//             .catch(err => console.log(err));
//     }
// }
// const getStats = () => {
//     let capStructure = [0, 0, 0, 0, 0];
//     let industryStructure = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//     let finalStructure = [];
//     let finalIndustry = [];
//     fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/positions`, {
//         headers: {
//             Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
//         }
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data !== null && data !== undefined && data.length > 0) {
//                 for (const obj of data) {
//                     let stock = obj.symbol;
//                     let cap = StockDetails[stock];
//                     if (cap !== undefined && cap[0] === 'xl') {
//                         capStructure[0] = Number(Number(capStructure[0]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[0] === 'l') {
//                         capStructure[1] = Number(Number(capStructure[1]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[0] === 'm') {
//                         capStructure[2] = Number(Number(capStructure[2]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[0] === 's') {
//                         capStructure[3] = Number(Number(capStructure[3]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[0] === 'xs') {
//                         capStructure[4] = Number(Number(capStructure[4]) + parseFloat(obj.market_value));
//                     }
//                     if (cap !== undefined && cap[1] === 'Technology') {
//                         industryStructure[0] = Number(Number(industryStructure[0]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Automotive') {
//                         industryStructure[1] = Number(Number(industryStructure[1]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Insurance') {
//                         industryStructure[2] = Number(Number(industryStructure[2]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Banking/Finance') {
//                         industryStructure[3] = Number(Number(industryStructure[3]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Retail') {
//                         industryStructure[4] = Number(Number(industryStructure[4]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Pharma') {
//                         industryStructure[5] = Number(Number(industryStructure[5]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Telecom') {
//                         industryStructure[6] = Number(Number(industryStructure[6]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Cap goods') {
//                         industryStructure[7] = Number(Number(industryStructure[7]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Consulting') {
//                         industryStructure[8] = Number(Number(industryStructure[8]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Logistics') {
//                         industryStructure[9] = Number(Number(industryStructure[9]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Railroad') {
//                         industryStructure[10] = Number(Number(industryStructure[10]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Energy') {
//                         industryStructure[11] = Number(Number(industryStructure[11]) + parseFloat(obj.market_value));
//                     } else if (cap !== undefined && cap[1] === 'Chemical') {
//                         industryStructure[12] = Number(Number(industryStructure[12]) + parseFloat(obj.market_value));
//                     }
//                 }
//             }
//             for (let i = 0; i < capStructure.length; i++) {
//                 const cap = {};
//                 cap.value = capStructure[i];
//                 if (i === 0) {
//                     cap.label = 'Mega Cap';
//                 } else if (i === 1) {
//                     cap.label = 'Large Cap';
//                 } else if (i === 2) {
//                     cap.label = 'Mid Cap';
//                 } else if (i === 3) {
//                     cap.label = 'Small Cap';
//                 } else if (i === 4) {
//                     cap.label = 'Micro Cap';
//                 }
//                 finalStructure.push(cap);
//             }
//             for (let i = 0; i < 12; i++) {
//                 const ind = {};
//                 ind.value = industryStructure[i];
//                 if (i === 0) {
//                     ind.label = 'Technology';
//                 } else if (i === 1) {
//                     ind.label = 'Automotive';
//                 } else if (i === 2) {
//                     ind.label = 'Insurance';
//                 } else if (i === 3) {
//                     ind.label = 'Banking/Finance';
//                 } else if (i === 4) {
//                     ind.label = 'Retail';
//                 } else if (i === 5) {
//                     ind.label = 'Pharma';
//                 } else if (i === 6) {
//                     ind.label = 'Telecom';
//                 } else if (i === 7) {
//                     ind.label = 'Cap goods';
//                 } else if (i === 8) {
//                     ind.label = 'Consulting';
//                 } else if (i === 9) {
//                     ind.label = 'Logistics';
//                 } else if (i === 10) {
//                     ind.label = 'Railroad';
//                 } else if (i === 11) {
//                     ind.label = 'Energy';
//                 } else if (i === 12) {
//                     ind.label = 'Chemical';
//                 }
//                 finalIndustry.push(ind);
//             }
//             setIndustry(finalIndustry);
//             setMCap(finalStructure);
//         }).catch(err => console.log(err));
// }
// const findInvestmentAmount = () => {
//     if (assets !== 0 && equity !== 0) return equity;
//     else return 0;
// }
// const findReturns = () => {
//     if (isNaN(Number((((netCash - equityVal) / equityVal) * 100).toFixed(2)))) return 0;
//     else return Number((((netCash - equityVal) / equityVal) * 100).toFixed(2));
// }
// const indyfundCreated = () => {
//     findPortfolio().then(data => (data !== undefined && data.length > 0) ? setPortfolioCreated(true) : setPortfolioCreated(false));
// }
// const findBuyingPower = () => {
//     fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/account`, {
//         method: 'GET',
//         headers: {
//             'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
//             'content-type': 'application/json'
//         }
//     })
//         .then(data => data.json())
//         .then(data => setBuyingPower(data.buying_power))
//         .catch(err => console.log(err));
// }