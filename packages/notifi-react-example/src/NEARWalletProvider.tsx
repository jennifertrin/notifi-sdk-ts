import App from './App';
import { WalletSelectorContextProvider as NearContextProvider } from './NEARWalletContextProvider';
import { NearSignIn } from './NotifiCard/NearSignIn';

export const NearWalletContextProvider: React.FC = () => {
  return (
    <NearContextProvider>
      <NearSignIn />
      <App />
    </NearContextProvider>
  );
};
