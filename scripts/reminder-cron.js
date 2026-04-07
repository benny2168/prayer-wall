/**
 * Minimalist background cron job for intercession reminders.
 * This script hits the internal API endpoint every 10 minutes.
 */
const http = require('http');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.CRON_SECRET;
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

console.log('[Cron Worker] Initializing automated reminder engine...');

function triggerReminders() {
  const url = `http://localhost:${PORT}/api/cron/reminders?secret=${SECRET}`;
  
  console.log(`[Cron Worker] Triggering reminders at ${new Date().toISOString()}...`);
  
  http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(data);
          console.log(`[Cron Worker] Success: Sent ${json.sent || 0} reminders.`);
        } catch (e) {
          console.log(`[Cron Worker] Response received, but could not parse JSON: ${data.substring(0, 50)}`);
        }
      } else {
        console.error(`[Cron Worker] Failed with status ${res.statusCode}: ${data}`);
      }
    });
  }).on('error', (err) => {
    console.error(`[Cron Worker] Connection error: ${err.message}`);
  });
}

// Initial delay to let the Next.js server start up (30 seconds)
setTimeout(() => {
  triggerReminders();
  setInterval(triggerReminders, INTERVAL_MS);
}, 30000);
