import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientsReducer from './slices/clientsSlice';
import machinesReducer from './slices/machinesSlice';
import collectionsReducer from './slices/collectionsSlice';
import expensesReducer from './slices/expensesSlice';
import companyProfileReducer from './slices/companyProfileSlice';
import counterReducer from './slices/counterSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    machines: machinesReducer,
    collections: collectionsReducer,
    expenses: expensesReducer,
    companyProfile: companyProfileReducer,
    counters: counterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['counters/update/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: [
          'counters.updates',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
