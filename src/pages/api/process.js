import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable the default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

// This is a proxy API route that forwards requests to the App Router API route
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      // Create a new FormData object to forward to the App Router API
      const formData = new FormData();
      
      // Add all files to the FormData
      Object.values(files).forEach((fileArray) => {
        fileArray.forEach((file) => {
          const fileContent = fs.readFileSync(file.filepath);
          formData.append('files', new Blob([fileContent]), file.originalFilename);
        });
      });

      try {
        // Forward the request to the App Router API route
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process`, {
          method: 'POST',
          body: formData,
        });

        // Get the response data
        const data = await response.json();

        // Return the response
        res.status(response.status).json(data);
      } catch (error) {
        console.error('Error forwarding request:', error);
        res.status(500).json({ error: 'Failed to process request' });
      }
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
} 