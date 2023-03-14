import {Container, Navbar} from "react-bootstrap";
import * as React from "react";
import {WalletModalProvider, WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";

const endpoint = "https://api.devnet.solana.com";
const wallets = [];

function WalletTab(props: {
    children: any
}) {
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>

                    <Navbar bg="dark" variant="dark">
                        <Container>
                            <Navbar.Brand href="#home" className="fw-semibold">
                                SolLightning
                            </Navbar.Brand>

                            <div className="ms-auto">
                                <WalletMultiButton />
                            </div>
                        </Container>
                    </Navbar>

                    <header className="App-header text-black flex-grow-1">
                        {props.children}
                    </header>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )

}

export default WalletTab;