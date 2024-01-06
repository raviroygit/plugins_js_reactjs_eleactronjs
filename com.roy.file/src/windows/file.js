var fs = require('fs');


const writeFile = (filepath, data, callback) => {
    fs.stat(filepath, async (err, success) => {
        if (err) {
            fs.writeFile(filepath, data, function (err) {
                try {
                    if (err) {
                        callback(err)
                    };

                    if (callback) {
                        callback("file saved!");
                    };
                } catch (err) {
                    callback("Something went wrong, not able to create file!");
                }

            });
        } else {
            callback("file directory already exists!");
        }
    });


};

const createDirectory = (filepath, callback) => {
    fs.stat(filepath, async (err, success) => {
        if (err) {
            fs.mkdir(filepath, { recursive: true }, function (err) {
                try {
                    if (err) {
                        callback(err)
                    };

                    if (callback) {
                        callback("Directory created.");
                    };
                } catch (err) {
                    callback("Something went wrong, not able to create file!");
                }

            });
        } else {
            callback("file directory already exists!");
        }
    });
}



const readFile = (filepath, callback) => {
    fs.readFile(filepath, function (err, data) {
        try {
            if (callback && err) {
                callback(err)
            };

            if (callback) {
                callback(data);
            }
        } catch (err) {
            if (!data) {
                callback("Something went wrong, not able to read file!");
            }
        }

    });

};

const appendFile = (filepath, data, callback) => {
    fs.appendFile(filepath, data, 'utf8', function (err) {
        try {
            if (callback && err) {
                callback(err)
            };

            if (callback) {
                callback("Data is appended to file successfully.");
            }
        } catch (err) {
            callback("Something went wrong, not able to appended file!");
        }

    });

};

const deleteFile = (filepath, callback) => {
    fs.unlink(filepath, function (err) {
        try {
            if (callback && err) {
                callback(err)
            };

            if (callback) {
                callback("File is deleted successfully.");
            }
        } catch (err) {
            callback("Something went wrong, not able to deleted File!");
        }

    });

};

const deleteDirectory = (filepath, callback) => {
    fs.stat(filepath, async (err, success) => {
        if (success) {
            fs.rmdir(filepath, {recursive: true}, function (err) {
                try {
                    if (callback && err) {
                        callback(err)
                    };

                    if (callback) {
                        callback("Directory is deleted successfully.");
                    }
                } catch (err) {
                    callback("Something went wrong, not able to deleted directory !");
                }

            });
        } else {
            callback('Directory doesn\'t exist!');
        }

    });

};

const writeStream = (filepath,bufferData, callback) => {
    fs.stat(filepath, async (err, success) => {
        if (err) {
            if(Buffer.isBuffer(bufferData)){
                const result= fs.createWriteStream(filepath,{highWaterMark:64*1024}).write(bufferData);
                if(result){
                 callback(result);
                }else{
                 callback("Something went wrong!")
                }
            }else{
                callback("Invalid data, Only buffer data accepted!")
            }
           
        } else {
            callback('Directory doesn\'t exist!');
        }

    });

};

module.exports = {
    writeFile,
    readFile,
    appendFile,
    deleteFile,
    createDirectory,
    deleteDirectory,
    writeStream
}