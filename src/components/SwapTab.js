import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import ValidatedInput from "./ValidatedInput";
import { useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { Button, Card, Modal } from "react-bootstrap";
import * as bolt11 from "bolt11";
import SolToBTCLNPanel from "./SolToBTCLNPanel";
import BTCLNtoSolPanel from "./BTCLNtoSolPanel";
import { QrReader } from "react-qr-reader";
import { ic_qr_code } from 'react-icons-kit/md/ic_qr_code';
import Icon from "react-icons-kit";
import { Swapper, SwapType } from "sollightning-sdk";
import { FEConstants } from "../FEConstants";
function SwapTab(props) {
    const [amount, setAmount] = useState(null);
    const amountRef = useRef();
    const [kind, setKind] = useState("SoltoBTCLN");
    const kindRef = useRef();
    const [address, setAddress] = useState(null);
    const sendToRef = useRef();
    const [scanning, setScanning] = useState(false);
    const [step, setStep] = useState(0);
    const [verifyAddress, setVerifyAddress] = useState(false);
    useEffect(() => {
        if (!verifyAddress)
            return;
        sendToRef.current.validate();
        setVerifyAddress(false);
    }, [verifyAddress]);
    return (_jsxs(Card, Object.assign({ className: "p-3" }, { children: [_jsxs(Modal, Object.assign({ show: scanning, onHide: () => setScanning(false) }, { children: [_jsx(Modal.Header, Object.assign({ closeButton: true }, { children: _jsx(Modal.Title, { children: "Scan the lightning invoice" }) })), _jsx(Modal.Body, { children: _jsx(QrReader, { onResult: (result, error) => {
                                if (!!error) {
                                    //console.info(error);
                                    return;
                                }
                                if (result) {
                                    console.log(result);
                                    let resultText = result.getText();
                                    console.log(resultText);
                                    if (resultText.startsWith("lightning:")) {
                                        resultText = resultText.substring(10);
                                    }
                                    if (resultText.startsWith("bitcoin:")) {
                                        resultText = resultText.substring(8);
                                        if (resultText.includes("?")) {
                                            resultText = resultText.split("?")[0];
                                        }
                                    }
                                    setScanning(false);
                                    setAddress(resultText);
                                    setVerifyAddress(true);
                                }
                            }, constraints: {
                                facingMode: "environment"
                            } }) }), _jsx(Modal.Footer, { children: _jsx(Button, Object.assign({ variant: "secondary", onClick: () => setScanning(false) }, { children: "Close" })) })] })), _jsx(Card.Title, { children: "Swap now" }), _jsxs(Card.Body, { children: [_jsx(ValidatedInput, { disabled: step !== 0, inputRef: kindRef, className: "mb-4", type: "select", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Type" }))), size: "lg", value: "" + kind, onChange: (val) => {
                            console.log("Value selected: ", val);
                            setKind(val);
                        }, placeholder: "Enter amount you want to send", onValidate: (val) => {
                            return null;
                        }, options: [
                            {
                                value: "BTC-LN -> Solana",
                                key: "BTCLNtoSol"
                            },
                            {
                                value: "BTC -> Solana",
                                key: "BTCtoSol"
                            },
                            {
                                value: "Solana -> BTC-LN",
                                key: "SoltoBTCLN"
                            },
                            {
                                value: "Solana -> BTC",
                                key: "SoltoBTC"
                            }
                        ] }), kind === "BTCLNtoSol" || kind === "BTCtoSol" ? (_jsx(ValidatedInput, { disabled: step !== 0, inputRef: amountRef, className: "mt-1 strip-group-text form-align-end", type: "number", value: amount, size: "lg", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Enter amount" }))), onChange: (val) => {
                            setAmount(val);
                        }, min: (kind === "BTCLNtoSol" ? new BigNumber(Swapper.getMinimum(SwapType.BTCLN_TO_SOL).toString(10)) : new BigNumber(Swapper.getMinimum(SwapType.BTC_TO_SOL).toString(10)))
                            .dividedBy(FEConstants.satsPerBitcoin), max: (kind === "BTCLNtoSol" ? new BigNumber(Swapper.getMaximum(SwapType.BTCLN_TO_SOL).toString(10)) : new BigNumber(Swapper.getMaximum(SwapType.BTC_TO_SOL).toString(10)))
                            .dividedBy(FEConstants.satsPerBitcoin), step: new BigNumber("0.00000001"), onValidate: (val) => {
                            return val === "" ? "Amount cannot be empty" : null;
                        } })) : kind === "SoltoBTCLN" ? (_jsx(ValidatedInput, { inputRef: sendToRef, className: "mb-4", type: "text", disabled: step !== 0, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Send to" }))), textEnd: (_jsx("a", Object.assign({ href: "javascript:void(0);", onClick: () => setScanning(true) }, { children: _jsx(Icon, { icon: ic_qr_code }) }))), size: "lg", value: address, onChange: setAddress, placeholder: "Enter destination address", onValidate: (val) => {
                            if (val === "")
                                return "Cannot be empty";
                            try {
                                const parsed = bolt11.decode(val);
                                console.log("parsed invoice: ", parsed);
                                if (parsed.satoshis == null) {
                                    return "Invoice needs to have an amount!";
                                }
                                if (parsed.timeExpireDate < (Date.now() / 1000)) {
                                    return "Invoice already expired!";
                                }
                                // if(parsed.timeExpireDate-600<(Date.now()/1000)) {
                                //     return "Invoice will expire in less than 10 minutes!";
                                // }
                            }
                            catch (e) {
                                console.error(e);
                                return "Invalid lightning invoice!";
                            }
                        } })) : (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { inputRef: sendToRef, className: "mb-4", type: "text", disabled: step !== 0, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Send to" }))), textEnd: (_jsx("a", Object.assign({ href: "javascript:void(0);", onClick: () => setScanning(true) }, { children: _jsx(Icon, { icon: ic_qr_code }) }))), size: "lg", value: address, onChange: setAddress, placeholder: "Enter destination address", onValidate: (val) => {
                                    if (val === "")
                                        return "Cannot be empty";
                                    if (!Swapper.isValidBitcoinAddress(val))
                                        return "Invalid bitcoin address";
                                } }), _jsx(ValidatedInput, { disabled: step !== 0, inputRef: amountRef, className: "mt-1 strip-group-text form-align-end", type: "number", value: amount, size: "lg", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Enter amount" }))), onChange: (val) => {
                                    setAmount(val);
                                }, min: new BigNumber(Swapper.getMinimum(SwapType.SOL_TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin), max: new BigNumber(Swapper.getMaximum(SwapType.SOL_TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin), step: new BigNumber("0.00000001"), onValidate: (val) => {
                                    return val === "" ? "Amount cannot be empty" : null;
                                } })] })), step === 1 ? (_jsxs(_Fragment, { children: [kind === "SoltoBTCLN" ? (_jsx(SolToBTCLNPanel, { bolt11PayReq: address, signer: props.signer, swapType: SwapType.SOL_TO_BTCLN, swapper: props.swapper })) : kind === "BTCLNtoSol" ? (_jsx(BTCLNtoSolPanel, { amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.BTCLN_TO_SOL, swapper: props.swapper })) : kind === "BTCtoSol" ? (_jsx(BTCLNtoSolPanel, { amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.BTC_TO_SOL, swapper: props.swapper })) : (_jsx(SolToBTCLNPanel, { bolt11PayReq: address, amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.SOL_TO_BTC, swapper: props.swapper })), _jsx(Button, Object.assign({ className: "mt-3", variant: "secondary", size: "lg", onClick: () => {
                                    setStep(0);
                                } }, { children: "Back" }))] })) : (_jsx(Button, Object.assign({ className: "mt-3", size: "lg", onClick: () => {
                            if (kind === "BTCLNtoSol" || kind === "BTCtoSol") {
                                if (!amountRef.current.validate()) {
                                    return;
                                }
                            }
                            else if (kind === "SoltoBTCLN") {
                                if (!sendToRef.current.validate()) {
                                    return;
                                }
                            }
                            else {
                                if (!amountRef.current.validate()) {
                                    return;
                                }
                                if (!sendToRef.current.validate()) {
                                    return;
                                }
                            }
                            setStep(1);
                        } }, { children: "Continue" })))] })] })));
}
export default SwapTab;
