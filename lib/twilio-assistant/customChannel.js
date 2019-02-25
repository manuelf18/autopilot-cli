

const customChannel = async (assistantSid, channel, text, profile, local) => {
    const localServer = require('./createLocalServer');
    const request = require('request-promise');
    const client = await require('./client')(profile);

    if(local !== false){
        try{
           await localServer.init(local, profile);
        }
        catch(e){
            console.log(e);
            await localServer.turnOff(true);
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

        let response = await request(options)
            .then(response => {
                return response;
            })
            .catch(err => {
                throw err;
            })
        if (local !== false){
            await localServer.turnOff();
        }
        return response;
      })
      
      .catch(async (err) => {
        if (local !== false){
            await localServer.turnOff();
        }
        throw err;
      })
  
  }
  
  module.exports = { customChannel };