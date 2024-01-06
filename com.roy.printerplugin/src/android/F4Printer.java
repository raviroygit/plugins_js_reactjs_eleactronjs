package com.factionfour.F4Printer;


import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.util.Log;
import android.util.Base64;
import android.os.Handler;
import android.os.Message;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothClass.Device.Major;

//ZEBRA
import com.zebra.sdk.comm.BluetoothConnectionInsecure;
import com.zebra.sdk.comm.BluetoothConnection;
import com.zebra.sdk.comm.Connection;
import com.zebra.sdk.comm.ConnectionException;
import com.zebra.sdk.printer.PrinterLanguage;
import com.zebra.sdk.printer.SGD;
import com.zebra.sdk.printer.ZebraPrinterFactory;
import com.zebra.sdk.printer.PrinterStatus;
import com.zebra.sdk.printer.ZebraPrinterLanguageUnknownException;

//BROTHER
//import com.brother.ptouch.sdk.PrinterStatus;

//import com.dascom.print.connection.BluetoothConnection;
import com.brother.ptouch.sdk.Printer;
import com.brother.ptouch.sdk.PrinterInfo;
import com.brother.ptouch.sdk.LabelInfo;

//PRINTEK
//import com.dascom.print.BasePrint;
import com.dascom.print.ESCPOS;
import com.dascom.print.ZPL;
import com.dascom.print.connection.IConnection;
import com.dascom.print.utils.BluetoothUtils;
//import com.dascom.print.SmartPrint;

public class F4Printer extends CordovaPlugin {

    public static final String PRINTZPL_LABEL = "printZPL";
    public static final String PRINTFILE_LABEL = "printFile";
    public static final String GETPRINTER_LABEL = "getPrinter";
    private BluetoothConnectionInsecure connection = null;
    private String serialNumber;
    private String macaddress;
    private String printerName;
    private String printerType;
    private BluetoothAdapter mBluetoothAdapter = null;
    CallbackContext callbackContext=null;

    public F4Printer() {

    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        if (PRINTZPL_LABEL.equals(action)) {
            String label = args.getString(0);
            printZPL(label, callbackContext);
            return true;
        }
        if (PRINTFILE_LABEL.equals(action)) {
            String label = args.getString(0);
            printFile(label, callbackContext);
            return true;
        }
        if (GETPRINTER_LABEL.equals(action)) {
            macaddress = args.getString(0);
            getPrinter(macaddress,callbackContext);
            return true;
        }
        return false;
    }


