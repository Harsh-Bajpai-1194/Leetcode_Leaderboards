import express from 'express';
import { spawn } from 'child_process';
import path, { dirname } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import os from 'os';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 10000; 

app.use(cors());
app.use(express.json());

const submissionCache = new Map();
const activeScrapes = new Map();

app.get('/api/submission/:submissionId', (req, res) => {
  console.log(`Received request for /api/submission/${req.params.submissionId}`);
  const { submissionId } = req.params;

  if (submissionCache.has(submissionId)) {
    console.log(`Returning cached result for submission ID: ${submissionId}`);
    return res.json(submissionCache.get(submissionId));
  }

  if (activeScrapes.has(submissionId)) {
    console.log(`Request queued for ${submissionId}. Waiting for Python to finish...`);
    activeScrapes.get(submissionId).push(res);
    return;
  }

  activeScrapes.set(submissionId, [res]);
  
  const pythonScriptPath = path.join(__dirname, 'working_scraper.py');
  const pythonCommand = (os.platform() === 'win32') ? 'python' : 'python3';
  
  console.log(`Attempting to spawn: ${pythonCommand} "${pythonScriptPath}" "${submissionId}"`);
  
  const pythonProcess = spawn(pythonCommand, [pythonScriptPath, submissionId]);

  let pythonOutput = '';
  let pythonError = '';

  pythonProcess.stdout.on('data', (data) => {
    pythonOutput += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    pythonError += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Python script exited with code ${code}`);
      console.error(`Python stdout: ${pythonOutput}`);
      console.error(`Python stderr: ${pythonError}`);
      
      const errorMsg = { error: 'Failed to scrape submission details', details: pythonError };
      const waitingClients = activeScrapes.get(submissionId) || [];
      waitingClients.forEach(clientRes => {
        if (!clientRes.headersSent) clientRes.status(500).json(errorMsg);
      });
      activeScrapes.delete(submissionId);
      return;
    }

    try {
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

        const formattedTitle = details.question?.titleSlug 
            ? details.question.titleSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            : 'Unknown Problem Title';

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

        submissionCache.set(submissionId, parsedSubmission);
        console.log("Successfully mapped submission data!");

        const waitingClients = activeScrapes.get(submissionId) || [];
        waitingClients.forEach(clientRes => {
            if (!clientRes.headersSent) {
                clientRes.json(parsedSubmission);
            }
        });
        activeScrapes.delete(submissionId);

    } catch (error) {
        console.error("Failed to parse or map JSON from Python script:", error.message);
        console.error("Raw stdout was:", pythonOutput);
        console.error("Raw stderr was:", pythonError);
        
        const errorMsg = { error: 'Failed to parse submission details.', details: error.message, stderr: pythonError };
        const waitingClients = activeScrapes.get(submissionId) || [];
        waitingClients.forEach(clientRes => {
            if (!clientRes.headersSent) clientRes.status(500).json(errorMsg);
        });
        activeScrapes.delete(submissionId);
    }
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python subprocess:', err);
    const errorMsg = { error: 'Failed to start scraper process', details: err.message };
    
    const waitingClients = activeScrapes.get(submissionId) || [];
    waitingClients.forEach(clientRes => {
        if (!clientRes.headersSent) clientRes.status(500).json(errorMsg);
    });
    activeScrapes.delete(submissionId);
  });
});

app.get('/', (req, res) => {
  res.send('Leetcode Leaderboards Backend is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});