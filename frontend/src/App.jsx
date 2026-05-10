import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [result, setResult] = useState(null);

  const addRow = () => setExpenses([...expenses, { name: "", amount: "", currency: "USD" }]);

  const update = (i, key, value) => {
    const copy = [...expenses];
    copy[i][key] = value;
    setExpenses(copy);
  };

  const calculate = async () => {
    const res = await fetch(API + "/calculate", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(expenses)
    });
    setResult(await res.json());
  };

  return (
<div style={{ padding: 20 }}>
<h2>Trip Expense Splitter</h2>

{expenses.map((e,i)=>(
<div key={i} style={{ marginBottom: 10 }}>
<input
placeholder="Name"
onChange={v=>update(i,"name",v.target.value)}
/>

<input
type="number"
placeholder="Amount"
onChange={v=>update(i,"amount",v.target.value)}
/>

<select
onChange={v=>update(i,"currency",v.target.value)}
>
<option>USD</option>
<option>EUR</option>
<option>INR</option>
<option>CAD</option>
</select>
</div>
))}

<button onClick={addRow}>Add Expense</button>
<button onClick={calculate}>Calculate</button>

{result && (
<div style={{ marginTop: 20 }}>
<h3>Settlement</h3>

{result.transactions?.length > 0 ? (
result.transactions.map((t,i)=>(
<p key={i}>
{t.from} pays {t.to}: ${t.amount}
</p>
))
) : (
<p>No transactions found</p>
)}

<pre>
{JSON.stringify(result, null, 2)}
</pre>
</div>
)}
</div>
);
}
