import { HDNodeWallet } from 'ethers'

export class GenerateBIP32Wallet {
  constructor({ kmsApi, secretRepository }) {
    this.kmsApi = kmsApi
    this.secretRepository = secretRepository
  }

  async execute({ walletId } = {}) {
    const existingSecret = await this.secretRepository.getSecret(walletId)
    if (existingSecret) throw new Error('Wallet already exists')

    const seed = await this.kmsApi.generateRandom()
    const masterNode = HDNodeWallet.fromSeed(seed)

    const ciphertext = await this.kmsApi.encrypt({
      keyId: process.env.KMS_ARN,
      plaintext: masterNode.extendedKey,
    })
    const secret = {
      path: masterNode.path,
      type: 'hd',
      keyId: process.env.KMS_ARN,
      secretId: walletId,
      ciphertext,
    }

    await this.secretRepository.createSecret(secret)
    // TODO: check if we need to "clean up" the sensitive data

    return secret
  }
}
