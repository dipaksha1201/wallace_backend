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
import swaggerJsdoc from "swagger-jsdoc";

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
    await submitForm(form, res);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Da
app.post("/performance", (req, res) => {
  portfolio.fetchFundPerformance(req.accountId, req.period, req.timeFrame);
})

// Bank Settings & Fund Transfer
app.get("/getBankRelations", (req, res) => {
  const accountId = req.account;
  getAchRelations(accountId, res);
})

app.get("/findBuyingPower", (req, res) => {
  const accountId = req.query.account;
  findBuyingPower(accountId, res);
})

app.post("/submitFunds", (req, res) => {
  submitFunds(req, res);
})

app.post("/createACH", (req, res) => {
  createACH(req, res);
})

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
  const account_id = req.params.accountId;
  if (!account_id) res.status(400).json("Invalid Request");
  getWatchlist(account_id, res);
})

app.put("/updateWatchlist", (req, res) => {
  const stock = req.stock;
  const action = req.action;
  const account_id = req.acount_id;
  const watchlistName = req.watchlistName;
  if (!stock || !action || !account_id)
    res.status(400).json("Invalid Request");
  updateWatchlist(stock, action, account_id, watchlistName, res);
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export const api = https.onRequest(app);
