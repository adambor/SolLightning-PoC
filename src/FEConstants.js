import BigNumber from "bignumber.js";
import { PublicKey } from "@solana/web3.js";
export const FEConstants = {
    // expirySecondsBTCLNtoSol: 1*86400, //1 days
    // expirySecondsSoltoBTCLN: 3*86400, //3 days
    // confirmationsSoltoBTC: 3,
    // confirmationTargetSoltoBTC: 3,
    // url: "https://node3.gethopa.com",
    // customPorts: {
    //     [SwapType.BTCLN_TO_SOL]: 34000,
    //     [SwapType.SOL_TO_BTCLN]: 34001,
    //     [SwapType.BTC_TO_SOL]: 34002,
    //     [SwapType.SOL_TO_BTC]: 34003,
    // },
    // url: "http://localhost:4000",
    // customPorts: null,
    wbtcToken: new PublicKey("Ag6gw668H9PLQFyP482whvGDoAseBWfgs5AfXCAK3aMj"),
    usdcToken: new PublicKey("6jrUSQHX8MTJbtWpdbx65TAwUv1rLyCF6fVjr9yELS75"),
    usdtToken: new PublicKey("Ar5yfeSyDNDHyq1GvtcrDKjNcoVTQiv7JaVvuMDbGNDT"),
    wsolToken: new PublicKey("So11111111111111111111111111111111111111112"),
    tokenData: {
        "Ag6gw668H9PLQFyP482whvGDoAseBWfgs5AfXCAK3aMj": {
            decimals: 8,
            symbol: "WBTC"
        },
        "6jrUSQHX8MTJbtWpdbx65TAwUv1rLyCF6fVjr9yELS75": {
            decimals: 6,
            symbol: "USDC"
        },
        "Ar5yfeSyDNDHyq1GvtcrDKjNcoVTQiv7JaVvuMDbGNDT": {
            decimals: 6,
            symbol: "USDT"
        },
        "So11111111111111111111111111111111111111112": {
            decimals: 9,
            symbol: "SOL"
        }
    },
    url: null,
    satsPerBitcoin: new BigNumber(100000000)
};
