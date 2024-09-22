import { HDNodeWallet } from 'ethers'

export class ExportPublicKeyInfo {
  constructor({ kmsApi, secretRepository }) {
    this.kmsApi = kmsApi
    this.secretRepository = secretRepository
  }

  async execute({ walletId, derivationPath } = {}) {
    const secret = await this.secretRepository.getSecret(walletId)
    if (!secret) throw new Error('Wallet not found')

    const plaintextXpub = await this.kmsApi.decrypt({
      keyId: secret.keyId,
      ciphertext: secret.ciphertext,
    })

    // TODO: check if we need to "clean up" the sensitive data

    const masterNode = HDNodeWallet.fromExtendedKey(plaintextXpub.toString())
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
