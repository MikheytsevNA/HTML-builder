const fs = require('fs');
const path = require('path');

const pathSource = path.join(__dirname, 'files'); //from this folder
const pathTarget = path.join(__dirname, 'files-copy'); //to this folder

fs.promises.mkdir(pathTarget, {recursive: true}).then();


// empty folder
fs.promises.readdir(pathTarget)
  .then((files) => {
    for (let file of files) {
      fs.promises.unlink(path.join(pathTarget, file)).then();
    }
  })

// cop from source to target
fs.promises.readdir(pathSource)
  .then((files) => {
    for (let file of files) {
      fs.promises.copyFile(path.join(pathSource, file), path.join(pathTarget, file)).then();
    }
  })
