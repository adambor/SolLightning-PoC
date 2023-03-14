import {BTCLNtoSolClaim} from "./components/BTCLNtoSolPanel";
import {SoltoBTCLNRefund} from "./components/SolToBTCLNPanel";
import SwapTab from "./components/SwapTab";
import * as React from "react";
import {useEffect} from "react";
import {useState} from "react";
import {Card} from "react-bootstrap";
import {useConnection, useAnchorWallet, AnchorWallet} from "@solana/wallet-adapter-react";
import {AnchorProvider} from "@project-serum/anchor";

import {Swapper, IBTCxtoSolSwap, ISoltoBTCxSwap} from "sollightning-sdk";
import {FEConstants} from "./FEConstants";

export default function WrappedApp() {

    const wallet: AnchorWallet = useAnchorWallet();
    const {connection} = useConnection();

    const [provider, setProvider] = useState<AnchorProvider>();

    const [error, setError] = useState<string>();

    const [swapper, setSwapper] = useState<Swapper>();

    const [claimableBTCLNtoEVM, setClaimableBTCLNtoEVM] = useState<IBTCxtoSolSwap[]>();
    const [refundableEVMtoBTCLN, setRefundableEVMtoBTCLN] = useState<ISoltoBTCxSwap[]>();

    useEffect(() => {

        if(wallet==null) {
            setSwapper(null);
            setClaimableBTCLNtoEVM(null);
            setRefundableEVMtoBTCLN(null);
            setProvider(null);
            return;
        }

        const _provider = new AnchorProvider(connection, wallet, {preflightCommitment: "processed"});

        console.log("New signer set: ", wallet.publicKey);

        setProvider(_provider);

        (async () => {

            try {
                console.log("init start");

                const swapper = new Swapper(_provider, FEConstants.url, FEConstants.customPorts);

                await swapper.init();

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
                                <Card.Title>Incomplete swaps (BTCLN-{'>'}EVM)</Card.Title>
                                <Card.Body>
                                    {claimableBTCLNtoEVM.map((e,index) => {
                                        return (
                                            <BTCLNtoSolClaim key={index} signer={provider} swap={e} onError={setError} onSuccess={() => {
                                                setClaimableBTCLNtoEVM(prevState => {
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
                        {refundableEVMtoBTCLN!=null && refundableEVMtoBTCLN.length>0 ? (
                            <Card className="p-3">
                                <Card.Title>Incomplete swaps (EVM-{'>'}BTCLN)</Card.Title>
                                <Card.Body>
                                    {refundableEVMtoBTCLN.map((e,index) => {
                                        return (
                                            <SoltoBTCLNRefund key={index} signer={provider} swap={e} onError={setError} onSuccess={() => {
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
                        <SwapTab signer={provider} swapper={swapper}/>
                    </>
                ) : ""}
            </Card.Body>
        </Card>
    )
}