    private void getPrinter(String macaddress, CallbackContext callbackContext) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                if (mBluetoothAdapter == null) {
                    mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
                }
                if (mBluetoothAdapter == null) {
                    callbackContext.error("Bluetooth is not supported");
                }
                else if (!mBluetoothAdapter.isEnabled()) {
                    callbackContext.error("Bluetooth is not enabled");
                }
                else {
                    Log.d("F4Printer","Attempting to connect to printer " + macaddress);
                    try {
                        if (connection == null) {
                            connection = new BluetoothConnectionInsecure(macaddress);
                            connection.open();
                        }
                        else if (!connection.isConnected()) {
                            connection.open();
                        }
                        if (connection.isConnected()) {
                            Log.d("F4Printer","printer connected");
                            printerName = connection.getFriendlyName();

                            if (printerName.startsWith("ZQ")) {
                                printerType = "ZEBRA";
                                callbackContext.success(macaddress);
                            }
                            else if (printerName.startsWith("ZE")) {
                                printerType = "ZEBRA";
                                callbackContext.success(macaddress);
                            }
                            else if (printerName.startsWith("BR")) {
                                connection.close();
                                printerType = "BROTHER";
                                callbackContext.success(macaddress);
                            }
                            else if (printerName.startsWith("PJ")) {
                                connection.close();
                                printerType = "BROTHER";
                                callbackContext.success(macaddress);
                            }
                            else if (printerName.startsWith("RJ")) {
                                connection.close();
                                printerType = "BROTHER";
                                callbackContext.success(macaddress);
                            }
                            else if (printerName.startsWith("PR")) {
                                connection.close();
                                printerType = "PRINTEK";
                                callbackContext.success(macaddress);
                            }
                            else if (printerName.startsWith("I-820")) {
                                connection.close();
                                printerType = "PRINTEK";
                                callbackContext.success(macaddress);
                            }
                            else {
                                //printerType = "ZEBRA";
                                //callbackContext.success(macaddress);
                                callbackContext.error("Printer type not identifyable by name");
                            }
                        }
                        else {
                            connection.close();
                            connection = null;
                            Log.d("F4Printer","printer is not connected");
                            callbackContext.error("No bluetooth printer connected.");
                        }
                        //connection.close();

                    } catch (ConnectionException e) {
                        connection = null;
                        callbackContext.error(e.getMessage());
                    } finally {

                    }
                }
            }
        }).start();

    }

    private void printZPL(String label, CallbackContext callbackContext) {
        if (printerType == "ZEBRA") {
            printZPL_Zebra(label.getBytes(), callbackContext);
        }
        if (printerType == "BROTHER") {
            printZPL_Brother(label.getBytes(), callbackContext);
        }
        if (printerType == "PRINTEK") {
            printZPL_Printek(label, callbackContext);
        }
    }

    private void printFile(String filePath, CallbackContext callbackContext) {
        if (printerType == "ZEBRA") {
            printFile_Zebra(filePath, callbackContext);
        }
        if (printerType == "BROTHER") {
            printFile_Brother(filePath, callbackContext);
        }
        if (printerType == "PRINTEK") {
            printFile_Printek(filePath, callbackContext);
        }
    }

    //ZEBRA PRINTING
    private void printZPL_Zebra(byte[] labelData, CallbackContext callbackContext) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {

                    //if a Zebra printer
                    com.zebra.sdk.printer.ZebraPrinter printer = ZebraPrinterFactory.getInstance(PrinterLanguage.ZPL, connection);

                    //check printer status
                    PrinterStatus printerStatus = printer.getCurrentStatus();
                    if (printerStatus.isReadyToPrint) { //print
                        connection.write(labelData);
                        Thread.sleep(2000); // Make sure the data got to the printer before closing the connection
                        callbackContext.success("");
                    } else if (printerStatus.isPaused) {
                        callbackContext.error("Cannot Print - printer is paused.");
                    } else if (printerStatus.isHeadOpen) {
                        callbackContext.error("Cannot Print - printer door is open.");
                    } else if (printerStatus.isPaperOut) {
                        callbackContext.error("Cannot Print - out of paper.");
                    } else {
                        connection.close();
                        connection = null;
                        callbackContext.error("Cannot Print - unknown error.");
                    }
                    //connection.close();

                } catch (ConnectionException e) {
                    connection = null;
                    callbackContext.error(e.getMessage());
                } catch (InterruptedException e) {
                    callbackContext.error(e.getMessage());
                } finally {

                }
            }
        }).start();
    }

    private void printFile_Zebra(String filePath, CallbackContext callbackContext) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {

                    //if a Zebra printer
                    com.zebra.sdk.printer.ZebraPrinter printer = ZebraPrinterFactory.getInstance(connection);
                    String newFilePath = filePath;

                    newFilePath = newFilePath.startsWith("file:///") ? newFilePath.substring(8) : newFilePath;

                    //check printer status
                    PrinterStatus printerStatus = printer.getCurrentStatus();
                    if (printerStatus.isReadyToPrint) { //print
                        String scale = scalePrintZebra(connection);

                        SGD.SET("apl.settings",scale,connection);
                        printer.sendFileContents(newFilePath);

                        callbackContext.success("");
                    } else if (printerStatus.isPaused) {
                        callbackContext.error("Cannot Print - printer is paused.");
                    } else if (printerStatus.isHeadOpen) {
                        callbackContext.error("Cannot Print - printer door is open.");
                    } else if (printerStatus.isPaperOut) {
                        callbackContext.error("Cannot Print - out of paper.");
                    } else {
                        connection.close();
                        connection = null;
                        callbackContext.error("Cannot Print - unknown error.");
                    }


                } catch (ConnectionException e) {
                    connection = null;
                    callbackContext.error(e.getMessage());
                } catch (ZebraPrinterLanguageUnknownException e) {
                    callbackContext.error(e.getMessage());

                } finally {

                }
            }
        }).start();
    }

    // Takes the size of the pdf and the printer's maximum size and scales the file down
    private String scalePrintZebra (Connection connection) throws ConnectionException {
        //int fileWidth = 841; points
        int fileWidth = 11;
        String scale = "dither scale-to-fit";

        if (fileWidth != 0) {
            String printerModel = SGD.GET("device.host_identification",connection).substring(0,5);
            double scaleFactor;
/*
            if (printerModel.equals("iMZ22")||printerModel.equals("QLn22")||printerModel.equals("ZD410")) {
                scaleFactor = 2.0/fileWidth*100;
            } else if (printerModel.equals("iMZ32")||printerModel.equals("QLn32")||printerModel.equals("ZQ510")) {
                scaleFactor = 3.0/fileWidth*100;
            } else if (printerModel.equals("QLn42")||printerModel.equals("ZQ520")||
                    printerModel.equals("ZD420")||printerModel.equals("ZD500")||
                    printerModel.equals("ZT220")||printerModel.equals("ZT230")||
                    printerModel.equals("ZT410")) {
                scaleFactor = 4.0/fileWidth*100;
            } else if (printerModel.equals("ZT420")) {
                scaleFactor = 6.5/fileWidth*100;
            } else {
                scaleFactor = 100;
            }
            */
            scaleFactor = 100;

            scale = "dither scale=" + (int) scaleFactor + "x" + (int) scaleFactor;
        }

        return scale;
    }

    //BROTHER PRINTING
    private void printZPL_Brother(byte[] labelData, CallbackContext callbackContext) {
        this.callbackContext=callbackContext;
        // Specify printer
        final Printer printer = new Printer();
        PrinterInfo settings = printer.getPrinterInfo();
        printer.setBluetooth(BluetoothAdapter.getDefaultAdapter());
        settings.port = PrinterInfo.Port.BLUETOOTH;
        settings.macAddress = macaddress;

        // Connect, then print
        new Thread(new Runnable() {
            @Override
            public void run() {
                if (printer.startCommunication()) {
                    com.brother.ptouch.sdk.PrinterStatus result = printer.sendBinary(labelData);

                    if (result.errorCode != PrinterInfo.ErrorCode.ERROR_NONE) {
                        Log.d("F4Printer", "PRINT ERROR - " + result.errorCode);
                    }


                    if (result.errorCode == PrinterInfo.ErrorCode.ERROR_NOT_SAME_MODEL) {
                        callbackContext.error("Cannot Print - incorrect printer model.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_PAPER_EMPTY) {
                        callbackContext.error("Cannot Print - out of paper.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_BATTERY_EMPTY) {
                        callbackContext.error("Cannot Print - battery is drained.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_OVERHEAT) {
                        callbackContext.error("Cannot Print - overheating.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_PAPER_JAM) {
                        callbackContext.error("Cannot Print - paper jam.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_COVER_OPEN) {
                        callbackContext.error("Cannot Print - cover open.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_PAPER_EMPTY || result.errorCode == PrinterInfo.ErrorCode.ERROR_FEED_OR_CASSETTE_EMPTY) {
                        callbackContext.error("Cannot Print - out of paper.");
                    }
                    else if (result.errorCode != PrinterInfo.ErrorCode.ERROR_NONE) {
                        callbackContext.error("Cannot Print - unknown error (code: " + result.errorCode + ")");
                    }
                    else {
                        //success
                        try {
                            Thread.sleep(2000);// Make sure the data got to the printer before closing the connection
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        callbackContext.success("");
                    }


                    printer.endCommunication();
                }
            }
        }).start();

    }

    private void printFile_Brother(String filePath, CallbackContext callbackContext) {
        this.callbackContext=callbackContext;
        // Specify printer
        final Printer printer = new Printer();
        PrinterInfo settings = printer.getPrinterInfo();
        printer.setBluetooth(BluetoothAdapter.getDefaultAdapter());
        settings.port = PrinterInfo.Port.BLUETOOTH;
        settings.macAddress = macaddress;

        String workDir = this.cordova.getActivity().getApplicationInfo().dataDir;
        // Connect, then print
        new Thread(new Runnable() {
            @Override
            public void run() {
                String newFilePath = filePath;
                newFilePath = newFilePath.startsWith("file:///") ? newFilePath.substring(8) : newFilePath;

                PrinterInfo mPrinterInfo = printer.getPrinterInfo();

                mPrinterInfo.printMode=PrinterInfo.PrintMode.FIT_TO_PAGE;


                mPrinterInfo.workPath = workDir;

                if (printerName.startsWith("PJ")) {
                    mPrinterInfo.printerModel = PrinterInfo.Model.PJ_763MFi;
                    mPrinterInfo.paperSize = PrinterInfo.PaperSize.LETTER;
                }
                if (printerName.startsWith("RJ")) {
                    mPrinterInfo.paperSize = PrinterInfo.PaperSize.CUSTOM;
                }

                printer.setPrinterInfo(mPrinterInfo);

                if (printer.getPDFFilePages(newFilePath) <1) {
                    Log.d("F4Printer", "PRINT ERROR - NO PDF PAGES");
                }

                if (printer.startCommunication()) {

                    com.brother.ptouch.sdk.PrinterStatus result = printer.printPdfFile(newFilePath,1);

                    if (result.errorCode != PrinterInfo.ErrorCode.ERROR_NONE) {
                        Log.d("F4Printer", "PRINT ERROR - " + result.errorCode);
                    }


                    if (result.errorCode == PrinterInfo.ErrorCode.ERROR_NOT_SAME_MODEL) {
                        callbackContext.error("Cannot Print - incorrect printer model.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_PAPER_EMPTY) {
                        callbackContext.error("Cannot Print - out of paper.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_BATTERY_EMPTY) {
                        callbackContext.error("Cannot Print - battery is drained.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_OVERHEAT) {
                        callbackContext.error("Cannot Print - overheating.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_PAPER_JAM) {
                        callbackContext.error("Cannot Print - paper jam.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_COVER_OPEN) {
                        callbackContext.error("Cannot Print - cover open.");
                    }
                    else if (result.errorCode == PrinterInfo.ErrorCode.ERROR_PAPER_EMPTY || result.errorCode == PrinterInfo.ErrorCode.ERROR_FEED_OR_CASSETTE_EMPTY) {
                        callbackContext.error("Cannot Print - out of paper.");
                    }
                    else if (result.errorCode != PrinterInfo.ErrorCode.ERROR_NONE) {
                        callbackContext.error("Cannot Print - unknown error (code: " + result.errorCode + ")");
                    }
                    else {
                        //success
                        try {
                            Thread.sleep(2000);// Make sure the data got to the printer before closing the connection
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        callbackContext.success("");
                    }


                    printer.endCommunication();
                }
            }
        }).start();

    }


    //PRINTEK PRINTING

    private volatile IConnection PTconnection = null;
    volatile ESCPOS escpos;
    volatile ZPL zpl;
    //protected BasePrint printLib;

    private void printZPL_Printek(String label, CallbackContext callbackContext) {
        new Thread(() -> {
            BluetoothDevice device = null;
            try {

                device = BluetoothUtils.getBluetoothDevice(macaddress);
                PTconnection = new com.dascom.print.connection.BluetoothConnection(device, true);
                if (PTconnection.connect()) {
                    zpl = new ZPL(PTconnection);
                    zpl.switchToZPL();
                    zpl.setLabelStart();
                    if (!zpl.printText(203,203,1.5,1.5,label)) {
                        zpl.setLabelEnd();
                        callbackContext.error("Cannot Print - failed to send file to printer.");
                        return;
                    }

                    if (PTconnection != null) {
                        PTconnection.disconnect();
                    }

                    callbackContext.success("");

                }
                else {
                    callbackContext.error("Cannot Print - unable to connect to bluetooth device.");
                }

            }
            catch (Exception e) {
                //if (sSmartPrint != null) {
                //    sSmartPrint.DSColseBT();
                //}
                //sSmartPrint = null;
                if (PTconnection != null) {
                    PTconnection.disconnect();
                }
                callbackContext.error(e.getMessage());
            }
        }).start();
    }

    private void printFile_Printek(final String filePath, CallbackContext callbackContext) {
        //this.callbackContext=callbackContext;
        //Activity activity = this.cordova.getActivity();
        new Thread(() -> {
            //SmartPrint sSmartPrint = null;
            BluetoothDevice device = null;
            try {

                device = BluetoothUtils.getBluetoothDevice(macaddress);
                PTconnection = new com.dascom.print.connection.BluetoothConnection(device, true);
                if (PTconnection.connect()) {
                    escpos = new ESCPOS(PTconnection);
                    escpos.switchToPDF();

                    String newFilePath = filePath;

                    newFilePath = newFilePath.startsWith("file:///") ? newFilePath.substring(8) : newFilePath;


                    byte[] buff = new byte[4096];
                    int count;
                    FileInputStream inputStream = new FileInputStream(newFilePath);
                    while ((count = inputStream.read(buff)) > 0) {
                        if (!escpos.printData(buff, count)) {
                            callbackContext.error("Cannot Print - failed to send file to printer.");
                            return;
                        }
                    }
                    inputStream.close();

                    PTconnection.disconnect();

                    callbackContext.success("");
                }
                else {
                    callbackContext.error("Cannot Print - unable to connect to bluetooth device.");
                }


            }
            catch (Exception e) {

                if (PTconnection != null) {
                    PTconnection.disconnect();
                }
                callbackContext.error(e.getMessage());
            }
        }).start();
    }

}

