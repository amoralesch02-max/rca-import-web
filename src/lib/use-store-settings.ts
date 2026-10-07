"use client";

import {
  DEFAULT_STORE_SETTINGS,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import { useEffect, useState } from "react";

// Una sola consulta compartida: aunque haya 24 tarjetas en pantalla,
// la configuración de la tienda se pide a Supabase una única vez.
let settingsPromise: Promise<StoreSettings> | null = null;

export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    let active = true;

    if (!settingsPromise) {
      settingsPromise = getSupabaseStoreSettings();
    }

    settingsPromise.then((loaded) => {
      if (active) {
        setSettings(loaded);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return settings;
}
