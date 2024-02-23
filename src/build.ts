
interface Task<K, V> {
    key: K;
    run(fetch: (key: K) => V): V;
}

interface Tasks<K, V> {
    getTask(key: K): Task<K, V> | undefined;
}

// abstract store containing a key/value map and persistent build information
interface Store<K, V, I> {
    initialize(info: I): Store<K, V, I>;
    //getInfo(): I;
    //putInfo(info: I): Store<K, V, I>;
    getValue(key: K): V;
    putValue(key: K, val: V): Store<K, V, I>;
}

// a compact summary of a value with a fast equality check
interface Hash<V, H> {
    hash(val: V): H;
    getHash<K, I>(key: K, store: Store<K, V, I>): H;
}

interface Build<K, V, I> {
    (tasks: Tasks<K, V>, key: K, store: Store<K, V, I>): Store<K, V, I>;
}

interface Rebuilder<K, V> {
    (key: K, val: V, task: Task<K, V>): Task<K, V>;
}

interface Scheduler<K, V, I> {
    (rb: Rebuilder<K, V>): Build<K, V, I>;
}

const busy: Build<any, any, any> = (tasks, key, store) => {
    const fetch = (key: any) => {
        const task = tasks.getTask(key);
        if (task === undefined) {
            return store.getValue(key);
        } else {
            const val = task.run(fetch);
            store.putValue(key, val);
            return val;
        }
    }
    return {
        initialize() {
            return this;
        },
        getValue: fetch,
        putValue(key, val) {
            return this;
        },
    }
}

const sprshTasks: Tasks<string, number> = {
    getTask(k): Task<string, number> | undefined {
        if (k == "B1") {
            return {key: "B1", run: (fetch) => fetch("A1") + fetch("A2")};
        }
        if (k == "B2") {
            return {key: "B2", run: (fetch) => 2 * fetch("B1")};
        }
        return undefined;
    }
}

const sprshStore: Store<string, number, any> = {
    initialize() {
        return this;
    },
    getValue(key) {
        if (key === "A1") return 10;
        return 20;
    },
    putValue(key, val) {
        return this;
    },
}

const sprsh = (k: string) => busy(sprshTasks, k, sprshStore).getValue(k);
console.log(sprsh("B1") === 30);
console.log(sprsh("B2") === 60);