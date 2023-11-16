// runner script, to create

/**
 * a simple script runner, to test the bundler and API.
 * for a simple target method, we just call the "nonce" method of the account itself.
 */

import * as dotenv from 'dotenv'
import { BigNumber, Signer, Wallet, ethers } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { formatEther } from 'ethers/lib/utils'
import { Command } from 'commander'
import { WalletFactory__factory as SimpleAccountFactory__factory, SmartWalletV3__factory, EntryPoint, EntryPoint__factory } from '@account-abstraction/contracts'
import { erc4337RuntimeVersion } from '@account-abstraction/utils'
import {
  DeterministicDeployer,
  HttpRpcClient,
  LoopringAccountAPI as SimpleAccountAPI,
  PaymasterOption, PaymasterAPI,
  ApprovalOption, GuardianAPI, ActionType
  // SmartWalletV3, VerifyingPaymaster, VerifyingPaymaster__factory,
  // calcPreVerificationGas, USDT__factory
} from '@account-abstraction/sdk'
import { getNetworkProvider } from '../Config'

dotenv.config()

const ENTRY_POINT = process.env.ENTRYPOINT_ADDR as string
const PAYMASTER = process.env.PAYMASTER_ADDR as string
const SMARTWALLET_IMPL = process.env.SMARTWALLET_IMPL_ADDR as string

class Runner {
  bundlerProvider!: HttpRpcClient
  accountApi!: SimpleAccountAPI
  entryPoint!: EntryPoint

  /**
   *
   * @param provider - a provider for initialization. This account is used to fund the created account contract, but it is not the account or its owner.
   * @param bundlerUrl - a URL to a running bundler. must point to the same network the provider is.
   * @param accountOwner - the wallet signer account. used only as signer (not as transaction sender)
   * @param entryPointAddress - the entrypoint address to use.
   * @param index - unique salt, to allow multiple accounts with the same owner
   */
  constructor (
    readonly provider: JsonRpcProvider,
    readonly bundlerUrl: string,
    readonly accountOwner: Wallet,
    readonly paymaster: string,
    readonly paymasterOwner: Signer,
    readonly entryPointAddress = ENTRY_POINT,
    readonly index = 0
  ) {
  }

  async getAddress (): Promise<string> {
    return await this.accountApi.getCounterFactualAddress()
  }

  async init (accountAddress: string, guardianPrivateKeys: string[]): Promise<this> {
    const net = await this.provider.getNetwork()
    const chainId = net.chainId
    // const dep = new DeterministicDeployer(this.provider)
    const accountDeployer = await DeterministicDeployer.getAddress(new SimpleAccountFactory__factory(), 0, [this.entryPointAddress])
    this.bundlerProvider = new HttpRpcClient(this.bundlerUrl, this.entryPointAddress, chainId)
    const paymasterAPI = new PaymasterAPI({
      paymaster: this.paymaster,
      paymasterOwner: this.paymasterOwner
    })
    const guardianAPI = new GuardianAPI({
      owner: this.accountOwner,
      wallet: accountAddress,
      verifyingContract: SMARTWALLET_IMPL,
      guardians: guardianPrivateKeys.map(priKey => new Wallet(priKey, this.provider))
    }, this.provider)
    this.accountApi = new SimpleAccountAPI({
      provider: this.provider,
      entryPointAddress: this.entryPointAddress,
      factoryAddress: accountDeployer,
      owner: this.accountOwner,
      index: this.index,
      accountAddress,
      paymasterAPI,
      guardianAPI,
      overheads: {
        // perUserOp: 100000
      }
    })
    this.entryPoint = EntryPoint__factory.connect(this.entryPointAddress, this.provider)
    return this
  }

  parseExpectedGas (e: Error): Error {
    // parse a custom error generated by the BundlerHelper, which gives a hint of how much payment is missing
    const match = e.message?.match(/paid (\d+) expected (\d+)/)
    if (match != null) {
      const paid = Math.floor(parseInt(match[1]) / 1e9)
      const expected = Math.floor(parseInt(match[2]) / 1e9)
      return new Error(`Error: Paid ${paid}, expected ${expected} . Paid ${Math.floor(paid / expected * 100)}%, missing ${expected - paid} `)
    }
    return e
  }

  async runUserOp (target: string, data: string, paymasterOption?: PaymasterOption, approvalOption?: ApprovalOption): Promise<void> {
    const signedUserOp = await this.accountApi.createSignedUserOp({
      target,
      data
    }, paymasterOption, approvalOption)
    const estimatedGas = await this.bundlerProvider.estimateUserOpGas(signedUserOp)
    console.log('estimatedGas: ', estimatedGas)

    try {
      const userOpHash = await this.bundlerProvider.sendUserOpToBundler(signedUserOp)
      const txid = await this.accountApi.getUserOpReceipt(userOpHash)
      console.log('reqId', userOpHash, 'txid=', txid)
    } catch (e: any) {
      throw this.parseExpectedGas(e)
    }
  }
}

async function main (): Promise<void> {
  const program = new Command()
    .version(erc4337RuntimeVersion)
    .option('--network <string>', 'network name or url', 'http://localhost:8545')
    .option('--bundlerUrl <url>', 'bundler URL', 'http://localhost:3000/rpc')
    .option('--entryPoint <string>', 'address of the supported EntryPoint contract', ENTRY_POINT)
    .option('--show-stack-traces', 'Show stack traces.')

  const opts = program.parse().opts()
  const provider = getNetworkProvider(opts.network)
  // const accountOwner = new Wallet('0x'.padEnd(66, '7'))
  const accountOwner = new Wallet(process.env.ACCOUNT_OWNER_PRIVATE_KEY as string, provider)

  const index = 0
  const addr = process.env.SMARTWALLET_ADDR as string
  console.log('using account index=', index)
  const paymasterOwner = new Wallet(process.env.PAYMASTER_OWNER_PRIVATE_KEY as string, provider)
  const client = await new Runner(
    provider, opts.bundlerUrl,
    accountOwner, PAYMASTER,
    paymasterOwner, opts.entryPoint,
    index
  ).init(addr, [process.env.GUARDIAN_PRIVATE_KEY as string])

  // const addr = await client.getAddress()

  async function isDeployed (addr: string): Promise<boolean> {
    return await provider.getCode(addr).then(code => code !== '0x')
  }

  async function getBalance (addr: string): Promise<BigNumber> {
    return await provider.getBalance(addr)
  }

  const bal = await getBalance(addr)
  console.log('account address', addr, 'deployed=', await isDeployed(addr), 'bal=', formatEther(bal))

  const payToken = '0x116C55AFEaB4f16CcC5e91B563D450A4aE14CA15'
  const paymasterOption = {
    payToken,
    valueOfEth: ethers.utils.parseUnits('625', 12),
    validUntil: 0
  }
  const approvalOption = {
    validUntil: 0,
    action_type: ActionType.ApproveToken
  }
  const data = SmartWalletV3__factory.createInterface().encodeFunctionData('approveTokenWA', [payToken, PAYMASTER, ethers.constants.MaxUint256])
  // const data = USDT__factory.createInterface().encodeFunctionData('balanceOf', [addr])
  // const data = keccak256(Buffer.from('entryPoint()')).slice(0, 10)
  console.log('data=', data)
  await client.runUserOp(addr, data, paymasterOption, approvalOption)
  console.log('after run1')
  // client.accountApi.overheads!.perUserOp = 30000
  // await client.runUserOp(dest, data, paymasterOption, signer)
  // console.log('after run2')
}

void main()
  .catch(e => { console.log(e); process.exit(1) })
  .then(() => process.exit(0))
