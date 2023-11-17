import { BigNumberish, utils, Wallet, BytesLike } from 'ethers'
import { Provider } from '@ethersproject/providers'
import _ from 'lodash'

export interface GuardianParams {
  guardians: Wallet[]
  owner: Wallet
  wallet: string
  verifyingContract: string
}

export enum ActionType {
  ApproveToken,
  TransferToken,
  CallContract,
  ApproveThenCallContract,
  Recover,
  Unlock,
  AddToWhitelist,
  ChangeMasterCopy,
  ChangeDailyQuota,
  AddGuardian,
  RemoveGuardian,
  ResetGuardians,
}

export interface ApprovalOption {
  validUntil: BigNumberish
  // validAfter: BigNumberish
  salt: BytesLike
  action_type: ActionType
}

export interface Approval {
  signers: string[]
  signatures: string[]
  validUntil: BigNumberish
  salt: BytesLike
}

async function signTypedData (data: BytesLike, signer: Wallet, approvalOption: ApprovalOption, domain: any, initValue: {wallet: string, validUntil: BigNumberish, salt: BytesLike}): Promise<string> {
  let message: any
  switch (approvalOption.action_type) {
    case ActionType.ApproveToken: {
      const result = utils.defaultAbiCoder.decode(['address', 'address', 'uint256'], data)
      const types = {
        approveToken: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'approveToken',
        value: {
          ...initValue,
          token: result[0],
          to: result[1],
          amount: result[2]
        }
      }
      break
    }
    case ActionType.TransferToken: {
      const result = utils.defaultAbiCoder.decode(['address', 'address', 'uint256', 'bytes'], data)

      const types = {
        transferToken: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'logdata', type: 'bytes' },
          { name: 'salt', type: 'bytes32' }
        ]
      }

      message = {
        types,
        domain,
        primaryType: 'transferToken',
        value: {
          ...initValue,
          token: result[0],
          to: result[1],
          amount: result[2],
          logdata: result[3]
        }
      }
      break
    }
    case ActionType.CallContract: {
      const result = utils.defaultAbiCoder.decode(['address', 'uint256', 'bytes'], data)
      const types = {
        callContract: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'callContract',
        value: {
          ...initValue,
          to: result[0],
          value: result[1],
          data: result[2]
        }
      }
      break
    }
    case ActionType.ApproveThenCallContract: {
      const result = utils.defaultAbiCoder.decode(['address', 'address', 'uint256', 'uint256', 'bytes'], data)
      const types = {
        approveThenCallContract: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'approveThenCallContract',
        value: {
          ...initValue,
          token: result[0],
          to: result[1],
          amount: result[2],
          value: result[3],
          data: result[4]
        }
      }
      break
    }
    case ActionType.AddGuardian: {
      const result = utils.defaultAbiCoder.decode(['address'], data)
      const types = {
        addGuardian: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'guardian', type: 'address' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'addGuardian',
        value: {
          ...initValue,
          guardian: result[0]
        }
      }
      break
    }
    case ActionType.RemoveGuardian: {
      const result = utils.defaultAbiCoder.decode(['address'], data)
      const types = {
        removeGuardian: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'guardian', type: 'address' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'removeGuardian',
        value: {
          ...initValue,
          guardian: result[0]
        }
      }
      break
    }
    case ActionType.ResetGuardians: {
      const result = utils.defaultAbiCoder.decode(['address[]'], data)
      const types = {
        resetGuardians: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'guardians', type: 'address[]' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'resetGuardians',
        value: {
          ...initValue,
          guardians: result[0]
        }
      }
      break
    }
    case ActionType.AddToWhitelist: {
      const result = utils.defaultAbiCoder.decode(['address[]'], data)
      const types = {
        addToWhitelist: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'addr', type: 'address' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'addToWhitelist',
        value: {
          ...initValue,
          addr: result[0]
        }
      }
      break
    }
    case ActionType.ChangeDailyQuota: {
      const result = utils.defaultAbiCoder.decode(['uint256'], data)
      const types = {
        changeDailyQuota: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'newQuota', type: 'uint256' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'changeDailyQuota',
        value: {
          ...initValue,
          newQuota: result[0]
        }
      }
      break
    }
    case ActionType.ChangeMasterCopy: {
      const result = utils.defaultAbiCoder.decode(['address'], data)
      const types = {
        changeMasterCopy: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'masterCopy', type: 'address' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'changeMasterCopy',
        value: {
          ...initValue,
          masterCopy: result[0]
        }
      }
      break
    }
    case ActionType.Recover: {
      const result = utils.defaultAbiCoder.decode(['address', 'address[]'], data)
      const types = {
        recover: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'newOwner', type: 'address' },
          { name: 'newGuardians', type: 'address[]' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'recover',
        value: {
          ...initValue,
          newOwner: result[0],
          newGuardians: result[1]
        }
      }
      break
    }
    case ActionType.Unlock: {
      const types = {
        unlock: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
      message = {
        types,
        domain,
        primaryType: 'unlock',
        value: {
          ...initValue
        }
      }
      break
    }
  }
  return await signer._signTypedData(message.domain, message.types, message.value)
}

export class LoopringGuardianAPI {
  guardians: Wallet[]
  owner: Wallet
  wallet: string
  verifyingContract: string

  constructor (guardianParams: GuardianParams, readonly provider: Provider) {
    this.owner = guardianParams.owner
    this.guardians = guardianParams.guardians
    this.verifyingContract = guardianParams.verifyingContract
    this.wallet = guardianParams.wallet
  }

  async signUserOp (data: BytesLike, approvalOption: ApprovalOption): Promise<Approval> {
    const calldata = utils.hexDataSlice(data, 4)
    const { chainId } = await this.provider.getNetwork()
    const domain = {
      name: 'LoopringWallet',
      version: '2.0.0',
      chainId,
      verifyingContract: this.verifyingContract
    }

    const smartWalletOrEOASigners: Array<{ signer: Wallet, smartWalletAddress?: string }> = [{ signer: this.owner }]
    // TODO(signer should be the owner of the wallet when the guardian is smart wallet )
    this.guardians.map(g => smartWalletOrEOASigners.push({ smartWalletAddress: g.address, signer: g }))

    const signatures = await Promise.all(
      smartWalletOrEOASigners.map(async (g) =>
        await signTypedData(calldata, g.signer, approvalOption, domain, { wallet: this.wallet, validUntil: approvalOption.validUntil, salt: approvalOption.salt })
      )
    )

    const [sortedSigners, sortedSignatures] = _.unzip(
      _.sortBy(
        _.zip(
          smartWalletOrEOASigners.map((g) =>
            g.smartWalletAddress != null
              ? g.smartWalletAddress.toLowerCase()
              : g.signer.address.toLowerCase()
          ),
          signatures
        ),
        item => item[0]
      )
    )

    const approval: Approval = {
      signers: sortedSigners as string[],
      signatures: sortedSignatures as string[],
      validUntil: approvalOption.validUntil,
      salt: approvalOption.salt
    }

    return approval
  }
}
