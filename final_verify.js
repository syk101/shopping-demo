const http = require('http');

async function check(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            resolve(res.statusCode);
        }).on('error', (e) => {
            resolve(e.message);
        });
    });
}

async function run() {
    console.log('Final Verification...');

    const shopStatus = await check('http://localhost:5000/shop');
    console.log(`- GET /shop: ${shopStatus}`);

    const apiStatus = await check('http://localhost:5000/api/products');
    console.log(`- GET /api/products: ${apiStatus}`);

    if (shopStatus === 200 && apiStatus === 200) {
        console.log('SUCCESS: Connection and Routing are working!');
    } else {
        console.log('FAILURE: Issues detected.');
    }
}

run();
