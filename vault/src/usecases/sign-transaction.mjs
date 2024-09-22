import { HDNodeWallet, Transaction } from 'ethers'

export class SignTransaction {
  constructor({ kmsApi, secretRepository }) {
    this.kmsApi = kmsApi
    this.secretRepository = secretRepository
  }

  async execute({ walletId, unsignedTx, derivationPath } = {}) {
    const secret = await this.secretRepository.getSecret(walletId)
    if (!secret) throw new Error('Wallet not found')

    const plaintextXpub = await this.kmsApi.decrypt({
      keyId: secret.keyId,
      ciphertext: secret.ciphertext,
    })

    // TODO: check if we need to "clean up" the sensitive data

    const masterNode = HDNodeWallet.fromExtendedKey(plaintextXpub.toString())
    const node = masterNode.derivePath(derivationPath)

    const parsedUnsignedTx = Transaction.from(unsignedTx)
    const signedTx = await node.signTransaction(parsedUnsignedTx)

    return { signedTx }
  }
}
