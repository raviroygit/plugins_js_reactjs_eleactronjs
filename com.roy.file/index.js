const { writeFile, readFile, appendFile, deleteFile, createDirectory, deleteDirectory, writeStream } = require('./src/windows/file');

module.exports = {
    writeFile,
    readFile,
    appendFile,
    deleteFile,
    createDirectory,
    deleteDirectory,
    writeStream
}