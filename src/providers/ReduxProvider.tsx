"use client"

import { useRef } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { makeStore, replaceStoreInstance, type RootState } from "@/store"

export default function ReduxProvider({
  children,
  preloadedState,
}: {
  children: React.ReactNode
  preloadedState?: Partial<RootState>
}) {
  const storeRef = useRef<ReturnType<typeof makeStore> | null>(null)
  const persistorRef = useRef<ReturnType<typeof replaceStoreInstance>["persistor"] | null>(null)

  if (!storeRef.current) {
    const nextStore = makeStore(preloadedState)
    const { persistor } = replaceStoreInstance(nextStore)
    storeRef.current = nextStore
    persistorRef.current = persistor
  }

  const activePersistor = persistorRef.current

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={activePersistor!}>
        {children}
      </PersistGate>
    </Provider>
  )
}
