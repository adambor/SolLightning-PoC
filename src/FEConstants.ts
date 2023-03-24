import BigNumber from "bignumber.js";
import {SwapType} from "sollightning-sdk";

export const FEConstants = {
    urlBTCLNtoSol: "http://localhost:4000",
    expirySecondsBTCLNtoSol: 1*86400, //1 days
    urlSoltoBTCLN: "http://localhost:4001",
    expirySecondsSoltoBTCLN: 3*86400, //3 days
    urlSoltoBTC: "http://localhost:4003",
    confirmationsSoltoBTC: 3,
    confirmationTargetSoltoBTC: 3,
    urlBTCtoSol: "http://localhost:4002",
    // url: "https://node3.gethopa.com",
    // customPorts: {
    //     [SwapType.BTCLN_TO_SOL]: 14000,
    //     [SwapType.SOL_TO_BTCLN]: 14001,
    //     [SwapType.BTC_TO_SOL]: 14002,
    //     [SwapType.SOL_TO_BTC]: 14003,
    // },
    url: "http://localhost",
    customPorts: null,
    satsPerBitcoin: new BigNumber(100000000)
};