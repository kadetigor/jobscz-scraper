import { Page, PuppeteerLaunchOptions } from 'puppeteer';
import os from 'os';

// Detect Chrome executable path based on OS
function getChromePath(): string | undefined {
    const platform = os.platform();
    const fs = require('fs');

    if (platform === 'darwin') {
        // macOS
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'linux') {
        // Linux (Ubuntu/Debian) - try common paths
        const linuxPaths = [
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/usr/bin/google-chrome',
            '/snap/bin/chromium'
        ];

        for (const path of linuxPaths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }
        return undefined; // Use bundled Chromium if none found
    } else if (platform === 'win32') {
        // Windows
        return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }

    // If undefined, Puppeteer will use bundled Chromium
    return undefined;
}

// Browser launch options
export const BROWSER_OPTS: PuppeteerLaunchOptions = {
    headless: true, // Set to true for server environments
    executablePath: getChromePath(),
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
    ]
};

// Page options
export const PAGE_OPTS = {
    DEFAULT_TIMEOUT: 30000
};

// Click an element
export async function click(page: Page, selector: string, type: string = 'css', timeout: number = 30): Promise<void> {
    await page.waitForSelector(selector, { timeout: timeout * 1000 });
    await page.click(selector);
}

// Wait for selector
export async function waitForSelector(page: Page, selector: string, type: string = 'css', timeout: number = 30): Promise<void> {
    await page.waitForSelector(selector, { timeout: timeout * 1000 });
}

// Get text content
export async function getText(page: Page, selector: string): Promise<string> {
    const element = await page.$(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    const text = await page.evaluate(el => el.textContent?.trim() || '', element);
    return text;
}

// Get attribute value
export async function getAttribute(page: Page, selector: string, attribute: string): Promise<string> {
    const element = await page.$(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    const value = await page.evaluate((el, attr) => el.getAttribute(attr) || '', element, attribute);
    return value;
}

// Timeout/sleep
export async function timeout(seconds: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
