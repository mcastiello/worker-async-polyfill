/*
 * Copyright (c) 2020
 * Author: Marco Castiello
 * E-mail: marco.castiello@gmail.com
 * Project: Worker Async Polyfill
 */

import { WorkerChannel } from './worker-channel.js';
import { WorkerScope } from './worker-scope.js';

// Initialise event maps.
const scopeMap = new WeakMap();
const channelMap = new WeakMap();

/**
 * Check if a URL is valid.
 * @param {String} string
 * @returns {Boolean}
 */
const isValidURL = (string) => {
    return /^(http(s)?:\/\/.|\.\/|\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/g.test(string);
};

/**
 * Provide a polyfill for the Worker class. The code is not executed 
 * in a new thread but it is ran asynchronously.
 * @type {Worker}
 * @class
 */
class Worker extends ExtendableEventTarget {
    /**
     * Initialise the Worker using the code downloaded from the URL.
     * @param {String|Blob} urlOrBlob
     * @constructor
     */
    constructor(urlOrBlob) {
        super();
        
        const scope = new WorkerScope(this);
        const channel = new WorkerChannel(scope);
        const runCode = code => {
            // Execute the code.
            scope.run(code);

            // Check if the code is running.
            if (!scope.running) {
                const event = new Event("error");
                event.message = "Unable to execute Worker code!";
                this.terminate();
                this.dispatchEvent(event);
            }
        };
        const notifyError = error => {
            // Notify that it wasn't possible to load the file.
            const event = new Event("error");
            event.message = error;
            this.terminate();
            this.dispatchEvent(event);
        };
        
        scopeMap.set(this, scope);
        channelMap.set(this, channel);
        
        const xhr = new XMLHttpRequest();
        
        this.onmessage = null;
        this.onmessageerror = null;
        this.onerror = null;

        // Make sure that the message callbacks executed
        // when a message is posted by the worker.
        scope.addEventListener("message", event => {
            if (typeof this.onmessage === "function") {
                this.onmessage(event);
            }
        });
        scope.addEventListener("messageerror", event => {
            if (typeof this.onmessageerror === "function") {
                this.onmessageerror(event);
            }
        });
        this.addEventListener("error", event => {
            if (typeof this.onerror === "function") {
                this.onerror(event);
            }
        });

        if (urlOrBlob instanceof Blob) {
            urlOrBlob.text().then(code => runCode(code)).catch(error => notifyError(error));
        } else if (typeof urlOrBlob === "string") {
            if (isValidURL(urlOrBlob)) {
                xhr.open("GET", urlOrBlob);
                xhr.onreadystatechange = () => {
                    if(xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            runCode(xhr.responseText);
                        } else {
                            notifyError("Worker code not available!");
                        }
                    }
                };
                xhr.send();
            } else {
                setTimeout(() => runCode(urlOrBlob), 0);
            }
        }
    }

    /**
     * Check if the Worker is running.
     * @returns {Boolean}
     */
    get running() {
        return Boolean(scopeMap.has(this) && scopeMap.get(this).running);
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

export { Worker };
