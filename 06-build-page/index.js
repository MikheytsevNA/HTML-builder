const fs = require('fs');
const path = require('path');
const rl = require('readline');
const pathToTemplate = path.join(__dirname, 'template.html');
const pathToComponents = path.join(__dirname, 'components');
const keywords = ['{{articles}}', '{{footer}}', '{{header}}'].sort();
const pathToBuild = path.join(__dirname, 'project-dist');

fs.promises.mkdir(pathToBuild, {recursive: true}).then();

let readStream = fs.createReadStream(pathToTemplate, 'utf-8');
let writeStream = fs.createWriteStream(path.join(pathToBuild, 'index.html'), 'utf-8');
let templateCopy = '';
let allTags = [];

fs.promises.readFile(pathToTemplate, 'utf-8')
.then( (data) => {
  templateCopy += data;
})
.then(() => {
  templateCopy = templateCopy.split('\n');
  console.log(findTag(templateCopy, keywords, allTags, 0));
})

function findTagInLine(tags, line) {
  let count = 0;
  for (let tag of tags) {
    if (line.includes(tag)) {
      return count;
    }
    count += 1;
  }
  return -1;
}

function findTag(text, tags, allTags, lineIndex) {
  let count = lineIndex;
  let newText = [];
  let isFound = false;
  for (let line of text) {
    let foundTag = findTagInLine(tags, line);
    if (isFound) {
      newText.push(line)
    } else if (foundTag != -1) {
      let index = line.indexOf(tags[foundTag]);
      if (allTags.length != 0) {
        if (count == allTags.at(-1)[0]) {
          index += allTags.at(-1)[1] + allTags.at(-1)[2].length;
        }
      }
      newText.push(line.slice(index + tags[foundTag].length));
      allTags.push([count, index, tags[foundTag]]);
      isFound = true;
    } else {
      count += 1;
    }
  }
  if (!isFound) {
    return allTags;
  }
  return findTag(newText, tags, allTags, count)
}

// merging .css
function mergeCss(pathToFolder) {
  let writeStream = fs.createWriteStream(path.join(__dirname, 'project-dist', 'style.css'))

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
}

mergeCss(path.join(__dirname, "styles"));

// copy assets
const pathSource = path.join(__dirname, 'assets'); //from this folder
const pathTarget = path.join(__dirname, 'project-dist', 'assets'); //to this folder
fs.promises.mkdir(pathTarget, {recursive: true}).then();

function copyDir(pathSource, pathTarget) { // recursive copy dir
  // empty folder
  fs.promises.readdir(pathTarget)
    .then((files) => {
      for (let file of files) {
        fs.promises.unlink(path.join(pathTarget, file)).then();
      }
    })
  // copy from source to target
  fs.promises.readdir(pathSource)
    .then((files) => {
      for (let file of files) {
        if (path.extname(file).length === 0) {
          fs.promises.mkdir(path.join(pathTarget, file), {recursive: true}).then();
          copyDir(path.join(pathSource, file), path.join(pathTarget, file))
        } else {
          fs.promises.copyFile(path.join(pathSource, file), path.join(pathTarget, file)).then();
        }
      }
    })
}

copyDir(pathSource, pathTarget);