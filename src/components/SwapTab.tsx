import ValidatedInput, {ValidatedInputRef} from "./ValidatedInput";
import * as React from "react";
import {useEffect, useRef, useState} from "react";
import BigNumber from "bignumber.js";
import {Button, Card, Modal} from "react-bootstrap";
import * as bolt11 from "bolt11";
import SolToBTCLNPanel from "./SolToBTCLNPanel";
import BTCLNtoSolPanel from "./BTCLNtoSolPanel";
import {AnchorProvider} from "@project-serum/anchor";
import {QrReader} from "react-qr-reader";
import {ic_qr_code} from 'react-icons-kit/md/ic_qr_code'
import Icon from "react-icons-kit";
import * as bitcoin from "bitcoinjs-lib";
import {Swapper, SwapType} from "sollightning-sdk";
import {FEConstants} from "../FEConstants";

function SwapTab(props: {
    signer: AnchorProvider,
    swapper: Swapper
}) {

    const [amount, setAmount] = useState<string>(null);
    const amountRef = useRef<ValidatedInputRef>();

    const [kind, setKind] = useState<"BTCLNtoSol" | "SoltoBTCLN" | "SoltoBTC" | "BTCtoSol">("SoltoBTCLN");
    const kindRef = useRef<ValidatedInputRef>();

    const [address, setAddress] = useState<string>(null);
    const sendToRef = useRef<ValidatedInputRef>();
    const [scanning, setScanning] = useState<boolean>(false);

    const [step, setStep] = useState<number>(0);

    const [verifyAddress, setVerifyAddress] = useState<boolean>(false);

    useEffect(() => {
        if(!verifyAddress) return;

        sendToRef.current.validate();

        setVerifyAddress(false);
    }, [verifyAddress]);

    return (
        <Card className="p-3">

            <Modal show={scanning} onHide={() => setScanning(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Scan the lightning invoice</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <QrReader
                        onResult={(result, error) => {
                            if (!!error) {
                                //console.info(error);
                                return;
                            }
                            if(result) {
                                console.log(result);
                                const resultText = result.getText();
                                console.log(resultText);
                                setScanning(false);
                                setAddress(resultText);
                                setVerifyAddress(true);
                            }
                        }}
                        constraints={{
                            facingMode: "environment"
                        }}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setScanning(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Card.Title>Swap now</Card.Title>
            <Card.Body>
                <ValidatedInput
                    disabled={step!==0}
                    inputRef={kindRef}
                    className="mb-4"
                    type="select"
                    label={(
                        <span className="fw-semibold">Type</span>
                    )}
                    size={"lg"}
                    value={""+kind}
                    onChange={(val) => {
                        console.log("Value selected: ", val);
                        setKind(val);
                    }}
                    placeholder="Enter amount you want to send"
                    onValidate={(val: any) => {
                        return null;
                    }}
                    options={
                        [
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
                        ]
                    }
                />
                {kind==="BTCLNtoSol" || kind==="BTCtoSol" ? (
                    <ValidatedInput
                        disabled={step!==0}
                        inputRef={amountRef}
                        className="mt-1 strip-group-text form-align-end"
                        type="number"
                        value={amount}
                        size={"lg"}
                        label={(<span className="fw-semibold">Enter amount</span>)}
                        onChange={(val) => {
                            setAmount(val);
                        }}
                        min={
                            (kind==="BTCLNtoSol" ? new BigNumber(Swapper.getMinimum(SwapType.BTCLN_TO_SOL).toString(10)) : new BigNumber(Swapper.getMinimum(SwapType.BTC_TO_SOL).toString(10)))
                            .dividedBy(FEConstants.satsPerBitcoin)}
                        max={
                            (kind==="BTCLNtoSol" ? new BigNumber(Swapper.getMaximum(SwapType.BTCLN_TO_SOL).toString(10)) : new BigNumber(Swapper.getMaximum(SwapType.BTC_TO_SOL).toString(10)))
                            .dividedBy(FEConstants.satsPerBitcoin)}
                        step={new BigNumber("0.00000001")}
                        onValidate={(val: any) => {
                            return val==="" ? "Amount cannot be empty" : null;
                        }}
                    />
                ) : kind==="SoltoBTCLN" ? (
                    <ValidatedInput
                        inputRef={sendToRef}
                        className="mb-4"
                        type="text"
                        disabled={step!==0}
                        label={(
                            <span className="fw-semibold">Send to</span>
                        )}
                        textEnd={(
                            <a href="javascript:void(0);" onClick={() => setScanning(true)}>
                                <Icon icon={ic_qr_code}/>
                            </a>
                        )}
                        size={"lg"}
                        value={address}
                        onChange={setAddress}
                        placeholder="Enter destination address"
                        onValidate={(val: any) => {
                            if(val==="") return "Cannot be empty";
                            try {
                                const parsed = bolt11.decode(val);
                                console.log("parsed invoice: ", parsed);
                                if(parsed.satoshis==null) {
                                    return "Invoice needs to have an amount!";
                                }
                                if(parsed.timeExpireDate<(Date.now()/1000)) {
                                    return "Invoice already expired!";
                                }
                                // if(parsed.timeExpireDate-600<(Date.now()/1000)) {
                                //     return "Invoice will expire in less than 10 minutes!";
                                // }
                            } catch (e) {
                                console.error(e);
                                return "Invalid lightning invoice!";
                            }
                        }}
                    />
                ) : (
                    <>
                        <ValidatedInput
                            inputRef={sendToRef}
                            className="mb-4"
                            type="text"
                            disabled={step!==0}
                            label={(
                                <span className="fw-semibold">Send to</span>
                            )}
                            textEnd={(
                                <a href="javascript:void(0);" onClick={() => setScanning(true)}>
                                    <Icon icon={ic_qr_code}/>
                                </a>
                            )}
                            size={"lg"}
                            value={address}
                            onChange={setAddress}
                            placeholder="Enter destination address"
                            onValidate={(val: any) => {
                                if(val==="") return "Cannot be empty";
                                if(!Swapper.isValidBitcoinAddress(val)) return "Invalid bitcoin address";
                            }}
                        />
                        <ValidatedInput
                            disabled={step!==0}
                            inputRef={amountRef}
                            className="mt-1 strip-group-text form-align-end"
                            type="number"
                            value={amount}
                            size={"lg"}
                            label={(<span className="fw-semibold">Enter amount</span>)}
                            onChange={(val) => {
                                setAmount(val);
                            }}
                            min={new BigNumber(Swapper.getMinimum(SwapType.SOL_TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin)}
                            max={new BigNumber(Swapper.getMaximum(SwapType.SOL_TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin)}
                            step={new BigNumber("0.00000001")}
                            onValidate={(val: any) => {
                                return val==="" ? "Amount cannot be empty" : null;
                            }}
                        />
                    </>
                )}
                {step===1 ? (
                    <>
                        {kind==="SoltoBTCLN" ? (
                            <SolToBTCLNPanel bolt11PayReq={address} signer={props.signer} swapType={SwapType.SOL_TO_BTCLN} swapper={props.swapper}/>
                        ) : kind==="BTCLNtoSol" ? (
                            <BTCLNtoSolPanel amount={new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin)} signer={props.signer} swapType={SwapType.BTCLN_TO_SOL} swapper={props.swapper}/>
                        ) : kind==="BTCtoSol" ? (
                            <BTCLNtoSolPanel amount={new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin)} signer={props.signer} swapType={SwapType.BTC_TO_SOL} swapper={props.swapper}/>
                        ) : (
                            <SolToBTCLNPanel bolt11PayReq={address} amount={new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin)} signer={props.signer} swapType={SwapType.SOL_TO_BTC} swapper={props.swapper}/>
                        )}
                        <Button className="mt-3" variant="secondary" size={"lg"} onClick={() => {
                            setStep(0);
                        }}>
                            Back
                        </Button>
                    </>
                ) : (
                    <Button className="mt-3" size={"lg"} onClick={() => {
                        if(kind==="BTCLNtoSol" || kind==="BTCtoSol") {
                            if(!amountRef.current.validate()) {
                                return;
                            }
                        } else if(kind==="SoltoBTCLN") {
                            if(!sendToRef.current.validate()) {
                                return;
                            }
                        } else {
                            if(!amountRef.current.validate()) {
                                return;
                            }
                            if(!sendToRef.current.validate()) {
                                return;
                            }
                        }
                        setStep(1)
                    }}>
                        Continue
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
}

export default SwapTab;