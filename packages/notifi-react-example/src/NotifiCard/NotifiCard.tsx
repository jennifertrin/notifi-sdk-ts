import {
  NotifiContext,
  NotifiSubscriptionCard,
} from '@notifi-network/notifi-react-card';
import '@notifi-network/notifi-react-card/dist/index.css';
import { keyStores } from 'near-api-js';
import React, { useEffect, useMemo, useState } from 'react';

import { useWalletSelector } from '../NEARWalletContextProvider';
import './NotifiCard.css';

// import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export const NotifiCard: React.FC = () => {
  const [publicKey, setPublicKey] = useState<string>('');
  const { accounts, accountId, modal } = useWalletSelector();

  const keyStore = useMemo(() => {
    return new keyStores.BrowserLocalStorageKeyStore();
  }, []);

  useEffect(() => {
    async function getPublicKey() {
      const keyPair = await keyStore.getKey('testnet', ACCOUNT_ID);
      setPublicKey(keyPair.getPublicKey().toString());
    }
    getPublicKey();
  }, [keyStore]);

  console.log('publicKey', publicKey);

  console.log('notifiCard', accounts, accountId, modal);

  const ACCOUNT_ID = 'jennifer-notifi.testnet';

  if (accountId === null) return null;

  console.log('keyStore', keyStore);

  // const config = {
  //   keyStore,
  //   networkId: 'testnet',
  //   nodeUrl: 'https://rpc.testnet.near.org',
  // };

  async function signMessage(message: string) {
    const keyPair = await keyStore.getKey('testnet', ACCOUNT_ID);

    const msg = Buffer.from(message);

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
        walletPublicKey={publicKey}
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
