const { BrowserWindow, dialog, app } = require('electron');
const path = require('path');
const fs = require("fs");

var splash;
const startSplashscreen = () => {

    fs.access(`${path.join(__dirname, `../../../../resources/splash/splash.html`)}`, function (error) {
        if (error) {
            process.on("uncaughtException", (err) => {
                const messageBoxOptions = {
                    type: "error",
                    title: "Error in com.factionfour.splashscreen",
                    message: "path resources/splash/splash.html for splashscreen doesn't exist!"
                };
                dialog.showMessageBoxSync(messageBoxOptions);
                app.exit(1);
            });
        } else {
            splash = new BrowserWindow({ width: 800, height: 600, frame: false });
            splash.loadURL(`file://${path.join(__dirname, `../../../../resources/splash/splash.html`)}`);
        }
    })

};

const stopSplashscreen = async (delay) => {
    return new Promise(async (Resolve) => {
        const stop = () => {
            Resolve(splash.destroy())
        }
        await setTimeout(stop, delay ? delay : 2000);
    })

}


module.exports = { startSplashscreen, stopSplashscreen };