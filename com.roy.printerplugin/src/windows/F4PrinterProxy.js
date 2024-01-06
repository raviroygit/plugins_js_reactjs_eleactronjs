cordova.commandProxy.add("F4Printer",{
    getPrinter:function(successCallback,errorCallback,address) {
        var result = SmartSquadPrinter.Printer.getPrinter(address);
        if(result.toUpperCase().indexOf("ERROR") == 0) {
            errorCallback(result);
        }
        else {
            successCallback(result);
        }
    },
	
	printZPL:function(successCallback,errorCallback,content) {
        var result = SmartSquadPrinter.Printer.printZPL(content);
        if(result.toUpperCase().indexOf("ERROR") == 0) {
            errorCallback(result);
        }
        else {
            successCallback(result);
        }
    },
    
    printFile:function(successCallback,errorCallback,content) {
        var result = SmartSquadPrinter.Printer.printFile(content);
        if(result.toUpperCase().indexOf("ERROR") == 0) {
            errorCallback(result);
        }
        else {
            successCallback(result);
        }
    }
});