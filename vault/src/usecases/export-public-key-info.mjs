import { HDNodeWallet } from 'ethers'

export class ExportPublicKeyInfo {
  constructor({ kmsApi, storageApi }) {
    this.kmsApi = kmsApi
    this.storageApi = storageApi
  }

  async execute({ walletId, derivationPath } = {}) {
    const wallet = await this.storageApi.load({ key: walletId })
    if (!wallet) throw new Error('Wallet not found')

    const masterNode = HDNodeWallet.fromExtendedKey(wallet.xprv)
    const node = masterNode.derivePath(derivationPath)
    const nodeData = {
      address: node.address,
      publicKey: node.publicKey,
      xpub: node.neuter().extendedKey,
      depth: node.depth,
      path: derivationPath,
    }

    // TODO: throw error if dp is not BIP44 standard
    if (node.depth < 5) {
      delete nodeData.address
      delete nodeData.publicKey
    } else {
      delete nodeData.xpub
    }

    return nodeData
  }
}
