const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const m = env.match(/OIKOLAB_API_KEY="([^"]+)"/);
if (m) {
  const key = m[1];
  fetch(`https://api.oikolab.com/weather?lat=59.3293&lon=18.0686&param=temperature&param=wind_speed&param=total_cloud_cover&start=2024-04-14&end=2024-04-16`, { headers: { "api-key": key } })
    .then(r => r.json())
    .then(t => { const d = JSON.parse(t.data); console.log("Cols:", d.columns); console.log("Index:", d.index.slice(0,3)); console.log("Data0:", d.data[0]); })
    .catch(console.error);
} else {
  console.log("No key");
}
