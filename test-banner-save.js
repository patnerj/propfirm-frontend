const fs = require('fs');

async function test() {
  const key = fs.readFileSync('./test_api_key.txt', 'utf8').trim();
  const bannerPayload = {
    title: 'QA Automated Test Banner 2026',
    placement: 'top',
    coupon_code: 'QASUITE20',
    cta_text: 'Claim 20% Off',
    cta_link: '/pricing',
    is_active: 1
  };

  const res = await fetch('http://propfirm.local/wp-json/fxsim/v1/admin/banners/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-FXSIM-Key': key
    },
    body: JSON.stringify(bannerPayload)
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

test();
