import {useEffect, useRef, useState} from "react";
import BigNumber from "bignumber.js";

import * as React from "react";
import {Alert, Button, Spinner} from "react-bootstrap";
import {AnchorProvider, BN} from "@project-serum/anchor";
import {FEConstants} from "../FEConstants";
import {Swapper, SwapType, ISoltoBTCxSwap, SolToBTCxSwapState} from "sollightning-sdk";

export function SoltoBTCLNRefund(props: {
    signer: AnchorProvider,
    swap: ISoltoBTCxSwap
    onError: (string) => any,
    onSuccess: () => any,
    onRefunded: () => any
}) {
    const [loading, setLoading] = useState<boolean>(false);

    const [state, setState] = useState<number>(0);

    const [sendingTx, setSendingTx] = useState<boolean>(false);

    const abortController = useRef<AbortController>(null);


    useEffect(() => {
        abortController.current = new AbortController();
        if(props.swap==null) {
            return;
        }
        if(props.signer==null) {
            return;
        }

        const listener = (swap) => {
            setState(swap.state);
            if(swap.state===SolToBTCxSwapState.CREATED) {
                setLoading(true);
                (async() => {

                    const neededToPay = props.swap.getInAmount();

                    const balance = await props.swap.getWrapper().getWBTCBalance();
                    console.log("Balance: ", balance);
                    const hasEnoughBalance = balance.gte(neededToPay);
                    if(!hasEnoughBalance) {
                        setLoading(false);
                        props.onError("Not enough balance!");
                        return;
                    }

                    //setApproveRequired(false);
                    setLoading(false);
                })();
            }
        };

        listener(props.swap);
        props.swap.events.on("swapState", listener);

        return () => {
            props.swap.events.removeListener("swapState", listener);
            abortController.current.abort();
        };
    }, [props.swap, props.signer]);

    const refund = async() => {
        setSendingTx(true);

        try {
            const receipt = await props.swap.refund(props.signer);
            props.onRefunded();
        } catch (e) {
            if(typeof(e)==="string") {
                props.onError(e);
            } else {
                props.onError(e.message);
            }
        }

        setSendingTx(false);

    };

    const pay = async () => {
        setSendingTx(true);
        try {
            const receipt = await props.swap.commit(props.signer);
            const result = await props.swap.waitForPayment(abortController.current.signal);

            if(result) {
                props.onSuccess();
            }
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

    return (
        <div  className="d-flex flex-column justify-content-center align-items-center">
            <b>Amount: </b>{props.swap==null ? "0.00000000" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC
            <b>Fee: </b>{props.swap==null ? "0.00000000" : new BigNumber(props.swap.getFee().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC
            <b>Total: </b>{props.swap==null ? "0.00000000" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC

            {state===SolToBTCxSwapState.CREATED ? (
                <>
                    <Button disabled={sendingTx} onClick={pay}>
                        Pay {props.swap==null ? "" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC
                    </Button>
                </>
            ) : state===SolToBTCxSwapState.REFUNDABLE ? (
                <>
                    <Alert variant={"error"}>
                        Error occurred when trying to process the swap (recipient unreachable?)
                    </Alert>
                    <Button onClick={refund} disabled={sendingTx}>
                        Refund {props.swap==null ? "" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8)} BTC
                    </Button>
                </>
            ) : state===SolToBTCxSwapState.COMMITED ? (
                <>
                    {props.swap.getTxId()!=null ? (
                        <Alert variant="success">
                            Swap successful ({props.swap.getTxId()})
                        </Alert>
                    ) : (
                        <>
                            <Spinner animation="border" />
                            <b>Payment in progress...</b>
                        </>
                    )}
                </>
            ) : state===SolToBTCxSwapState.CLAIMED ? (
                <Alert variant="success">
                    Swap successful ({props.swap.getTxId()})
                </Alert>
            ) : state===SolToBTCxSwapState.REFUNDED ? (
                <Alert variant="danger">
                    Swap failed (Money refunded)
                </Alert>
            ) : state===SolToBTCxSwapState.FAILED ? (
                <Alert variant="danger">
                    Swap failed
                </Alert>
            ) : ""}
        </div>
    )

}

function SolToBTCLNPanel(props: {
    bolt11PayReq: string,
    amount?: BigNumber,
    signer: AnchorProvider,
    swapper: Swapper,
    swapType: SwapType.SOL_TO_BTC | SwapType.SOL_TO_BTCLN
}) {

    const [loading, setLoading] = useState<boolean>(null);
    const [error, setError] = useState<string>(null);

    const [swap, setSwap] = useState<ISoltoBTCxSwap>(null);

    useEffect(() => {
        if(props.signer==null) {
            return;
        }

        setSwap(null);
        setError(null);
        setLoading(true);

        (async () => {
            try {
                let swap;
                if(props.swapType===SwapType.SOL_TO_BTCLN) {
                    swap = await props.swapper.createSolToBTCLNSwap(props.bolt11PayReq, 5*24*3600);
                }
                if(props.swapType===SwapType.SOL_TO_BTC) {
                    swap = await props.swapper.createSolToBTCSwap(props.bolt11PayReq, new BN(props.amount.toString(10)));
                }
                setSwap(swap);
            } catch (e) {
                if(typeof(e)==="string") {
                    setError(e);
                } else {
                    setError(e.message);
                }
            }

            setLoading(false);
        })();

    }, [props.signer, props.bolt11PayReq]);

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
                <SoltoBTCLNRefund signer={props.signer} swap={swap} onError={(e) => {
                    setError(e);
                }} onSuccess={() => {

                }} onRefunded={() => {

                }}/>
            ) : ""}
        </div>
    );

}

export default SolToBTCLNPanel;