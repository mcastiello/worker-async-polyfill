import WorkerChannel from './worker-channel';
import WorkerScope from './worker-scope';

// Initialise event maps.
const scopeMap = new WeakMap();
const channelMap = new WeakMap();

/**
 * Provide a polyfill for the Worker class. The code is not executed 
 * in a new thread but it is ran asynchronously.
 * @type {Worker}
 * @class
 */
class Worker extends ExtendableEventTarget {
    /**
     * Initialise the Worker using the code downloaded from the URL.
     * @param {String} url
     * @constructor
     */
    constructor(url) {
        super();
        
        const scope = new WorkerScope(this);
        const channel = new WorkerChannel(scope);
        
        scopeMap.set(this, scope);
        channelMap.set(this, channel);
        
        const xhr = new XMLHttpRequest();

        xhr.open("GET", url);
        xhr.onreadystatechange = () => {
            if(xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    scope.run(xhr.responseText);
                    if (!scope.running) {
                        this.terminate();
                        throw new Error("Unable to execute Worker code!");
                    }
                } else {
                    throw new Error("Worker code not available!");
                    this.terminate();
                }
            }
        };
        xhr.send();
    }
    
    /**
     * Send a message to the worker scope.
     */
    postMessage(...params) {
        if (channelMap.has(this)) {
            return channelMap.get(this).postMessage(...params);
        }
    }
    
    /**
     * Terminate the worker execution.
     */
    terminate() {
        if (channelMap.has(this)) {
            channelMap.get(this).clear();
            channelMap.delete(this);
        }
        
        if (scopeMap.has(this)) {
            scopeMap.get(this).terminate();
            scopeMap.delete(this);
        }
    }
}

export default Worker
