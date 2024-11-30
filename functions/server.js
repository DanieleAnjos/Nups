const serverless = require('serverless-http');
const app = require('../app');  // Importe o seu app.js

module.exports.handler = serverless(app);  // Torne o app express uma função serverless
