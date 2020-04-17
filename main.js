var fs = require("fs")
var osc = require("osc")

let config
try {
  config = require("./config.json")
} catch (e) {
  console.log("No valid config file found. Please validate the JSON formatting or redownload the default config.json from the repository.")
  console.log(e)
}

// Create an osc.js UDP Port listening on port 57121.
var udpPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 8000,
    metadata: true
});

// Run shell commands
function runShell (command) {
  const { exec } = require("child_process");
  exec(command, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    // console.log(`stdout: ${stdout}`);
});
}

// Listen for incoming OSC messages and execute commands based on config
udpPort.on("message", function (message, timeTag, info) {
    if (message.address in config.osc_messages) {
      let config_item = config.osc_messages[message.address]
      let value = message.args[0].value
      let command = config_item.command
      command = command.replace("$1", value)
      command = `${config.prefix}${command}${config.suffix}`
      if (config_item.trigger_type == "continuous") {
        runShell(command)
      }
    }
});

udpPort.on("error", function (error) {
    console.log("An error occurred: ", error.message);
});

// Open the socket.
udpPort.open();
