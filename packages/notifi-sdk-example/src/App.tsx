import { arrayify } from "@ethersproject/bytes";
import {
  SignMessageParams,
  useNotifiClient,
} from "@notifi-network/notifi-react-hooks";
import { useWallet } from "@solana/wallet-adapter-react";

function App() {
  const { publicKey, signMessage } = useWallet();
  const DAPP_ADDRESS = "junitest.xyz";

  const notifiClient = useNotifiClient({
    dappAddress: DAPP_ADDRESS,
    walletBlockchain: "SOLANA",
    env: "Development",
    walletPublicKey: publicKey?.toBase58() ?? "",
  });

  const { logIn, logOut, isAuthenticated } = notifiClient;

  const handleLogin = async () => {
    if (!publicKey) {
      throw new Error("no public key");
    }
    if (!signMessage) {
      throw new Error("no sign message");
    }
    const signer: SignMessageParams = {
      walletBlockchain: "SOLANA",
      signMessage: async (buffer: Uint8Array) => {
        const result = await signMessage(buffer);
        return arrayify(result);
      },
    };

    await logIn(signer);
  };
  const handleCreateAlert = () => {
    console.log("create alert");
  };

  return (
    <div className="App">
      <div className="app-container">
        {!isAuthenticated ? (
          <button disabled={isAuthenticated} onClick={handleLogin}>
            Log In
          </button>
        ) : (
          <button onClick={logOut}> Log out</button>
        )}
        <button onClick={handleCreateAlert}> Create Alert</button>
      </div>
    </div>
  );
}

export default App;
