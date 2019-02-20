const ngrok = require('ngrok');
const child_process = require('child_process');


const turnOn = async () => {
    child_process.fork('./functions/express.js', [], {silent:false});
    return await ngrok.connect(3000);
}

const turnOff = async () => {
    child_process.execSync('kill $(lsof -ti tcp:3000)');
    return await ngrok.disconnect();
}

module.exports = { turnOn, turnOff };