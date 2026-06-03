import { createContext, useContext } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';

const LotsContext = createContext();

const fetcher = (url) => fetch(url).then((res) => res.json());

export function LotsProvider({ children }) {
  // Poll lots every 5 seconds for real-time updates
  const { data: lots = [], isValidating: loadingLots } = useSWR('/api/lots', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });

  // Suppliers rarely change, fetch once
  const { data: suppliers = [], isValidating: loadingSuppliers } = useSWR('/api/suppliers', fetcher, {
    revalidateOnFocus: false,
  });

  const loading = loadingLots || loadingSuppliers;
  const suppliersList = suppliers.value || suppliers || [];

  // Helper getters
  const inboundLots = lots.filter((l) => l.status === 'Inbound Received');
  const qcApprovedLots = lots.filter((l) => l.status === 'QC Approved');
  const processedLots = lots.filter((l) => l.status === 'Processed/Melted');
  const flaggedLots = lots.filter((l) => l.status === 'Flagged - Pending Approval');
  const clearedLots = lots.filter((l) => l.status === 'Cleared for Settlement');
  const remeltedLots = lots.filter((l) => l.status === 'Merged into Remelt');

  return (
    <LotsContext.Provider
      value={{
        lots,
        suppliers: suppliersList,
        loading,
        inboundLots,
        qcApprovedLots,
        processedLots,
        flaggedLots,
        clearedLots,
        remeltedLots,
        fetchLots: () => mutate('/api/lots'), // For immediate manual refresh
      }}
    >
      {children}
    </LotsContext.Provider>
  );
}

export function useLots() {
  return useContext(LotsContext);
}
