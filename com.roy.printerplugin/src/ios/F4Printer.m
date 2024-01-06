//
//  zebraPrinter.m
//
//  Created by Shawn Rehill on 2-DEC-2015.
//

#import "F4Printer.h"
#import <ExternalAccessory/ExternalAccessory.h>
#import "MfiBtPrinterConnection.h"
#import "ZebraPrinterConnection.h"
#import "ZebraPrinterFactory.h"
#import "PrinterStatus.h"
#import "PrinterStatus.h"
#import <BRPtouchPrinterKit/BRPtouchPrinterKit.h>

@implementation F4Printer

NSString *serialNumber = nil;
NSString *printerName = nil;//used for Brother printer only
NSString *printerType = nil;

- (void) getPrinter:(CDVInvokedUrlCommand *)command
{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^ {
        //serialNumber = [command.arguments objectAtIndex:0]; //this parameter is passed in, but ignored - the plugin sets the serialNumber to the zebra printer

        NSString *tmpSerialNumber = nil;
        NSString *tmpPrinterType = nil;
        NSString *tmpPrinterName = nil;

        //Find the Zebra Bluetooth Accessory
        EAAccessoryManager *sam = [EAAccessoryManager sharedAccessoryManager];
        NSArray * connectedAccessories = [sam connectedAccessories];
        
        NSLog(@"Searching for zebra printer");
        for (EAAccessory *accessory in connectedAccessories) {
            if([accessory.protocolStrings indexOfObject:@"com.zebra.rawport"] != NSNotFound){
                /*There is a ZEBRA PRINTER found*/
                tmpSerialNumber = accessory.serialNumber;
                tmpPrinterName = accessory.name;
                tmpPrinterType = @"ZEBRA";
                break;
            }
        }
        
        if(tmpSerialNumber == nil) {
            NSLog(@"Searching for a brother printer");
            NSArray<BRPtouchDeviceInfo *> *connectedDevicesList = BRPtouchBluetoothManager.sharedManager.pairedDevices;
            
            /*There is a BROTHER PRINTER found*/
            if ([connectedDevicesList count] != 0) {
                BRPtouchDeviceInfo *printerInfo;
                printerInfo = connectedDevicesList.firstObject;
                tmpSerialNumber = printerInfo.strSerialNumber;
                tmpPrinterName = printerInfo.strModelName;
                tmpPrinterType = @"BROTHER";
            }
        }

        if(tmpSerialNumber == nil) {
            serialNumber = nil;
            printerType = nil;
            printerName = nil;
            NSLog(@"No connected printer Found");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"No connected printer Found."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }else{
            serialNumber = tmpSerialNumber;
            printerType = tmpPrinterType;
            printerName = tmpPrinterName;
            NSLog(@"Connected Printer Found - %@", tmpSerialNumber);
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:serialNumber];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    });
}

- (void) printZPL:(CDVInvokedUrlCommand *)command{
    //Dispatch this task to the default queue
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^ {
        if ([printerType  isEqual: @"ZEBRA"]) {
            [self printZPL_Zebra : command];
        }
        if ([printerType  isEqual: @"BROTHER"]) {
            [self printZPL_Brother : command];
        }
    });
}

- (void) printFile:(CDVInvokedUrlCommand *)command{
    //Dispatch this task to the default queue
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^ {
        if ([printerType  isEqual: @"ZEBRA"]) {
            [self printFile_Zebra : command]; //single command for ZPL and File
        }
        if ([printerType  isEqual: @"BROTHER"]) {
            [self printFile_Brother : command];
        }
    });
}

