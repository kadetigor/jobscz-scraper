import puppeteer, { Browser, Page } from 'puppeteer';
import chalk from 'chalk';

const DEBUG = true;

export interface JobDetail {
    url: string;
    title?: string;
    company?: string;
    location?: string;
    salary?: string;
    description?: string;
    benefits?: string[];
    fullText?: string;
    applicationUrl?: string;
}

function sanitizeString(str: string | undefined): string | undefined {
    if (!str) return str;
    return str
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Try to use system Chrome on macOS, otherwise let Puppeteer use its bundled browser
const getBrowserOptions = () => {
    const options: any = {
        headless: true,
        protocolTimeout: 180000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions'
        ]
    };

    // Only set executablePath on macOS, let Puppeteer use bundled Chrome on Linux
    if (process.platform === 'darwin') {
        options.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }

    return options;
};

const BROWSER_OPTS = getBrowserOptions();

const DEFAULT_TIMEOUT = 60000;

function timeout(s: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

export async function scrapeJobDetail(url: string): Promise<JobDetail> {
    if (DEBUG) {
        console.log(chalk.bold('Scraping job detail: ') + chalk.gray(url));
    }

    let browser: Browser | null = null;

    try {
        browser = await puppeteer.launch(BROWSER_OPTS);
        const page: Page = await browser.newPage();
        page.setDefaultTimeout(DEFAULT_TIMEOUT);

        await page.goto(url, { waitUntil: 'networkidle0' });
        await timeout(1);

        const jobDetail: JobDetail = { url };

        // Extract job title from h1
        try {
            const titleElement = await page.$('.JobDescriptionHeading h1, h1');
            if (titleElement) {
                const title = await page.evaluate(el => el?.textContent?.trim() || '', titleElement);
                jobDetail.title = sanitizeString(title);
            }
        } catch (e) {
            if (DEBUG) console.log(chalk.yellow('Could not extract title'));
        }

        // Extract company name from IconWithText
        try {
            const companyElement = await page.$('.IconWithText p.typography-body-medium-text-regular');
            if (companyElement) {
                const company = await page.evaluate(el => el?.textContent?.trim() || '', companyElement);
                jobDetail.company = sanitizeString(company);
            }
        } catch (e) {
            if (DEBUG) console.log(chalk.yellow('Could not extract company'));
        }

        // Extract location from link
        try {
            const locationElement = await page.$('a[data-test="jd-info-location"]');
            if (locationElement) {
                const location = await page.evaluate(el => el?.textContent?.trim() || '', locationElement);
                jobDetail.location = sanitizeString(location);
            }
        } catch (e) {
            if (DEBUG) console.log(chalk.yellow('Could not extract location'));
        }

        // Extract salary
        try {
            const salaryElement = await page.$('[data-test="jd-salary"] .IconWithText__text');
            if (salaryElement) {
                const salary = await page.evaluate(el => el?.textContent?.trim() || '', salaryElement);
                jobDetail.salary = sanitizeString(salary);
            }
        } catch (e) {
            if (DEBUG) console.log(chalk.yellow('Could not extract salary'));
        }

        // Extract full job description from RichContent
        try {
            const descriptionElement = await page.$('[data-jobad="body"][data-test="jd-body-richtext"]');
            if (descriptionElement) {
                const description = await page.evaluate(el => el?.textContent?.trim() || '', descriptionElement);
                jobDetail.description = sanitizeString(description);
            }
        } catch (e) {
            if (DEBUG) console.log(chalk.yellow('Could not extract description'));
        }

        // Extract benefits
        try {
            const benefitsElements = await page.$$('.JobDescriptionBenefits .Tag span');
            if (benefitsElements.length > 0) {
                const benefits = await Promise.all(
                    benefitsElements.map(el =>
                        page.evaluate(element => element?.textContent?.trim() || '', el)
                    )
                );
                jobDetail.benefits = benefits
                    .map((b: string) => sanitizeString(b))
                    .filter((b: string | undefined): b is string => Boolean(b));
            }
        } catch (e) {
            if (DEBUG) console.log(chalk.yellow('Could not extract benefits'));
        }

        // Extract full text content (everything visible on the page)
        try {
            // @ts-ignore - runs in browser context
            const fullText = await page.evaluate(() => document.body.innerText);
            jobDetail.fullText = sanitizeString(fullText);
        } catch (e) {
            if (DEBUG) console.log(chalk.yellow('Could not extract full text'));
        }

        // Extract application URL
        try {
            const applicationButton = await page.$('a.Button[data-track-event="JD.Reply"], a[data-test="jd-reply-button-top"]');
            if (applicationButton) {
                const href = await page.evaluate(el => el?.getAttribute('href') || '', applicationButton);
                if (href && !href.startsWith('#')) {
                    // Make sure it's an absolute URL
                    jobDetail.applicationUrl = href.startsWith('http') ? href : `https://www.jobs.cz${href}`;
                }
            }
        } catch (e) {
            if (DEBUG) console.log(chalk.yellow('Could not extract application URL'));
        }

        if (DEBUG) {
            console.log(chalk.green('✓ Successfully scraped job detail'));
            console.log();
        }

        return jobDetail;

    } catch (error: any) {
        console.error(chalk.red('Error scraping job detail:'), error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
