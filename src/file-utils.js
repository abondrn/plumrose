const crypto = require('crypto');
const zlib = require('zlib');
const { createWriteStream, createReadStream } = require('fs');
const fs = require('fs').promises;

const unzipper = require('unzipper');

/**
 * Unzips a file to the given destination directory, defaulting to the directory containing the zip file.
 * @param {string} zipFilePath - The path to the zip file.
 * @param {string} [destDir] - The directory to extract the zip file to. Defaults to the directory containing the zip file.
 */
async function unzipFile(zipFilePath, destDir) {
    try {
      // Determine the default destination directory
      if (!destDir) {
        destDir = path.join(path.dirname(zipFilePath), path.basename(zipFilePath, '.zip'));
      }
  
      // Ensure the destination directory exists
      await fs.mkdir(destDir, { recursive: true });
  
      // Initialize the progress bar
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
      progressBar.start(100, 0);
  
      // Extract the zip file
      await createReadStream(zipFilePath)
        .pipe(unzipper.Parse())
        .on('entry', (entry) => {
          const fileName = entry.path;
          const type = entry.type; // 'Directory' or 'File'
  
          if (type === 'File') {
            const filePath = path.join(destDir, fileName);
  
            // Create a write stream for the file
            const writeStream = createWriteStream(filePath);
  
            // Pipe the entry to the write stream
            entry.pipe(writeStream);
  
            // Update progress bar as data is extracted
            entry.on('data', (chunk) => {
              progressBar.increment(chunk.length);
            });
          } else {
            entry.autodrain(); // Don't extract directories, just drain them
          }
        })
        .promise();
  
      progressBar.stop();
      console.log(`File unzipped to: ${destDir}`);
    } catch (error) {
      console.error(`Error unzipping file: ${error.message}`);
    }
}


/**
 * Unzips a gzip file to the given destination directory.
 * @param {string} gzipFilePath - The path to the gzip file.
 * @param {string} [destDir] - The directory to extract the gzip file to. Defaults to the directory containing the gzip file.
 */
async function gunzipFile(gzipFilePath, destDir) {
    try {
      // Determine the default destination directory
      if (!destDir) {
        destDir = path.join(path.dirname(gzipFilePath), path.basename(gzipFilePath, '.gz'));
      }
  
      // Ensure the destination directory exists
      await fs.mkdir(path.dirname(destDir), { recursive: true });
  
      // Initialize the progress bar
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
      progressBar.start(100, 0);
  
      // Create a read stream for the gzip file
      const readStream = createReadStream(gzipFilePath);
  
      // Create a write stream for the decompressed file
      const writeStream = createWriteStream(destDir);
  
      // Pipe the read stream through the decompression stream and then to the write stream
      readStream.pipe(zlib.createGunzip()).pipe(writeStream);
  
      // Update progress bar as data is extracted
      readStream.on('data', (chunk) => {
        progressBar.increment(chunk.length);
      });
  
      // When the process finishes, stop the progress bar and log a message
      writeStream.on('finish', () => {
        progressBar.stop();
        console.log(`File unzipped to: ${destDir}`);
      });
  
      // Handle errors
      //readStream.on('error', (err) => console.error('Read error:', err));
      //writeStream.on('error', (err) => console.error('Write error:', err));
    } catch (error) {
      console.error(`Error unzipping file: ${error.message}`);
    }
}


/**
 * Calculates the MD5 hash of a file.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<string>} - A promise that resolves with the MD5 hash of the file.
 */
async function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = createReadStream(filePath);
  
      stream.on('error', reject);
  
      stream.on('data', (chunk) => {
        hash.update(chunk);
      });
  
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
    });
}


/**
 * Check if a file exists asynchronously.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<boolean>} - A promise that resolves to true if the file exists, false otherwise.
 */
async function fileExists(filePath) {
    try {
      // Use fs.access to check if the file exists
      await fs.access(filePath);
      return true;
    } catch (error) {
      // If fs.access throws an error, the file does not exist
      if (error.code === 'ENOENT') {
        return false;
      } else {
        // If fs.access throws an error other than 'ENOENT', rethrow it
        throw error;
      }
    }
}


/**
 * Delete a file asynchronously.
 * @param {string} filePath - The path to the file to delete.
 * @returns {Promise<void>} - A promise that resolves when the file is deleted.
 */
async function deleteFile(filePath) {
    try {
      // Use fs.unlink to delete the file
      await fs.unlink(filePath);
      console.log(`File '${filePath}' deleted successfully.`);
    } catch (error) {
      // If fs.unlink throws an error, log the error
      console.error(`Error deleting file '${filePath}':`, error);
    }
}


async function deleteIfExists(filePath) {
    if (await fileExists(filePath)) {
        await deleteFile(filePath);
        return true;
    } else {
        return false;
    }
}


module.exports = { deleteIfExists, calculateFileHash, gunzipFile, unzipFile };