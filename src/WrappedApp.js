import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { BTCLNtoSolClaim, BTCtoSolClaim } from "./components/BTCLNtoSolPanel";
import { SoltoBTCLNRefund } from "./components/SolToBTCLNPanel";
import SwapTab from "./components/SwapTab";
import { useEffect } from "react";
import { useState } from "react";
import { Card } from "react-bootstrap";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { SolanaSwapper, BTCLNtoSolSwap, BTCtoSolNewSwap, CoinGeckoSwapPrice } from "sollightning-sdk";
import * as BN from "bn.js";
import { FEConstants } from "./FEConstants";
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
                const swapper = new SolanaSwapper(_provider, {
                    pricing: new CoinGeckoSwapPrice(new BN(2500), CoinGeckoSwapPrice.createCoinsMap(FEConstants.wbtcToken.toBase58(), FEConstants.usdcToken.toBase58(), FEConstants.usdtToken.toBase58()))
                });
                await swapper.init();
                console.log("Swapper initialized, getting claimable swaps...");
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
    return (_jsx(Card, Object.assign({ bg: "light" }, { children: _jsx(Card.Body, { children: swapper != null ? (_jsxs(_Fragment, { children: [claimableBTCLNtoEVM != null && claimableBTCLNtoEVM.length > 0 ? (_jsxs(Card, Object.assign({ className: "p-3" }, { children: [_jsxs(Card.Title, { children: ["Incomplete swaps (BTCLN-", '>', "Solana)"] }), _jsx(Card.Body, { children: claimableBTCLNtoEVM.map((e, index) => {
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
                                }) })] }))) : "", refundableEVMtoBTCLN != null && refundableEVMtoBTCLN.length > 0 ? (_jsxs(Card, Object.assign({ className: "p-3" }, { children: [_jsxs(Card.Title, { children: ["Incomplete swaps (Solana-", '>', "BTCLN)"] }), _jsx(Card.Body, { children: refundableEVMtoBTCLN.map((e, index) => {
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
