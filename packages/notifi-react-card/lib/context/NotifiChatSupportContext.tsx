import React, { useState } from 'react';

import {
  ChatSupportViewEnum,
  useChatSupportView,
} from '../hooks/useChatSupportView';

type NotifiChatSupportStates = {
  isOpen: boolean;
  toggleChat: (open?: boolean) => void;

  cardView: ChatSupportViewEnum;
  setCardView: React.Dispatch<React.SetStateAction<ChatSupportViewEnum>>;

  email?: string;
  setEmail: (email: string) => void;
  emailErrorMessage: string;
  setEmailErrorMessage: (error: string) => void;

  phoneNumber?: string;
  setPhoneNumber: (phone: string) => void;

  telegramId?: string;
  setTelegramId: (telegramId: string) => void;

  telegramConfirmationUrl?: string;
  setTelegramConfirmationUrl: (url: string) => void;
};

export type NotifiChatSupportData = Readonly<NotifiChatSupportStates>;

const NotifiChatContext = React.createContext<NotifiChatSupportData>(
  {} as unknown as NotifiChatSupportData,
);

export const NotifiChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { view, setView } = useChatSupportView();

  const [isOpen, setIsOpen] = useState(false);

  const [email, setEmail] = useState<string>('');
  const [emailErrorMessage, setEmailErrorMessage] = useState<string>('');

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [telegramId, setTelegramId] = useState<string>('');
  const [telegramConfirmationUrl, setTelegramConfirmationUrl] = useState<
    string | undefined
  >(undefined);

  const toggleChat = React.useCallback(
    (show?: boolean) => {
      setIsOpen(show ?? !isOpen);
    },
    [isOpen],
  );

  const value: NotifiChatSupportData = {
    isOpen,
    toggleChat,
    cardView: view,
    setCardView: setView,
    email,
    setEmail,
    emailErrorMessage,
    setEmailErrorMessage,
    phoneNumber,
    setPhoneNumber,
    telegramId,
    setTelegramId,
    telegramConfirmationUrl,
    setTelegramConfirmationUrl,
  };

  return (
    <NotifiChatContext.Provider value={value}>
      {children}
    </NotifiChatContext.Provider>
  );
};

export const useNotifiChatContext = () => React.useContext(NotifiChatContext);
