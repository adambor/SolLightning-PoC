import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";
import ValidatedInput from "./ValidatedInput";
import { Alert, Button, Spinner } from "react-bootstrap";
import QRCode from "qrcode.react";
import { BN } from "@coral-xyz/anchor";
import { FEConstants } from "../FEConstants";
import { SwapType, FromBTCLNSwapState, FromBTCLNSwap, FromBTCSwapState, FromBTCSwap } from "sollightning-sdk";
import { PublicKey } from "@solana/web3.js";
export function BTCLNtoSolClaim(props) {
    var _a, _b;
    const [sendingTx, setSendingTx] = useState(false);
    const [state, setState] = useState(0);
    const [expired, setExpired] = useState(false);
    const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
    useEffect(() => {
        let timer;
        timer = setInterval(() => {
            const now = Date.now();
            if (props.swap.getState() === FromBTCLNSwapState.PR_PAID) {
                if (props.swap.getExpiry() < now && !sendingTx) {
                    props.onError("Swap expired!");
                    if (timer != null)
                        clearInterval(timer);
                    setExpired(true);
                    timer = null;
                    return;
                }
            }
            setCurrentTimestamp(now);
        }, 500);
        return () => {
            if (timer != null)
                clearInterval(timer);
        };
    }, [props.swap]);
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
            await props.swap.commitAndClaim();
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
        setState(props.swap.getState());
        console.log("Swap: ", props.swap);
        if (props.swap.getState() === FromBTCLNSwapState.PR_CREATED) {
            props.swap.waitForPayment(_abortController.signal, null).then(() => {
                //
            }).catch(e => {
                props.onError("Receiving error:" + e.message);
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
    const tokenData = FEConstants.tokenData[props.swap.data.getToken().toString()];
    const tokenSymbol = tokenData.symbol;
    const tokenDecimals = tokenData.decimals;
    const tokenDivisor = new BigNumber(10).pow(new BigNumber(tokenData.decimals));
    const nativeTokenData = FEConstants.tokenData[props.swap.getWrapper().contract.swapContract.getNativeCurrencyAddress().toString()];
    const nativeTokenSymbol = nativeTokenData.symbol;
    const nativeTokenDecimals = nativeTokenData.decimals;
    const nativeTokenDivisor = new BigNumber(10).pow(new BigNumber(nativeTokenData.decimals));
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [state === FromBTCLNSwapState.PR_CREATED ? (props.swap.isLNURL() ? (_jsx(_Fragment, { children: _jsx("b", { children: "Receiving through LNURL-withdraw..." }) })) : (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { className: "mb-4", type: "text", disabled: true, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Address" }))), size: null, value: (_a = props.swap) === null || _a === void 0 ? void 0 : _a.getAddress(), onValidate: (val) => {
                            return null;
                        }, copyEnabled: true }), _jsx(QRCode, { size: 256, value: (_b = props.swap) === null || _b === void 0 ? void 0 : _b.getQrData(), includeMargin: true, id: "qrCodeCanvas" })] }))) : "", !props.swap.isLNURL() ? (_jsx(Alert, Object.assign({ variant: "success", style: {
                    maxWidth: "400px"
                } }, { children: "Send the lightning network payment first, then finish the swap by claiming it here (the claim button will appear when the payment arrives)." }))) : "", _jsx("b", { children: "Amount: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmountWithoutFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, _jsx("b", { children: "Fee: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, _jsx("b", { children: "Total received: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, state === FromBTCLNSwapState.PR_CREATED ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), _jsx("b", { children: "Waiting for payment..." })] }))) : (state === FromBTCLNSwapState.PR_PAID || state === FromBTCLNSwapState.CLAIM_COMMITED) ? (_jsxs(_Fragment, { children: [state === FromBTCLNSwapState.PR_PAID && !sendingTx ? (_jsxs(_Fragment, { children: [_jsx("b", { children: "Expires in: " }), props.swap == null ? "0" : Math.floor((props.swap.getExpiry() - currentTimestamp) / 1000), " seconds"] })) : "", _jsxs(Button, Object.assign({ onClick: commitAndClaim, disabled: sendingTx || expired }, { children: ["Claim ", props.swap == null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol] }))] })) : state === FromBTCLNSwapState.CLAIM_CLAIMED ? (_jsx(Alert, Object.assign({ variant: "success" }, { children: "Swap successful" }))) : (_jsx(Alert, Object.assign({ variant: "danger" }, { children: "Swap failed" })))] })));
}
export function BTCtoSolClaim(props) {
    var _a, _b;
    const [sendingTx, setSendingTx] = useState(false);
    const [state, setState] = useState(0);
    const [txId, setTxId] = useState(null);
    const [confirmations, setConfirmations] = useState(null);
    const [targetConfirmations, setTargetConfirmations] = useState(null);
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const [expired, setExpired] = useState(false);
    const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
    useEffect(() => {
        let timer;
        timer = setInterval(() => {
            const now = Date.now();
            if (props.swap.getState() === FromBTCSwapState.PR_CREATED) {
                console.log("State: PR_CREATED", props.swap);
                if (props.swap.getExpiry() < now && !sendingTx) {
                    props.onError("Swap expired!");
                    if (timer != null)
                        clearInterval(timer);
                    setExpired(true);
                    timer = null;
                    return;
                }
            }
            setCurrentTimestamp(now);
        }, 500);
        return () => {
            if (timer != null)
                clearInterval(timer);
        };
    }, [props.swap]);
    const commit = async () => {
        setSendingTx(true);
        try {
            await props.swap.commit();
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
    const claim = async () => {
        setSendingTx(true);
        let success = false;
        try {
            await props.swap.claim();
            success = true;
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
        setState(props.swap.getState());
        console.log("Swap: ", props.swap);
        const listenForPayment = () => {
            props.swap.waitForPayment(_abortController.signal, null, ((txId, confirmations, targetConfirmations) => {
                setTxId(txId);
                setConfirmations(confirmations);
                setTargetConfirmations(targetConfirmations);
            })).then(() => {
                //
            });
        };
        const checkTimeoutInterval = setInterval(() => {
            const msRemaining = props.swap.getTimeoutTime() - Date.now();
            setSecondsRemaining(Math.floor(msRemaining / 1000));
        }, 1000);
        if (props.swap.getState() === FromBTCSwapState.CLAIM_COMMITED) {
            listenForPayment();
        }
        const listener = (swap) => {
            setState(swap.state);
            if (swap.state === FromBTCSwapState.CLAIM_COMMITED) {
                listenForPayment();
            }
        };
        props.swap.events.on("swapState", listener);
        return () => {
            _abortController.abort();
            props.swap.events.removeListener("swapState", listener);
            clearInterval(checkTimeoutInterval);
        };
    }, [props.swap]);
    const tokenData = FEConstants.tokenData[props.swap.data.getToken().toString()];
    const tokenSymbol = tokenData.symbol;
    const tokenDecimals = tokenData.decimals;
    const tokenDivisor = new BigNumber(10).pow(new BigNumber(tokenData.decimals));
    const nativeTokenData = FEConstants.tokenData[props.swap.getWrapper().contract.swapContract.getNativeCurrencyAddress().toString()];
    const nativeTokenSymbol = nativeTokenData.symbol;
    const nativeTokenDecimals = nativeTokenData.decimals;
    const nativeTokenDivisor = new BigNumber(10).pow(new BigNumber(nativeTokenData.decimals));
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [state === FromBTCSwapState.CLAIM_COMMITED && txId == null ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { className: "mb-4", type: "text", disabled: true, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Address" }))), size: null, value: (_a = props.swap) === null || _a === void 0 ? void 0 : _a.getAddress(), onValidate: (val) => {
                            return null;
                        }, copyEnabled: true }), _jsx(QRCode, { size: 256, value: (_b = props.swap) === null || _b === void 0 ? void 0 : _b.getQrData(), includeMargin: true, id: "qrCodeCanvas" })] })) : "", _jsx("b", { children: "Security deposit: " }), props.swap == null ? "0." + "0".repeat(nativeTokenDecimals) : new BigNumber(props.swap.getSecurityDeposit().toString()).dividedBy(nativeTokenDivisor).toFixed(nativeTokenDecimals), " ", nativeTokenSymbol, _jsx("small", { children: "(Returned back to you upon successful swap)" }), _jsx("b", { children: "Relayer fee: " }), props.swap == null ? "0." + "0".repeat(nativeTokenDecimals) : new BigNumber(props.swap.getClaimerBounty().toString()).dividedBy(nativeTokenDivisor).toFixed(nativeTokenDecimals), " ", nativeTokenSymbol, _jsx("small", { children: "(Fee for swap watchtowers)" }), _jsx("b", { children: "Amount: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmountWithoutFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, _jsx("b", { children: "Fee: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, _jsx("b", { children: "Total received: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, state === FromBTCSwapState.CLAIM_COMMITED ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), txId != null ? (_jsxs(_Fragment, { children: [_jsx("b", { children: "Waiting for confirmations..." }), _jsxs("div", Object.assign({ className: "mt-2 d-flex flex-column" }, { children: [_jsx("b", { children: "Tx ID: " }), _jsx("small", { children: txId })] })), _jsxs("div", Object.assign({ className: "mt-2 d-flex flex-column" }, { children: [_jsxs("b", { children: ["Confirmations: ", confirmations, "/", targetConfirmations] }), _jsxs("small", { children: ["You will be able to claim the funds once", _jsx("br", {}), "your bitcoin transaction gets ", targetConfirmations, " confirmations"] })] }))] })) : (_jsxs(_Fragment, { children: [_jsx("b", { children: "Waiting for payment..." }), _jsxs(Alert, Object.assign({ variant: "success", style: {
                                    maxWidth: "400px"
                                } }, { children: [_jsxs("p", { children: ["Make sure you send the transaction with the ", _jsx("b", { children: "EXACT" }), " amount, in time and with high enough fee!"] }), _jsxs("p", { children: ["Seconds remaining: ", secondsRemaining] })] }))] }))] }))) : (state === FromBTCSwapState.PR_CREATED) ? (_jsxs(_Fragment, { children: [!sendingTx ? (_jsxs(_Fragment, { children: [_jsx("b", { children: "Expires in: " }), props.swap == null ? "0" : Math.floor((props.swap.getExpiry() - currentTimestamp) / 1000), " seconds"] })) : "", _jsxs(Button, Object.assign({ onClick: commit, disabled: sendingTx || expired }, { children: ["Begin claim of ", props.swap == null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol] }))] })) : state === FromBTCSwapState.BTC_TX_CONFIRMED ? (_jsx(_Fragment, { children: _jsxs(Button, Object.assign({ onClick: claim, disabled: sendingTx }, { children: ["Claim ", props.swap == null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol] })) })) : state === FromBTCSwapState.CLAIM_CLAIMED ? (_jsx(Alert, Object.assign({ variant: "success" }, { children: "Swap successful" }))) : (_jsx(Alert, Object.assign({ variant: "danger" }, { children: "Swap failed" })))] })));
}
function BTCLNtoSolPanel(props) {
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [swap, setSwap] = useState(null);
    useEffect(() => {
        const _abortController = new AbortController();
        if (props.swapper == null) {
            return;
        }
        setError(null);
        setLoading(true);
        setSwap(null);
        (async () => {
            if (props.amount != null) {
                try {
                    let createdSwap;
                    if (props.swapType === SwapType.FROM_BTCLN) {
                        if (props.lnurl != null && props.lnurl !== "") {
                            console.log("Creating swap with lnurl: ", props.lnurl);
                            createdSwap = await props.swapper.createFromBTCLNSwapViaLNURL(new PublicKey(props.token), props.lnurl, new BN(props.amount.toString(10)));
                        }
                        else {
                            createdSwap = await props.swapper.createFromBTCLNSwap(new PublicKey(props.token), new BN(props.amount.toString(10)));
                        }
                    }
                    if (props.swapType === SwapType.FROM_BTC) {
                        createdSwap = await props.swapper.createFromBTCSwap(new PublicKey(props.token), new BN(props.amount.toString(10)));
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
    }, [props.swapper, props.swapType]);
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [loading ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), _jsx("b", { children: "Loading..." })] }))) : "", error != null ? (_jsx(Alert, Object.assign({ variant: "danger" }, { children: error }))) : "", swap != null ? (_jsx(_Fragment, { children: swap instanceof FromBTCLNSwap ? (_jsx(BTCLNtoSolClaim, { swap: swap, onError: setError, onSuccess: () => {
                        if (props.onSuccess != null)
                            props.onSuccess();
                    } })) : swap instanceof FromBTCSwap ? (_jsx(BTCtoSolClaim, { swap: swap, onError: setError, onSuccess: () => {
                        if (props.onSuccess != null)
                            props.onSuccess();
                    } })) : "" })) : ""] })));
}
export default BTCLNtoSolPanel;
