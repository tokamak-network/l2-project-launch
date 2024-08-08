const ethers = require("ethers")
const titanSDK = require("@tokamak-network/titan-sdk")

require('dotenv').config()

const MessageDirection = {
    L1_TO_L2: 0,
    L2_TO_L1: 1,
}

const l1Url = `${process.env.ETH_NODE_URI_MAINNET}`
const l2Url = `${process.env.ETH_NODE_URI_TITAN}`


const getSigners = async () => {
    const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)
    const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
    const privateKey = process.env.PRIVATE_KEY
    const l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider)
    const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider)

    return [l1Wallet, l2Wallet]
}

const setup = async() => {
    const [l1Signer, l2Signer] = await getSigners()
    ourAddr = l1Signer.address

    crossChainMessenger = new titanSDK.BatchCrossChainMessenger({
        l1ChainId: 1,
        l2ChainId: 55004,
        l1SignerOrProvider: l1Signer,
        l2SignerOrProvider: l2Signer
    })
}

const checkTransaction = async (tx) => {
    console.log(`\n`)

    const start = new Date()
    console.log(`\n`)
    console.log(`Transaction hash (on L2): ${tx}`)
    console.log(`\tFor more information: https://explorer.titan.tokamak.network/tx/${tx}`)
    console.log(`\n`)

    const resolved = await crossChainMessenger.toCrossChainMessage(tx)
    console.log(`resolved : `, resolved)

    const currentStatus = await crossChainMessenger.getMessageStatus(resolved)
    console.log(`currentStatus : `, currentStatus)

    if( currentStatus == titanSDK.MessageStatus.IN_CHALLENGE_PERIOD ) {
      console.log(`IN_CHALLENGE_PERIOD  `)
    } else if( currentStatus == titanSDK.MessageStatus.READY_FOR_RELAY ) {
      console.log(`READY_FOR_RELAY  `)
    }

    await crossChainMessenger.waitForMessageStatus(tx, titanSDK.MessageStatus.IN_CHALLENGE_PERIOD)
    console.log("In the challenge period, waiting for status READY_FOR_RELAY")
    console.log(`Time so far ${(new Date()-start)/1000} seconds`)
    await crossChainMessenger.waitForMessageStatus(tx, titanSDK.MessageStatus.READY_FOR_RELAY)
    console.log("Ready for relay, finalizing message now")
    console.log(`Time so far ${(new Date()-start)/1000} seconds`)


    let receipt = await crossChainMessenger.getMessageReceipt(resolved)
    console.log(`receipt : `, receipt)

    if( receipt == null) {
      await crossChainMessenger.finalizeMessage(resolved)
      console.log("Waiting for status to change to RELAYED")
      console.log(`Time so far ${(new Date()-start)/1000} seconds`)
      await crossChainMessenger.waitForMessageStatus(resolved, titanSDK.MessageStatus.RELAYED)

    }
    receipt = await crossChainMessenger.getMessageReceipt(resolved)
    if(receipt!= null && receipt.transactionReceipt != null )
      console.log(`match tx: `, receipt.transactionReceipt.transactionHash )

  }


  const main = async () => {
      await setup()
      let l2tx = "0x5a5b1b18749c76ebd85b6ecb8f530944584312c80d0f54930c8e9a3f9404d059"

      await checkTransaction(l2tx)

  }  // main

  main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

