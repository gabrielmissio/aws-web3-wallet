import { randomUUID } from 'crypto'
/* eslint-disable no-unused-vars */

export class VaultApi {
  constructor() {
    this.vaultURL = process.env.VAULT_URL
  }

  async createHDWallet() {
    const walletId = randomUUID()

    const response = await fetch(`${this.vaultURL}/hd-wallet`, {
      method: 'POST',
      body: JSON.stringify({ walletId }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error('Failed to create wallet')
    }

    return response.clone().json().catch(() => response.text())
  }

  async exportPublicKeyInfo({ walletId, derivationPath }) {
  }

  async signTransaction({ walletId, derivationPath, unsignedTx }) {
    const hdWalletIndo = parseStringDP(derivationPath)

    const response = await fetch(`${this.vaultURL}/hd-wallet/${walletId}/sign`, {
      method: 'POST',
      body: JSON.stringify({ unsignedTx, wallet: { addressIndex: hdWalletIndo.addressIndex } }),
      headers: { 'Content-Type': 'application/json' },
    })

    const body = await response.clone().json().catch(() => response.text())

    if (!response.ok) {
      throw new Error('Failed to create wallet: ' + body.error)
    }

    return body.data.signedTx
  }
}

function parseStringDP(derivationPath) {
  const parts = derivationPath.split('/')

  if (parts.length !== 6) {
    throw new Error('Invalid derivation path')
  }

  return {
    purpose: parts[0],
    coinType: parts[1],
    account: parts[2],
    change: parts[3],
    addressIndex: parts[4],
  }
}
