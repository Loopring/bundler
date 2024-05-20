# Bundler Usage Guide



## Installation
install all dependencies and compile solidity and typescript codes

```
yarn && yarn preprocess
```


## Run

config .env file in packages/bundler/
```
cp .env.example .env

# set private key
# SIGNER_PRIVATE_KEY=0xxxx
```


modify config file in packages/bundler/localconfig/bundler_sepolia.config.json or bundler_taiko.config.json as you want

```
{
  // unused
  "gasFactor": "1",
  // open server port to outside users
  "port": "3000",
  // smart contract addreess of entrypoint
  "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  // set node rpc the network
  "network": "http://3.133.9.211:8545",
  // fee collector address
  "beneficiary": "0xc82Ea2afE1Fd1D61C4A12f5CeB3D7000f564F5C6",
  "minBalance": "1",
  // enable some rpc methods for debug purposes
  "debugRpc": true,
  "maxBundleGas": 5e6,
  // discard the userop when expiration
  "expirationTTL": 600,
  // cache db for all userops in mempool
  "data_directory": "/tmp/erc4337_bundler_sepolia_data_directory",
  "minStake": "1" ,
  "minUnstakeDelay": 0 ,
  // interval to bundle userop and send them on chain
  "autoBundleInterval": 20,
  // max count of userops in single bundle
  "autoBundleMempoolSize": 10
}
```


start bundler to handle incoming userops
```
yarn bundler-sepolia
```

or redirect log to file
```
nohup yarn run bundler-sepolia  > bundler_sepolia.log 2>&1 &

tail -f bundler_sepolia.log
```
