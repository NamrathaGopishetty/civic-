const axios = require('axios');

const USER_AGENT = 'civic-issue-app/1.0 (your-email@example.com)';

async function reverseGeocode(lat, lon) {
  const url = 'https://nominatim.openstreetmap.org/reverse';
  const resp = await axios.get(url, {
    params: { lat, lon, format: 'json', addressdetails: 1 },
    headers: { 'User-Agent': USER_AGENT }
  });
  return resp.data; // contains display_name and address object
}

module.exports = { reverseGeocode };
