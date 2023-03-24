import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { BTCLNtoSolClaim, BTCtoSolClaim } from "./components/BTCLNtoSolPanel";
import { SoltoBTCLNRefund } from "./components/SolToBTCLNPanel";
import SwapTab from "./components/SwapTab";
import { useEffect } from "react";
import { useState } from "react";
import { Card } from "react-bootstrap";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@project-serum/anchor";
import { Swapper } from "sollightning-sdk";
import { FEConstants } from "./FEConstants";
import BTCLNtoSolSwap from "sollightning-sdk/dist/bridge/btclntosol/BTCLNtoSolSwap";
import BTCtoSolNewSwap from "sollightning-sdk/dist/bridge/btctosolNew/BTCtoSolNewSwap";
export default function WrappedApp() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [provider, setProvider] = useState();
    const [error, setError] = useState();
    const [swapper, setSwapper] = useState();
    const [claimableBTCLNtoEVM, setClaimableBTCLNtoEVM] = useState();
    const [refundableEVMtoBTCLN, setRefundableEVMtoBTCLN] = useState();
    useEffect(() => {
        if (wallet == null) {
            setSwapper(null);
            setClaimableBTCLNtoEVM(null);
            setRefundableEVMtoBTCLN(null);
            setProvider(null);
            return;
        }
        const _provider = new AnchorProvider(connection, wallet, { preflightCommitment: "processed" });
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
            }
            catch (e) {
                console.error(e);
            }
        })();
    }, [wallet]);
    return (_jsx(Card, Object.assign({ bg: "light" }, { children: _jsx(Card.Body, { children: swapper != null ? (_jsxs(_Fragment, { children: [claimableBTCLNtoEVM != null && claimableBTCLNtoEVM.length > 0 ? (_jsxs(Card, Object.assign({ className: "p-3" }, { children: [_jsxs(Card.Title, { children: ["Incomplete swaps (BTCLN-", '>', "EVM)"] }), _jsx(Card.Body, { children: claimableBTCLNtoEVM.map((e, index) => {
                                    if (e instanceof BTCLNtoSolSwap) {
                                        return (_jsx(BTCLNtoSolClaim, { signer: provider, swap: e, onError: setError, onSuccess: () => {
                                                setClaimableBTCLNtoEVM(prevState => {
                                                    const cpy = [...prevState];
                                                    cpy.splice(index, 1);
                                                    return cpy;
                                                });
                                            } }, index));
                                    }
                                    if (e instanceof BTCtoSolNewSwap) {
                                        return (_jsx(BTCtoSolClaim, { signer: provider, swap: e, onError: setError, onSuccess: () => {
                                                setClaimableBTCLNtoEVM(prevState => {
                                                    const cpy = [...prevState];
                                                    cpy.splice(index, 1);
                                                    return cpy;
                                                });
                                            } }, index));
                                    }
                                }) })] }))) : "", refundableEVMtoBTCLN != null && refundableEVMtoBTCLN.length > 0 ? (_jsxs(Card, Object.assign({ className: "p-3" }, { children: [_jsxs(Card.Title, { children: ["Incomplete swaps (EVM-", '>', "BTCLN)"] }), _jsx(Card.Body, { children: refundableEVMtoBTCLN.map((e, index) => {
                                    return (_jsx(SoltoBTCLNRefund, { signer: provider, swap: e, onError: setError, onSuccess: () => {
                                            setRefundableEVMtoBTCLN(prevState => {
                                                const cpy = [...prevState];
                                                cpy.splice(index, 1);
                                                return cpy;
                                            });
                                        }, onRefunded: () => {
                                            setRefundableEVMtoBTCLN(prevState => {
                                                const cpy = [...prevState];
                                                cpy.splice(index, 1);
                                                return cpy;
                                            });
                                        } }, index));
                                }) })] }))) : "", _jsx(SwapTab, { signer: provider, swapper: swapper })] })) : "" }) })));
}
