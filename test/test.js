/*
 * Copyright (c) 2020
 * Author: Marco Castiello
 * E-mail: marco.castiello@gmail.com
 * Project: Worker Async Polyfill
 */

// Forcing to use the EventTarget polyfill
self.EventTarget = null;

require('../src/extendable-event-target.js');
const {Worker} = require('../src/worker.js');

describe('Worker', () => {
    it("should create and handle the Worker", () => {
        const worker = new Worker("./worker.js");

        worker.addEventListener("message", event => {
            expect(worker.running).toBeTruthy();
            expect(event.data === "Test").toBeTruthy();
        });
    });
    it("should be able to communicate data", () => {
        const worker = new Worker("./worker.js");

        worker.addEventListener("message", event => {
            expect(worker.running).toBeTruthy();
            expect(event.data === 2).toBeTruthy();
        });

        worker.postMessage({"type": "increment", "value": 1});
    });
    it("should be able to transfer data", () => {
        const worker = new Worker("./worker.js");
        const buffer = new ArrayBuffer(5);

        worker.addEventListener("message", event => {
            expect(worker.running).toBeTruthy();
            expect(event.data === buffer).toBeTruthy();
        });

        worker.postMessage({"type": "buffer", "value": buffer});
    });
    it("should be able to clone non transferable data", () => {
        const worker = new Worker("./worker.js");
        const obj = {
            "testObject": true
        };

        worker.addEventListener("message", event => {
            expect(worker.running).toBeTruthy();
            expect(event.data !== obj).toBeTruthy();
            expect(event.data.testObject).toBeTruthy();
        });

        worker.postMessage({"type": "object", "value": obj});
    });
    it("should be able to terminate the Worker", () => {
        const worker = new Worker("./worker.js");
        const obj = {
            "testObject": true
        };

        worker.addEventListener("message", event => {
            expect(worker.running).toBeTruthy();
            worker.terminate();
            setTimeout(() => {
                expect(worker.running).toBeFalsy();
            }, 100);
        });
    });
});
