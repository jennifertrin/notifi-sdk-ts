import { useWalletSelector } from '../NEARWalletContextProvider';

export const NearSignIn: React.FC = () => {
  const { modal } = useWalletSelector();

  const handleSignIn = () => {
    modal.show();
  };

  return <button onClick={handleSignIn}>Log in</button>;
};
