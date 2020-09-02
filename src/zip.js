const fs = require("fs");

const archiver = require("archiver");

async function zipDirs(outputPath, directories) {
  return new Promise((resolve, reject) => {
    // create a file to stream archive data to.
    var output = fs.createWriteStream(outputPath);
    //Set the compression format to zip
    var archive = archiver("zip");

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on("close", function () {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "archiver has been finalized and the output file descriptor has closed."
      );

      const stats = fs.statSync(outputPath);
      const fileSizeInBytes = stats.size;

      resolve({
        zipFileStream: fs.createReadStream(outputPath),
        fileSizeInBytes,
      });
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see:   https://nodejs.org/api/stream.html#stream_event_end
    output.on("end", function () {
      console.log("Data has been drained");
    });

    // good practice to catch this error explicitly
    archive.on("error", function (err) {
      throw err;
    });
    // pipe archive data to the file
    archive.pipe(output);

    directories.forEach((directory) => {
      // append files from a sub-directory, putting its contents at the root of archive
      archive.directory(directory, false);
    });
    archive.finalize();
  });
}

module.exports = { zipDirs };
