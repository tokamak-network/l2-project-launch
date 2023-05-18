import {parseEther} from '@ethersproject/units';
import {deployments, getNamedAccounts} from 'hardhat';
const {rawTx, execute} = deployments;

async function main() {
  const {deployer, testUser, simpleERC20Beneficiary} = await getNamedAccounts();
  await rawTx({
    from: deployer,
    to: testUser,
    log: true,
    value: parseEther('1'),
  });
  await execute(
    'SimpleERC20',
    {from: simpleERC20Beneficiary, log: true},
    'transfer',
    testUser,
    1
  );
}

main().catch((e) => console.error(e));
