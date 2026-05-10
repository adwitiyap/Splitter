const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let cachedRates = null;
let lastFetch = 0;

async function getRates() {
  const now = Date.now();
  if (cachedRates && (now - lastFetch < 3600000)) return cachedRates;

  const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
  const data = await res.json();

  cachedRates = data.rates;
  lastFetch = now;
  return cachedRates;
}

app.post("/calculate", async (req, res) => {
  const expenses = req.body;
  const rates = await getRates();

  let totals = {};
  let people = new Set();

  for (let e of expenses) {
    if (!e.name || !e.amount || !e.currency) continue;

    let usd = e.currency === "USD" ? e.amount : e.amount / rates[e.currency];

    totals[e.name] = (totals[e.name] || 0) + usd;
    people.add(e.name);
  }

  let total = Object.values(totals).reduce((a,b)=>a+b,0);
  let share = total / people.size;

  let balances = {};
  for (let p of people) balances[p] = totals[p] - share;

  let creditors = [], debtors = [];
  for (let p in balances) {
    if (balances[p] > 0) creditors.push([p, balances[p]]);
    else debtors.push([p, -balances[p]]);
  }

  let transactions = [];
  while (creditors.length && debtors.length) {
    let [c, cAmt] = creditors[0];
    let [d, dAmt] = debtors[0];
    let amt = Math.min(cAmt, dAmt);

    transactions.push({ from: d, to: c, amount: amt.toFixed(2) });

    creditors[0][1] -= amt;
    debtors[0][1] -= amt;

    if (creditors[0][1] < 0.01) creditors.shift();
    if (debtors[0][1] < 0.01) debtors.shift();
  }

  res.json({ balances, transactions });
});

app.listen(process.env.PORT || 3000);
