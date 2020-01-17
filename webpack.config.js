/*
 * Copyright (c) 2020
 * Author: Marco Castiello
 * E-mail: marco.castiello@gmail.com
 * Project: Worker Async Polyfill
 */

const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'worker-async-polyfill.js',
        path: path.resolve(__dirname, 'dist'),
    }
};
