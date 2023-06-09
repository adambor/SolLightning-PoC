import { jsx as _jsx } from "react/jsx-runtime";
import './App.css';
import WalletTab from "./components/WalletTab";
import WrappedApp from "./WrappedApp";
require('@solana/wallet-adapter-react-ui/styles.css');
function App() {
    return (_jsx("div", Object.assign({ className: "App d-flex flex-column" }, { children: _jsx(WalletTab, { children: _jsx(WrappedApp, {}) }) })));
}
export default App;
