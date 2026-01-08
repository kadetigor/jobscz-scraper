import { Page, PuppeteerLaunchOptions } from 'puppeteer';

// Browser launch options
export const BROWSER_OPTS: PuppeteerLaunchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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

// Execute shell command
export function executeCommand(command: string): void {
    const { exec } = require('child_process');
    exec(command, (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}
