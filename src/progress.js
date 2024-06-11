const progress = require('cli-progress');


function* range(start, stop, step = 1, pbar) {
    let current = start;
    const totalSteps = Math.floor((stop - start) / step) + 1;
    let stepCount = 0;

    // Initialize the progress bar
    const progressBar = pbar || new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(totalSteps, 0);

    while (current < stop) {
        yield current;
        current += step;
        stepCount++;
        progressBar.update(stepCount);
    }

    // Stop the progress bar
    progressBar.stop();
}


function* enumerate(iterable, start = 0) {
    const totalSteps = iterable.length;
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(totalSteps, 0);
    
    let count = start;
    for (const item of iterable) {
        yield [count, item];
        count++;
        progressBar.update(count);
    }
    
    progressBar.stop();
}


function* zip(...iterables) {
    const minLength = Math.min(...iterables.map(iter => iter.length));
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(minLength, 0);

    for (let i = 0; i < minLength; i++) {
        yield iterables.map(iter => iter[i]);
        progressBar.update(i + 1);
    }
    
    progressBar.stop();
}


function* product(...iterables) {
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    const totalSteps = iterables.reduce((acc, curr) => acc * curr.length, 1);
    progressBar.start(totalSteps, 0);
    
    function* _product(arr, n = 0, current = []) {
        if (n === arr.length) {
            yield current;
            return;
        }
        for (let value of arr[n]) {
            yield* _product(arr, n + 1, current.concat(value));
        }
    }
    
    let count = 0;
    for (let combo of _product(iterables)) {
        yield combo;
        count++;
        progressBar.update(count);
    }
    
    progressBar.stop();
}


function* batch(iterable, size) {
    const totalSteps = Math.ceil(iterable.length / size);
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(totalSteps, 0);

    for (let i = 0; i < iterable.length; i += size) {
        yield iterable.slice(i, i + size);
        progressBar.update(i / size + 1);
    }
    
    progressBar.stop();
}


function* concat(...iterables) {
    const totalSteps = iterables.reduce((acc, curr) => acc + curr.length, 0);
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(totalSteps, 0);

    let count = 0;
    for (const iterable of iterables) {
        for (const item of iterable) {
            yield item;
            count++;
            progressBar.update(count);
        }
    }
    
    progressBar.stop();
}


async function asyncMap(array, callback) {
    const results = [];
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(array.length, 0);

    for (let index = 0; index < array.length; index++) {
        const result = callback(array[index], index, array);
        results.push(result instanceof Promise ? await result : result);
        progressBar.update(index + 1);
    }

    progressBar.stop();
    return results;
}


async function asyncReduce(array, callback, initialValue) {
    let accumulator = initialValue;
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(array.length, 0);

    for (let index = 0; index < array.length; index++) {
        const result = callback(accumulator, array[index], index, array);
        accumulator = result instanceof Promise ? await result : result;
        progressBar.update(index + 1);
    }

    progressBar.stop();
    return accumulator;
}


async function asyncForEach(array, callback) {
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(array.length, 0);

    for (let index = 0; index < array.length; index++) {
        const result = callback(array[index], index, array);
        if (result instanceof Promise) {
            await result;
        }
        progressBar.update(index + 1);
    }

    progressBar.stop();
}


async function asyncFind(array, callback) {
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(array.length, 0);

    for (let index = 0; index < array.length; index++) {
        const result = callback(array[index], index, array);
        if (result instanceof Promise ? await result : result) {
            progressBar.stop();
            return array[index];
        }
        progressBar.update(index + 1);
    }

    progressBar.stop();
    return undefined;
}


async function asyncSome(array, callback) {
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(array.length, 0);

    for (let index = 0; index < array.length; index++) {
        const result = callback(array[index], index, array);
        if (result instanceof Promise ? await result : result) {
            progressBar.stop();
            return true;
        }
        progressBar.update(index + 1);
    }

    progressBar.stop();
    return false;
}


async function* flatten(array, iterableGenerator) {
    const progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
    progressBar.start(array.length, 0);

    for (let i = 0; i < array.length; i++) {
        const iterable = iterableGenerator(array[i]);
        for await (const item of iterable) {
            yield item;
        }
        progressBar.increment();
    }

    progressBar.stop();
}


module.exports = { range, enumerate, zip, product, batch, concat, asyncMap, asyncReduce, asyncForEach, asyncFind, asyncSome, flatten };