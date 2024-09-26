const fs = require('fs').promises;
const path = require('path');

async function safeReaddir(dir) {
    try {
        return await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return an empty array if directory does not exist
        } else {
            throw error; // Re-throw other errors
        }
    }
}

async function cleanupEmptyDirectories(rootDir) {
    const items = await safeReaddir(rootDir);

    for (const item of items) {
        const itemPath = path.join(rootDir, item.name);

        if (item.isDirectory()) {
            const isEmpty = await isDirectoryEmpty(itemPath);
            if (isEmpty) {
                console.log(`Removing empty directory: ${itemPath}`);
                await fs.rmdir(itemPath);
            }

            await cleanupEmptyDirectories(itemPath);
        }
    }
}

// Check if the directory is empty by reading its contents
async function isDirectoryEmpty(dir) {
    const items = await fs.readdir(dir);
    return items.length === 0;
}

// Start the cleanup process
async function main() {
    try {
        // Get the root directory path from command-line arguments
        const rootDir = process.argv[2];

        // Validate the root directory path
        if (!rootDir) {
            console.error('Usage: node cleanup.js <root directory>');
            return;
        }

        // Recursively clean up empty directories
        await cleanupEmptyDirectories(rootDir);

        console.log('Cleanup completed.');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();