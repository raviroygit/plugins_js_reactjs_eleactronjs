
var exec = require("cordova/exec");

var windowsHello = function() {
    this.isAvailable = function(success,failure) {
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
            },"windowsHello","isAvailable");

    };
    
    this.verifyUser = function(userName,success,failure) {
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
                
            },"windowsHello","verifyUser",[userName]);

    };
	
	this.enrollUser = function(userName,success,failure) {
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
                
            },"windowsHello","enrollUser",[userName]);

    };
	
}
window.plugins.windowsHello = new windowsHello();
module.exports = windowsHello;
