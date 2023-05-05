const fs = require('fs');
const path = require('path');

const pathToFolder = path.join(__dirname, "styles");

let writeStream = fs.createWriteStream(path.join(__dirname, 'project-dist', 'bundle.css'))

fs.promises.readdir(
  pathToFolder,
  {withFileTypes: true},
)
.then(
  (files) => {
    for (let file of files) {
      let ext = path.extname(file.name).slice(1);
      if (ext === 'css') {
        let dataFile = '';
        let readableStream = fs.createReadStream(path.join(pathToFolder, file.name), 'utf-8');
        readableStream.on('data', chunk => {
          dataFile += chunk;
        });
        readableStream.on('end', () => {
          writeStream.write(dataFile);
        });
      }
    }
  }
)