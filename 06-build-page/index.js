const fs = require('fs');
const fsP = require('fs/promises');
const path = require('path');

async function deleteIfExists(pathToBuild) {
  try {
    await fsP.access(pathToBuild);
    await fsP.rm(pathToBuild, { recursive: true, force: true });
  } catch {}
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
  const tags = await discoverTag(copy);
  return [copy.split('\n'), tags];
}

function discoverTag(text) {
  const regex = /{{([a-z]+)}}/gm;
  let allTags = [];
  let count = 0;
  for (let line of text.split('\n')) {
    for (let match of line.matchAll(regex)) {
      allTags.push([count, match.index, match[0]])
    };
    count+=1;
  }
  return allTags;
}

async function pasteInsteadOfTags(text, tags, components) {
  let count = 1;
  for (let tag of tags.reverse()) {
    const componentContent = await fsP.readFile(path.join(components, tag[2].slice(2, tag[2].length - 2)) + '.html', 'utf-8');
    if (count <= tags.length - 1) {
      if (tag[0] === tags[count][0]){// in repeating tag
        text[tag[0]] = text[tag[0]].slice(0, tag[0]+2);
        text.splice(tag[0]+1,0, ...componentContent.split('\n').map((line) => ' '.repeat(tags[count][1]) + line));
      } else { // in NOT repeating tag
        text.splice(tag[0],1, ...componentContent.split('\n').map((line) => ' '.repeat(tag[1]) + line));
      }   
    } else { //for first tag
      text.splice(tag[0],1, ...componentContent.split('\n').map((line) => ' '.repeat(tag[1]) + line));
    }
    count += 1;
  }
  return text;
}


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