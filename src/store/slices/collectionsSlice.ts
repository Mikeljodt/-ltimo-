import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getDB, Collection } from '@/lib/db';
import { generateUniqueId } from '@/lib/utils';

interface CollectionsState {
  collections: Collection[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CollectionsState = {
  collections: [],
  status: 'idle',
  error: null,
};

export const fetchCollections = createAsyncThunk('collections/fetchCollections', async () => {
  const db = await getDB();
  return db.getAll('collections');
});

export const addCollection = createAsyncThunk(
  'collections/addCollection',
  async (collectionData: Omit<Collection, 'id' | 'createdAt'>) => {
    const db = await getDB();
    const now = new Date().toISOString();
    
    // Get the machine to update its counter
    const machine = await db.get('machines', collectionData.machineId);
    if (!machine) {
      throw new Error('Machine not found');
    }
    
    // Create new collection
    const newCollection: Collection = {
      ...collectionData,
      id: generateUniqueId(),
      createdAt: now,
    };
    
    // Update machine counter
    const updatedMachine = {
      ...machine,
      currentCounter: collectionData.currentCounter,
      updatedAt: now,
      history: [
        ...machine.history,
        {
          date: now,
          action: 'collection',
          details: `Collection of ${collectionData.amount} recorded`
        }
      ]
    };
    
    // Use transaction to ensure both operations succeed or fail together
    const tx = db.transaction(['collections', 'machines'], 'readwrite');
    await tx.objectStore('collections').add(newCollection);
    await tx.objectStore('machines').put(updatedMachine);
    await tx.done;
    
    return newCollection;
  }
);

export const updateCollection = createAsyncThunk(
  'collections/updateCollection',
  async ({ id, ...updates }: Partial<Collection> & { id: string }) => {
    const db = await getDB();
    const collection = await db.get('collections', id);
    
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    const updatedCollection: Collection = {
      ...collection,
      ...updates,
    };
    
    await db.put('collections', updatedCollection);
    return updatedCollection;
  }
);

export const deleteCollection = createAsyncThunk(
  'collections/deleteCollection',
  async (id: string) => {
    const db = await getDB();
    await db.delete('collections', id);
    return id;
  }
);

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCollections.fulfilled, (state, action: PayloadAction<Collection[]>) => {
        state.status = 'succeeded';
        state.collections = action.payload;
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch collections';
      })
      .addCase(addCollection.fulfilled, (state, action: PayloadAction<Collection>) => {
        state.collections.push(action.payload);
      })
      .addCase(updateCollection.fulfilled, (state, action: PayloadAction<Collection>) => {
        const index = state.collections.findIndex((collection) => collection.id === action.payload.id);
        if (index !== -1) {
          state.collections[index] = action.payload;
        }
      })
      .addCase(deleteCollection.fulfilled, (state, action: PayloadAction<string>) => {
        state.collections = state.collections.filter((collection) => collection.id !== action.payload);
      });
  },
});

export default collectionsSlice.reducer;
