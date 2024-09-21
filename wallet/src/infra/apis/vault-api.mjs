export class VaultApi {
  constructor() {
    this.vaultURL = process.env.VAULT_URL
  }

  async createHDWallet({ walletId }) {
    const response = await fetch(`${this.vaultURL}/hd-wallet`, {
      method: 'POST',
      body: JSON.stringify({ walletId }),
      headers: { 'Content-Type': 'application/json' },
    })

    const body = await response.clone().json().catch(() => response.text())

    if (!response.ok) {
      throw new Error('Failed to create wallet')
    }

    return body.data
  }

  async exportPublicKeyInfo({ walletId, derivationPath }) {
    const hdWalletInfo = parseStringDP(derivationPath)

    const response = await fetch(`${this.vaultURL}/hd-wallet/${walletId}?purpose=${
      hdWalletInfo.purpose}&coinType=${hdWalletInfo.coinType}&account=${hdWalletInfo.account}`,
    )

    const body = await response.clone().json().catch(() => response.text())

    if (!response.ok) {
      throw new Error('Failed to create wallet: ' + body.error)
    }

    return body.data
  }

  async signTransaction({ walletId, derivationPath, unsignedTx }) {
    const hdWalletInfo = parseStringDP(derivationPath)

    const response = await fetch(`${this.vaultURL}/hd-wallet/${walletId}/sign`, {
      method: 'POST',
      body: JSON.stringify({ unsignedTx, wallet: { addressIndex: hdWalletInfo.addressIndex } }),
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

  if (parts.length < 4) {
    throw new Error('Invalid derivation path, must have at least "account" part')
  }
  if (parts[0] !== 'm') {
    throw new Error('Invalid derivation path, must start with "m"')
  }

  // NOTE: Application abstracts the hardening of the path
  return {
    purpose: parts[1].replace('\'', ''),
    coinType: parts[2].replace('\'', ''),
    account: parts[3].replace('\'', ''),
    change: parts[4],
    addressIndex: parts[5],
  }
}
