const fs = require('fs');
const fsP = require('fs/promises');
const path = require('path');

async function deleteIfExists(pathToBuild) {
  try {
    await fsP.access(pathToBuild);
    await fsP.rm(pathToBuild, { recursive: true, force: true });
  } catch {
    console.log('folder was not there');
  }
}


async function createBuild(pathToBuild) {
  await deleteIfExists(pathToBuild);
  await fsP.mkdir(pathToBuild);
}

async function buildHTML(pathToBuild, pathToTemplate, pathToComponents) {
  let [templateCopy, foundTags] = await makeTemplateCopyAndTags(pathToTemplate);
  templateCopy = await pasteInsteadOfTags(templateCopy, foundTags, pathToComponents)
  writeStream = fs.createWriteStream(path.join(pathToBuild, 'index.html'), 'utf-8');
  writeStream.write(templateCopy.join('\n'));
}

async function makeTemplateCopyAndTags(pathToTemplate) {
  const copy = await fsP.readFile(pathToTemplate, 'utf-8')
  const tags = await findTag(copy.split('\n'), discoverTag(copy), [], 0);
  return [copy.split('\n'), tags];
}

function discoverTag(text) {
  const regex = /{{([a-z]+)}}/gm;
  return text.match(regex)
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

async function pasteInsteadOfTags(text, tags, components) {
  for (let tag of tags.reverse()) {
    const componentContent = await fsP.readFile(path.join(components, tag[2].slice(2, tag[2].length - 2)) + '.html', 'utf-8');
    text.splice(tag[0],1, ...componentContent.split('\n').map((line) => ' '.repeat(tag[1]) + line));
  }
  return text;
}


// merging .css
function mergeCss(pathToFolder) {
  let writeStream = fs.createWriteStream(path.join(__dirname, 'project-dist', 'style.css'))
  fsP.readdir(
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

// copy assets

async function copyAssets(pathSource, pathTarget) { // recursive copy dir
  await fsP.mkdir(pathTarget);
  const files = await fsP.readdir(pathSource);
  for (let file of files) {
    if (path.extname(file).length === 0) {
      copyAssets(path.join(pathSource, file), path.join(pathTarget, file))
    } else {
      fsP.copyFile(path.join(pathSource, file), path.join(pathTarget, file));
    }
  }
}

async function main() {
  const pathToTemplate = path.join(__dirname, 'template.html');
  const pathToComponents = path.join(__dirname, 'components');
  const pathToStyles = path.join(__dirname, 'styles');
  const pathToBuild = path.join(__dirname, 'project-dist');
  const pathSourceAssets = path.join(__dirname, 'assets');
  const pathTargetAssets = path.join(__dirname, 'project-dist', 'assets');
  try {
    await createBuild(pathToBuild, pathTargetAssets);
    await buildHTML(pathToBuild, pathToTemplate, pathToComponents);
    await mergeCss(pathToStyles);
    await copyAssets(pathSourceAssets, pathTargetAssets);
  } catch (err) {
    await deleteIfExists(pathToBuild);
    throw err;
  }
}


main();