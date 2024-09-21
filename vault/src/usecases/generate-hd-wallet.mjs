import { HDNodeWallet } from 'ethers'

export class GenerateBIP32Wallet {
  constructor({ kmsApi, storageApi }) {
    this.kmsApi = kmsApi
    this.storageApi = storageApi
  }

  async execute({ walletId } = {}) {
    const existingWallet = await this.storageApi.load({ key: walletId })
    if (existingWallet) throw new Error('Wallet already exists')

    const seed = await this.kmsApi.generateRandom()
    const masterNode = HDNodeWallet.fromSeed(seed)

    const masterNodeData = {
      // mnemonic: '',
      path: masterNode.path,
      xprv: masterNode.extendedKey,
      xpub: masterNode.neuter().extendedKey,
    }

    await this.storageApi.save({
      key: walletId,
      value: masterNodeData,
    })

    return {
      path: masterNode.path,
      xpub: masterNodeData.xpub,
    }
  }
}
