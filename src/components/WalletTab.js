import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Navbar } from "react-bootstrap";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
const endpoint = "https://api.devnet.solana.com";
const wallets = [];
function WalletTab(props) {
    return (_jsx(ConnectionProvider, Object.assign({ endpoint: endpoint }, { children: _jsx(WalletProvider, Object.assign({ wallets: wallets, autoConnect: true }, { children: _jsxs(WalletModalProvider, { children: [_jsx(Navbar, Object.assign({ bg: "dark", variant: "dark" }, { children: _jsxs(Container, { children: [_jsx(Navbar.Brand, Object.assign({ href: "#home", className: "fw-semibold" }, { children: "SolLightning" })), _jsx("div", Object.assign({ className: "ms-auto" }, { children: _jsx(WalletMultiButton, {}) }))] }) })), _jsx("header", Object.assign({ className: "App-header text-black flex-grow-1" }, { children: props.children }))] }) })) })));
}
export default WalletTab;
