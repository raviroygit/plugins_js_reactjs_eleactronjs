
var exec = require("cordova/exec");

var F4Printer = function() {
    this.getPrinter = function(address,success,failure) {
        cordova.exec(
           function successHandler(data) {
                if (success!= null) {
                    success(data);
                }
            },
           function errorHandler(err) {
               if (failure!= null) {
                    failure(err);
                }
            },"F4Printer","getPrinter",[address]);

    }
    
    this.print = function(content,type, success,failure) {
        if (type == "ZPL") {
            cordova.exec(
                function successHandler(data) {
                    if (success!= null) {
                        success(data);
                    }
                },
                function errorHandler(err) {
                    if (failure!= null) {
                        failure(err);
                    }

                },"F4Printer","printZPL",[content]);
        }
        if (type == "PDF") {
            cordova.exec(
                function successHandler(data) {
                    if (success!= null) {
                        success(data);
                    }
                },
                function errorHandler(err) {
                    if (failure!= null) {
                        failure(err);
                    }

                },"F4Printer","printFile",[content]);
        }

    }
}
module.exports = F4Printer;
