import { createContext, useContext } from 'react';

interface WalletState {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  showConnectModal: () => void;
}

const WalletContext = createContext<WalletState>({
  connected: false,
  address: null,
  connecting: false,
  connect: async () => {},
  disconnect: async () => {},
  showConnectModal: () => {},
});

export function useWallet(): WalletState {
  return useContext(WalletContext);
}

export { WalletContext };
export type { WalletState };
