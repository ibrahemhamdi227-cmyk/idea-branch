import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({limit:"2mb"}));
app.use(express.static("."));

const client = process.env.OPENAI_API_KEY ? new OpenAI({apiKey:process.env.OPENAI_API_KEY}) : null;
const model = process.env.OPENAI_MODEL || "gpt-6-luna";

app.post("/api/analyze", async (req,res)=>{
  if(!client) return res.status(503).json({error:"OPENAI_API_KEY is not configured"});
  const {orders, patterns} = req.body || {};
  if(!Array.isArray(orders)) return res.status(400).json({error:"orders must be an array"});
  const instructions=`You are an operations analytics assistant for a warehouse force-pick prototype. Analyze only the supplied order data. Do not invent inventory, robot availability, pod state, or locations. Do not issue robot commands. Respect floor separation: do not recommend grouping across floors. CPT urgency and customer-shipment status are important. Recommend grouping only when SKU, pod and floor match. Return concise JSON with keys summary, patterns, recommended_order_ids, grouping_opportunities, warnings.`;
  try{
    const response=await client.responses.create({model,input:[{role:"system",content:instructions},{role:"user",content:JSON.stringify({orders,patterns})}]});
    res.json({analysis:response.output_text});
  }catch(e){res.status(500).json({error:e.message});}
});

app.listen(process.env.PORT||3000,()=>console.log(`Force Pick Intelligence running on http://localhost:${process.env.PORT||3000}`));
