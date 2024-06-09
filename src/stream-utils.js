const { createReadStream } = require('fs');
const { Transform } = require('stream');
const readline = require('readline');

/**
 * Transform stream to parse TSV data.
 */
class TsvParserStream extends Transform {
    constructor(options) {
      super({ ...options, objectMode: true });
      this.headers = [];
      this.currentRow = [];
      this.currentRowIndex = 0;
      this.delimiter = options.delimiter || '\t'; // Default delimiter is tab
    }
  
    _transform(chunk, encoding, callback) {
        const line = chunk.toString();
        // Split the line by the specified delimiter to get columns
        const columns = line.split(this.delimiter);

        if (this.currentRowIndex === 0) {
            // If it's the first row, consider it as header
            this.headers = columns;
        } else {
            // Otherwise, emit an object with key-value pairs
            const rowData = {};
            columns.forEach((column, index) => {
            rowData[this.headers[index]] = column;
            });
            this.push(rowData);
        }

        this.currentRowIndex++;
  
        callback();
    }
}


/**
 * Custom Transform stream to split data into lines.
 */
class LineSplitterStream extends Transform {
    constructor(options) {
      super({ ...options, readableObjectMode: true });
      this.rl = readline.createInterface({
        input: this,
        crlfDelay: Infinity // Preserve \r in output
      });
  
      this.rl.on('line', (line) => {
        this.push(line);
      });
  
      this.rl.on('close', () => {
        this.push(null); // Signal end of data
      });
    }
  
    _transform(chunk, encoding, callback) {
      this.rl.write(chunk); // Write data to the readline interface
      callback();
    }
}
  

/**
 * Create a stream to read and parse a gzipped TSV file.
 * @param {string} gzippedFilePath - The path to the gzipped TSV file.
 * @param {string} delimiter - The delimiter to use for parsing the TSV data.
 * @returns {Promise<Array>} - A promise that resolves with an array containing all parsed TSV rows.
 */
function parseGzipTsvFile(gzippedFilePath, delimiter) {
    return new Promise((resolve, reject) => {
      const rows = [];
  
      // Create a readable stream for the gzipped file
      const readStream = createReadStream(gzippedFilePath);
  
      // Create a decompression stream
      const decompressionStream = zlib.createGunzip();
  
      // Create a LineSplitterStream to split data into lines
      const lineSplitterStream = new LineSplitterStream();
  
      // Create a TSV parser stream with the specified delimiter
      const tsvParserStream = new TsvParserStream({ objectMode: true, delimiter });
  
      // Pipe the streams together
      readStream.pipe(decompressionStream).pipe(lineSplitterStream).pipe(tsvParserStream);
  
      // Listen for 'data' events to collect parsed TSV rows
      tsvParserStream.on('data', (data) => {
        console.log(data);
        rows.push(data);
      });
  
      // Handle 'end' event to resolve with the array of rows
      tsvParserStream.on('end', () => {
        resolve(rows);
      });
  
      // Handle 'error' events
      tsvParserStream.on('error', (error) => {
        reject(error);
      });
    });
}


/**
 * A transform stream that filters data based on a predicate function.
 * @param {Function} predicate - A function that returns true for data to be passed through and false to be filtered out.
 */
class FilterStream extends Transform {
    constructor(predicate, options) {
      super(options);
      this.predicate = predicate;
    }
  
    _transform(chunk, encoding, callback) {
      // Convert the chunk to a string
      const data = chunk.toString();
  
      // Check if the data meets the predicate criteria
      if (this.predicate(data)) {
        // If it does, push the data to the readable side of the stream
        this.push(data);
      }
  
      // Call the callback to indicate that processing of this chunk is complete
      callback();
    }
}