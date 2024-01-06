const dns = require('dns');
const os = require('os');
const { TYPES } = require('./Connection');

const checkInternet = (callback) => {
    dns.lookup('google.com', function (err) {
        if (err && err.code == "ENOTFOUND") {
            callback("Offline");
        } else {
          TYPES.map(type=>{
            if(Object.keys(os.networkInterfaces()).includes(type)){
                callback(type)
            }
          })            
        }
    })
}


module.exports = checkInternet;
