let fs = require("fs")
let osc = require("osc")

let config
try {
  config = require("./config.json")
} catch (e) {
  console.log("No valid config file found. Please validate the JSON formatting or redownload the default config.json from the repository.")
  console.log(e)
}

// Create a UDP Port to listen for OSC messages
let udpPort = new osc.UDPPort({
  localAddress: "127.0.0.1",
  localPort: 8000,
  metadata: true
})

// Run shell commands
function runShell (command) {
  const { exec } = require("child_process")
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return
    }
    // console.log(`stdout: ${stdout}`)
  })
}

let last_threshold = {}

// Listen for incoming OSC messages and execute commands based on config
udpPort.on("message", function (message, timeTag, info) {
  let address = message.address
  if (address in config.osc_messages) {
    let config_item = config.osc_messages[address]
    let value = message.args[0].value
    let trigger_type = config_item.trigger_type
    let threshold = config_item.threshold
    if (trigger_type == "continuous") {
      let command = config_item.command
      command = command.replace("$1", value)
      command = `${config.prefix}${command}${config.suffix}`
      runShell(command)
    } else if (trigger_type == "threshold") {
      // Only run once each time threshold is exceeded
      let command_rising = config_item.command_rising
      let command_falling = config_item.command_falling
      if (!(address in last_threshold)) {
        last_threshold[address] = "below"
      }
      if (value >= threshold && last_threshold[address] == "below") {
        // Rising edge
        last_threshold[address] = "above"
        let command = command_rising.replace("$1", value)
        command = `${config.prefix}${command}${config.suffix}`
        runShell(command)
      } else if (value < threshold && last_threshold[address] == "above") {
        // Falling edge
        last_threshold[address] = "below"
        let command = command_falling.replace("$1", value)
        command = `${config.prefix}${command}${config.suffix}`
        runShell(command)
      }
    }
  }
})

udpPort.on("error", function (error) {
  console.log("An error occurred: ", error.message)
})

// Open the socket
udpPort.open()
