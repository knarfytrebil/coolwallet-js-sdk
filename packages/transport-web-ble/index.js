import { hexStringToByte, convertToHex } from './util'

const PACKET_DATA_SIZE = 18

export class WebBleTransport {
  constructor() {
    this.eventPromise
    this.server = undefined
    this.statusCharacteristic = undefined
    this.commandCharacteristic = undefined
    this.dataCharacteristic = undefined
    this.responseCharacteristic = undefined

    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this.request = this.request.bind(this)

    this._waitForStatusChange = this._waitForStatusChange.bind(this)
    this._onCharateristicStatusChange = this._onCharateristicStatusChange.bind(this)
    this._sendData = this._sendData.bind(this)
    this._readValue = this._readValue.bind(this)
  }

  async connect() {
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [0xa000] }] })
      console.log(`found device id: "${device.id}", name: "${device.name}"`)

      // Connect to GATT Server
      device.addEventListener('gattserverdisconnected', event => {
        console.log('Device ' + event.target.name + ' is disconnected.')
      })
      this.server = await device.gatt.connect()

      // Get Service
      const services = await this.server.getPrimaryServices()
      const service = services[0]
      console.log(`Service uuid: ${service.uuid}`)

      this.commandCharacteristic = await service.getCharacteristic(0xa007)
      this.dataCharacteristic = await service.getCharacteristic(0xa008)
      this.statusCharacteristic = await service.getCharacteristic(0xa006)
      this.responseCharacteristic = await service.getCharacteristic(0xa009)

      await this.statusCharacteristic.startNotifications()
      this.statusCharacteristic.addEventListener('characteristicvaluechanged', this._onCharateristicStatusChange)
    } catch (error) {
      console.log('error :', error.message)
      if (this.server) await this.server.disconnect()
    }
  }

  /**
   *
   * @param {string} command
   * @param {string} data
   * @returns {string}
   */
  async request(command, data) {
    if (!this.server) throw Error('No Connection')
    console.log(`WebBLE request command: ${command}, data: ${data}`)
    const commandBuf = hexStringToByte(command)

    await this.commandCharacteristic.writeValue(commandBuf)

    if (data) {
      this._sendData(hexStringToByte(data))
    }
    await this._waitForStatusChange()
    return await this._readValue()
  }

  async disconnect() {
    if (this.server) await this.server.disconnect()
  }

  async _sendData(data) {
    let isFinalPart = false,
      index = 0
    while (!isFinalPart) {
      isFinalPart = (index + 1) * PACKET_DATA_SIZE >= data.length
      const batchdata = data.slice(index * PACKET_DATA_SIZE, (index + 1) * PACKET_DATA_SIZE)
      let packet = new Uint8Array(batchdata.length + 2)
      packet.set(new Uint8Array([index + 1]))
      packet.set(new Uint8Array([batchdata.length]), 1)
      packet.set(batchdata, 2)
      await this.dataCharacteristic.writeValue(packet)
      index = index + 1
    }
  }

  async _readValue() {
    let response = ''
    while (true) {
      let _response = convertToHex(await this.responseCharacteristic.readValue())
      if (_response === 'fc') break
      response = response + _response.slice(4)
    }
    return response
  }

  async _onCharateristicStatusChange() {
    if (this.eventPromise) {
      this.eventPromise.resolve()
    }
  }

  async _waitForStatusChange() {
    return new Promise((resolve, reject) => {
      this.eventPromise = {
        resolve,
        reject,
      }
    })
  }
}