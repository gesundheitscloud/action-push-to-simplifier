const fs = require('fs')
const https = require('https')
// Action modules
const core = require('@actions/core')
const github = require('@actions/github')
// node_modules
const archiver = require('node-zip')

// create a file to stream archive data to.
var output = fs.createWriteStream(__dirname + '/simplifier.zip');
//Set the compression format to zip
var archive = archiver('zip');

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on('close', function() {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see:   https://nodejs.org/api/stream.html#stream_event_end
output.on('end', function() {
    console.log('Data has been drained');
});

// good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});
// pipe archive data to the file
archive.pipe(output);

try {
  const directories = core.getInput('directories')
  directories.forEach((directory) => {
    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(directory, false);

    // fs.readdir(`${__dirname}/${directory}/`, (err, files) => {
    //   files.forEach(file => {
    //     const filePath = `${__dirname}/${directory}/${file}`
    //     archive.append(fs.createReadStream(filePath), { name: file })
    //   });
    // });
  })

  await archive.finalize();

  let zipFile = fs.readFileSync(__dirname + "/simplifier.zip", {encoding: 'utf8'})

  https.request({
    hostname: 'https://api.simplifier.net',
    path: '/TestProject44/zip',
    method: 'POST',
    headers:{
      "Content-Type": "application/zip"
    },
    body: zipFile,
  }, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.');
    });
  });

} catch (e) {
  console.log(e)
}