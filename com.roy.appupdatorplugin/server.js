const express = require('express')
const app = express()
const port = 8000
const ftp = require("basic-ftp")
const yaml = require('js-yaml');
const fs = require('fs')
const path = require('path')
const username = require('os').userInfo().username

let directorypath = 'C:/Users/' + username + '/AppData/ElectronUpdate'

let latestversion

async function latestVersion(req, res, next) {
    
        const client = new ftp.Client()
        client.ftp.verbose = true
        try {
            await client.access({
                host: 'waws-prod-blu-381.ftp.azurewebsites.windows.net',
                user: 'smartsquad\\$smartsquad',
                password: 'rxtnkkdQ85KGhcEQ4CtEarjselwwedMs4Zc2xtaH0B5ccfhmChiy6cNAp7N0',
                port: 990,
                secure: 'implicit',
                secureOptions: { rejectUnauthorized: false }
            })

            await client.downloadTo(directorypath + '/latest.yml', "/site/wwwroot/electron/latest.yml")
            
            let data = yaml.load(fs.readFileSync(directorypath + '/latest.yml', 'utf8'));
            console.log(data)
            latestversion = data.version
            console.log('latestversion',latestversion)
            next()
        }
        catch (err) {
            console.log(err)
        }
        client.close()
    }
    


async function downloadUpdate(req, res, next) {  
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: 'waws-prod-blu-381.ftp.azurewebsites.windows.net',
            user: 'smartsquad\\$smartsquad',
            password: 'rxtnkkdQ85KGhcEQ4CtEarjselwwedMs4Zc2xtaH0B5ccfhmChiy6cNAp7N0',
            port: 990,
            secure: 'implicit',
            secureOptions: { rejectUnauthorized: false }
        })

        await client.downloadToDir(directorypath, "/site/wwwroot/electron")
        next()
    }
    catch (err) {
        console.log(err)
    }
    client.close()
}





// First step is the authentication of the client
app.get('/getversion', latestVersion, (req, res)=> {
    return res.send(latestversion)
})

app.get('/downloadupdate', downloadUpdate, (req, res)=> {
    return res.send("Success")
})

app.use('/update', express.static(directorypath))


app.listen(port, () => console.log(`app is listening on port ${port}`));
