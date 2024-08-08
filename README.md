# What is l2-project-launch
l2-project-launch is designed to launch a project in Layer2 and distribute project funds according to a planned schedule.



## Documentation

The structure and specifications of the designed contract are described in the following article. [Description of L2 project launcher contracts](./doc)



## Test 

```npx hardhat test test/2-2.L1ProjectManager.test.spec.ts```



## Deploy

- L1 side
``` npx hardhat deploy --network sepolia```
- L2 side
```npx hardhat deploy --network thanossepolia```
