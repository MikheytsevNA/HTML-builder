const fs = require('fs');
const path = require('path');
const { stdout } = process;

const pathToDir = path.join(__dirname, 'secret-folder');

fs.promises.readdir(pathToDir, {withFileTypes: true})
  .then((files) => {
    for (let file of files) {
      let sizeBytes = 0;
      let name = '';
      let ext = '';
      if (file.isFile()) {
        name = (path.parse(file.name).name + ' - ');
        ext = (path.extname(file.name).slice(1) + ' - ');
        fs.stat(path.join(pathToDir, file.name), (err, stats) => {
          console.log(name + ext + stats.size);
        });
      }
    }
  })
  .catch(err => {
    console.log(err)
  })
