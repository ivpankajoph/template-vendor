import { configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  type PersistConfig,
  type PersistedState,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer, { type RootState } from "./rootReducer";

const PERSIST_WHITELIST = [
  "auth",
  "customerAuth",
  "customerCart",
  "customerWishlist",
] as const;

const persistConfig: PersistConfig<RootState> = {
  key: "root",
  storage,
  whitelist: [...PERSIST_WHITELIST],
  migrate: async (state: unknown) => {
    if (!state || typeof state !== "object") {
      return state as PersistedState;
    }

    return PERSIST_WHITELIST.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        acc[key] = (state as Record<string, unknown>)[key];
      }
      return acc;
    }, {} as Partial<Record<(typeof PERSIST_WHITELIST)[number], unknown>>) as PersistedState;
  },
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: persistedReducer,
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: {
          ignoredPaths: [
            "alltemplatepage.data",
            "alltemplatepage.products",
            "vendorprofilepage.vendor",
          ],
          warnAfter: 96,
        },
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          ignoredPaths: [
            "alltemplatepage.data",
            "alltemplatepage.products",
            "vendorprofilepage.vendor",
          ],
          warnAfter: 96,
        },
      }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type { RootState };

export let store = makeStore();
export let persistor = persistStore(store);

export const replaceStoreInstance = (nextStore: AppStore) => {
  store = nextStore;
  persistor = persistStore(store);
  return { store, persistor };
};
