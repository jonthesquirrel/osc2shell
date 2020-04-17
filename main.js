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

let past_thresholds = {}

// Listen for incoming OSC messages and execute commands based on config
udpPort.on("message", function (message, timeTag, info) {
    let address = message.address
    if (address in config.osc_messages) {
      let config_item = config.osc_messages[address]
      let value = message.args[0].value
      let trigger_type = config_item.trigger_type
      let threshold = config_item.threshold
      let command = config_item.command
      command = command.replace("$1", value)
      command = `${config.prefix}${command}${config.suffix}`
      if (trigger_type == "continuous") {
        runShell(command)
      } else if (trigger_type == "threshold") {
        // Only run once each time threshold is exceeded
        // console.log(JSON.stringify(past_thresholds))
        console.log((value >= threshold), value)
        if (value >= threshold) {
          if (!(address in past_thresholds)) {
            past_thresholds[address] = false
          }
          if (!past_thresholds[address]) {
            if (value >= threshold) {
              past_thresholds[address] = true
              runShell(command)
            }
          } else {
            past_thresholds[address] = false
          }
        }
      }
    }
});

udpPort.on("error", function (error) {
    console.log("An error occurred: ", error.message);
});

// Open the socket.
udpPort.open();
