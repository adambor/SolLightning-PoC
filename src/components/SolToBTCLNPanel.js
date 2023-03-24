import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { Alert, Button, Spinner } from "react-bootstrap";
import { BN } from "@project-serum/anchor";
import { FEConstants } from "../FEConstants";
import { SwapType, SolToBTCxSwapState } from "sollightning-sdk";
export function SoltoBTCLNRefund(props) {
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState(0);
    const [sendingTx, setSendingTx] = useState(false);
    const abortController = useRef(null);
    useEffect(() => {
        abortController.current = new AbortController();
        if (props.swap == null) {
            return;
        }
        if (props.signer == null) {
            return;
        }
        const listener = (swap) => {
            setState(swap.state);
            if (swap.state === SolToBTCxSwapState.CREATED) {
                setLoading(true);
                (async () => {
                    const neededToPay = props.swap.getInAmount();
                    const balance = await props.swap.getWrapper().getWBTCBalance();
                    console.log("Balance: ", balance);
                    const hasEnoughBalance = balance.gte(neededToPay);
                    if (!hasEnoughBalance) {
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
    const refund = async () => {
        setSendingTx(true);
        try {
            const receipt = await props.swap.refund(props.signer);
            props.onRefunded();
        }
        catch (e) {
            if (typeof (e) === "string") {
                props.onError(e);
            }
            else {
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
            if (result) {
                props.onSuccess();
            }
        }
        catch (e) {
            console.error(e);
            if (typeof (e) === "string") {
                props.onError(e);
            }
            else {
                props.onError(e.message);
            }
        }
        setSendingTx(false);
    };
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [_jsx("b", { children: "Amount: " }), props.swap == null ? "0.00000000" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC", _jsx("b", { children: "Fee: " }), props.swap == null ? "0.00000000" : new BigNumber(props.swap.getFee().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC", _jsx("b", { children: "Total: " }), props.swap == null ? "0.00000000" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC", state === SolToBTCxSwapState.CREATED ? (_jsx(_Fragment, { children: _jsxs(Button, Object.assign({ disabled: sendingTx, onClick: pay }, { children: ["Pay ", props.swap == null ? "" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC"] })) })) : state === SolToBTCxSwapState.REFUNDABLE ? (_jsxs(_Fragment, { children: [_jsx(Alert, Object.assign({ variant: "error" }, { children: "Error occurred when trying to process the swap (recipient unreachable?)" })), _jsxs(Button, Object.assign({ onClick: refund, disabled: sendingTx }, { children: ["Refund ", props.swap == null ? "" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC"] }))] })) : state === SolToBTCxSwapState.COMMITED ? (_jsx(_Fragment, { children: props.swap.getTxId() != null ? (_jsxs(Alert, Object.assign({ variant: "success" }, { children: ["Swap successful (", props.swap.getTxId(), ")"] }))) : (_jsxs(_Fragment, { children: [_jsx(Spinner, { animation: "border" }), _jsx("b", { children: "Payment in progress..." })] })) })) : state === SolToBTCxSwapState.CLAIMED ? (_jsxs(Alert, Object.assign({ variant: "success" }, { children: ["Swap successful (", props.swap.getTxId(), ")"] }))) : state === SolToBTCxSwapState.REFUNDED ? (_jsx(Alert, Object.assign({ variant: "danger" }, { children: "Swap failed (Money refunded)" }))) : state === SolToBTCxSwapState.FAILED ? (_jsx(Alert, Object.assign({ variant: "danger" }, { children: "Swap failed" }))) : ""] })));
}
function SolToBTCLNPanel(props) {
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [swap, setSwap] = useState(null);
    useEffect(() => {
        if (props.signer == null) {
            return;
        }
        setSwap(null);
        setError(null);
        setLoading(true);
        (async () => {
            try {
                let swap;
                if (props.swapType === SwapType.SOL_TO_BTCLN) {
                    swap = await props.swapper.createSolToBTCLNSwap(props.bolt11PayReq, 5 * 24 * 3600);
                }
                if (props.swapType === SwapType.SOL_TO_BTC) {
                    swap = await props.swapper.createSolToBTCSwap(props.bolt11PayReq, new BN(props.amount.toString(10)));
                }
                setSwap(swap);
            }
            catch (e) {
                if (typeof (e) === "string") {
                    setError(e);
                }
                else {
                    setError(e.message);
                }
            }
            setLoading(false);
        })();
    }, [props.signer, props.bolt11PayReq]);
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [loading ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), _jsx("b", { children: "Loading..." })] }))) : "", error != null ? (_jsx(Alert, Object.assign({ variant: "danger" }, { children: error }))) : "", swap != null ? (_jsx(SoltoBTCLNRefund, { signer: props.signer, swap: swap, onError: (e) => {
                    setError(e);
                }, onSuccess: () => {
                }, onRefunded: () => {
                } })) : ""] })));
}
export default SolToBTCLNPanel;
