

import { ethers } from 'hardhat'
import { BigNumber} from 'ethers'

export const getPublicSaleParams = (
    tier:Array<number>,
    percents:Array<number>,
    saleAmount:Array<BigNumber>,
    price:Array<number>,
    hardcapAmount: BigNumber,
    changeTOSPercent:number,
    times:Array<number>,
    claimCounts: number,
    claimTimes: Array<number>,
    claimPercents: Array<number>,
    ) =>
    {
    let InitalParameterPublicSaleVault = {
         stosTier1: ethers.BigNumber.from(""+tier[0]),
         stosTier2: ethers.BigNumber.from(""+tier[1]),
         stosTier3: ethers.BigNumber.from(""+tier[2]),
         stosTier4: ethers.BigNumber.from(""+tier[3]),
         tier1Percents: ethers.BigNumber.from(""+percents[0]),
         tier2Percents: ethers.BigNumber.from(""+percents[1]),
         tier3Percents: ethers.BigNumber.from(""+percents[2]),
         tier4Percents: ethers.BigNumber.from(""+percents[3]),
        //  total1roundSaleAmount: ethers.BigNumber.from(""+saleAmount[0]),
        //  total2roundSaleAmount: ethers.BigNumber.from(""+saleAmount[1]),
         total1roundSaleAmount: saleAmount[0],
         total2roundSaleAmount: saleAmount[1],
         saleTokenPrice: ethers.BigNumber.from(""+price[0]),
         payTokenPrice: ethers.BigNumber.from(""+price[1]),
         hardcapAmount: hardcapAmount,
         changeTOSPercent: ethers.BigNumber.from(""+changeTOSPercent),
         startWhiteTime: ethers.BigNumber.from(""+times[0]),
         endWhiteTime: ethers.BigNumber.from(""+times[1]),
         start1roundTime: ethers.BigNumber.from(""+times[2]),
         end1roundTime: ethers.BigNumber.from(""+times[3]),
         snapshotTime: ethers.BigNumber.from(""+times[4]),
         start2roundTime: ethers.BigNumber.from(""+times[5]),
         end2roundTime: ethers.BigNumber.from(""+times[6]),
         claimCounts: ethers.BigNumber.from(""+claimCounts),
    }

    type claimInterface = {
        claimTimes: Array<BigNumber>,
        claimPercents:  Array<BigNumber>
    }

    let InitalParameterPublicSaleClaim:claimInterface = {
        claimTimes: [],
        claimPercents: []
    }

    for(let i = 0; i < claimCounts ; i++){
        InitalParameterPublicSaleClaim.claimTimes.push(ethers.BigNumber.from(""+claimTimes[i]));
        InitalParameterPublicSaleClaim.claimPercents.push(ethers.BigNumber.from(""+claimPercents[i]));
    }

    return {
        vaultParams: InitalParameterPublicSaleVault,
        claimParams: InitalParameterPublicSaleClaim
    }
}

export const  getInitialLiquidityParams = (
    totalAmount:BigNumber,
    tosPrice:number,
    tokenPrice:number,
    price:string,
    startTime:number,
    fee:number ) =>
    {
    return  {
        totalAllocatedAmount: totalAmount,
        tosPrice: ethers.BigNumber.from(""+tosPrice),
        tokenPrice: ethers.BigNumber.from(""+tokenPrice),
        initSqrtPrice: ethers.BigNumber.from(price),
        startTime:  startTime,
        fee: fee
    };
}

export const  getLpRewardParams = (
    claimer:  string,
    poolAddress: string,
    totalAmount:number,
    totalClaimCount:number,
    firstClaimAmount:number,
    firstClaimTime:number,
    secondClaimTime:number,
    roundIntervalTime:number ) =>
    {
    return  {
        poolAddress: poolAddress,
        params : {
            claimer: claimer,
            totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount),
            totalClaimCount: ethers.BigNumber.from(""+totalClaimCount),
            firstClaimAmount: ethers.BigNumber.from(""+firstClaimAmount),
            firstClaimTime: firstClaimTime,
            secondClaimTime: secondClaimTime,
            roundIntervalTime: roundIntervalTime
        }
    };
}

export const getTosAirdropParams = (
    claimer: string,
    totalAmount:number,
    totalClaimCount:number,
    firstClaimAmount:number,
    firstClaimTime:number,
    secondClaimTime:number,
    roundIntervalTime:number ) =>
    {
    return  {
            claimer: claimer,
            totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount),
            totalClaimCount: ethers.BigNumber.from(""+totalClaimCount),
            firstClaimAmount: ethers.BigNumber.from(""+firstClaimAmount),
            firstClaimTime: firstClaimTime,
            secondClaimTime: secondClaimTime,
            roundIntervalTime: roundIntervalTime
    };
}

export const getTonAirdropParams = (
    claimer: string,
    totalAmount:number,
    totalClaimCount:number,
    firstClaimAmount:number,
    firstClaimTime:number,
    secondClaimTime:number,
    roundIntervalTime:number ) =>
    {
    return  {
            claimer: claimer,
            totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount),
            totalClaimCount: ethers.BigNumber.from(""+totalClaimCount),
            firstClaimAmount: ethers.BigNumber.from(""+firstClaimAmount),
            firstClaimTime: firstClaimTime,
            secondClaimTime: secondClaimTime,
            roundIntervalTime: roundIntervalTime
    };
}

export const getScheduleParams = (
    name: string,
    claimer: string,
    totalAmount:BigNumber,
    totalClaimCount:number,
    firstClaimAmount:BigNumber,
    firstClaimTime:number,
    secondClaimTime:number,
    roundIntervalTime:number ) =>
    {
    return  {
        vaultName: name,
        params: {
            claimer: claimer,
            totalAllocatedAmount: totalAmount,
            totalClaimCount: ethers.BigNumber.from(""+totalClaimCount),
            firstClaimAmount: firstClaimAmount,
            firstClaimTime: firstClaimTime,
            secondClaimTime: secondClaimTime,
            roundIntervalTime: roundIntervalTime
        }
    }
}

export const getNonScheduleParams = (
    name: string,
    claimer: string,
    totalAmount:BigNumber ) =>
    {
    return  {
        vaultName: name,
        claimer: claimer,
        totalAllocatedAmount: totalAmount
    }
}