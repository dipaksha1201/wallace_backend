const getPortfolio = () => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/positions`, {
        headers: {
            Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
        }
    }).then(data => data.json()).then(data => setPortfolio(data)).catch(err => console.log(err));
}

const fetchFundPerformance = (account_id, period, timeFrame) => {
    return fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${account_id}/account/portfolio/history?period=${period}&timeframe=${timeFrame}`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        }
    }).then(data => data.json())
        .then(data => {
            console.log(data);
            const dateArray = data.timestamp;
            // console.log("dateArray: ", dateArray);
            const dateObjects = dateArray.map((timestamp) => {
                const date = new Date(timestamp * 1000);
                let formattedDate;
                switch (timeFrame) {
                    case '15Min':
                        formattedDate = new Intl.DateTimeFormat('en-US', {
                            hour: 'numeric', minute: 'numeric', hour12: true
                        }).format(date);
                        break;
                    case '1H':
                        formattedDate = new Intl.DateTimeFormat('en-US', {
                            day: 'numeric', month: 'short'
                        }).format(date);
                        break;
                    case '1D':
                        formattedDate = new Intl.DateTimeFormat('en-US', {
                            day: 'numeric', month: 'short'
                        }).format(date);
                        break;
                    case '1W':
                        formattedDate = new Intl.DateTimeFormat('en-US', {
                            month: 'short', year: 'numeric'
                        }).format(date);
                        break;
                }
                return formattedDate;

            });
            const x = dateObjects;
            const y = data.equity;
            const newPerformance = { xData: x, yData: y , performance: data.profit_loss_pct };
            return newPerformance;
        }).catch(err => {
            console.error('Error in fetchFundPerformance:', err);
            throw err; // Re-throw to allow handling in the calling function
        });
}

export default { getPortfolio, fetchFundPerformance };
