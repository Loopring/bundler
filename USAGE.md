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
enable some rpc methods for debug purposes
{
    debugRpc: true
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
