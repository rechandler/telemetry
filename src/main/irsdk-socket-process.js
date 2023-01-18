const { io } = require("socket.io-client")
const { feathers } = require('@feathersjs/feathers')
const socketio = require('@feathersjs/socketio-client')
const irsdk = require('node-irsdk')

const connectAndRun = (profile) => {
  const iracing = irsdk.init()
  const socket = io(`ws://${getDomain()}?l=server&userId=${profile.sub}`)
  const client = feathers()
  const socketClient = socketio(socket)
  client.configure(socketClient)
  client.use('telemetry', socketClient.service('telemetry'), {
    methods: ['stream']
  })
  const telemetryService = client.service('telemetry')

  iracing.on('Telemetry', evt => {
    const streamValues = {userId: profile.sub, values: evt.values}
    if (telemetryService) telemetryService.stream(streamValues)
  })

  return client
}

const getDomain = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'telemetry-proxy.herokuapp.com'
  }

  return '192.168.86.100:3030'
}

module.exports = connectAndRun