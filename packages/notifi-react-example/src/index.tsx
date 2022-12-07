import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import { NearWalletContextProvider } from './NEARWalletProvider';
import { SolanaWalletProvider } from './SolanaWalletProvider';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <NearWalletContextProvider>
      <SolanaWalletProvider>
        <App />
      </SolanaWalletProvider>
    </NearWalletContextProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
