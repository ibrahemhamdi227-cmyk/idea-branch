# Force Pick Intelligence

A standalone companion prototype for the PickFlow force-pick system. It reads an order list, detects demand patterns, groups compatible orders, applies deterministic priority rules, and produces a force-pick queue.

## What it does
- CSV order upload
- Demo data
- CPT urgency scoring
- Customer-shipment prioritisation
- Same SKU + pod + floor grouping
- Floor-aware grouping guardrail
- Force-pick queue generation
- JSON queue export
- Optional OpenAI Responses API analysis through a server-side endpoint

## Important production boundary
This prototype does **not** directly control robots or call production systems. The queue is an output for an authorised Force Pick workflow. In production, connect the data adapters to approved internal interfaces and keep floor/permission/robot eligibility checks deterministic.

## Run locally
1. Install Node.js.
2. Run `npm install`.
3. Optional: copy `.env.example` to `.env` and add an approved OpenAI API key/model.
4. Run `npm start`.
5. Open `http://localhost:3000`.

The browser UI works in simulation mode without an API key. The optional AI endpoint is `/api/analyze`.

## Production integration plan
Order source -> normalisation -> deterministic guardrails -> pattern engine -> optional AI explanation/ranking -> authorised Force Pick queue -> existing drive system.

Never put an API key in browser JavaScript or GitHub Pages. Use a protected backend and the organisation's approved authentication/network controls.
