const { app,dialog,net,BrowserWindow } = require('electron')
const { autoUpdater } = require('electron-updater');
const cp = require('child_process')
const fs = require('fs')
const username = require('os').userInfo().username
const path = require('path')

class ElectronUpdater {
	constructor(options = {}) {
		this.options = this.options = {			
			autoUpdater,
			...options
		};

		if (options.logger) {
			this.options.autoUpdater.logger = this.options.logger;
		}
	}

	get autoUpdater() {
		return this.options.autoUpdater;
	}

	checkUpdate(option = {}) {
		//this.autoUpdater.setFeedURL(option)
		this.autoUpdater.checkForUpdates();
		this.autoUpdater.on("update-available", () => {
			console.log("update-available");
		})
		this.autoUpdater.on('update-not-available', () => {
			console.log('Update not available');
		});
		this.autoUpdater.on('update-downloaded', () => {
			console.log('Update downloaded');
			autoUpdater.quitAndInstall();
		});
	}

	async checkForUpdates(option) {
		this.checkUpdate(option);
	}
}

function splashWindow(mainWindow) {
    splash = new BrowserWindow({
        width: 600,
        height: 400,
        modal: true,
        frame: true,
        alwaysOnTop: false,
        parent: mainWindow,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    });

    splash.loadFile(path.join(__dirname, './splash.html'));
    splash.center();
    mainWindow.hide()

    splash.on('close', function () {
        mainWindow.close()
        app.quit()

    })
}

function updateHandler(mainWindow) {

    const request = net.request('http://localhost:8000/getversion')
    request.on('response', (response) => {

        console.log(`STATUS: ${response.statusCode}`)
        console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
        response.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`)
            if (chunk > app.getVersion()) {
                const dialogOpts = {
                    type: 'question',
                    title: 'Update ready to be installed',
                    message: 'A new update is ready. When would you like to install?',
                    buttons: ['Yes', 'Skip'],
                    defaultId: 0,
                    cancelId: 1,
                };
                dialog.showMessageBox(dialogOpts).then((returnValue) => {
                    if (returnValue.response === 0) {
                        splashWindow(mainWindow)
                        callAutoUpdater();
                    }
                })
            }
        })
        response.on('end', () => {
            console.log('No more data in response.')
        })
    })
    request.end();
}

function callAutoUpdater() {
    const requestDownloadUpdate = net.request('http://localhost:8000/downloadupdate');
    requestDownloadUpdate.on('response', (response) => {
        console.log("donwloadUpdate", response);
        const autoUpdate = new ElectronUpdater();
        autoUpdate.checkForUpdates();
    });
    requestDownloadUpdate.end();
};

const updateInitiator = (mainWindow)=>{
	let dirPath= 'C:/Users/' + username + '/AppData/ElectronUpdate';
	fs.rmSync(dirPath, { force: true, recursive: true });

        fs.mkdir(dirPath, (err) => {
            if (err) {
                console.log(err)
                return;
            }
            cp.fork(path.resolve(__dirname, './server.js'))
            updateHandler(mainWindow);
        });
};


module.exports = {
	ElectronUpdater,
	updateHandler,
	updateInitiator,
	autoUpdate: options => {
		const autoAppUpdater = new ElectronUpdater(options);
		autoAppUpdater.checkForUpdates();
		return autoAppUpdater;
	}
};