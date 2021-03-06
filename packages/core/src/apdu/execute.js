import { assemblyCommandAndData } from './utils'
import { RESPONSE, DFU_RESPONSE } from '../config/response'
import COMMAND from '../config/command'
import ErrorCode from '../config/error'

/**
 *
 * @param {Transport} transport
 * @param {string} commandName
 * @param {string} commandType
 * @param {string} data
 * @param {string} params1
 * @param {string} params2
 */
export const executeCommand = async (transport, commandName, commandType = 'SE', data, params1, params2) => {
  console.log(`Execute Command: ${commandName}`)
  const commandParams = COMMAND[commandName]

  const P1 = !!params1 ? params1 : commandParams.P1
  const P2 = !!params2 ? params2 : commandParams.P2

  const apdu = assemblyCommandAndData(commandParams.CLA, commandParams.INS, P1, P2, data)
  const result = await executeAPDU(commandName, transport, apdu, commandType)

  return result
}

/**
 * @param {string} commandName
 * @param {Transport} transport
 * @param {{command:string, data:string}} apdu
 * @param {string} commandType SE or MCU
 */
const executeAPDU = async (commandName, transport, apdu, commandType) => {
  const response = await transport.request(apdu.command, apdu.data)
  if (commandType === 'SE') {
    const status = response.slice(-4)
    if (status !== RESPONSE.SUCCESS && status !== RESPONSE.CANCELED) {
      if (ErrorCode[commandName] && ErrorCode[commandName].hasOwnProperty(status)) {
        throw ErrorCode[commandName][status].msg
      }
      throw status
    }
    const outputData = response.slice(0, -4)
    return { status, outputData }
  } else {
    const status = response.slice(4, 6)
    const outputData = response.slice(6)
    if (status === DFU_RESPONSE.CHARGING_ERROR) throw 'Please insert your card into the charger to initiate the update.'
    else if (status !== DFU_RESPONSE.SUCCESS) throw status
    return { status, outputData }
  }
}
