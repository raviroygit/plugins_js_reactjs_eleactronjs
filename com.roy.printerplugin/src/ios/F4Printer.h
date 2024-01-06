//
//  F4Printer.h
//
//  Created by Shawn Rehill on 2-DEC-2015.
//

#import <Cordova/CDVPlugin.h>

@interface F4Printer : CDVPlugin
- (void) printZPL :(CDVInvokedUrlCommand *)command;
- (void) printFile :(CDVInvokedUrlCommand *)command;
- (void) getPrinter :(CDVInvokedUrlCommand *)command;
@end
