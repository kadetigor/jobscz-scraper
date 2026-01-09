import { scrapeJobDetail } from './detail-scraper';

const testUrl = 'https://www.jobs.cz/rpd/2000980048/';

(async () => {
    try {
        console.log('Testing job detail scraper...');
        const result = await scrapeJobDetail(testUrl);
        console.log('\nResult:');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
})();
