const fs = require('fs');
const path = require('path');
const { stdout } = process;

const pathToDir = path.join(__dirname, 'secret-folder');

(async () => {
  try {
    let files = await fs.promises.readdir(pathToDir, {withFileTypes: true});
    for (let file of files) {
      let name = '';
      let ext = '';
      if (file.isFile()) {
        name = (path.parse(file.name).name + ' - ');
        ext = (path.extname(file.name).slice(1) + ' - ');
        const stats = await fs.promises.stat(path.join(pathToDir, file.name))
        console.log(name + ext + stats.size + " B");
      }
    }
  } catch {}
})();