import { useNotifiChatContext } from 'notifi-react-card/lib/context';
import { ChatSupportViewEnum } from 'notifi-react-card/lib/hooks/useChatSupportView';
import React, { FC, useMemo } from 'react';

import { ChatConversation } from './CardConversation';
import { ChatGreeting } from './CardGreeting';
import { ChatSettings } from './CardSettings';

export const ChatCard: FC = () => {
  const { cardView } = useNotifiChatContext();

  const renderCardView = useMemo(() => {
    switch (cardView) {
      case ChatSupportViewEnum.Greeting:
        return <ChatGreeting />;
      case ChatSupportViewEnum.Chat:
        return <ChatConversation />;
      case ChatSupportViewEnum.Settings:
        return <ChatSettings />;
      default:
        return null;
    }
  }, []);

  return <div className="NotifiChatSupport--Card">{renderCardView}</div>;
};
