cordova.commandProxy.add("Serial",{
    requestPermission:function(successCallback,errorCallback, options) {
        var res = SmartSquadDLScanner.Scanner.requestPermission();
        if(res.indexOf("Error") == 0) {
            errorCallback(res);
        }
        else {
            successCallback(res);
        }
    },
	
	openSerial:function(successCallback,errorCallback,options) {
		//var res = "Success";
        var res = SmartSquadDLScanner.Scanner.open(options);
        if(res.indexOf("Error") == 0) {
            errorCallback(res);
        }
        else {
            successCallback(res);
        }
    },
	registerReadCallback:function(successCallback,errorCallback) {
        var res = SmartSquadDLScanner.Scanner.registerReadCallback();
        if(res == null || res.indexOf("Error") == 0) {
            errorCallback(res);
        }
        else {
			//var returnVal = res.replace(/\\n/g, ",\n");
            successCallback(res);
        }
    }
});