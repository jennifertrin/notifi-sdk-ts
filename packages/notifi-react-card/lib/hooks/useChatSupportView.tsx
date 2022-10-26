import { useState } from 'react';

export enum ChatSupportViewEnum {
  Greeting = 'greeting',
  Chat = 'chat',
  Settings = 'settings',
}

export const useChatSupportView = () => {
  const [view, setView] = useState(() => ChatSupportViewEnum.Greeting);

  return { view, setView };
};
