import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer from "./rootReducer";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

const PERSIST_WHITELIST = [
  "auth",
  "customerAuth",
  "customerCart",
  "customerWishlist",
] as const;

const persistConfig = {
  key: "root",
  storage,
  whitelist: PERSIST_WHITELIST as unknown as string[],
  migrate: async (state: any) => {
    if (!state || typeof state !== "object") return state;
    return PERSIST_WHITELIST.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        acc[key] = state[key];
      }
      return acc;
    }, {} as Record<string, unknown>);
  },
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
