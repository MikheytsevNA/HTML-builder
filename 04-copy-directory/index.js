const fs = require('fs');
const path = require('path');

const pathSource = path.join(__dirname, 'files'); //from this folder
const pathTarget = path.join(__dirname, 'files-copy'); //to this folder

async function copyDir(pathSource, pathTarget) {
  // create empty copy of target directory
  try { // for fs.promises/access behaviour on fail promise
    await fs.promises.access(pathTarget); 
    await fs.promises.rm(pathTarget, { recursive: true, force: true });
  } catch {}
  await fs.promises.mkdir(pathTarget);

  // copy from source to target
  const files = await fs.promises.readdir(pathSource);
  for (let file of files) {
    await fs.promises.copyFile(path.join(pathSource, file), path.join(pathTarget, file));
  }
}

copyDir(pathSource, pathTarget);
