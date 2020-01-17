/*
 * Copyright (c) 2020
 * Author: Marco Castiello
 * E-mail: marco.castiello@gmail.com
 * Project: Worker Async Polyfill
 */

postMessage("Test");

onmessage = event => {
    let value = event.data.value;
    switch (event.data.type) {
        case "increment":
            postMessage(++value);
            break;
        case "buffer":
            if (value instanceof ArrayBuffer) {
                postMessage(value);
            }
            break;
        case "object":
            if (value instanceof Object) {
                postMessage(value);
            }
            break;
    }
};
