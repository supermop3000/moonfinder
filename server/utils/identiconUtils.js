import * as jdenticon from 'jdenticon';
import fs from 'fs';
import path from 'path';

/**
 * Generates and saves an identicon for the user.
 * @param {string} username - The unique username of the user.
 * @returns {string} - The relative file path of the generated identicon.
 */
export const generateIdenticon = (username) => {
  const svg = jdenticon.toSvg(username, 100); // Generate SVG icon
  const filename = `${username}.svg`; // Use username for the filename
  const filepath = path.join(
    process.cwd(),
    'server',
    'public',
    'identicons',
    filename
  ); // Save path

  // Ensure the directory exists
  fs.mkdirSync(path.dirname(filepath), { recursive: true });

  // Write the SVG to a file
  fs.writeFileSync(filepath, svg, 'utf8');

  return `/identicons/${filename}`; // Return the relative path for database storage
};
