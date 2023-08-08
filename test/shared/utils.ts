import { ethers } from 'hardhat'

export const computedCreate2Address = (factoryAddress:string, saltHex: string, byteCode: string) => {
    return `0x${ethers.utils.keccak256(
        `0x${['ff', factoryAddress, saltHex, ethers.utils.keccak256(byteCode)]
          .map((x) => x.replace(/0x/, ''))
          .join('')}`,
      )
      .slice(-40)}`.toLowerCase()
  }

export const numberToUint256 = (value: number) => {
  const hex = value.toString(16)
  return `0x${'0'.repeat(64 - hex.length)}${hex}`
}

export const saltToHex = (salt: string | number) =>
  ethers.utils.id(salt.toString())

