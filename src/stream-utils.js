const { Transform } = require('stream');


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
      // Check if the data meets the predicate criteria
      if (this.predicate(chunk)) {
        // If it does, push the data to the readable side of the stream
        this.push(chunk);
      }
  
      // Call the callback to indicate that processing of this chunk is complete
      callback();
    }
}


async function forEachStream(readableStream, callback) {
    return new Promise((resolve, reject) => {
        readableStream.on('data', async (chunk) => {
            try {
                await callback(chunk);
            } catch (error) {
                reject(error);
            }
        });

        readableStream.on('end', () => {
            resolve();
        });

        readableStream.on('error', (error) => {
            reject(error);
        });
    });
}


async function streamToArray(readableStream) {
    const records = [];

    await forEachStream(readableStream, async (chunk) => {
        records.push(chunk);
    });

    return records;
}


module.exports = { FilterStream, streamToArray, forEachStream };