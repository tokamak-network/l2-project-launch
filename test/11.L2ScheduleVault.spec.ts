import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber} from 'ethers'
import { l2ProjectLaunchFixtures, l2ProjectLaunchFixtures2, l2UniswapInfo } from './shared/fixtures'
import { SetL2ProjectLaunchFixture, ProjectInfo } from './shared/fixtureInterfaces'

import univ3prices from '@thanpolas/univ3prices';

describe('L2InitialLiquidityVault', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: SetL2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string;
    let projectInfo: any;

    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures2()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })
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

});
