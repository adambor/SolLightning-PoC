import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";
import ValidatedInput from "./ValidatedInput";
import { Alert, Button, Spinner } from "react-bootstrap";
import QRCode from "qrcode.react";
import { BN } from "@project-serum/anchor";
import { FEConstants } from "../FEConstants";
import { BTCLNtoSolSwapState, SwapType } from "sollightning-sdk";
export function BTCLNtoSolClaim(props) {
    var _a, _b;
    const [sendingTx, setSendingTx] = useState(false);
    const [state, setState] = useState(0);
    const [txId, setTxId] = useState(null);
    const [confirmations, setConfirmations] = useState(null);
    const [targetConfirmations, setTargetConfirmations] = useState(null);
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
    const commitAndClaim = async () => {
        setSendingTx(true);
        try {
            await props.swap.commitAndClaim(props.signer);
            props.onSuccess();
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
    useEffect(() => {
        if (props.swap == null)
            return;
        const _abortController = new AbortController();
        setState(props.swap.state);
        if (props.swap.state === BTCLNtoSolSwapState.PR_CREATED) {
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
        };
    }, [props.swap]);
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [state === BTCLNtoSolSwapState.PR_CREATED && txId == null ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { className: "mb-4", type: "text", disabled: true, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Address" }))), size: null, value: (_a = props.swap) === null || _a === void 0 ? void 0 : _a.getAddress(), onValidate: (val) => {
                            return null;
                        }, copyEnabled: true }), _jsx(QRCode, { size: 256, value: (_b = props.swap) === null || _b === void 0 ? void 0 : _b.getQrData(), includeMargin: true, id: "qrCodeCanvas" })] })) : "", _jsx("b", { children: "Amount: " }), props.swap == null ? "0.00000000" : new BigNumber(props.swap.getInAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC", _jsx("b", { children: "Fee: " }), props.swap == null ? "0.00000000" : new BigNumber(props.swap.getFee().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC", _jsx("b", { children: "Total received: " }), props.swap == null ? "0.00000000" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC", state === BTCLNtoSolSwapState.PR_CREATED ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), txId != null ? (_jsxs(_Fragment, { children: [_jsx("b", { children: "Waiting for confirmations..." }), _jsxs("div", Object.assign({ className: "mt-2 d-flex flex-column" }, { children: [_jsx("b", { children: "Tx ID: " }), _jsx("small", { children: txId })] })), _jsxs("div", Object.assign({ className: "mt-2 d-flex flex-column" }, { children: [_jsxs("b", { children: ["Confirmations: ", confirmations, "/", targetConfirmations] }), _jsxs("small", { children: ["You will be able to claim the funds once", _jsx("br", {}), "your bitcoin transaction gets ", targetConfirmations, " confirmations"] })] }))] })) : (_jsx("b", { children: "Waiting for payment..." }))] }))) : (state === BTCLNtoSolSwapState.PR_PAID || state === BTCLNtoSolSwapState.CLAIM_COMMITED) ? (_jsx(_Fragment, { children: _jsxs(Button, Object.assign({ onClick: commitAndClaim, disabled: sendingTx }, { children: ["Claim ", props.swap == null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(FEConstants.satsPerBitcoin).toFixed(8), " BTC"] })) })) : state === BTCLNtoSolSwapState.CLAIM_CLAIMED ? (_jsx(Alert, Object.assign({ variant: "success" }, { children: "Swap successful" }))) : (_jsx(Alert, Object.assign({ variant: "danger" }, { children: "Swap failed" })))] })));
}
function BTCLNtoSolPanel(props) {
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [swap, setSwap] = useState(null);
    useEffect(() => {
        const _abortController = new AbortController();
        if (props.signer == null) {
            return;
        }
        setError(null);
        setLoading(true);
        setSwap(null);
        (async () => {
            if (props.amount != null) {
                try {
                    let createdSwap;
                    if (props.swapType === SwapType.BTCLN_TO_SOL) {
                        createdSwap = await props.swapper.createBTCLNtoSolSwap(new BN(props.amount.toString(10)));
                    }
                    if (props.swapType === SwapType.BTC_TO_SOL) {
                        createdSwap = await props.swapper.createBTCtoSolSwap(new BN(props.amount.toString(10)));
                    }
                    setSwap(createdSwap);
                    setLoading(false);
                }
                catch (e) {
                    console.log(e);
                    if (typeof (e) === "string") {
                        setError(e);
                    }
                    else {
                        setError(e.message);
                    }
                }
            }
        })();
        return () => {
            _abortController.abort();
        };
    }, [props.signer, props.amount]);
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [loading ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), _jsx("b", { children: "Loading..." })] }))) : "", error != null ? (_jsx(Alert, Object.assign({ variant: "danger" }, { children: error }))) : "", swap != null ? (_jsx(BTCLNtoSolClaim, { signer: props.signer, swap: swap, onError: setError, onSuccess: () => {
                } })) : ""] })));
}
export default BTCLNtoSolPanel;
