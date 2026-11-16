import React, { createContext, useContext, useEffect, useState } from "react";
import { uniqueId } from "lodash";
import {
  MadieAlert as DesignSystemAlert,
  MinimizedAlert,
} from "@madie/madie-design-system/dist/react";

type AlertEntry = {
  minimizedAlerts: Record<number, boolean>;
  errorCount: number;
};
type AlertEntries = Record<string, AlertEntry>;

const MinimizedAlertsContext = createContext<{
  entries: AlertEntries;
  setEntries: React.Dispatch<React.SetStateAction<AlertEntries>>;
}>(undefined);

export const MinimizedAlertsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [entries, setEntries] = useState<AlertEntries>({});
  return (
    <MinimizedAlertsContext.Provider value={{ entries, setEntries }}>
      {children}
    </MinimizedAlertsContext.Provider>
  );
};

export const MadieAlert = (props) => {
  const context = useContext(MinimizedAlertsContext);
  const setEntries = context?.setEntries;
  const [id] = useState(() => uniqueId("madie-alert-"));

  useEffect(
    () => () => {
      setEntries?.((previous) => {
        if (!previous[id]) return previous;
        const next = { ...previous };
        delete next[id];
        return next;
      });
    },
    [id, setEntries]
  );

  if (!context) return <DesignSystemAlert {...props} />;

  return (
    <DesignSystemAlert
      {...props}
      minimizedAlerts={context.entries[id]?.minimizedAlerts || {}}
      onMinimizedAlertsChange={(minimizedAlerts, errorCount) =>
        setEntries((previous) => ({
          ...previous,
          [id]: { minimizedAlerts, errorCount },
        }))
      }
    />
  );
};

export const MinimizedAlertsControl = () => {
  const context = useContext(MinimizedAlertsContext);
  const entries = Object.values(context.entries).filter((entry) =>
    Object.values(entry.minimizedAlerts).some(Boolean)
  );
  return entries.length > 0 ? (
    <MinimizedAlert
      errorCount={entries.reduce((total, entry) => total + entry.errorCount, 0)}
      onClick={() => context.setEntries({})}
    />
  ) : null;
};
