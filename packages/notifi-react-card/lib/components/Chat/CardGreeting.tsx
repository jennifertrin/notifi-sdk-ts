import React, { FC } from 'react';

import { ChatForm } from './ChatForm';

export const ChatGreeting: FC = () => {
  return (
    <div className="NotifiChatSupport--Card__Greeting">
      <h3 className="NotifiChatSupport--Card__Greeting--Title">
        Your Company Support
      </h3>
      <p className="NotifiChatSupport--Card__Greeting--SubTitle">
        Start chatting with our team to get support. We’re here for you 24/7!
      </p>
      <ChatForm />
    </div>
  );
};
