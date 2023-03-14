import BigNumber from "bignumber.js";
import {useEffect, useState} from "react";
import * as React from "react";
import ValidatedInput from "./ValidatedInput";
import {Alert, Button, Spinner} from "react-bootstrap";
import QRCode from "qrcode.react";
import {AnchorProvider, BN} from "@project-serum/anchor";
import {FEConstants} from "../FEConstants";
import {IBTCxtoSolSwap, BTCLNtoSolSwapState, Swapper, SwapType} from "sollightning-sdk";

export function BTCLNtoSolClaim(props: {
    signer: AnchorProvider,
    onError: (string) => any,
    onSuccess: () => any,
    swap: IBTCxtoSolSwap
}) {

    const [sendingTx, setSendingTx] = useState<boolean>(false);

    const [state, setState] = useState<number>(0);

    const [txId, setTxId] = useState<string>(null);
    const [confirmations, setConfirmations] = useState<number>(null);
    const [targetConfirmations, setTargetConfirmations] = useState<number>(null);


    // const commit = async() => {
    //     setSendingTx(true);
    //
    //     try {
    //         await props.swap.commit(props.signer);
    //         setClaimBegun(true);
    //     } catch (e) {
    //         if(typeof(e)==="string") {
    //             props.onError(e);
    //         } else {
    //             props.onError(e.message);
    //         }
    //     }
    //
    //     setSendingTx(false);
    // };
    //
    // const claim = async() => {
    //     setSendingTx(true);
    //
    //     try {
    //         await props.swap.claim(props.signer);
    //         props.onSuccess();
    //     } catch (e) {
    //         if(typeof(e)==="string") {
    //             props.onError(e);
    //         } else {
    //             props.onError(e.message);
    //         }
    //     }
    //
    //     setSendingTx(false);
    // };

    const commitAndClaim = async() => {
        setSendingTx(true);

        try {
            await props.swap.commitAndClaim(props.signer);
            props.onSuccess();
        } catch (e) {
            console.error(e);
            if(typeof(e)==="string") {
                props.onError(e);
            } else {
                props.onError(e.message);
            }
        }

        setSendingTx(false);
    };

    useEffect(() => {

        if(props.swap==null) return;

        const _abortController = new AbortController();

        setState(props.swap.state);

        if(props.swap.state===BTCLNtoSolSwapState.PR_CREATED) {
            props.swap.waitForPayment(_abortController.signal, null, ((txId, confirmations, targetConfirmations, amount, totalFee, received) => {
                setTxId(txId);
                setConfirmations(confirmations);
                setTargetConfirmations(targetConfirmations);
            })).then(() => {
                //
            });
        }

        const listener = (swap) => {
            setState(swap.state);
        };

        props.swap.events.on("swapState", listener);

        return () => {
            _abortController.abort();
            props.swap.events.removeListener("swapState", listener);
        }

    }, [props.swap]);

    return (
        <div className="d-flex flex-column justify-content-center align-items-center">
            {state===BTCLNtoSolSwapState.PR_CREATED && txId==null ? (
                <>
                    <ValidatedInput
                        className="mb-4"
                        type="text"
                        disabled={true}
                        label={(
                            <span className="fw-semibold">Address</span>
                        )}
                        size={null}
                        value={props.swap?.getAddress()}
                        onValidate={(val: any) => {
                            return null;
                        }}
                        copyEnabled={true}
                    />
                    <QRCode
                        size={256}
                        value={props.swap?.getQrData()}
                        includeMargin={true}
                        id={"qrCodeCanvas"}
                    />
                </>
            ) : ""}

            <b>Amount: </b>{props.swap==null ? "0.00000000" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC
            <b>Fee: </b>{props.swap==null ? "0.00000000" : new BigNumber(props.swap.getFee().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC
            <b>Total received: </b>{props.swap==null ? "0.00000000" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC

            {state===BTCLNtoSolSwapState.PR_CREATED ? (
                <div className="d-flex flex-column justify-content-center align-items-center mt-4">
                    <Spinner animation="border" />
                    {txId!=null ? (
                        <>
                            <b>Waiting for confirmations...</b>
                            <div className="mt-2 d-flex flex-column">
                                <b>Tx ID: </b>
                                <small>{txId}</small>
                            </div>
                            <div className="mt-2 d-flex flex-column">
                                <b>Confirmations: {confirmations}/{targetConfirmations}</b>
                                <small>You will be able to claim the funds once<br/>your bitcoin transaction gets {targetConfirmations} confirmations</small>
                            </div>
                        </>
                    ) : (
                        <b>Waiting for payment...</b>
                    )}
                </div>
            ) : (state===BTCLNtoSolSwapState.PR_PAID || state===BTCLNtoSolSwapState.CLAIM_COMMITED) ? (
                <>
                    {/*{isBeginRequired ? (*/}
                        {/*<Button onClick={commit} disabled={sendingTx || claimBegun}>*/}
                            {/*1. Begin claim {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(Bitcoin.satsMultiplier).toFixed(8)} BTC*/}
                        {/*</Button>*/}
                    {/*) : ""}*/}

                    {/*<Button onClick={claim} disabled={sendingTx || (isBeginRequired ? !claimBegun : false)}>*/}
                        {/*{isBeginRequired ? "2. " : ""}Finish claim {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(Bitcoin.satsMultiplier).toFixed(8)} BTC*/}
                    {/*</Button>*/}

                    <Button onClick={commitAndClaim} disabled={sendingTx}>
                        Claim {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC
                    </Button>
                </>
            ) : state===BTCLNtoSolSwapState.CLAIM_CLAIMED ? (
                <Alert variant="success">
                    Swap successful
                </Alert>
            ) : (
                <Alert variant="danger">
                    Swap failed
                </Alert>
            )}

        </div>
    )

}

function BTCLNtoSolPanel(props: {
    amount: BigNumber,
    signer: AnchorProvider,
    swapper: Swapper,
    swapType: SwapType.BTC_TO_SOL | SwapType.BTCLN_TO_SOL
}) {

    const [loading, setLoading] = useState<boolean>(null);
    const [error, setError] = useState<string>(null);

    const [swap, setSwap] = useState<IBTCxtoSolSwap>(null);

    useEffect(() => {
        const _abortController = new AbortController();

        if(props.signer==null) {
            return;
        }

        setError(null);
        setLoading(true);
        setSwap(null);

        (async () => {
            if(props.amount!=null) {
                try {
                    let createdSwap;
                    if(props.swapType===SwapType.BTCLN_TO_SOL) {
                        createdSwap = await props.swapper.createBTCLNtoSolSwap(new BN(props.amount.toString(10)));
                    }
                    if(props.swapType===SwapType.BTC_TO_SOL) {
                        createdSwap = await props.swapper.createBTCtoSolSwap(new BN(props.amount.toString(10)));
                    }
                    setSwap(createdSwap);
                    setLoading(false);
                } catch (e) {
                    console.log(e);
                    if(typeof(e)==="string") {
                        setError(e);
                    } else {
                        setError(e.message);
                    }
                }
            }
        })();

        return () => {
            _abortController.abort();
        };
    }, [props.signer, props.amount]);

    return (
        <div className="d-flex flex-column justify-content-center align-items-center">
            {loading ? (
                <div className="d-flex flex-column justify-content-center align-items-center mt-4">
                    <Spinner animation="border" />
                    <b>Loading...</b>
                </div>
            ) : ""}

            {error!=null ? (
                <Alert variant="danger">
                    {error}
                </Alert>
            ) : ""}

            {swap!=null ? (
                <BTCLNtoSolClaim signer={props.signer} swap={swap} onError={setError} onSuccess={() => {

                }}/>
            ) : ""}
        </div>
    )

}

export default BTCLNtoSolPanel;