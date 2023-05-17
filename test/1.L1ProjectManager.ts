import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer } from 'ethers'
import { l2ProjectLaunchFixtures } from './shared/fixtures'
import { L2ProjectLaunchFixture } from './shared/fixtureInterfaces'

import snapshotGasCost from './shared/snapshotGasCost'

describe('L1ProjectManager', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: L2ProjectLaunchFixture

    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
    })

    describe('# setL1TokenFactories', () => {

        it('setL1TokenFactories can not be executed by not owner', async () => {
            await expect(
                deployed.l1ProjectManager.connect(addr1).setL1TokenFactories(
                    [0,1,2,3],
                    [
                        deployed.l1ERC20A_TokenFactory.address,
                        deployed.l1ERC20B_TokenFactory.address,
                        deployed.l1ERC20C_TokenFactory.address,
                        deployed.l1ERC20D_TokenFactory.address,
                    ]
                )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL1TokenFactories can be executed by only owner', async () => {
            await deployed.l1ProjectManager.connect(deployer).setL1TokenFactories(
                [0,1,2,3],
                [
                    deployed.l1ERC20A_TokenFactory.address,
                    deployed.l1ERC20B_TokenFactory.address,
                    deployed.l1ERC20C_TokenFactory.address,
                    deployed.l1ERC20D_TokenFactory.address,
                ]
            )

            expect(await deployed.l1ProjectManager.l1TokenFactory(0)).to.eq(deployed.l1ERC20A_TokenFactory.address)
            expect(await deployed.l1ProjectManager.l1TokenFactory(1)).to.eq(deployed.l1ERC20B_TokenFactory.address)
            expect(await deployed.l1ProjectManager.l1TokenFactory(2)).to.eq(deployed.l1ERC20C_TokenFactory.address)
            expect(await deployed.l1ProjectManager.l1TokenFactory(3)).to.eq(deployed.l1ERC20D_TokenFactory.address)

        })

    });

    describe('# setL2TokenFactory', () => {

        it('setL2TokenFactory can not be executed by not owner', async () => {
            await expect(
                deployed.l1ProjectManager.connect(addr1).setL2TokenFactory(0, deployed.l2TokenFactory.address)
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2TokenFactory can be executed by only owner ', async () => {

            await deployed.l1ProjectManager.connect(deployer).setL2TokenFactory(0, deployed.l2TokenFactory.address)
            expect(await deployed.l1ProjectManager.l2TokenFactory(0)).to.eq(deployed.l2TokenFactory.address)

        })

        it('cannot be changed to the same value', async () => {
            await expect(
                deployed.l1ProjectManager.connect(deployer).setL2TokenFactory(0, deployed.l2TokenFactory.address)
                ).to.be.revertedWith("same")
        })
    });

    describe('# createProject', () => {


    });

});