//START ZEBRA PRINTING
- (void) printZPL_Zebra:(CDVInvokedUrlCommand *)command
{
    NSString *labelData = [command.arguments objectAtIndex:0];
    
    // Instantiate connection to Zebra Bluetooth accessory
    id<ZebraPrinterConnection, NSObject> thePrinterConn = [[MfiBtPrinterConnection alloc] initWithSerialNumber:serialNumber];
    
    //BugFix: Due to https://developer.motorolasolutions.com/thread/29893
    //2.5 - 75MS delay & 25MS read delay
    [((MfiBtPrinterConnection*)thePrinterConn) setTimeToWaitAfterWriteInMilliseconds:75];
    [((MfiBtPrinterConnection*)thePrinterConn) setTimeToWaitAfterReadInMilliseconds:25];

    // Open the connection - physical connection is established here.
    BOOL success = [thePrinterConn open];
    
    if(success)
    {
        NSError *error = nil;
        id<ZebraPrinter, NSObject> printer = [ZebraPrinterFactory getInstance:thePrinterConn error:&error];

        PrinterStatus *printerStatus = [printer getCurrentStatus:&error];
        if (printerStatus.isReadyToPrint) {
            NSLog(@"Ready To Print");

            //Send the print job in multiple chunks
            /*
             Sending large amounts of data in a single write command can overflow the NSStream buffers which are the underlying mechanism used by the SDK to communicate with the printers.
             This method shows one way to break up large strings into smaller chunks to send to the printer
            */
            
            /*NSMutableString *tmpLabel =[labelData mutableCopy];
            
            long blockSize = 256;
            long totalSize = labelData.length;
            long bytesRemaining = totalSize;

            while (bytesRemaining > 0) {
                long bytesToSend = MIN(blockSize, bytesRemaining);
                NSRange range = NSMakeRange(0, bytesToSend);
                NSString *partialLabel = [labelData substringWithRange:range];
                [[printer getToolsUtil] sendCommand:partialLabel error:&error];
                bytesRemaining -= bytesToSend;
                [tmpLabel deleteCharactersInRange:range];
                NSLog(@"Sending data block to printer");
            }
            */
            
            //This is a change to only send one string.
            success = [thePrinterConn write:[labelData dataUsingEncoding:NSUTF8StringEncoding] error:&error];
            
            PrinterStatus *status = nil;
            do {
                status = [printer getCurrentStatus:&error];
                if (status == nil) {
                    NSLog(@"MyLog - getCurrentStatus returns nil");
                } else if (status.isReceiveBufferFull) {
                    NSLog(@"MyLog - Receive Buffer is full");
                } else if (status.numberOfFormatsInReceiveBuffer) {
                    NSLog(@"MyLog - There are still %ld jobs in receive buffer", status.numberOfFormatsInReceiveBuffer);
                }
                sleep (1); // Delay by 1 sec. for another iteration of checking

            } while (status == nil || status.numberOfFormatsInReceiveBuffer);

                    
            if (success == YES && error == nil) {
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"OK"];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            } else {
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR    messageAsString:@"Printer Connection and Creation Failed"];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
        } else if (printerStatus.isPaused) {
            NSLog(@"Cannot Print because the printer is paused.");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - printer is paused."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else if (printerStatus.isHeadOpen) {
            NSLog(@"Cannot Print because the printer head is open.");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - printer door is open."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else if (printerStatus.isPaperOut) {
            NSLog(@"Cannot Print because the paper is out.");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - out of paper."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else {
            NSLog(@"Cannot Print due to unknown error.");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - unknown error."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
        // Close the connection to release resources.
        [thePrinterConn close];
        //[thePrinterConn release];
        
    }else{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Printer Connection Failed"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}
    
- (void) printFile_Zebra:(CDVInvokedUrlCommand *)command
{
    NSString *labelData = [command.arguments objectAtIndex:0];
    //NSData *data = [[NSData alloc] initWithBase64EncodedString:labelData options:0];

    // Instantiate connection to Zebra Bluetooth accessory
    id<ZebraPrinterConnection, NSObject> thePrinterConn = [[MfiBtPrinterConnection alloc] initWithSerialNumber:serialNumber];
    
    //BugFix: Due to https://developer.motorolasolutions.com/thread/29893
    //2.5 - 75MS delay & 25MS read delay
    [((MfiBtPrinterConnection*)thePrinterConn) setTimeToWaitAfterWriteInMilliseconds:75];
    [((MfiBtPrinterConnection*)thePrinterConn) setTimeToWaitAfterReadInMilliseconds:25];

    // Open the connection - physical connection is established here.
    BOOL success = [thePrinterConn open];
    
    if(success)
    {
        NSError *error = nil;
        id<ZebraPrinter, NSObject> printer = [ZebraPrinterFactory getInstance:thePrinterConn error:&error];

        PrinterStatus *printerStatus = [printer getCurrentStatus:&error];
        if (printerStatus.isReadyToPrint) {
            NSLog(@"Ready To Print");

            if ([labelData hasPrefix:@"file://"]) {
                labelData = [labelData substringFromIndex:7];
            }
            NSFileManager *fileManager = [NSFileManager defaultManager];

            if ([fileManager fileExistsAtPath:labelData]){
                printf("file exists");
            }
            
            //This is a change to only send one string.
            //success = [thePrinterConn write:data error:&error];
            success = [[printer getFileUtil] sendFileContents:labelData error:&error];
            NSString *debugData = nil;
            
            debugData = [[printer getFileUtil] debugDescription];
        
            PrinterStatus *status = nil;
            do {
                status = [printer getCurrentStatus:&error];
                if (status == nil) {
                    NSLog(@"MyLog - getCurrentStatus returns nil");
                } else if (status.isReceiveBufferFull) {
                    NSLog(@"MyLog - Receive Buffer is full");
                } else if (status.numberOfFormatsInReceiveBuffer) {
                    NSLog(@"MyLog - There are still %ld jobs in receive buffer", status.numberOfFormatsInReceiveBuffer);
                }
                sleep (1); // Delay by 1 sec. for another iteration of checking

            } while (status == nil || status.numberOfFormatsInReceiveBuffer);
            
                    
            if (success == YES && (error == nil || error.code == 7)) {//ZEBRA_MALFORMED_PRINTER_STATUS_RESPONSE this is a workaround for the PDFDirect direct driver having some issues with sending a response sometimes
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"OK"];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            } else {
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR    messageAsString:@"Printer Connection and Creation Failed"];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
        } else if (printerStatus.isPaused) {
            NSLog(@"Cannot Print because the printer is paused.");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - printer is paused."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else if (printerStatus.isHeadOpen) {
            NSLog(@"Cannot Print because the printer head is open.");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - printer door is open."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else if (printerStatus.isPaperOut) {
            NSLog(@"Cannot Print because the paper is out.");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - out of paper."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else {
            NSLog(@"Cannot Print due to unknown error.");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - unknown error."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
        // Close the connection to release resources.
        [thePrinterConn close];
        //[thePrinterConn release];
        
    }else{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Printer Connection Failed"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

// END ZEBRA PRINTING


// START BROTHER PRINTING
- (void) printZPL_Brother:(CDVInvokedUrlCommand *)command{
    NSString *labelString = [command.arguments objectAtIndex:0];
    NSData* labelData = [labelString dataUsingEncoding:NSUTF8StringEncoding];
    bool startPrint = true;
    // Specify printer
    BRPtouchPrinter *printer = [[BRPtouchPrinter alloc] initWithPrinterName:printerName interface:CONNECTION_TYPE_BLUETOOTH];
    [printer setupForBluetoothDeviceWithSerialNumber:serialNumber];

    // Print Settings
    //TODO: Change to load from the app
    BRPtouchPrintInfo *settings = [BRPtouchPrintInfo new];

    //if printer starts with PJ (PocketJet)
    if([printerName hasPrefix:@"PJ"]) {
        settings.strPaperName = @"A4";
        settings.nPrintMode = PRINT_FIT_TO_PAGE;
        [printer setPrintInfo:settings];
    }
    
    //if printer starts is RJ (RuggedJet)
    if([printerName hasPrefix:@"RJ"]) {
        settings.strPaperName = @"CUSTOM";
        settings.nPrintMode = PRINT_FIT_TO_PAGE;
        [printer setPrintInfo:settings];
        
        float tapeWidth = 102.0f;
        float rightMargin = 0.0f;
        float leftMagin = 0.0f;
        float topMargin = 0.0f;
        UnitOfLengthParameter unitOfLengthParameter = Mm;
        BRCustomPaperInfoCommand *customPaperInfoCommand = [[BRCustomPaperInfoCommand alloc] initWithPrinterNameForRoll:printerName
                                                                                                                tapeWidth:tapeWidth
                                                                                                                rightMargin:rightMargin
                                                                                                                leftMagin:leftMagin
                                                                                                                topMargin:topMargin
                                                                                                                unitOfLength:unitOfLengthParameter];
        NSArray *errors = [printer setCustomPaperInfoCommand:customPaperInfoCommand];
        if (errors.count > 0) {
            //NSLog(@"%@", errors);
            //return;
            NSLog(@"Cannot Print due to Printer Paper error: %@",[NSString stringWithFormat:@"%@", errors]);
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - Paper size error"];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            startPrint = false;
        }
    }

    if (startPrint) {
        // Connect, then print
        if ([printer startCommunication]) {

            int errorCode = [printer sendData:labelData];
            
            if (errorCode == ERROR_NOT_SAME_MODEL_) {
                NSLog(@"Cannot Print due to ERROR_NOT_SAME_MODEL_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - incorrect printer model."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_PAPER_EMPTY_) {
                NSLog(@"Cannot Print due to ERROR_PAPER_EMPTY_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - out of paper."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_BATTERY_EMPTY_) {
                NSLog(@"Cannot Print due to ERROR_BATTERY_EMPTY_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - battery is drained."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_OVERHEAT_) {
                NSLog(@"Cannot Print due to ERROR_OVERHEAT_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - overheating."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_PAPER_JAM_) {
                NSLog(@"Cannot Print due to ERROR_PAPER_JAM_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - paper jam."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_COVER_OPEN_) {
                NSLog(@"Cannot Print due to ERROR_COVER_OPEN_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - cover open."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_PAPER_EMPTY_ || errorCode == ERROR_FEED_OR_CASSETTE_EMPTY_) {
                NSLog(@"Cannot Print due to ERROR_PAPER_EMPTY_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - out of paper."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode != ERROR_NONE_) {
                NSLog(@"Cannot Print due to Error: %@",[NSString stringWithFormat:@"%i", errorCode]);
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - unknown error."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else {
                //success
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"OK"];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            
            [printer endCommunication];
            
        }
        else {
            NSLog(@"Cannot connect to printer");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - communications error."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    }
}

- (void) printFile_Brother:(CDVInvokedUrlCommand *)command{
    //NSString *labelString = [command.arguments objectAtIndex:0];
    //NSData *labelData = [[NSData alloc] initWithBase64EncodedString:labelString options:0];
    NSString *labelData = [command.arguments objectAtIndex:0];
    bool startPrint = true;
    
    // Specify printer
    BRPtouchPrinter *printer = [[BRPtouchPrinter alloc] initWithPrinterName:printerName interface:CONNECTION_TYPE_BLUETOOTH];
    [printer setupForBluetoothDeviceWithSerialNumber:serialNumber];

    if ([labelData hasPrefix:@"file://"]) {
           labelData = [labelData substringFromIndex:7];
       }
       NSFileManager *fileManager = [NSFileManager defaultManager];

       if ([fileManager fileExistsAtPath:labelData]){
           printf("file exists");
       }

    // Print Settings
    //TODO: Change to load from the app
    BRPtouchPrintInfo *settings = [BRPtouchPrintInfo new];

    //if printer starts with PJ (PocketJet)
    if([printerName hasPrefix:@"PJ"]) {
        settings.strPaperName = @"A4";
        settings.nPrintMode = PRINT_FIT_TO_PAGE;
        [printer setPrintInfo:settings];
    }
    
    //if printer starts is RJ (RuggedJet)
    if([printerName hasPrefix:@"RJ"]) {
        settings.strPaperName = @"CUSTOM";
        settings.nPrintMode = PRINT_FIT_TO_PAGE;
        [printer setPrintInfo:settings];
        
        float tapeWidth = 102.0f;
        float rightMargin = 0.0f;
        float leftMagin = 0.0f;
        float topMargin = 0.0f;
        UnitOfLengthParameter unitOfLengthParameter = Mm;
        BRCustomPaperInfoCommand *customPaperInfoCommand = [[BRCustomPaperInfoCommand alloc] initWithPrinterNameForRoll:printerName
                                                                                                                tapeWidth:tapeWidth
                                                                                                                rightMargin:rightMargin
                                                                                                                leftMagin:leftMagin
                                                                                                                topMargin:topMargin
                                                                                                                unitOfLength:unitOfLengthParameter];
        NSArray *errors = [printer setCustomPaperInfoCommand:customPaperInfoCommand];
        if (errors.count > 0) {
            //NSLog(@"%@", errors);
            //return;
            NSLog(@"Cannot Print due to Printer Paper error: %@",[NSString stringWithFormat:@"%@", errors]);
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - Paper size error"];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            startPrint = false;
        }
    }


    // Connect, then print
    if (startPrint) {
        if ([printer startCommunication]) {

            int errorCode = [printer printPDFAtPath:labelData pages:0 length:0 copy:1];
            
            if (errorCode == ERROR_NOT_SAME_MODEL_) {
                NSLog(@"Cannot Print due to ERROR_NOT_SAME_MODEL_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - incorrect printer model."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_PAPER_EMPTY_) {
                NSLog(@"Cannot Print due to ERROR_PAPER_EMPTY_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - out of paper."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_BATTERY_EMPTY_) {
                NSLog(@"Cannot Print due to ERROR_BATTERY_EMPTY_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - battery is drained."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_OVERHEAT_) {
                NSLog(@"Cannot Print due to ERROR_OVERHEAT_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - overheating."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_PAPER_JAM_) {
                NSLog(@"Cannot Print due to ERROR_PAPER_JAM_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - paper jam."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_COVER_OPEN_) {
                NSLog(@"Cannot Print due to ERROR_COVER_OPEN_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - cover open."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode == ERROR_PAPER_EMPTY_ || errorCode == ERROR_FEED_OR_CASSETTE_EMPTY_) {
                NSLog(@"Cannot Print due to ERROR_PAPER_EMPTY_.");
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - out of paper."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else if (errorCode != ERROR_NONE_) {
                NSLog(@"Cannot Print due to Error: %@",[NSString stringWithFormat:@"%i", errorCode]);
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - unknown error."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            else {
                //success
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"OK"];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
            
            [printer endCommunication];
            
        }
        else {
            NSLog(@"Cannot connect to printer");
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot Print - communications error."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    }
}
// END BROTHER PRINTING


@end

