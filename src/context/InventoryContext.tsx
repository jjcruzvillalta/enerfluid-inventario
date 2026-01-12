"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  buildCatalogIndex,
  buildItemsIndex,
  parseMovements,
  parseVentas,
  readSheetRows,
  loadFromFile,
  buildUploadRows,
} from "@/lib/data";
import { hasNewerLogs, readCachePayload, writeCachePayload } from "@/lib/cache";

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState("Sin cargar");
  const loadInProgressRef = useRef(false);

  const [uploadLogs, setUploadLogs] = useState([]);
  const [movRows, setMovRows] = useState([]);
  const [ventasRows, setVentasRows] = useState([]);
  const [itemsRows, setItemsRows] = useState([]);
  const [catalogRows, setCatalogRows] = useState([]);
  const [movements, setMovements] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [itemsIndex, setItemsIndex] = useState(null);
  const [catalogIndex, setCatalogIndex] = useState(null);

  const [selection, setSelection] = useState(new Set());
  const [itemFilter, setItemFilter] = useState("");

  const [uploadFiles, setUploadFiles] = useState({
    movimientos: null,
    ventas: null,
    items: null,
    catalogo: null,
  });
  const [uploadStatus, setUploadStatus] = useState({
    movimientos: "Sin subir",
    ventas: "Sin subir",
    items: "Sin subir",
    catalogo: "Sin subir",
  });
  const [uploadLoading, setUploadLoading] = useState({
    movimientos: false,
    ventas: false,
    items: false,
    catalogo: false,
  });
  const [initialized, setInitialized] = useState(false);

  const applyData = useCallback((payload) => {
    const nextMovRows = payload?.movRows || [];
    const nextVentasRows = payload?.ventasRows || [];
    const nextItemsRows = payload?.itemsRows || [];
    const nextCatalogRows = payload?.catalogRows || [];
    const nextUploadLogs = payload?.uploadLogs || [];

    setMovRows(nextMovRows);
    setVentasRows(nextVentasRows);
    setItemsRows(nextItemsRows);
    setCatalogRows(nextCatalogRows);
    setUploadLogs(nextUploadLogs);

    const parsedMovements = parseMovements(nextMovRows);
    const parsedVentas = parseVentas(nextVentasRows);
    setMovements(parsedMovements);
    setVentas(parsedVentas);

    const catalogIdx = buildCatalogIndex(nextCatalogRows);
    setCatalogIndex(catalogIdx);
    const itemsIdx = buildItemsIndex(nextItemsRows, catalogIdx);
    setItemsIndex(itemsIdx);

    setSelection((prev) => {
      if (!itemsIdx?.items?.length) return new Set();
      if (!prev || !prev.size) return new Set(itemsIdx.items.map((item) => item.code));
      const next = new Set();
      itemsIdx.items.forEach((item) => {
        if (prev.has(item.code)) next.add(item.code);
      });
      return next.size ? next : new Set(itemsIdx.items.map((item) => item.code));
    });

    setLoadStatus("Conectado");
  }, []);

  const loadAllFromSupabase = useCallback(
    async ({ force = false } = {}) => {
      if (!user) {
        setLoadStatus("Inicia sesion");
        return;
      }
      if (loadInProgressRef.current) return;
      loadInProgressRef.current = true;
      try {
        setLoading(true);
        setLoadStatus("Cargando...");
        let cachedPayload = null;
        if (!force) {
          cachedPayload = await readCachePayload();
          if (cachedPayload) applyData(cachedPayload);
        }

        const res = await fetch("/api/inventory/data", { cache: "no-store", credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar datos");
        const payload = await res.json();

        const shouldReload = force || !cachedPayload || hasNewerLogs(cachedPayload?.uploadLogs, payload?.uploadLogs || []);
        if (!shouldReload) {
          setLoading(false);
          setLoadStatus("Conectado");
          return;
        }

        applyData(payload);
        await writeCachePayload(payload);
        setLoading(false);
        setLoadStatus("Conectado");
      } catch (error) {
        console.error(error);
        setLoadStatus("Error al cargar");
      } finally {
        setLoading(false);
        loadInProgressRef.current = false;
      }
    },
    [applyData, user]
  );

  const handleUpload = useCallback(
    async (type) => {
      if (!user) {
        setUploadStatus((prev) => ({ ...prev, [type]: "Inicia sesion" }));
        return;
      }
      const file = uploadFiles[type];
      if (!file) {
        setUploadStatus((prev) => ({ ...prev, [type]: "Selecciona un archivo" }));
        return;
      }
      const confirmReplace = window.confirm(
        "Esta carga reemplazara completamente la tabla. Deseas continuar?"
      );
      if (!confirmReplace) {
        setUploadStatus((prev) => ({ ...prev, [type]: "Cancelado" }));
        return;
      }
      setUploadLoading((prev) => ({ ...prev, [type]: true }));
      setUploadStatus((prev) => ({ ...prev, [type]: "Leyendo archivo..." }));

      try {
        const workbook = await loadFromFile(file);
        const rawRows = readSheetRows(workbook);
        const payloadRows = buildUploadRows(type, rawRows);
        if (!payloadRows.length) {
          setUploadStatus((prev) => ({ ...prev, [type]: "Sin datos para subir" }));
          setUploadLoading((prev) => ({ ...prev, [type]: false }));
          return;
        }

        const chunkSize = 500;
        const totalRows = payloadRows.length;
        const totalBatches = Math.ceil(payloadRows.length / chunkSize);

        for (let i = 0; i < payloadRows.length; i += chunkSize) {
          const batchIndex = Math.floor(i / chunkSize) + 1;
          setUploadStatus((prev) => ({ ...prev, [type]: `Subiendo ${batchIndex}/${totalBatches}...` }));
          const batch = payloadRows.slice(i, i + chunkSize);

          const res = await fetch("/api/inventory/upload", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              rows: batch,
              replace: i === 0,
              fileName: file?.name || "",
              totalRows,
              isLast: batchIndex === totalBatches,
            }),
          });

          if (!res.ok) {
            const msg = await res.text();
            console.error(msg);
            setUploadStatus((prev) => ({ ...prev, [type]: "Error al subir" }));
            setUploadLoading((prev) => ({ ...prev, [type]: false }));
            return;
          }
          if (batchIndex === totalBatches) {
            setUploadStatus((prev) => ({ ...prev, [type]: "Cargado" }));
          }
        }
        setUploadLoading((prev) => ({ ...prev, [type]: false }));
        await loadAllFromSupabase({ force: true });
      } catch (error) {
        console.error(error);
        setUploadStatus((prev) => ({ ...prev, [type]: "Error al leer" }));
        setUploadLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [user, uploadFiles, loadAllFromSupabase]
  );

  useEffect(() => {
    setInitialized(true);
    if (user) loadAllFromSupabase();
  }, [user, loadAllFromSupabase]);

  useEffect(() => {
    if (user) return;
    setMovRows([]);
    setVentasRows([]);
    setItemsRows([]);
    setCatalogRows([]);
    setMovements([]);
    setVentas([]);
    setItemsIndex(null);
    setCatalogIndex(null);
    setSelection(new Set());
    setLoadStatus("Inicia sesion");
  }, [user]);

  const value = {
    loading,
    loadStatus,
    uploadFiles,
    setUploadFiles,
    uploadStatus,
    setUploadStatus,
    uploadLoading,
    setUploadLoading,
    movements,
    ventas,
    itemsIndex,
    catalogIndex,
    selection,
    setSelection,
    itemFilter,
    setItemFilter,
    loadAllFromSupabase,
    uploadLogs,
    handleUpload,
    movRows,
    ventasRows,
    itemsRows,
    catalogRows,
    initialized,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within InventoryProvider");
  return context;
};
