# The Bridge - how to open it locally

`index.html` fetches `data.json` from the same folder (browsers block fetch
across folders). The build script copies both into `dashboard/dist/`:

```bash
node scripts/build-dashboard.mjs
cd dashboard/dist && python3 -m http.server 8000
```

Then open http://localhost:8000/. In production, the Cloudflare Pages
project "dashboard" runs the same script as its build command, so
`dash.vantage-ars.co.za` is always serving the current `data/data.json`.