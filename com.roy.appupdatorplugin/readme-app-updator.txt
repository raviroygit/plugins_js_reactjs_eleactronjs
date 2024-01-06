<=================== How to use ================>

1) const { updateInitiator } = require('com.factionfour.appupdatorplugin/index');

2)  call when aap ready  updateInitiator(mainWindow);
   example:app.whenReady().then(() => {
    try {
        updateInitiator(mainWindow);

       } catch (err) {
       console.log("handle error");
      }
     }

3)  mainWindow is a electron browserWindow 


<============= Package.json configuaration ============>

1) added below code in package.json file
 "nsis": {
      "artifactName": "${productName}-Setup-${version}.${ext}",
      "oneClick": false,
      "perMachine": true,
      "allowElevation": false,
      "allowToChangeInstallationDirectory": true,
      "menuCategory": true,
      "deleteAppDataOnUninstall": true,
      "runAfterFinish": true,
      "differentialPackage": false
    },
    "win": {
      "target": "nsis",
      "publisherName": "Dipole",
      "publish": {
        "provider": "generic",
        "url": "http://127.0.0.1:8000/update"
      }
    },