import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber} from 'ethers'
import { l2ProjectLaunchFixtures, l2ProjectLaunchFixtures2, l2UniswapInfo } from './shared/fixtures'
import { SetL2ProjectLaunchFixture, ProjectInfo } from './shared/fixtureInterfaces'

import univ3prices from '@thanpolas/univ3prices';
import {
    getPublicSaleParams, getInitialLiquidityParams, getLpRewardParams,
    getTosAirdropParams, getTonAirdropParams, getScheduleParams, getNonScheduleParams } from './shared/vaultParameters'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
/**
 * deployer : owner
 * addr1 :  vault admin, token admin
 * addr2 : projectManager
 */
describe('L2InitialLiquidityVault', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: SetL2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string;
    let projectInfo: any;
    let initialVaultParams : any;
    let tokenInfo = {
        name: "TEST_TOKEN",
        symbol: "TST",
        initialSupply: ethers.utils.parseEther("100000"),
        owner: '',
        tokenAddress: ''
    }
    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures2()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })

    describe(' setL2ProjectManager ', () => {

        it('setL2ProjectManager can not be executed by not owner', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(addr1).setL2ProjectManager(
                    deployer.address
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2ProjectManager can be executed by only owner ', async () => {

            await deployed.initialLiquidityVault.connect(deployer).setL2ProjectManager(
                addr2.address
            )

            expect(await deployed.initialLiquidityVault.l2ProjectManager()).to.be.eq(addr2.address)

        })

        it('setL2ProjectManager cannot be changed to the same value', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(deployer).setL2ProjectManager(
                    addr2.address
                )
            ).to.be.revertedWith("same")
        })
    });


    describe(' setUniswapInfo ', () => {

        it('setUniswapInfo can not be executed by not owner', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(addr1).setUniswapInfo(
                    l2UniswapInfo.uniswapV3Factory,
                    l2UniswapInfo.npm,
                    l2UniswapInfo.ton,
                    l2UniswapInfo.tos
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setUniswapInfo can be executed by only owner ', async () => {

            await deployed.initialLiquidityVault.connect(deployer).setUniswapInfo(
                l2UniswapInfo.uniswapV3Factory,
                l2UniswapInfo.npm,
                l2UniswapInfo.ton,
                l2UniswapInfo.tos
            )

            expect(await deployed.initialLiquidityVault.uniswapV3Factory()).to.be.eq(l2UniswapInfo.uniswapV3Factory)
            expect(await deployed.initialLiquidityVault.nonfungiblePositionManager()).to.be.eq(l2UniswapInfo.npm)
            expect(await deployed.initialLiquidityVault.ton()).to.be.eq(l2UniswapInfo.ton)
            expect(await deployed.initialLiquidityVault.tos()).to.be.eq(l2UniswapInfo.tos)

        })

        it('setUniswapInfo cannot be changed to the same value', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(deployer).setUniswapInfo(
                    l2UniswapInfo.uniswapV3Factory,
                    l2UniswapInfo.npm,
                    l2UniswapInfo.ton,
                    l2UniswapInfo.tos
                )
            ).to.be.revertedWith("same")
        })
    });

    describe(' setAcceptTickChangeInterval ', () => {

        it('setAcceptTickChangeInterval can not be executed by not owner', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(addr1).setAcceptTickChangeInterval(
                    8
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setAcceptTickChangeInterval can be executed by only owner ', async () => {

            await deployed.initialLiquidityVault.connect(deployer).setAcceptTickChangeInterval(
                8
            )

            expect(await deployed.initialLiquidityVault.acceptTickChangeInterval()).to.be.eq(8)

        })

        it('setAcceptTickChangeInterval cannot be changed to the same value', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(deployer).setAcceptTickChangeInterval(
                    8
                )
            ).to.be.revertedWith("same")
        })
    });

    describe(' setAcceptSlippagePrice ', () => {

        it('setAcceptSlippagePrice can not be executed by not owner', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(addr1).setAcceptSlippagePrice(
                    10
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setAcceptSlippagePrice can be executed by only owner ', async () => {

            await deployed.initialLiquidityVault.connect(deployer).setAcceptSlippagePrice(
                10
            )

            expect(await deployed.initialLiquidityVault.acceptSlippagePrice()).to.be.eq(10)

        })

        it('setAcceptSlippagePrice cannot be changed to the same value', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(deployer).setAcceptSlippagePrice(
                    10
                )
            ).to.be.revertedWith("same")
        })
    });

    describe(' setTWAP_PERIOD ', () => {

        it('setTWAP_PERIOD can not be executed by not owner', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(addr1).setTWAP_PERIOD(
                    120
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setTWAP_PERIOD can be executed by only owner ', async () => {

            await deployed.initialLiquidityVault.connect(deployer).setTWAP_PERIOD(
                120
            )

            expect(await deployed.initialLiquidityVault.TWAP_PERIOD()).to.be.eq(120)

        })

        it('setTWAP_PERIOD cannot be changed to the same value', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(deployer).setTWAP_PERIOD(
                    120
                )
            ).to.be.revertedWith("same")
        })
    });

    describe(' setVaultAdmin ', () => {

        it('create non mint-able token', async () => {

            tokenInfo.owner = await addr1.getAddress()


            const receipt = await (await  deployed.l1ERC20A_TokenFactory.connect(deployer).create(
                    tokenInfo.name,
                    tokenInfo.symbol,
                    tokenInfo.initialSupply,
                    tokenInfo.owner
            )).wait();

            const topic = deployed.l1ERC20A_TokenFactory.interface.getEventTopic('CreatedERC20A');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l1ERC20A_TokenFactory.interface.parseLog(log);
            tokenInfo.tokenAddress = deployedEvent.args.contractAddress;

            expect(deployedEvent.args.contractAddress).to.not.eq(ethers.constants.AddressZero);
            expect(deployedEvent.args.name).to.eq(tokenInfo.name);
            expect(deployedEvent.args.symbol).to.eq(tokenInfo.symbol);
            expect(deployedEvent.args.initialSupply).to.eq(tokenInfo.initialSupply);
            expect(deployedEvent.args.to).to.eq(tokenInfo.owner);

            let tokenContract = await ethers.getContractAt(ERC20A.abi, tokenInfo.tokenAddress,addr1)

            await (await tokenContract.connect(addr1).transfer(addr2.address, tokenInfo.initialSupply)).wait()

            expect(await tokenContract.balanceOf(addr2.address)).to.be.eq(tokenInfo.initialSupply)

            await (await tokenContract.connect(addr2).approve(deployed.initialLiquidityVault.address, tokenInfo.initialSupply)).wait()

        });

        it('setVaultAdmin can not be executed by not onlyL2ProjectManager', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(deployer).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                    )
                ).to.be.revertedWith("caller is not l2ProjectManager")
        })

        it('setVaultAdmin can be executed by not onlyL2ProjectManager ', async () => {

            await deployed.initialLiquidityVault.connect(addr2).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
            )

            expect(await deployed.initialLiquidityVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(true)

        })

        it('setVaultAdmin cannot be changed to the same value', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(addr2).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                )
            ).to.be.revertedWith("same")
        })
    });

    describe(' initialize ', () => {

        it('initialize can not be executed by not project owner or vault admin', async () => {

            let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
            let tosPrice = 1e18;
            let tokenPrice = 10e18;
            let token0Price = tosPrice;
            let token1Price = tokenPrice;
            if(deployed.tosAddress > tokenInfo.tokenAddress) {
                token0Price = tokenPrice;
                token1Price = tosPrice;
            }
            const sqrtPrice = univ3prices.utils.encodeSqrtRatioX96(token0Price, token1Price);
            // const price = univ3prices([18, 18], sqrtPrice).toFixed();

            initialVaultParams = getInitialLiquidityParams(
                tokenInfo.initialSupply,
                tosPrice / 1e18,
                token1Price / 1e18,
                sqrtPrice.toString(),
                sTime,
                3000) ;

            await expect(
                deployed.initialLiquidityVault.connect(deployer).initialize(
                    tokenInfo.tokenAddress,
                    initialVaultParams
                    )
                ).to.be.revertedWith("caller is not a vaultAdmin or ProjectManager")
        })

        it('initialize can be executed by only project owner or vault admin ', async () => {
            let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
            let tosPrice = 1e18;
            let tokenPrice = 10e18;
            let token0Price = tosPrice;
            let token1Price = tokenPrice;
            if(deployed.tosAddress > tokenInfo.tokenAddress) {
                token0Price = tokenPrice;
                token1Price = tosPrice;
            }
            const sqrtPrice = univ3prices.utils.encodeSqrtRatioX96(token0Price, token1Price);
            // const price = univ3prices([18, 18], sqrtPrice).toFixed();

            initialVaultParams = getInitialLiquidityParams(
                tokenInfo.initialSupply,
                tosPrice / 1e18,
                token1Price / 1e18,
                sqrtPrice.toString(),
                sTime,
                3000) ;



            const receipt = await (await deployed.initialLiquidityVault.connect(addr2).initialize(
                tokenInfo.tokenAddress,
                initialVaultParams
                )).wait()

            const topic = deployed.initialLiquidityVault.interface.getEventTopic('InitializedInitialLiquidityVault');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.initialLiquidityVault.interface.parseLog(log);

            expect(deployedEvent.args.l2Token).to.be.eq(tokenInfo.tokenAddress)
            expect(deployedEvent.args.totalAllocatedAmount).to.be.eq(initialVaultParams.totalAllocatedAmount)
            expect(deployedEvent.args.initialTosPrice).to.be.eq(initialVaultParams.tosPrice)
            expect(deployedEvent.args.initialTokenPrice).to.be.eq(initialVaultParams.tokenPrice)
            expect(deployedEvent.args.startTime).to.be.eq(initialVaultParams.startTime)
            expect(deployedEvent.args.initSqrtPriceX96).to.be.eq(initialVaultParams.initSqrtPrice)
            expect(deployedEvent.args.fee).to.be.eq(initialVaultParams.fee)

            let viewVaultInfo = await deployed.initialLiquidityVault.viewVaultInfo(tokenInfo.tokenAddress)
            expect(viewVaultInfo.pool).to.be.eq(ethers.constants.AddressZero)
            expect(viewVaultInfo.totalAllocatedAmount).to.be.eq(initialVaultParams.totalAllocatedAmount)
            expect(viewVaultInfo.initialTosPrice).to.be.eq(initialVaultParams.tosPrice)
            expect(viewVaultInfo.initialTokenPrice).to.be.eq(initialVaultParams.tokenPrice)
            expect(viewVaultInfo.lpToken).to.be.eq(ethers.constants.Zero)
            expect(viewVaultInfo.startTime).to.be.eq(initialVaultParams.startTime)
            expect(viewVaultInfo.initSqrtPriceX96).to.be.eq(initialVaultParams.initSqrtPrice)
            expect(viewVaultInfo.fee).to.be.eq(initialVaultParams.fee)
            expect(viewVaultInfo.boolReadyToCreatePool).to.be.eq(false)
        })

        it('initialize can execute just once', async () => {
            let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
            let tosPrice = 1e18;
            let tokenPrice = 10e18;
            let token0Price = tosPrice;
            let token1Price = tokenPrice;
            if(deployed.tosAddress > tokenInfo.tokenAddress) {
                token0Price = tokenPrice;
                token1Price = tosPrice;
            }
            const sqrtPrice = univ3prices.utils.encodeSqrtRatioX96(token0Price, token1Price);
            // const price = univ3prices([18, 18], sqrtPrice).toFixed();

            let initialVaultParams = getInitialLiquidityParams(
                tokenInfo.initialSupply,
                tosPrice / 1e18,
                token1Price / 1e18,
                sqrtPrice.toString(),
                sTime,
                3000) ;

            await expect(
                deployed.initialLiquidityVault.connect(addr2).initialize(
                    tokenInfo.tokenAddress,
                    initialVaultParams
                    )
                ).to.be.revertedWith("already initialized")

        })
    });

    describe(' setStartTime ', () => {
        it('setStartTime can not be executed by not vault admin', async () => {

            expect(
                await deployed.initialLiquidityVault.isVaultAdmin(tokenInfo.tokenAddress, addr2.address)
                ).to.be.eq(false)

            await expect(
                deployed.initialLiquidityVault.connect(addr2).setStartTime(
                    tokenInfo.tokenAddress,
                    initialVaultParams.startTime + 100
                    )
                ).to.be.revertedWith("caller is not a vaultAdmin Of l2Token")
        });

        it('setStartTime can not be executed by not vault admin', async () => {
            expect(
                await deployed.initialLiquidityVault.isVaultAdmin(tokenInfo.tokenAddress, addr1.address)
                ).to.be.eq(true)

            await (await deployed.initialLiquidityVault.connect(addr1).setStartTime(
                    tokenInfo.tokenAddress,
                    initialVaultParams.startTime + 100
                    )).wait()
        });
    });


    describe(' setCreatePool ', () => {

        it('setCreatePool can not be executed before start time', async () => {

            await expect(
                deployed.initialLiquidityVault.connect(deployer).setCreatePool(
                    tokenInfo.tokenAddress
                    )
                ).to.be.revertedWith("StartTime has not passed.")

        });

        it('setCreatePool can be executed by anybody', async () => {

            let block = await ethers.provider.getBlock('latest')
            let viewVaultInfo0 = await deployed.initialLiquidityVault.viewVaultInfo(tokenInfo.tokenAddress)

            ethers.provider.send("evm_increaseTime", [viewVaultInfo0.startTime - block.timestamp + 100 ])
            ethers.provider.send("evm_mine");

            await (await deployed.initialLiquidityVault.connect(deployer).setCreatePool(
                tokenInfo.tokenAddress
                )).wait()

            let viewVaultInfo = await deployed.initialLiquidityVault.viewVaultInfo(tokenInfo.tokenAddress)

            expect(viewVaultInfo.pool).to.be.not.eq(ethers.constants.AddressZero);
            expect(viewVaultInfo.boolReadyToCreatePool).to.be.eq(true);
        });
    });

    describe(' mint : create liquidity ', () => {

        it('mint is failed when tos balance is zero', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(deployer).mint(
                    tokenInfo.tokenAddress,
                    ethers.utils.parseEther("10")
                    )
                ).to.be.revertedWith("balance is insufficient")
        });

        it('mint can be executed by anybody ', async () => {
            let amount = ethers.utils.parseEther("100");
            const tosAdmin =  await ethers.getSigner(deployed.tosAdminAddress);
            let tosContract = await ethers.getContractAt(ERC20B.abi, deployed.tosAddress)

            // let balance = await tosContract.balanceOf(deployed.tosAdminAddress);
            // console.log('balance',balance)

            await (await tosContract.connect(tosAdmin).transfer(
                deployed.initialLiquidityVault.address,
                amount
            )).wait()

            const receipt = await (await deployed.initialLiquidityVault.connect(deployer).mint(
                tokenInfo.tokenAddress,
                amount
            )).wait()

            const topic = deployed.initialLiquidityVault.interface.getEventTopic('InitialMintedInVault');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.initialLiquidityVault.interface.parseLog(log);

            let viewVaultInfo = await deployed.initialLiquidityVault.viewVaultInfo(tokenInfo.tokenAddress)

            expect(deployedEvent.args.l2Token).to.be.eq(tokenInfo.tokenAddress);
            expect(deployedEvent.args.pool).to.be.eq(viewVaultInfo.pool);
            expect(deployedEvent.args.tokenId).to.be.not.eq(ethers.constants.Zero);
            expect(deployedEvent.args.liquidity).to.be.gt(ethers.constants.Zero);
            expect(deployedEvent.args.amount0).to.be.gt(ethers.constants.Zero);
            expect(deployedEvent.args.amount1).to.be.gt(ethers.constants.Zero);

            expect(viewVaultInfo.pool).to.be.not.eq(ethers.constants.AddressZero);
            expect(viewVaultInfo.boolReadyToCreatePool).to.be.eq(true);
        });
    });

    describe(' mint : add liquidity ', () => {
        it('mint can be executed by anybody', async () => {

            let amount = ethers.utils.parseEther("200");
            const tosAdmin =  await ethers.getSigner(deployed.tosAdminAddress);
            let tosContract = await ethers.getContractAt(ERC20B.abi, deployed.tosAddress)

            // let balance = await tosContract.balanceOf(deployed.tosAdminAddress);
            // console.log('balance',balance)

            await (await tosContract.connect(tosAdmin).transfer(
                deployed.initialLiquidityVault.address,
                amount
            )).wait()

            const receipt = await (await deployed.initialLiquidityVault.connect(deployer).mint(
                tokenInfo.tokenAddress,
                amount
            )).wait()

            const topic = deployed.initialLiquidityVault.interface.getEventTopic('IncreasedLiquidityInVault');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.initialLiquidityVault.interface.parseLog(log);

            expect(deployedEvent.args.tokenId).to.be.not.eq(ethers.constants.Zero);
            expect(deployedEvent.args.liquidity).to.be.gt(ethers.constants.Zero);
            expect(deployedEvent.args.amount0).to.be.gt(ethers.constants.Zero);
            expect(deployedEvent.args.amount1).to.be.gt(ethers.constants.Zero);

        });

    });

});
