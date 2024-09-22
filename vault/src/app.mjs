import express from 'express'
import { KMSApi } from './infra/apis/kms-api.mjs'
import { SecretRepository } from './infra/repositories/secret-repository.mjs'
import { SignTransaction } from './usecases/sign-transaction.mjs'
import { GenerateBIP32Wallet } from './usecases/generate-hd-wallet.mjs'
import { ExportPublicKeyInfo } from './usecases/export-public-key-info.mjs'

const app = express()
app.use(express.json())

const isLocalhost = process.env.IS_LOCALHOST === 'true'
const kmsApi = new KMSApi({ useSocket: !isLocalhost })
const secretRepository = new SecretRepository()

// TODO: Improve error handling
// TODO: Improve input validation

app.get('/health', (req, res) => {
  res.send('OK')
})

app.post('/hd-wallet', async (req, res) => {
  try {
    const { walletId } = req.body

    if (!walletId) return res.status(400).json({ error: 'walletId is required' })
    if (typeof walletId !== 'string') return res.status(400).json({ error: 'walletId must be a string' })

    const handler = new GenerateBIP32Wallet({ kmsApi, secretRepository })
    const data = await handler.execute({ walletId })

    return res.status(201).json({ message: 'HD Wallet created', data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
})

// TODO: Allow partial derivation path
app.get('/hd-wallet/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params
    const derivationPath = buildDerivationPath({
      purpose: req.query.purpose || 44,
      coinType: req.query.coinType || 60,
      account: req.query.account || 0,
      change: req.query.change,
      addressIndex: req.query.addressIndex,
    }) // Ensure it exports at least the "account level node"

    if (!walletId) return res.status(400).json({ error: 'walletId is required' })

    const handler = new ExportPublicKeyInfo({ kmsApi, secretRepository })
    const data = await handler.execute({ walletId, derivationPath })

    return res.status(200).json({ message: `HD Wallet ${req.params.walletId}`, data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
})

app.post('/hd-wallet/:walletId/sign', async (req, res) => {
  try {
    const { walletId } = req.params
    const { wallet, unsignedTx } = req.body
    const derivationPath = buildDerivationPath({
      purpose: wallet.purpose || 44,
      coinType: wallet.coinType || 60,
      account: wallet.account || 0,
      change: wallet.change || 0,
      addressIndex: wallet.addressIndex || 0,
    }) // Ensure it always signs at the "address level node"

    if (!walletId) return res.status(400).json({ error: 'walletId is required' })
    if (typeof walletId !== 'string') return res.status(400).json({ error: 'walletId must be a string' })
    if (!unsignedTx) return res.status(400).json({ error: 'unsignedTx is required' })
    if (typeof unsignedTx !== 'string') return res.status(400).json({ error: 'unsignedTx must be an string' })

    const handler = new SignTransaction({ kmsApi, secretRepository })
    const data = await handler.execute({ walletId, unsignedTx, derivationPath })

    return res.status(200).json({ message: `HD Wallet ${req.params.walletId} signed`, data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
})

// TODO: Refactor this sad code
// TODO: Move to a separate file
function buildDerivationPath({
  purpose,
  coinType,
  account,
  change,
  addressIndex,
} = {}) {
  let path = 'm'

  if (purpose) {
    path += `/${purpose}'`
  } else {
    // Cannot include further segments without purpose
    return path
  }

  if (coinType) {
    path += `/${coinType}'`
  } else {
    // Cannot include further segments without coinType
    return path
  }

  if (account || account === 0) {
    path += `/${account}'`
  } else {
    // Cannot include further segments without account
    return path
  }

  if (addressIndex || addressIndex === 0) {
    path += `/${change || 0}`
    path += `/${addressIndex}`
  }

  return path
}

export default app
