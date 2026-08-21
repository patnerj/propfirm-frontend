const fs = require('fs');

async function test() {
  const key = fs.readFileSync('./test_api_key.txt', 'utf8').trim();
  console.log('Using Key:', key);

  const url = `http://propfirm.local/wp-json/fxsim/v1/admin/risk/alerts?fxsim_key=${key}`;
  const res = await fetch(url, {
    headers: {
      'X-FXSIM-Key': key,
      'Authorization': `Bearer ${key}`
    }
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

test();
