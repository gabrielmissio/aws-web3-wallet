import { KMSClient, GenerateRandomCommand, EncryptCommand } from '@aws-sdk/client-kms'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'

export class KMSApi {
  constructor({ useSocket = false } = {}) {
    if (useSocket) {
      this.kmsClient = new KMSClient({
        endpoint: 'http://localhost:8000', // Dummy endpoint
        requestHandler: new NodeHttpHandler({
          socketPath: '/aws/aws-nitro-enclaves-kms.sock',
        }),
      })
    } else {
      this.kmsClient = new KMSClient({
        region: process.env.AWS_REGION,
      })
    }
  }

  async generateRandom() {
    const generateRandomCommand = new GenerateRandomCommand({
      'NumberOfBytes': 32,
    })

    const response = await this.kmsClient.send(generateRandomCommand)

    return Buffer.from(response.Plaintext)
  }

  async encrypt({ keyId, plaintext }) {
    const encryptCommand = new EncryptCommand({
      KeyId: keyId,
      Plaintext: plaintext,
    })

    const response = await this.kmsClient.send(encryptCommand)

    return Buffer.from(response.CiphertextBlob)
  }
}
