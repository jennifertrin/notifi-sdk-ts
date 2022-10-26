import { EmailIcon } from 'notifi-react-card/lib/assets/EmailIcon';
import { useNotifiChatContext } from 'notifi-react-card/lib/context';
import React, { FC } from 'react';

import { Input as NotifiInput } from '../Form';

export const ChatForm: FC = () => {
  const { email, setEmail, emailErrorMessage, setEmailErrorMessage } =
    useNotifiChatContext();

  return (
    <div className="NotifiChatSupport--Form">
      <p className="NotifiChatSupport--Form__Text">
        Get notifications for your support request
      </p>
      <div style={{ marginTop: '20px' }}>
        <NotifiInput
          icon={
            <div
              style={{
                color: '#B6B8D5',
                padding: '12px',
                paddingRight: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <EmailIcon />
            </div>
          }
          error={emailErrorMessage}
          value={email}
          onChange={setEmail}
          placeholder="Email address"
        />
      </div>
    </div>
  );
};
