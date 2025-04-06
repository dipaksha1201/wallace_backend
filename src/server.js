import { https } from "firebase-functions/v2";
import { handleSignIn, handleSignUp, submitForm } from './gLogin.js';  // Default import
import { createACH, getAchRelations, submitFunds, findBuyingPower, deleteBankDetails } from './bank.js';
import { db } from './Firebase.js';
import portfolio from './portfolio.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './swagger.js';

import express from 'express';
import cors from 'cors';
import { getWatchlist, updateWatchlist } from './watchlists.js';
import { getPositions, getEquityVal, fetchReturns, fetchPortfolio, fetchCompanyOverview } from './indyfund.js';
import { handleStockSearch } from './stockSearch.js';
import { placePortfolioOrders, fetchStockPrices } from './transaction.js';
import { updateWeights } from './rebalance.js';
import { fetchAllDefaultPackages } from './prebuiltPackages.js';

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json()); // Built-in middleware to parse JSON bodies
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Serve Swagger UI on /api-docs route
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /healthcheck:
 *   get:
 *     summary: Gets App Health
 *     description: Checks if App server is active 
 *     responses:
 *       200:
 *         description: App health OK
 *         content:
 *           application/json:
 *             schema:
 *               type: NA
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The user ID.
 *                     example: 1
 *                   name:
 *                     type: string
 *                     description: The user's name.
 *                     example: John Doe
 */
app.get("/healthcheck", (req, res) => {
  //   const { name } = req.body; // Access the parsed JSON object
  res.status(201).json({ message: `Hello!` });
});

/**
 * @swagger
 * /Login:
 *   post:
 *     summary: Login to Build Your Indyfund
 *     description: Takes in userId, Password, and optional parameters, and returns a token with account_id
 *     parameters:
 *       - in: query
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Username / EmailId for the user.
 *         example: "user@gmail.com"
 *       - in: query
 *         name: password
 *         required: true
 *         schema:
 *           type: string
 *         description: Password.
 *         example: "admin"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: BYI username or email ID.
 *                 example: "p@gmail.com"
 *               password:
 *                 type: string
 *                 description: User-selected password.
 *                 example: "JohnDoe123"
 *     responses:
 *       200:
 *         description: Success
 *       206:
 *         description: Proceed to onboarding
 *       400:
 *         description: Username/Password not valid
 *       403:
 *         description: Username/Password combination incorrect
 *       500:
 *         description: Server Error
 */
