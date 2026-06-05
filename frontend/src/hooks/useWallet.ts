import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

interface WalletState {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletState>({
  connected: false,
  address: null,
  connecting: false,
  connect: async () => {},
  disconnect: async () => {},
});

export function useWallet(): WalletState {
  return useContext(WalletContext);
}

export { WalletContext };
export type { WalletState };
