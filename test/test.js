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

// Mocking the Blob class to make sure that the text method exists.
class MockBlob extends Blob {
    constructor(parts) {
        super(parts);
        this.parts = parts.slice();
    }

    async text() {
        return this.parts.join(";");
    }
}

// Create a test worker
const workerCode = () => {
    postMessage("Test");
    onmessage = event => {
        let value = event.data.value;
        switch (event.data.type) {
            case "increment":
                postMessage(++value);
                break;
            case "buffer":
                if (value instanceof ArrayBuffer) {
                    postMessage(value,[value]);
                }
                break;
            case "object":
                if (value instanceof Object) {
                    postMessage(value);
                }
                break;
        }
    };
};
const workerData = "(" + workerCode.toString() +")()";
const blob = new MockBlob([workerData]);

describe('Worker', () => {
    it("should create and handle the Worker", done => {
        const worker = new Worker(blob);

        worker.addEventListener("message", event => {
            expect(worker.running).toBeTruthy();
            expect(event.data === "Test").toBeTruthy();
            worker.terminate();
            done();
        });
    });
    it("should be able to communicate data", done => {
        const worker = new Worker(blob);

        setTimeout(() => {
            worker.addEventListener("message", event => {
                expect(worker.running).toBeTruthy();
                expect(event.data === 2).toBeTruthy();
                worker.terminate();
                done();
            });
            worker.postMessage({"type": "increment", "value": 1});
        }, 10);
    });
    it("should be able to transfer data", done => {
        const worker = new Worker(blob);
        const buffer = new ArrayBuffer(5);

        setTimeout(() => {
            worker.addEventListener("message", event => {
                expect(worker.running).toBeTruthy();
                expect(event.data === buffer).toBeTruthy();
                worker.terminate();
                done();
            });

            worker.postMessage({"type": "buffer", "value": buffer}, [buffer]);
        }, 10);
    });
    it("should be able to clone non transferable data", done => {
        const worker = new Worker(blob);
        const obj = {
            "testObject": true
        };

        setTimeout(() => {
            worker.addEventListener("message", event => {
                expect(worker.running).toBeTruthy();
                expect(event.data !== obj).toBeTruthy();
                expect(event.data.testObject).toBeTruthy();
                worker.terminate();
                done();
            });

            worker.postMessage({"type": "object", "value": obj});
        }, 10);
    });
    it("should be able to terminate the Worker", done => {
        const worker = new Worker(blob);

        worker.addEventListener("message", event => {
            expect(worker.running).toBeTruthy();
            worker.terminate();
            setTimeout(() => {
                expect(worker.running).toBeFalsy();
                done();
            }, 100);
        });
    });
    it("should send an error if Worker cannot load", done => {
        const worker = new Worker(new MockBlob(["textThatDoesntWork"]));

        worker.addEventListener("error", event => {
            expect(typeof event.message === "string").toBeTruthy();
            expect(worker.running).toBeFalsy();
            worker.terminate();
            done();
        });
    });
});
