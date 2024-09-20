import { KMSClient } from '@aws-sdk/client-kms'
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

  // Generate Random

  // Sign Message
}
