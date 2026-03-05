const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err));
        await page.goto('http://localhost:5000/products.html?category=casual&collection=mens', { waitUntil: 'networkidle2' });
        const gridHtml = await page.$eval('.products-grid-modern', el => el.innerHTML).catch(e => e.message);
        console.log('Grid HTML Length:', gridHtml.length);
        const resultsCountStr = await page.$eval('#results-count-number', el => el.textContent).catch(e => e.message);
        console.log('Results Count:', resultsCountStr);
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
