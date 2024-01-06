const path = require('path')
const initiateWindowsHello = (username,callback) => {
        require('child_process').execFile(path.join(__dirname,'../resources/windowshello.exe'), ["0", `${username}`], async function (err, data) {
            if (JSON.parse(data).Status) {
                callback(JSON.parse(data));
            } else {
                callback(JSON.parse(data));
            }
        });
    
};

module.exports = {initiateWindowsHello};