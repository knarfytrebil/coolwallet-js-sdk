declare module '@coolwallets/core' {
  export namespace apdu {
    export namespace coin {
      export function authGetExtendedKey(transport: Transport, signature: string): Promise<string>
      export function getAccountExtendedKey(transport: Trasnport, coinType: string, accIndex: string): Promise<string>
      export function getEd25519AccountPublicKey(transport: Transport, coinType: string, accIndex:string): Promise<string>
    }

    export namespace control {
      export function sayHi(transport: Transport, appId: string): Promise<Boolean>
      export function getNonce(transport: Transport): Promise<string>
      export function cancelAPDU(transport: Transport): Promise<void>
      export function powerOff(transport: Transport): Promise<void>
    }

    export namespace pairing {
      export function registerDevice(transport: Transport, data: string, P1: string): Promise<string>
      export function getPairingPassword(transport: Transport, data: string): Promise<string>
    }

    export namespace setting {
      export function resetCard(transport: Transport): Promise<boolean>
      export function getCardInfo(transport: Transport): Promise<string>
      export function getSEVersion(transport: Transport): Promise<number>
    }
  }

  export namespace config {
    export namespace KEY {
      export const SEPublicKey: string
    }
  }

  export namespace core {
    export namespace auth {
      export function generalAuthorization(
        transport: Transport,
        appId: string,
        appPrivateKey: string,
        commandName: string,
        data: string,
        params1: string,
        params2: string,
        test: string
      ): Promise<string>

      export function versionCheck(transport: Transport, requiredSEVersion: number): Promise<void>
    }

    export namespace txFlow {
      export function prepareSEData(keyId: string, rawData: Buffer | Array<Buffer>, readType: string): Buffer
      export function sendDataToCoolWallet(
        transport: Transport,
        appPrivateKey: String,
        data: Buffer,
        P1: String,
        P2: String,
        isEDDSA?: Boolean,
        preAction?: Function,
        txPrepareComplteCallback?: Function,
        authorizedCallback?: Function,
        return_canonical?: Boolean
      ): Promise<{ signature: { r: string; s: string } | string | Buffer; cancel: boolean }>
    }

    export namespace txUtil {}
  }

  export namespace crypto {
    export namespace encryption {
      export function ECIESenc(recipientPubKey: string, msg: string): string
      export function ECIESDec(recipientPrivKey: string, encryption:string) : Buffer 
    }
  }
}
