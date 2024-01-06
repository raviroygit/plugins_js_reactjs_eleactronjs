const fs = require('fs');
const axios = require('axios');

const upload = async (options, callback, progressResult) => {
    try {
        var formData = new FormData();
        formData.append('file', fs.createReadStream(options.filepath));
        const response = await axios.post(options.url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (callback) callback(response.data);
        if (progressResult) {
            const totalLength = response.data.headers['content-length']
            response.data.on('data', (chunk) => {
                let percentCompleted = Math.floor(chunk.length / parseFloat(totalLength) * 100) + "%";
                progressResult(percentCompleted)
            })
        };
    } catch (err) {
        if (callback) callback(err + " Something went wrong!");
    }

};

const download = (options, callback, progressResult) => {
    try {
        let writer;
        const wirterFile = (response) => {
            let outputLocation = options.location;
            if (options.url.includes('.')) {
                outputLocation = outputLocation + "\\" + options.url.split('/')[(options.url.split('/').length) - 1]
            } else {
                outputLocation = outputLocation + response.headers['content-disposition'].replace("attachment;filename=", "").replaceAll('"', "")
            }
            writer = fs.createWriteStream(outputLocation);
            response.pipe(writer);
        }
        return axios({
            method: 'get',
            url: options.url,
            responseType: 'stream',
        }).then(response => {
            return new Promise((resolve, reject) => {
                if (progressResult) {
                    const totalLength = response.data.headers['content-length']
                    response.data.on('data', (chunk) => {
                        let percentCompleted = Math.floor(chunk.length / parseFloat(totalLength) * 100) + "%";
                        progressResult(percentCompleted)
                    })
                };

                wirterFile(response.data)
                let error = null;
                writer.on('error', err => {
                    if (callback) callback(err);

                    error = err;
                    writer.close();
                    reject(err);
                });
                writer.on('close', () => {
                    if (!error) {
                        if (callback) callback("file downloaded successfully!");

                        resolve(true);
                    }
                });
            });
        });
    } catch (err) {
        if (callback) callback(err + " Something went wrong!");
    }
}



module.exports = {
    upload,
    download
}