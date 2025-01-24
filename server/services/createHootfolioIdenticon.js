import { fileURLToPath } from 'url'; // Import fileURLToPath
import path from 'path'; // To work with file paths
import * as jdenticon from 'jdenticon';
import fs from 'fs'; // File system module

// Get the current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate and save identicon
const createHootfolioIdenticon = (username) => {
  try {
    // Generate identicon SVG
    const identiconSvg = jdenticon.toSvg(username, 200); // Generate a 200x200 SVG

    // Define the path to store the identicon
    const identiconDir = path.join(__dirname, '..', 'public', 'identicons');

    // Ensure the directory exists, if not, create it
    if (!fs.existsSync(identiconDir)) {
      fs.mkdirSync(identiconDir, { recursive: true });
    }

    // Define the full path for the identicon file
    const identiconPath = path.join(identiconDir, `${username}.svg`);

    // Write the identicon SVG to the specified path
    fs.writeFileSync(identiconPath, identiconSvg, 'utf8');

    console.log(`Identicon for ${username} saved at: ${identiconPath}`);
    return identiconPath; // Returning the path if needed elsewhere
  } catch (error) {
    console.error('Error generating identicon:', error);
  }
};

export default createHootfolioIdenticon;
