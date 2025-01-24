import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname); // Get the file extension
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`); // Append the extension
  },
});

const upload = multer({ storage });

// Resolve __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the processed directory exists
const processedFolder = path.resolve(__dirname, '../processed');
import fs from 'fs';
if (!fs.existsSync(processedFolder)) {
  fs.mkdirSync(processedFolder);
}

// Serve processed documents for download
router.use('/processed', express.static(processedFolder));

// Route to handle document processing
router.post('/process-document', upload.single('file'), (req, res) => {
  const filePath = req.file.path; // Path to the uploaded file
  console.log(filePath);
  const companyData = JSON.parse(req.body.companyData); // Company data sent from the frontend

  const pythonScriptPath = path.resolve(__dirname, '../services/documenter.py'); // Full path to the Python script
  const outputPath = path.join(
    processedFolder,
    `filled_${req.file.originalname}`
  ); // Full output path

  // Call Python script to process the document
  const pythonPath = '/usr/bin/python3';
  const command = `${pythonPath} ${pythonScriptPath} ${filePath} ${outputPath} '${JSON.stringify(
    companyData
  )}'`;

  console.log('Executing command:', command); // Debug log the command

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error processing document:', error);
      console.error('STDERR:', stderr); // Log errors from Python
      return res.status(500).send('Failed to process document.');
    }

    console.log('STDOUT:', stdout); // Log output from Python
    console.log('Document processed successfully!');
    res.json({
      message: 'Document processed successfully!',
      filledData: companyData, // Return updated company data if needed
      downloadLink: `/processed/${path.basename(outputPath)}`, // Link to the filled document
    });
  });
});

export default router;
