# CanteenLive - Review 2 prototype

Real-time canteen queue tracker. **MongoDB** stores permanent data (stalls, menus, users, queue history).
**Redis** stores the live queue (counters, sets, Pub/Sub). **Socket.IO** pushes changes to browsers.

```
server/   Node.js + Express API, MongoDB + Redis logic
client/   React (Vite) web app
CanteenLive.postman_collection.json   import into Postman
```

## Run it
```bash
# 1) server
cd server
cp .env.example .env        # then fill MONGO_URI, REDIS_URL, JWT_SECRET
npm install
npm run seed                # stalls, users, ~12k simulated queue events
npm run indexes             # creates all MongoDB indexes
npm run dev                 # API on http://localhost:5000

# 2) client (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # app on http://localhost:5173
```
Demo logins (password `canteen123`): student `23BCE0314`, staff `STAFF001`..`STAFF005`, admin `ADMIN001`.

## Useful scripts (server/)
| Command | What it does |
|---|---|
| `npm run seed` | resets stalls + users, regenerates simulated history |
| `npm run indexes` | creates the indexes |
| `npm run explain` | shows scan vs index (explain) for two queries |
| `npm run aggs` | prints the five aggregation results in the terminal |
| `npm run reset-redis` | sets all live queues back to zero (run before a demo) |
