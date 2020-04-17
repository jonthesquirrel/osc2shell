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

// Listen for incoming OSC messages.
udpPort.on("message", function (message, timeTag, info) {
    if (message.address in config.osc_messages) {
      let instructions = config.osc_messages[message.address]
      instructions = instructions.replace("$1", message.args[0].value)
      let command = `${config.prefix}${instructions}${config.suffix}`
      console.log(command)
    }
});

udpPort.on("error", function (error) {
    console.log("An error occurred: ", error.message);
});

// Open the socket.
udpPort.open();
