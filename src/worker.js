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
        
        this.onmessage = null;
        this.onmessageerror = null;
        this.onerror = null;

        xhr.open("GET", url);
        xhr.onreadystatechange = () => {
            if(xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
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
                    
                    // Execute the code.
                    scope.run(xhr.responseText);
                    
                    // Check if the code is running.
                    if (!scope.running) {
                        const event = new Event("error");
                        event.message = "Unable to execute Worker code!";
                        this.terminate();
                        this.dispatchEvent(event);
                    }
                } else { // Notify that it wasn't possible to load the file.
                    const event = new Event("error");
                    event.message = "Worker code not available!";
                    this.terminate();
                    this.dispatchEvent(event);
                }
            }
        };
        xhr.send();
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
