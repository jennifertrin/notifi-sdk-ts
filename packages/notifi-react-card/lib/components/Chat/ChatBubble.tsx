import { ChatIconOff, ChatIconOn } from 'notifi-react-card/lib/assets/ChatIcon';
import { useNotifiChatContext } from 'notifi-react-card/lib/context/NotifiChatSupportContext';
import React, { FC } from 'react';

import { ChatCard } from './ChatCard';

export const NotifiChatSupport: FC = () => {
  const { isOpen, toggleChat } = useNotifiChatContext();

  const handleToggle = () => {
    toggleChat();
  };

  return (
    <div className="NotifiChatSupport notifi--chat">
      {isOpen && <ChatCard />}
      <div className="NotifiChatSupport--IconBtn">
        {isOpen ? (
          <ChatIconOn onClick={handleToggle} />
        ) : (
          <ChatIconOff onClick={handleToggle} />
        )}
      </div>
    </div>
  );
};
