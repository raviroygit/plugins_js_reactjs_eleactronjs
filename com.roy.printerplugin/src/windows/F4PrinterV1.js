var _mainWindow = null;
var initPrinter = function (mainWindow) {
    _mainWindow = mainWindow;
}


var listPrinter = function (callback) {
    if (_mainWindow) {
        _mainWindow.webContents.getPrintersAsync().then((data) => {
            if (callback) {
                callback(data)
            }
        }).catch((e) => {
            if (callback) {
                callback(e);
            }
        })
    } else {
        if (callback) {
            callback("Please initPrinter first");
        }
    }

}

var printCommand = function (deviceName, windowToPrint, callback) {          
    windowToPrint.webContents.print({ deviceName: deviceName, printBackground: true, silent:true }, function (success) {
        
        if (success) {

            if (callback){
                callback("Print command processed successfully");
            }
        } else {
            if (callback){
                callback("Print command failed");
            }
        }      
    });
}


module.exports = { listPrinter, initPrinter, printCommand };