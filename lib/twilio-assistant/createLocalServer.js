const ngrok = require('ngrok');
const express = require('express');
const fs = require('fs');
const path = require('path');
const lodash = require('lodash');

let configFile, local, profile, prevSchema, ngrokAuth;

const _getPort = () => {
    return Math.floor(Math.random() * 999 + 3000);
};

const _createTunnel = async (port) => {
    let options = {
        addr: port, 
        authtoken: process.env.ngrok_auth || ngrokAuth, //'48hhpVU8LwXp5h72Sj9oW_6ezVYqUNDHKoyQEaYyTwn'
        bind_tls: false
    }
    return await ngrok.connect(options);
}

const _createExpressServer = async (_path) => {
    try {
        let app = express();
        let port = _getPort();
        let _myFn = require(path.relative(__dirname, _path));
        app.use(express.urlencoded({extended: true})); 
        // app.use(express.json());   
        app.post('/', (req, res, next) => {
            res.type('json');
            _myFn.handler('', req.body, (err, response) => {
                if(err || !response)
                    next('error')
                res.send(response);
            }); 
        });
        app.listen(port, () => { console.log(`\nRunning on port ${port}...`) });
        return await _createTunnel(port);
    }
    catch(e){
        console.log(e);
        throw new Error(e);
    }
}

const _readFileData = (path) => {
    return JSON.parse(fs.readFileSync(path));
}

const _modifyAndWriteData = async (_obj, _configFile, _path) => {
    let obj = lodash.cloneDeep(_obj); // deep copy of the _obj object
    for( let task of obj.tasks ){
        let fnPath = _path;
        for (let taskName of _configFile.tasks){
            if (taskName.hasOwnProperty(task.uniqueName)){
                fnPath += '/functions/' + taskName[task.uniqueName];
                break;
            }
        }
        for ( let action of task.actions.actions ){
            try{
                let url =  await _createExpressServer(fnPath);
                console.log(url);
                action.redirect = url;
            }
            catch(e){
                console.log(e);
            }
        }
    }
    fs.writeFileSync(local, JSON.stringify(obj));
    await require('./updateAssistant').updateAssistant(local, profile);
}

const init = async (_local, _profile) => {
    let filepath = path.dirname(_local.config);
    local = _local.schema;
    configFile = _readFileData(_local.config);
    prevSchema = _readFileData(_local.schema);
    profile = _profile;
    ngrokAuth = _local.ngrokAuth;
    await _modifyAndWriteData(prevSchema, configFile, filepath);
}
/**
    * reverts the assistant to the previous schema and disconnects the ngrok tunnels. 
    * @param {boolean} force kills the node process.
*/
const turnOff = async (force) => {
    fs.writeFileSync(local, JSON.stringify(prevSchema, null, 4));
    await require('./updateAssistant').updateAssistant(local, profile);
    await ngrok.disconnect();
    if(force === true)
        process.exit();
}

module.exports = { init, turnOff };