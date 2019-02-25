const path = require('path'),
      ora = require('ora'),
      prettyJSONStringify = require('pretty-json-stringify'),
      ta = require('../lib/twilio-assistant');

module.exports = async (args) => {

  if (!args.hasOwnProperty('assistant')) {
    console.log(`The '--assistant' argument is required`)
    return
  }
  if (!args.hasOwnProperty('text')) {
    console.log(`The '--text' argument is required`)
    return
  }

  if(args.hasOwnProperty('local') && !args.hasOwnProperty('schema')){
    console.log(`the '--schema' argument is required when using the --local argument`);
    return;
  }

  const assistantSid = args.assistant,
        text = args.text,
        local = (args.local === undefined) ? false : {config: args.local, schema: args.schema, ngrokAuth: args.ngrok},
        channel = 'cli',
        profile = args.credentials || "default";

  
  let startText = (local === false) ? 'Sending text to channel...' : 'Sending local text to channel...';
  const spinner = ora().start(startText);

  try {

    const channelResponse = await ta.customChannel(assistantSid, channel, text, profile, local);

    spinner.stop()   

    console.log(`Channel response\n`)
    console.log(prettyJSONStringify(channelResponse));

    if (local !== false)
      process.exit(); // we have to kill the process since otherwise express would keep it alive
    
  } catch (err) {
    spinner.stop()

    console.error(`ERROR: ${err}`)
  }
}