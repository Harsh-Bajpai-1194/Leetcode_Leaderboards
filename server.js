import express from 'express';
import { spawn } from 'child_process';
import path, { dirname } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());

// Simple lock to prevent multiple concurrent scraping processes
let isScrapingInProgress = false;

// In-memory cache to store successfully scraped submission data.
// This prevents re-scraping the same submission ID repeatedly.
const submissionCache = new Map();

app.get('/api/submission/:submissionId', (req, res) => {
  console.log(`Received request for /api/submission/${req.params.submissionId}`);
  const { submissionId } = req.params;

  // First, check if we have a cached result for this submission.
  if (submissionCache.has(submissionId)) {
    console.log(`Returning cached result for submission ID: ${submissionId}`);
    return res.json(submissionCache.get(submissionId));
  }

  if (isScrapingInProgress) {
    console.log('Scraping is already in progress. Ignoring new request.');
    return res.status(429).json({ error: 'Too many requests. A scraping process is already running.' });
  }
  
  const pythonScriptPath = path.join(__dirname, 'working_scraper.py');
  console.log(`Attempting to spawn Python script: python "${pythonScriptPath}" "${submissionId}"`);
  
  const pythonProcess = spawn('python', [pythonScriptPath, submissionId]);
  isScrapingInProgress = true; 

  let pythonOutput = '';
  let pythonError = '';

  // Collect chunked data streams
  pythonProcess.stdout.on('data', (data) => {
    pythonOutput += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    pythonError += data.toString();
  });

  pythonProcess.on('close', (code) => {
    isScrapingInProgress = false; 

    if (code !== 0) {
      console.error(`Python script exited with code ${code}`);
      console.error(`Python stdout: ${pythonOutput}`);
      console.error(`Python stderr: ${pythonError}`);
      return res.status(500).json({ error: 'Failed to scrape submission details', details: pythonError });
    }

    try {
        // Extract only the JSON portion from stdout (ignores random print statements)
        const jsonStartIndex = pythonOutput.indexOf('{');
        const jsonEndIndex = pythonOutput.lastIndexOf('}');
        
        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
            throw new Error("No JSON payload found in Python output.");
        }

        const rawJsonString = pythonOutput.substring(jsonStartIndex, jsonEndIndex + 1);
        const leetcodeData = JSON.parse(rawJsonString);
        
        const details = leetcodeData?.data?.submissionDetails;
        if (!details) {
            throw new Error("Missing 'submissionDetails' block in parsed JSON.");
        }

        // Convert the title-slug (e.g., "move-zeroes") into Title Case ("Move Zeroes")
        const formattedTitle = details.question?.titleSlug 
            ? details.question.titleSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            : 'Unknown Problem Title';

        // Map LeetCode's GraphQL schema to your exact backend schema
        const parsedSubmission = {
            problem_title: formattedTitle,
            status: details.statusCode === 10 ? 'Accepted' : (details.statusCode === 11 ? 'Wrong Answer' : 'Other/Error'),
            passed_testcases: `${details.totalCorrect || 0} / ${details.totalTestcases || 0}`,
            user_name: details.user?.username || 'Unknown User',
            timestamp: details.timestamp ? new Date(details.timestamp * 1000).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A',
            runtime: details.runtimeDisplay || '0 ms',
            runtime_beats: details.runtimePercentile ? `${details.runtimePercentile.toFixed(2)}%` : '0%',
            memory: details.memoryDisplay || '0 MB',
            memory_beats: details.memoryPercentile ? `${details.memoryPercentile.toFixed(2)}%` : '0%',
            language: details.lang?.verboseName || 'Unknown',
            code: details.code || 'Code not found.',
            submission_id: submissionId,
            problem_url: details.question?.titleSlug ? `https://leetcode.com/problems/${details.question.titleSlug}/` : '',
            explanation: "",
            runtime_distribution: details.runtimeDistribution ? JSON.parse(details.runtimeDistribution).distribution : []
        };

        // Add the newly scraped data to the cache for future requests
        submissionCache.set(submissionId, parsedSubmission);

        res.json(parsedSubmission);
        console.log("Successfully mapped submission data:\n", JSON.stringify(parsedSubmission, null, 2));

    } catch (error) {
        console.error("Failed to parse or map JSON from Python script:", error.message);
        console.error("Raw stdout was:", pythonOutput);
        console.error("Raw stderr was:", pythonError);
        return res.status(500).json({ error: 'Failed to parse submission details.', details: error.message, stderr: pythonError });
    }
  });

  pythonProcess.on('error', (err) => {
    isScrapingInProgress = false; 
    console.error('Failed to start Python subprocess:', err);
    res.status(500).json({ error: 'Failed to start scraper process', details: err.message });
  });
});

app.get('/', (req, res) => {
  res.send('Leetcode Leaderboards Backend is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});