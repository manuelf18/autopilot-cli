

const customChannel = async (assistantSid, channel, text, profile, local) => {
    const fs = require('fs');
    const localServer = require('./createLocalServer');
    const request = require('request-promise');
    const client = await require('./client')(profile);

    if (local !== false){
        
        var prevSchema = JSON.parse(fs.readFileSync(local));
        var newUrl = await localServer.turnOn();
        var newSchema = Object.assign({}, prevSchema);

        newSchema['tasks'].forEach((task) => {
            task.actions.actions.forEach((action) => {
                action.redirect = newUrl;
            })
        });
        fs.writeFileSync(local, JSON.stringify(newSchema));
        try {
            await require('./updateAssistant').updateAssistant(local, profile);
        }
        catch(e){
            await localServer.turnOff();
            throw new Error(e);
        }
    }
  
    return await Promise.resolve()
  
      //remove samples and fields
      .then( async () => {
  
        const userpass = `${client.username}:${client.password}`;
        const options = {
            method : "POST",
            uri : `https://channels.autopilot.twilio.com/v1/${client.accountSid}/${assistantSid}/custom/${channel}`,
            headers : {
                authorization : `Basic ${Buffer.from(userpass).toString('base64')}`
            },
            form : {
                text : text,
                user_id : client.accountSid
            },
            json : true
        }

        let response =  request(options)
            .then(response => {
                return response;
            })
            .catch(err => {
                throw err;
            })
        if (local !== false){
            fs.writeFileSync(local, JSON.stringify(prevSchema));
            await require('./updateAssistant').updateAssistant(local, profile);
            await localServer.turnOff();
        }
        return response;
      })
      
      .catch(async (err) => {
        if (local !== false){
            fs.writeFileSync(local, JSON.stringify(prevSchema));
            await require('./updateAssistant').updateAssistant(local, profile);
            await localServer.turnOff();
        }
        throw err;
      })
  
  }
  
  module.exports = { customChannel };