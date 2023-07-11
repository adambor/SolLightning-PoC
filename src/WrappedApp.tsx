import {BTCLNtoSolClaim, BTCtoSolClaim} from "./components/BTCLNtoSolPanel";
import {SoltoBTCLNRefund} from "./components/SolToBTCLNPanel";
import SwapTab from "./components/SwapTab";
import * as React from "react";
import {useEffect} from "react";
import {useState} from "react";
import {Card} from "react-bootstrap";
import {useConnection, useAnchorWallet, AnchorWallet} from "@solana/wallet-adapter-react";
import {AnchorProvider} from "@coral-xyz/anchor";

import {SolanaSwapper, IBTCxtoSolSwap, ISolToBTCxSwap, BTCLNtoSolSwap, BTCtoSolNewSwap, CoinGeckoSwapPrice, SolanaChains,
    BitcoinNetwork,
    createSwapperOptions} from "sollightning-sdk";
import * as BN from "bn.js";
import {FEConstants} from "./FEConstants";

export default function WrappedApp() {

    const wallet: any = useAnchorWallet();
    const {connection} = useConnection();

    const [provider, setProvider] = useState<AnchorProvider>();

    const [error, setError] = useState<string>();

    const [swapper, setSwapper] = useState<SolanaSwapper>();

    const [claimableBTCLNtoEVM, setClaimableBTCLNtoEVM] = useState<IBTCxtoSolSwap<any>[]>();
    const [refundableEVMtoBTCLN, setRefundableEVMtoBTCLN] = useState<ISolToBTCxSwap<any>[]>();

    useEffect(() => {

        if(wallet==null) {
            setSwapper(null);
            setClaimableBTCLNtoEVM(null);
            setRefundableEVMtoBTCLN(null);
            setProvider(null);
            return;
        }
        //
        // const conn = new Connection(RPC_ENDPOINT, {
        //     commitment: "confirmed",
        //     // fetch: (input: RequestInfo, init?: RequestInit) => {
        //     //     init.cache = "force-cache";
        //     //     init.headers = {};
        //     //     init.headers["Content-Type"] = "application/json";
        //     //     init.headers["Cache-Control"] = "max-age=600";
        //     //     return fetch(input, init);
        //     // }
        // });

        const _provider = new AnchorProvider(connection, wallet, {preflightCommitment: "processed"});

        console.log("New signer set: ", wallet.publicKey);

        setProvider(_provider);

        (async () => {

            try {
                console.log("init start");

                const swapper = new SolanaSwapper(_provider, createSwapperOptions(FEConstants.chain));

                await swapper.init();

                console.log("Swapper initialized, getting claimable swaps...");

                setClaimableBTCLNtoEVM(await swapper.getClaimableSwaps());

                setRefundableEVMtoBTCLN(await swapper.getRefundableSwaps());

                setSwapper(swapper);

                console.log("Initialized");
            } catch (e) {
                console.error(e)
            }

        })();

    }, [wallet]);

    return (
        <Card bg="light">
            <Card.Body>
                {swapper!=null ? (
                    <>
                        {claimableBTCLNtoEVM!=null && claimableBTCLNtoEVM.length>0 ? (
                            <Card className="p-3">
                                <Card.Title>Incomplete swaps (BTC-{'>'}Solana)</Card.Title>
                                <Card.Body>
                                    {claimableBTCLNtoEVM.map((e,index) => {
                                        if(e instanceof BTCLNtoSolSwap) {
                                            return (
                                                <BTCLNtoSolClaim key={index} swap={e} onError={setError} onSuccess={() => {
                                                    setClaimableBTCLNtoEVM(prevState => {
                                                        const cpy = [...prevState];
                                                        cpy.splice(index, 1);
                                                        return cpy;
                                                    });
                                                }}/>
                                            );
                                        }
                                        if(e instanceof BTCtoSolNewSwap) {
                                            return (
                                                <BTCtoSolClaim key={index} swap={e} onError={setError} onSuccess={() => {
                                                    setClaimableBTCLNtoEVM(prevState => {
                                                        const cpy = [...prevState];
                                                        cpy.splice(index, 1);
                                                        return cpy;
                                                    });
                                                }}/>
                                            );
                                        }
                                    })}
                                </Card.Body>
                            </Card>
                        ) : ""}
                        {refundableEVMtoBTCLN!=null && refundableEVMtoBTCLN.length>0 ? (
                            <Card className="p-3">
                                <Card.Title>Incomplete swaps (Solana-{'>'}BTC)</Card.Title>
                                <Card.Body>
                                    {refundableEVMtoBTCLN.map((e,index) => {
                                        return (
                                            <SoltoBTCLNRefund key={index} swap={e} onError={setError} onSuccess={() => {
                                                setRefundableEVMtoBTCLN(prevState => {
                                                    const cpy = [...prevState];
                                                    cpy.splice(index, 1);
                                                    return cpy;
                                                });
                                            }} onRefunded={() => {
                                                setRefundableEVMtoBTCLN(prevState => {
                                                    const cpy = [...prevState];
                                                    cpy.splice(index, 1);
                                                    return cpy;
                                                });
                                            }}/>
                                        )
                                    })}
                                </Card.Body>
                            </Card>
                        ) : ""}
                        <SwapTab swapper={swapper}/>
                    </>
                ) : ""}
            </Card.Body>
        </Card>
    )
}