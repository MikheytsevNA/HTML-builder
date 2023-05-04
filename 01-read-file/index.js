const { stdout } = process;
const fs = require('fs');
const path = require('path');

const pathToTxtFile = path.join(__dirname, 'text.txt');

const readableStream = fs.createReadStream(pathToTxtFile, 'utf-8');
let data = '';
readableStream.on('data', chunk => data += chunk);
readableStream.on('end', () => stdout.write(data));
readableStream.on('error',  error => console.log(error.message));