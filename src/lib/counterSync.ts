import { getDB, Machine } from './db';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Types
export interface CounterUpdate {
  machineId: string;
  newCounter: number;
  source: 'collection' | 'installation' | 'maintenance' | 'manual';
  timestamp: string;
  notes?: string;
}

export interface CounterState {
  updates: Record<string, CounterUpdate[]>;
  latestValues: Record<string, number>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state
const initialState: CounterState = {
  updates: {},
  latestValues: {},
  status: 'idle',
  error: null
};

// Async thunks
export const fetchAllCounters = createAsyncThunk(
  'counters/fetchAll',
  async () => {
    const db = await getDB();
    const machines = await db.getAll('machines');
    
    const latestValues: Record<string, number> = {};
    const updates: Record<string, CounterUpdate[]> = {};
    
    machines.forEach(machine => {
      latestValues[machine.id] = machine.currentCounter;
      
      // Initialize empty updates array for each machine
      if (!updates[machine.id]) {
        updates[machine.id] = [];
      }
    });
    
    return { latestValues, updates };
  }
);

export const updateMachineCounter = createAsyncThunk(
  'counters/update',
  async (update: Omit<CounterUpdate, 'timestamp'>) => {
    const db = await getDB();
    const machine = await db.get('machines', update.machineId);
    
    if (!machine) {
      throw new Error('Máquina no encontrada');
    }
    
    const timestamp = new Date().toISOString();
    const counterUpdate: CounterUpdate = {
      ...update,
      timestamp
    };
    
    // Update machine in database
    const updatedMachine: Machine = {
      ...machine,
      currentCounter: update.newCounter,
      updatedAt: timestamp,
      history: [
        ...machine.history,
        {
          date: timestamp,
          action: 'counter_update',
          details: `Contador actualizado de ${machine.currentCounter} a ${update.newCounter} (${update.source})`
        }
      ]
    };
    
    await db.put('machines', updatedMachine);
    
    return { 
      machineId: update.machineId, 
      newCounter: update.newCounter,
      update: counterUpdate
    };
  }
);

// Slice
const counterSlice = createSlice({
  name: 'counters',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCounters.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllCounters.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.latestValues = action.payload.latestValues;
        state.updates = action.payload.updates;
      })
      .addCase(fetchAllCounters.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Error al cargar contadores';
      })
      .addCase(updateMachineCounter.fulfilled, (state, action) => {
        const { machineId, newCounter, update } = action.payload;
        
        // Update latest value
        state.latestValues[machineId] = newCounter;
        
        // Add to updates history
        if (!state.updates[machineId]) {
          state.updates[machineId] = [];
        }
        state.updates[machineId].push(update);
      });
  }
});

export default counterSlice.reducer;

// Helper functions
export const getLatestCounter = (machineId: string, state: CounterState): number => {
  return state.latestValues[machineId] || 0;
};

export const getCounterHistory = (machineId: string, state: CounterState): CounterUpdate[] => {
  return state.updates[machineId] || [];
};
