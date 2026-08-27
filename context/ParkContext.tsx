import { createContext, useContext, useState, ReactNode } from 'react';
import { Park, PARKS } from '../lib/parks';

type ParkContextValue = {
  selectedPark: Park;
  setSelectedPark: (park: Park) => void;
};

const ParkContext = createContext<ParkContextValue | null>(null);

export function ParkProvider({ children }: { children: ReactNode }) {
  const [selectedPark, setSelectedPark] = useState<Park>(PARKS[0]);

  return (
    <ParkContext.Provider value={{ selectedPark, setSelectedPark }}>
      {children}
    </ParkContext.Provider>
  );
}

export function useSelectedPark(): ParkContextValue {
  const context = useContext(ParkContext);
  if (!context) {
    throw new Error('useSelectedPark must be used within a ParkProvider');
  }
  return context;
}
