import express from 'express'
import { KMSApi } from './infra/kms-api.mjs'
import { StorageAPI } from './infra/storage-api.mjs'
import { SignTransaction } from './usecases/sign-transaction.mjs'
import { GenerateBIP32Wallet } from './usecases/generate-hd-wallet.mjs'
import { ExportPublicKeyInfo } from './usecases/export-public-key-info.mjs'

const app = express()
app.use(express.json())

const isLocalhost = process.env.IS_LOCALHOST === 'true'
const kmsApi = new KMSApi({ useSocket: !isLocalhost })
const storageApi = new StorageAPI()

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

    const handler = new GenerateBIP32Wallet({ kmsApi, storageApi })
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
    const derivationPath = buildDerivationPath(req.query)

    if (!walletId) return res.status(400).json({ error: 'walletId is required' })

    const handler = new ExportPublicKeyInfo({ kmsApi, storageApi })
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
    const derivationPath = buildDerivationPath(wallet)

    if (!walletId) return res.status(400).json({ error: 'walletId is required' })
    if (typeof walletId !== 'string') return res.status(400).json({ error: 'walletId must be a string' })
    if (!unsignedTx) return res.status(400).json({ error: 'unsignedTx is required' })
    if (typeof unsignedTx !== 'string') return res.status(400).json({ error: 'unsignedTx must be an string' })

    const handler = new SignTransaction({ kmsApi, storageApi })
    const data = await handler.execute({ walletId, unsignedTx, derivationPath })

    return res.status(200).json({ message: `HD Wallet ${req.params.walletId} signed`, data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
})

// TODO: Move to a separate file
function buildDerivationPath({
  purpose = 44,
  coinType = 60,
  account = 0,
  change = 0,
  addressIndex = 0,
} = {}) {
  return `m/${purpose}'/${coinType}'/${account}'/${change}/${addressIndex}`
}

export default app
