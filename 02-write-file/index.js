const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { stdin:input } = process;
const output = fs.createWriteStream(path.join(__dirname, 'text.txt'));

console.log('Give me some text!');

const r1 = readline.createInterface({input, output});


r1.on('line', (input) => {
  if (input === 'exit') {
    r1.close();
  } else {
    output.write(input + '\n');
  }
});

process.on('SIGINT', () => {
  r1.close();
})

r1.on('close', () => {
  console.log('Thanks for input!');
})

