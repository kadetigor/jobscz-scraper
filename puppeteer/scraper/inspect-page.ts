import puppeteer, { Browser, Page } from 'puppeteer';
import * as ph from './src/puppethelper';
import fs from 'fs';

const testUrl = 'https://www.jobs.cz/rpd/2000980048/';

(async () => {
    let browser: Browser | null = null;
    try {
        let opts = ph.BROWSER_OPTS;
        browser = await puppeteer.launch(opts);
        const page: Page = await browser.newPage();
        page.setDefaultTimeout(ph.PAGE_OPTS.DEFAULT_TIMEOUT);

        await page.goto(testUrl, { waitUntil: 'networkidle0' });
        await ph.timeout(1);

        const html = await page.content();
        fs.writeFileSync('page-structure.html', html);
        console.log('HTML saved to page-structure.html');

        // Try to find key elements
        // @ts-ignore - runs in browser context
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log('\nPage text (first 2000 chars):');
        console.log(pageText.substring(0, 2000));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();
