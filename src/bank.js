import { query, collection, getDocs, getDoc, where, doc } from "firebase/firestore";


export const getAchRelations = (accountId, res) => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${accountId}/ach_relationships`, {
        method: 'GET',
        headers: {
            Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
        },
    })
        .then(data => data.json())
        .then(data => res.status(200).json(data[0].id))
        .catch(err => res.status(400).json("Unable to fetch details"));
}

export const submitFunds = (req, res) => {
    console.log(req.amount, req.relationship, req.account_id);
    if (req.amount !== undefined && !isNaN(req.amount) && req.relationship !== undefined && req.account_id !== undefined) {
        fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${req.account_id}/transfers`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
            },
            body: JSON.stringify({
                "transfer_type": "ach",
                "relationship_id": req.relationship,
                "amount": req.amount,
                "direction": "INCOMING",
                "timming": "immediate"
            })
        }).then(data => {
            if (data.status === 200) res.status(200).json("Funds Succesfully Queued, please wait till the buying power updates.")
            else if (data.status === 422) res.status(422).json("Fund transfer already initiated. Please wait before initiating another transfer.")
            else res.status(500).json("Something went wrong, please try again later");
        }).catch(err => res.status(500).json("Something went wrong, please try again later"))
    } else {
        if (req.relationship === undefined) {
            res.status(500).json("Please add your bank details to begin funding your account");
        } else if (req.amount === undefined) {
            res.status(500).json("Please enter a valid amount");
        }
    }
}

export const createACH = (req, res) => {
    if (req.account_owner_name.length > 0 && req.bank_account_type.length > 0 && req.bank_account_number.length > 0 && req.bank_routing_number.length > 0 && req.nickname.length > 0) {
        fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${req.account_id}/ach_relationships`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`
            },
            body: JSON.stringify(req)
        })
            .then(data => { return data.json() })
            .then(data => {
                if (data !== null && data !== undefined) {
                    res.status(200).json("Bank Details succesfully added");
                }
            })
            .catch(err => res.status(401).json("Denied"));
    } else {
        res.status(500).json("Please fill all the fields");
    }
}

export const findBuyingPower = async (accountId, res) => {
    try {
        // Make the API call
        console.log("Account ID:", accountId);
        const response = await fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${accountId}/account`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
                'content-type': 'application/json'
            }
        });

        // Check if the response status is OK
        if (!response.ok) {
            const errorMessage = `Error: Received status ${response.status} from API.`;
            console.error(errorMessage);
            return res.status(500).json(errorMessage);
        }

        // Parse the JSON response
        const data = await response.json();

        // Validate the presence of buying power in the response
        if (!data.buying_power) {
            const errorMessage = "Error: 'buying_power' not found in the API response.";
            console.error(errorMessage, data);
            return res.status(500).json(errorMessage);
        }

        // Return the buying power
        return res.status(200).json({ buying_power: data.buying_power });
    } catch (error) {
        // Catch and log any other errors
        console.error("Error in findBuyingPower:", error.message);
        return res.status(500).json("Internal server error, please try again.");
    }
};

// function formatNumberWithCommas(inputString) {
//     // Parse the input string to a floating-point number
//     const floatValue = parseFloat(inputString);
//     // Check if the input is a valid number
//     if (isNaN(floatValue)) {
//         return 0;
//     }
//     // Convert the number to an integer and add commas for thousands separators
//     const formattedString = floatValue.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
//     return formattedString;
// }
// const fetchBankDetails = () => {
//     fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${account_id}/ach_relationships`, {
//         method: 'GET',
//         headers: {
//             'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
//             'content-type': 'application/json'
//         }
//     }).then(data => data.json()).then(data => setBankDetails(data)).catch(err => console.log(err));
// }
export const deleteBankDetails = (account_id, relationship, res) => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${account_id}/ach_relationships/${relationship}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
            'content-type': 'application/json'
        }
    })
        .then(data => {
            if (data.status === 204) res.status(200).json("Bank Details succesfully deleted");
            // setRelationship(null);
        }).catch(err => res.status(500).json("Please try again"));
}

const fetchTransfers = () => {
    fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${id.account_id}/transfers`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
            'content-type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log("Transactions", data);
        })
};
