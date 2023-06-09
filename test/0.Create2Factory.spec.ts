import hre from 'hardhat'
import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, Wallet } from 'ethers'

import { L2TokenFactory } from '../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import Create2FactoryAbi  from '../artifacts/contracts/L2/factory/Create2Factory.sol/Create2Factory.json'

import { l2ProjectLaunchFixtures } from './shared/fixtures'
import { L2ProjectLaunchFixture } from './shared/fixtureInterfaces'
import {computedCreate2Address, saltToHex} from "./shared/utils"
import snapshotGasCost from './shared/snapshotGasCost'
import dotenv from "dotenv" ;
dotenv.config();

describe('Create2Factory', () => {
    let deployer: Signer, addr1: Signer, myDeployer:Signer;
    let deployed: L2ProjectLaunchFixture
    const salt = ethers.constants.Zero;

    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures()
        deployer = deployed.deployer;
    })

    describe('# Create2Factory', () => {

        it('can compute the address before deploying', async () => {

            const L2TokenFactory_ = await ethers.getContractFactory("L2TokenFactory")

            let computedAddress = computedCreate2Address(
                deployed.factory.address,
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                L2TokenFactory_.bytecode
            );
            console.log("computed L2TokenFactory address", computedAddress);

            const topic = deployed.factory.interface.getEventTopic('Deployed');
            const receipt = await (await deployed.factory.connect(deployer).deploy(
                L2TokenFactory_.bytecode, salt)).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.factory.interface.parseLog(log);

            expect(deployedEvent.args.addr.toString().toLowerCase()).to.be.eq(computedAddress.toLowerCase());
            expect(deployedEvent.args.salt).to.be.eq(salt);

        });

    });

});

