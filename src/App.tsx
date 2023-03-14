import './App.css';
import * as React from "react";
import WalletTab from "./components/WalletTab";
import WrappedApp from "./WrappedApp";

require('@solana/wallet-adapter-react-ui/styles.css');

function App() {
    return (
        <div className="App d-flex flex-column">
            <WalletTab>
                <WrappedApp/>
            </WalletTab>
        </div>
    );
}

export default App;
