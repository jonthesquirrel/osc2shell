var osc = require("osc")

// Create an osc.js UDP Port listening on port 57121.
var udpPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 8000,
    metadata: true
});

// Listen for incoming OSC messages.
udpPort.on("message", function (oscMsg, timeTag, info) {
    console.log("An OSC message just arrived!", oscMsg);
    console.log("Remote info is: ", info);
});

udpPort.on("error", function (error) {
    console.log("An error occurred: ", error.message);
});

// Open the socket.
udpPort.open();
