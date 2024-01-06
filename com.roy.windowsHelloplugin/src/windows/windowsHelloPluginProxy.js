cordova.commandProxy.add("windowsHello",{
    isAvailable:function(successCallback,errorCallback) {
        SmartSquadAuth.Auth.isAvailable().done(function(result) {
			if(result.toUpperCase().indexOf("ERROR") == 0) {
				errorCallback(result);
			}
			else {
				successCallback(result);
			}
		});
    },
	
	verifyUser:function(successCallback,errorCallback,userName) {
        SmartSquadAuth.Auth.verifyUser(userName).done(function(result) {
			if(result.toUpperCase().indexOf("ERROR") == 0) {
				errorCallback(result);
			}
			else {
				successCallback(result);
			}
		});
    },
	
	enrollUser:function(successCallback,errorCallback,userName) {
        SmartSquadAuth.Auth.enrollUser(userName).done(function(result) {
			if(result.toUpperCase().indexOf("ERROR") == 0) {
				errorCallback(result);
			}
			else {
				successCallback(result);
			}
		});
    }
});