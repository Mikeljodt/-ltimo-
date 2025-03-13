import counterReducer, { 
  fetchAllCounters, 
  updateMachineCounter,
  CounterState
} from '@/lib/counterSync';

export { 
  fetchAllCounters, 
  updateMachineCounter 
};

export type { CounterState };
export default counterReducer;
