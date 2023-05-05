const fs = require('fs');
const https = require('https');
const querystring = require('querystring');

let catalog = process.env.INPUT_CATALOG_URL;
let result = {}
// If you've specified a JSON file with all the data, let's use that.
if (process.env.INPUT_RESULT) {
  console.log(`Reading ${process.env.INPUT_RESULT}`)
  result = JSON.parse(fs.readFileSync(process.env.INPUT_RESULT, 'utf8'));
} else {
  // Otherwise, let's use the individual inputs.
  console.log(`Using individual inputs.`)
  result = {
    "name": process.env.INPUT_NAME,
    "start": process.env.INPUT_START,
    "end": process.env.INPUT_END,
    "type": process.env.INPUT_TYPE,
    "description": process.env.INPUT_DESCRIPTION,
    "external_id": process.env.INPUT_EXTERNAL_ID,
    "source": process.env.INPUT_SOURCE,
    "url": process.env.INPUT_URL,
    "active": process.env.INPUT_ACTIVE || true,
  }
}

let body = querystring.stringify(result);
let parsedURL = new URL(catalog);
const options = {
  hostname: parsedURL.host,
  path: '/api/events/',
  headers: {
    'Authorization': `token ${process.env.SERVICE_CATALOG_TOKEN}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': body.length,
    'User-Agent': 'actions/health-check-result'
  },
  method: 'POST'
}

const req = https.request(options, (res) => {
  res.on('data', (data) => {
    console.log(`Got a response ${res.statusCode} from the server.`)
    if (res.statusCode != 201) {
      let parsed = JSON.parse(data);
      console.log(`Error: ${parsed.message} ${data}`);
      process.exit(1);
    } else {
      console.log('Posted successfully.');
      process.exit(0);
    }
  })
})

req.write(body);

req.on('error', (error) => {
  console.log(`HTTP Error: ${error}`)
  process.exit(1)
})

req.end();