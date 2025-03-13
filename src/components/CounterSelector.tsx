import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getLatestCounter } from '@/lib/counterSync';

interface CounterSelectorProps {
  machineId: string | null;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  readOnly?: boolean;
}

export const CounterSelector = ({
  machineId,
  value,
  onChange,
  label = "Contador",
  required = false,
  readOnly = false
}: CounterSelectorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const counters = useSelector((state: RootState) => state.counters);
  const machines = useSelector((state: RootState) => state.machines.machines);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Find the selected machine
  const selectedMachine = machineId 
    ? machines.find(m => m.id === machineId) 
    : null;

  // Get the latest counter value for this machine
  const latestCounter = machineId 
    ? getLatestCounter(machineId, counters)
    : 0;

  // When machine changes, update the counter value if it's not already set
  useEffect(() => {
    if (machineId && (!value || value === '0') && latestCounter > 0 && !hasLoaded) {
      onChange(latestCounter.toString());
      setHasLoaded(true);
    }
  }, [machineId, latestCounter, value, onChange, hasLoaded]);

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="counter">{label}</Label>
      <div className="relative">
        <Input
          id="counter"
          type="number"
          min="0"
          placeholder="Valor del contador"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
        {machineId && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
            Último: {latestCounter}
          </div>
        )}
      </div>
      {selectedMachine && (
        <p className="text-xs text-muted-foreground mt-1">
          Contador inicial: {selectedMachine.initialCounter} | 
          Actual: {selectedMachine.currentCounter}
        </p>
      )}
    </div>
  );
};