app.post("/login", async (req, res) => {
  //   const { name } = req.body; // Access the parsed JSON object
  const user = req.body.user;
  const pwd = req.body.pwd;
  if (!user || !pwd || user.length === 0 || pwd.length === 0) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  try {
    await handleSignIn(user, pwd, res);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/register", async (req, res) => {
  //   const { name } = req.body; // Access the parsed JSON object
  const user = req.body.user;
  const pwd = req.body.pwd;
  if (!user || !pwd || user.length === 0 || pwd.length === 0) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  try {
    await handleSignUp(user, pwd, res);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/onboard", async (req, res) => {
  const form = req.body.form;
  try {
    await submitForm(req.body, res);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Da
app.post("/performance", async (req, res) => {
  try {
    // Extract parameters from the request body
    const { accountId, period, timeFrame } = req.body;
    console.log("accountId", accountId)
    console.log("period", period)
    console.log("timeFrame", timeFrame)

    // Validate the required parameters
    if (!accountId || !period || !timeFrame) {
      return res.status(400).json({ message: "Missing required parameters: accountId, period, or timeFrame." });
    }

    // Ensure `fetchFundPerformance` exists in the imported portfolio module
    if (!portfolio.fetchFundPerformance || typeof portfolio.fetchFundPerformance !== "function") {
      throw new Error("fetchFundPerformance is not a valid function in the portfolio module.");
    }
    // Call the function and properly handle the returned promise
    portfolio.fetchFundPerformance(accountId, period, timeFrame)
      .then(result => {
        console.log("Result:", result);
        res.status(200).json(result);
      })
      .catch(error => {
        console.error("Error fetching performance data:", error);
        throw error; // This will be caught by the outer try/catch
      });
  } catch (error) {
    console.error("Error in /performance endpoint:", error.message);

    // Handle specific errors or fallback to a generic internal server error
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Bank Settings & Fund Transfer
// Your route
app.get("/getBankRelations", (req, res) => {
  // 1) Make sure you're reading from req.query
  const accountId = req.query.account;
  // 2) Debug print to confirm it's defined
  console.log("accountId:", accountId);

  // If it's missing or empty, handle error:
  if (!accountId) {
    return res.status(400).send("No account provided");
  }

  // 3) Pass to your function
  getAchRelations(accountId, res);
});

app.get("/findBuyingPower", (req, res) => {
  const accountId = req.query.account;
  findBuyingPower(accountId, res);
})

app.post("/createACH", (req, res) => {
  createACH(req.body, res);
})

app.post("/submitFunds", (req, res) => {
  console.log("submitFunds");
  console.log(req.body);
  submitFunds(req.body, res);
});

app.delete("/removeBank", (req, res) => {
  const account_id = req.account_id;
  const relationship = req.relationship;
  if (account_id != undefined && relationship != undefined && account_id != "" && relationship != "") {
    deleteBankDetails(account_id, relationship, res);
  } else {
    res.status(403).json("Unauthorized")
  }
})

// Watchlist APIs
app.get("/getWatchlist", (req, res) => {
  const account_id = req.query.accountId;
  console.log("accountId:", account_id);
  if (!account_id) res.status(400).json("Invalid Request");
  getWatchlist(account_id, res);
})

app.put("/updateWatchlist", (req, res) => {
  const stock = req.body.stock;
  const action = req.body.action || 'add';
  const account_id = req.body.account_id;
  console.log("stock:", stock);
  console.log("action:", action);
  console.log("account_id:", account_id);
  if (!stock || !account_id) {
    return res.status(400).json({ message: "Stock and account_id are required" });
  }
  
  updateWatchlist(account_id, stock, res, action);
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export const api = https.onRequest(app);

/**
 * @swagger
 * /positions:
 *   get:
 *     summary: Get account positions
 *     description: Retrieves all positions for the specified account
 *     parameters:
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alpaca account ID
 *     responses:
 *       200:
 *         description: Positions retrieved successfully
 *       400:
 *         description: Something went wrong
 *       500:
 *         description: Internal Server Error
 */
app.get("/positions", (req, res) => {
  const account_id = req.query.account_id;
  if (!account_id) {
    return res.status(400).json({ message: "Account ID is required" });
  }
  getPositions(account_id, res);
});

/**
 * @swagger
 * /equity:
 *   get:
 *     summary: Get account equity value
 *     description: Retrieves the equity value for the specified account
 *     parameters:
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alpaca account ID
 *     responses:
 *       200:
 *         description: Equity value retrieved successfully
 *       401:
 *         description: No Investments Found
 *       500:
 *         description: Internal Server Error
 */
app.get("/equity", (req, res) => {
  const account_id = req.query.account_id;
  if (!account_id) {
    return res.status(400).json({ message: "Account ID is required" });
  }
  getEquityVal(account_id, res);
});

/**
 * @swagger
 * /returns:
 *   get:
 *     summary: Get account returns
 *     description: Retrieves the returns for the specified account
 *     parameters:
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alpaca account ID
 *     responses:
 *       200:
 *         description: Returns retrieved successfully
 *       500:
 *         description: Server Error
 */
app.get("/returns", (req, res) => {
  const account_id = req.query.account_id;
  if (!account_id) {
    return res.status(400).json({ message: "Account ID is required" });
  }
  fetchReturns(account_id, res);
});

/**
 * @swagger
 * /portfolio:
 *   get:
 *     summary: Get user portfolio
 *     description: Retrieves the portfolio for the specified email
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User email
 *     responses:
 *       200:
 *         description: Portfolio retrieved successfully
 *       401:
 *         description: Portfolio doesn't exist
 */
app.get("/portfolio", (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  fetchPortfolio(email, res);
});

/**
 * @swagger
 * /search/stock:
 *   get:
 *     summary: Search for stocks
 *     description: Retrieves a list of stocks matching the search query
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: List of stocks retrieved successfully
 *       400:
 *         description: Search query is required
 */
app.get("/search/stock", (req, res) => {
  const query = req.query.query;
  const limit = parseInt(req.query.limit) || 5;
  console.log("query:", query);
  console.log("limit:", limit);
  
  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }
  
  handleStockSearch(query, limit, res);
});

app.get("/overview/stock", (req, res) => {
    const symbol = req.query.symbol;
    if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
    }
    fetchCompanyOverview(symbol, res);
});

/**
 * @swagger
 * /portfolio/orders:
 *   post:
 *     summary: Place multiple orders based on portfolio weights
 *     description: Places buy orders for multiple stocks based on portfolio weights
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_id:
 *                 type: string
 *                 description: Alpaca account ID
 *               amount:
 *                 type: string
 *                 description: Total amount to invest
 *               portfolioItems:
 *                 type: array
 *                 description: Portfolio items with percentage allocations
 *     responses:
 *       200:
 *         description: Orders placed successfully
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Failed to place orders
 */
app.post("/portfolio/orders", (req, res) => {
  placePortfolioOrders(req.body, res);
});

app.post("/portfolio/weights", (req, res) => {
  const { email, weights } = req.body;
  updateWeights(email, weights, res);
});

app.post("/stocks/prices", (req, res) => {
  const { symbols } = req.body.symbols;
  console.log("Request body:", req.body.symbols);
  fetchStockPrices(req.body.symbols, res);
});

/**
 * @swagger
 * /defaultpackages:
 *   get:
 *     summary: Get all default packages
 *     description: Retrieves all default packages including top sectors and prebuilt portfolios
 *     responses:
 *       200:
 *         description: Default packages retrieved successfully
 *       500:
 *         description: Server Error
 */
app.get("/defaultpackages", (req, res) => {
  fetchAllDefaultPackages()
    .then(packages => {
      res.status(200).json(packages);
    })
    .catch(error => {
      console.error("Error fetching default packages:", error);
      res.status(500).json({ message: "Failed to fetch default packages", error: error.message });
    });
});

