const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Async generator function to recursively yield all files in a directory
async function* getAllFiles(dir) {
    try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                yield* getAllFiles(itemPath); // Recursively yield files in subdirectories
            } else {
                yield itemPath;
            }
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            return; // Return an empty array if directory does not exist
        } else {
            throw error; // Re-throw other errors
        }
    }
}

async function* getFilesToDelete(srcDir, destDir) {
    // Iterate over the files in the source directory
    for await (const srcFile of getAllFiles(srcDir)) {
        // Calculate relative path and destination file path
        const relativePath = path.relative(srcDir, srcFile);
        const destFilePath = path.join(destDir, relativePath);

        // Check if the file exists in the destination directory
        const existsInDest = await fileExists(destFilePath);
        if (existsInDest) {
            // Compare hashes if the file exists in both directories
            try {
                const [srcHash, destHash] = await Promise.all([getHash(srcFile), getHash(destFilePath)]);
                if (srcHash === destHash) {
                    // Yield the source file to delete if the hashes match
                    yield srcFile;
                }
            } catch(e) {
                console.error('Error:', e);
            }
        }
    }
}

async function deleteFilesInSrc(srcDir, destDir) {
    // Iterate over files to delete from the source directory
    for await (const srcFile of getFilesToDelete(srcDir, destDir)) {
        console.log(`Deleting ${srcFile}`);
        await fs.unlink(srcFile);
    }
    console.log('Done!');
}

async function getObjectType(filePath) {
    try {
        // Get information about the file or directory at the given path
        const stats = await fs.stat(filePath);

        // Check the type of the object
        if (stats.isFile()) {
            return 'file';
        } else if (stats.isDirectory()) {
            return 'directory';
        } else if (stats.isSymbolicLink()) {
            return 'symlink';
        } else {
            return 'unknown'; // Other types (e.g., device, socket, etc.)
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            return 'not found'; // Path does not exist
        } else {
            throw error; // Re-throw other errors
        }
    }
}

// Check if a file exists
async function fileExists(filePath) {
    return await getObjectType(filePath) === "file";
}

async function getHash(filePath) {
    const type = await getObjectType(filePath);
    switch (type) {
        case 'file': return getFileHash(filePath);
        case 'symlink': return getSymlinkHash(filePath);
        default:
            throw Error(`Tried to hash ${type} ${filePath}`);
    }
}

// Calculate the MD5 hash of a file's contents
async function getFileHash(filePath) {
    const fileData = await fs.readFile(filePath);
    return crypto.createHash('md5').update(fileData).digest('hex');
}

async function getSymlinkHash(filePath) {
    const target = await fs.readlink(filePath);
    return crypto.createHash('md5').update(target).digest('hex');
}

// Entry point of the script
async function main() {
    try {
        // Get source and destination directory paths from command-line arguments
        const srcDir = process.argv[2];
        const destDir = process.argv[3];

        // Validate command-line arguments
        if (!srcDir || !destDir) {
            console.error('Usage: node dedup.js <src directory> <dest directory>');
            return;
        }

        // Delete files in source directory based on comparison with destination directory
        await deleteFilesInSrc(srcDir, destDir);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call main function
main();