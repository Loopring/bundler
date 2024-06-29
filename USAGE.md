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

配置说明：
1. `packages/bundler/.env` 最小要配`SIGNER_PRIVATE_KEY`，并且配的私钥 地址上要有ETH
2. `yarn bundler-sepolia` 命令里的`bundler-sepolia`，要在外部和内部两个package.json
   1. 外部：需要在`package.json`里的`scripts`添加`"bundler-sepolia": "DEBUG=aa.* yarn --cwd packages/bundler bundler-sepolia --unsafe"`（外部的命令去调用内部的命令）
   2. 内部：需要在`packages/bundler/package.json`里的`scripts`添加`"bundler-sepolia": "ts-node ./src/exec.ts --config ./localconfig/bundler_sepolia.config.json"`
3. `packages/bundler/localconfig/bundler_sepolia.config.json`
   1. `port`: 启动端口
   2. `entryPoint`: 支持的entrypoint版本
   3. `network`: 节点地址
   4. `beneficiary`: 收费地址，一般配成operator地址。bundler自己从operator付gas，从entrypoint收用户的ETH fee，一般情况 bundler应该收支平衡（或略盈余），如果bundler这个operator地址比初始转入的低很多 就得看下哪里有问题
   5. `data_directory`: 每个network区分不同目录

命令：
1. 启动：`nohup yarn run bundler-sepolia  > bundler_sepolia.log 2>&1 &`
2. 检查端口是否已启动 `netstat -nlp | grep 5000| awk '{print $7}' | awk -F"/" '{print $1}'`
3. 重启时，先按端口查找进程，如果存在就 `kill -9 $pid`，再启动
4. 检查bundler服务
```
curl -X POST --url https://bundler-taiko.tokenbank.com/rpc --header 'accept: application/json' --header 'content-type: application/json'  --data ' {"id": 1,"jsonrpc": "2.0", "method": "eth_supportedEntryPoints"}'
```