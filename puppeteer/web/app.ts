import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { exec } from 'child_process';
import http from 'http';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Import CommonJS module using require
const { scrapeJobDetail } = require('../scraper/detail-scraper.ts');

//import { MongoClient, Db} from 'mongodb';
const dbUrl: string = 'mongodb://localhost:27017';
const dbName: string = 'jobPostings';
//const client: MongoClient = new MongoClient(dbUrl);

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const port: number = 3000;
const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

app.post('/submit', async (req: Request, res: Response): Promise<void> => {
    const jobParams: string = JSON.stringify(req.body, null, 2);

    /*
    await client.connect();
    let db: Db = client.db(dbName);

    await db.dropDatabase();

    await db.collection('parameters').insertOne(req.body);
    */

    fs.writeFile('job-params.json', jobParams, (err) => {
        if (err) {
            res.status(500).send('Failed to write to file.');
            return;
        }

        exec('cd ../scraper && npm start', (error, stdout, stderr) => {
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
    });
});

// API endpoint for n8n integration - returns full job data
app.post('/api/scrape', async (req: Request, res: Response): Promise<void> => {
    const jobParams: string = JSON.stringify(req.body, null, 2);
    const jobParamsPath = path.join(__dirname, '../scraper/job-params.json');
    const jobPostsPath = path.join(__dirname, '../scraper/job-posts.json');

    try {
        // Write parameters
        fs.writeFileSync(jobParamsPath, jobParams);

        // Run scraper synchronously and wait for completion
        await new Promise<void>((resolve, reject) => {
            exec('cd ../scraper && npm start', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Scraper error: ${error.message}`);
                    reject(error);
                    return;
                }
                console.log('Scraper completed successfully');
                resolve();
            });
        });

        // Read and return the scraped results
        const results = fs.readFileSync(jobPostsPath, 'utf-8');
        const jobPosts = JSON.parse(results);

        res.json({
            success: true,
            count: jobPosts.length,
            data: jobPosts
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint for getting just URLs (optimized for Firecrawl integration)
app.post('/api/scrape/urls', async (req: Request, res: Response): Promise<void> => {
    const jobParams: string = JSON.stringify(req.body, null, 2);
    const jobParamsPath = path.join(__dirname, '../scraper/job-params.json');
    const jobPostsPath = path.join(__dirname, '../scraper/job-posts.json');

    try {
        // Write parameters
        fs.writeFileSync(jobParamsPath, jobParams);

        // Run scraper synchronously and wait for completion
        await new Promise<void>((resolve, reject) => {
            exec('cd ../scraper && npm start', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Scraper error: ${error.message}`);
                    reject(error);
                    return;
                }
                console.log('Scraper completed successfully');
                resolve();
            });
        });

        // Read results and extract just URLs
        const results = fs.readFileSync(jobPostsPath, 'utf-8');
        const jobPosts = JSON.parse(results);
        const urls = jobPosts.map((post: any) => post.url).filter(Boolean);

        res.json({
            success: true,
            count: urls.length,
            urls: urls
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint for scraping individual job detail page
app.post('/api/scrape/detail', async (req: Request, res: Response): Promise<void> => {
    const { url } = req.body;

    if (!url) {
        res.status(400).json({
            success: false,
            error: 'URL is required'
        });
        return;
    }

    try {
        const jobDetail = await scrapeJobDetail(url);

        res.json({
            success: true,
            data: jobDetail
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

server.listen(port, (): void => {
    console.log(`Server running on http://localhost:${port}..`);
});
