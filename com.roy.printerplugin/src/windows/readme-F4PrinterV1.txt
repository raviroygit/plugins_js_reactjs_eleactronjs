For importing print file use this line
const { listPrinter, initPrinter, printCommand } = require('com.factionfour.printerplugin/src/windows/F4PrinterV1.js');

Need to call init function before calling anyother function
initPrinter(mainWindow);
mainWindow --> it is the object of main electron window

Listing printer example

 const listPrinterCallback = function (result) {
		 console.log("printer list",result);

};
listPrinter(listPrinterCallback);



call this function for printing any window
 printCommand(printerName, win, function (result) {
                console.log(result, "printer function");
 })

printerName --> It is the selected printer name
win --> it is the window object that needs to be print



