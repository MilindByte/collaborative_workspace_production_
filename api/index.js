// API route handler that imports the compiled serverless function
const handler = require('../dist/serverless').default;

module.exports = handler;
