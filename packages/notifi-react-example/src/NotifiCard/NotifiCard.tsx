import {
  NotifiContext,
  NotifiSubscriptionCard,
} from '@notifi-network/notifi-react-card';
import '@notifi-network/notifi-react-card/dist/index.css';
import { keyStores } from 'near-api-js';
import React from 'react';

import { useWalletSelector } from '../NEARWalletContextProvider';
import './NotifiCard.css';

// import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export const NotifiCard: React.FC = () => {
  const { accounts, accountId, modal } = useWalletSelector();

  console.log('notifiCard', accounts, accountId, modal);

  const ACCOUNT_ID = 'jennifer-notifi.testnet';

  if (accountId === null) return null;

  const keyStore = new keyStores.BrowserLocalStorageKeyStore();

  console.log('keyStore', keyStore);

  // const config = {
  //   keyStore,
  //   networkId: 'testnet',
  //   nodeUrl: 'https://rpc.testnet.near.org',
  // };

  async function signMessage(message: string) {
    const keyPair = await keyStore.getKey('testnet', ACCOUNT_ID);

    console.log('message', message);
    const msg = Buffer.from(message);

    console.log('msg', msg);

    const { signature } = keyPair.sign(msg);

    const isValid = keyPair.verify(msg, signature);

    console.log('isValid', isValid);

    return signature;
  }
  // const { connection } = useConnection();
  // const { wallet, sendTransaction, signMessage } = useWallet();
  // const adapter = wallet?.adapter;
  // const publicKey = adapter?.publicKey?.toBase58() ?? null;

  // if (publicKey === null || signMessage === undefined) {
  //   // publicKey is required
  //   return null;
  // }

  // const inputLabels = {
  //   email: 'Email',
  //   sms: 'Text Message',
  //   telegram: 'Telegram',
  // };

  // const inputSeparators: NotifiInputSeparators = {
  //   smsSeparator: {
  //     content: 'OR',
  //   },
  //   emailSeparator: {
  //     content: 'OR',
  //   },
  //   telegramSeparator: {
  //     content: 'OR',
  //   },
  // };

  return (
    <div className="container">
      <NotifiContext
        dappAddress="junitest.xyz"
        walletBlockchain="NEAR"
        env="Development"
        walletPublicKey={
          'ed25519:5ix7EqnEjgzt8QG8g1oLm7ZXvfzyZ9i12VWwFHQ4AjJXkXcJaj5yzQayEFmpvnnxzqWvY6oZdNV5NARQsQUG534k'
        }
        accountAddress={accountId}
        signMessage={signMessage}
      >
        <NotifiSubscriptionCard
          darkMode
          cardId="71562316475a4171ae9c980adaefab7d"
        ></NotifiSubscriptionCard>
      </NotifiContext>
    </div>
  );
};
