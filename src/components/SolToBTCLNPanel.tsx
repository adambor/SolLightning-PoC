import {useEffect, useRef, useState} from "react";
import BigNumber from "bignumber.js";

import * as React from "react";
import {Alert, Button, Spinner} from "react-bootstrap";
import {AnchorProvider, BN} from "@coral-xyz/anchor";
import {FEConstants} from "../FEConstants";
import {SolanaSwapper, SwapType, ISolToBTCxSwap, SolToBTCxSwapState} from "sollightning-sdk";
import {Keypair, PublicKey} from "@solana/web3.js";

export function SoltoBTCLNRefund(props: {
    swap: ISolToBTCxSwap<any>
    onError: (string) => any,
    onSuccess: () => any,
    onRefunded: () => any
}) {
    const [loading, setLoading] = useState<boolean>(false);

    const [state, setState] = useState<number>(0);

    const [sendingTx, setSendingTx] = useState<boolean>(false);

    const abortController = useRef<AbortController>(null);

    const [expired, setExpired] = useState<boolean>(false);
    const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
    useEffect(() => {
        let timer;
        timer = setInterval(() => {
            const now = Date.now();
            if(props.swap.getState()===SolToBTCxSwapState.CREATED) {
                if(props.swap.getExpiry()<now && !sendingTx) {
                    props.onError("Swap expired!");
                    if(timer!=null) clearInterval(timer);
                    setExpired(true);
                    timer = null;
                    return;
                }
            }
            setCurrentTimestamp(now);
        }, 500);

        return () => {
            if(timer!=null) clearInterval(timer);
        }
    }, [props.swap]);

    useEffect(() => {
        abortController.current = new AbortController();
        if(props.swap==null) {
            return;
        }

        const listener = (swap) => {
            setState(swap.state);
            if(swap.state===SolToBTCxSwapState.CREATED) {
                setLoading(true);
                (async() => {

                    const neededToPay = props.swap.getInAmount();

                    const balance = await props.swap.getWrapper().getBalance(props.swap.data.getToken());
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
    }, [props.swap]);

    const refund = async() => {
        setSendingTx(true);

        try {
            const receipt = await props.swap.refund();
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
            const receipt = await props.swap.commit();
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

    const tokenData = FEConstants.tokenData[props.swap.data.getToken().toString()];
    const tokenSymbol = tokenData.symbol;
    const tokenDecimals = tokenData.decimals;
    const tokenDivisor = new BigNumber(10).pow(new BigNumber(tokenData.decimals));

    return (
        <div  className="d-flex flex-column justify-content-center align-items-center">
            <b>Amount: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getInAmountWithoutFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
            <b>Fee: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
            <b>Total: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getInAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}

            {state===SolToBTCxSwapState.CREATED ? (
                <>
                    {!sendingTx ? (
                        <>
                            <b>Expires in: </b>{props.swap==null ? "0" : Math.floor((props.swap.getExpiry()-currentTimestamp)/1000)} seconds
                        </>
                    ) : ""}
                    <Button disabled={sendingTx || expired} onClick={pay}>
                        Pay {props.swap==null ? "" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
                    </Button>
                </>
            ) : state===SolToBTCxSwapState.REFUNDABLE ? (
                <>
                    <Alert variant={"error"}>
                        Error occurred when trying to process the swap (recipient unreachable?)
                    </Alert>
                    <Button onClick={refund} disabled={sendingTx}>
                        Refund {props.swap==null ? "" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
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
                <Alert variant="success" style={{
                    maxWidth: "400px"
                }}>
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
    token: string,
    bolt11PayReq: string,
    amount?: BigNumber,
    comment?: string,
    swapper: SolanaSwapper,
    swapType: SwapType.TO_BTC | SwapType.TO_BTCLN
}) {

    const [loading, setLoading] = useState<boolean>(null);
    const [error, setError] = useState<string>(null);

    const [swap, setSwap] = useState<ISolToBTCxSwap<any>>(null);

    useEffect(() => {
        if(props.swapper==null) {
            return;
        }

        setSwap(null);
        setError(null);
        setLoading(true);

        (async () => {
            try {
                let swap;
                if(props.swapType===SwapType.TO_BTCLN) {
                    if(props.swapper.isValidLNURL(props.bolt11PayReq)) {
                        swap = await props.swapper.createSolToBTCLNSwapViaLNURL(new PublicKey(props.token), props.bolt11PayReq, new BN(props.amount.toString(10)), props.comment, 5*24*3600);
                    } else {
                        swap = await props.swapper.createSolToBTCLNSwap(new PublicKey(props.token), props.bolt11PayReq, 5*24*3600);
                    }
                }
                if(props.swapType===SwapType.TO_BTC) {
                    swap = await props.swapper.createSolToBTCSwap(new PublicKey(props.token), props.bolt11PayReq, new BN(props.amount.toString(10)));
                }
                setSwap(swap);
            } catch (e) {
                console.log(e);
                if(typeof(e)==="string") {
                    setError(e);
                } else {
                    setError(e.message);
                }
            }

            setLoading(false);
        })();

    }, [props.swapper, props.amount, props.bolt11PayReq]);

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
                <SoltoBTCLNRefund swap={swap} onError={(e) => {
                    setError(e);
                }} onSuccess={() => {

                }} onRefunded={() => {

                }}/>
            ) : ""}
        </div>
    );

}

export default SolToBTCLNPanel;