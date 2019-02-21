const ngrok = require('ngrok');
const localtunnel = require('localtunnel');
const express = require('express');
const fs = require('fs');
const path = require('path');
const lodash = require('lodash');

let configFile, local, profile, prevSchema;

const _getPort = () => {
    return Math.floor(Math.random() * 999 + 3000);
};

const _createExpressServer = async (_path) => {
    try {
        let app = express();
        let port = _getPort();
        let _myFn = require(path.relative(__dirname, _path));
        app.use(express.urlencoded({extended: true})); 
        app.use(express.json());   
        app.post('/', (req, res) => {
            _myFn.handler('', req.body, (err, response) => {
                if(err)
                    throw new Error(e);
                res.type('json');
                res.send(response);
            }); 
        });
        app.listen(port, () => { console.log(`\nRunning on port ${port}...`) });
        return port;
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
                let port =  await _createExpressServer(fnPath);
                await ngrok.authtoken('48hhpVU8LwXp5h72Sj9oW_6ezVYqUNDHKoyQEaYyTwn');
                let url = await ngrok.connect(port);
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
    await _modifyAndWriteData(prevSchema, configFile, filepath);
}

const turnOff = async (force) => {
    if(force === true)
        process.exit();
    fs.writeFileSync(local, JSON.stringify(prevSchema, null, 4));
    await require('./updateAssistant').updateAssistant(local, profile);
    return await ngrok.disconnect();
}

module.exports = { init, turnOff };