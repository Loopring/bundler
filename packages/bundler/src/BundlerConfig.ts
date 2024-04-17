// TODO: consider adopting config-loading approach from hardhat to allow code in config file
import ow from 'ow'

const MIN_UNSTAKE_DELAY = 86400
const MIN_STAKE_VALUE = 1e18.toString()
export interface BundlerConfig {
  beneficiary: string
  entryPoint: string
  gasFactor: string
  minBalance: string
  network: string
  port: string
  unsafe: boolean
  useEnclave: boolean
  debugRpc?: boolean
  conditionalRpc: boolean
  expirationTTL: number
  data_directory: string

  whitelist?: string[]
  blacklist?: string[]
  maxBundleGas: number
  minStake: string
  minUnstakeDelay: number
  autoBundleInterval: number
  autoBundleMempoolSize: number
}

// TODO: implement merging config (args -> config.js -> default) and runtime shape validation
export const BundlerConfigShape = {
  beneficiary: ow.string,
  entryPoint: ow.string,
  gasFactor: ow.string,
  minBalance: ow.string,
  network: ow.string,
  port: ow.string,
  unsafe: ow.boolean,
  useEnclave: ow.boolean,
  debugRpc: ow.optional.boolean,
  conditionalRpc: ow.boolean,
  expirationTTL: ow.number,
  data_directory: ow.string,

  whitelist: ow.optional.array.ofType(ow.string),
  blacklist: ow.optional.array.ofType(ow.string),
  maxBundleGas: ow.number,
  minStake: ow.string,
  minUnstakeDelay: ow.number,
  autoBundleInterval: ow.number,
  autoBundleMempoolSize: ow.number
}

// TODO: consider if we want any default fields at all
// TODO: implement merging config (args -> config.js -> default) and runtime shape validation
export const bundlerConfigDefault: Partial<BundlerConfig> = {
  port: '3000',
  entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  unsafe: false,
  useEnclave: true,
  conditionalRpc: false,
  data_directory: '/tmp/erc4337_bundler_data_directory',
  minStake: MIN_STAKE_VALUE,
  minUnstakeDelay: MIN_UNSTAKE_DELAY
}
