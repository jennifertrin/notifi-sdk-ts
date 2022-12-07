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

  const ACCOUNT_ID = 'jennifer-notifi.test';

  if (accountId === null) return null;

  const keyStore = new keyStores.BrowserLocalStorageKeyStore();

  const config = {
    keyStore,
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
  };

  async function signMessage(message: string) {
    const keyPair = await keyStore.getKey(config.networkId, ACCOUNT_ID);
    const msg = Buffer.from(message);

    const { signature } = keyPair.sign(msg);

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
        walletPublicKey={accountId}
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
