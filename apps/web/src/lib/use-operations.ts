"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, WS } from "./api";
import type { Bootstrap } from "./types";
import { connectEvents } from "./event-connection";
import { applyTelemetry } from "./realtime";

export function useOperations() {
  const client = useQueryClient();
  const [connected, setConnected] = useState(false);
  const query = useQuery({ queryKey: ["bootstrap"], queryFn: ({ signal }) => request<Bootstrap>("/api/bootstrap", undefined, "GET", signal), refetchInterval: 10000 });
  useEffect(() => connectEvents(WS, {
    connection: setConnected,
    resync: async () => { await Promise.all(["bootstrap", "incident", "report", "detections"].map(key => client.invalidateQueries({ queryKey: [key] }))); },
    event: event => {
      if (event.type.endsWith(".telemetry")) client.setQueryData<Bootstrap>(["bootstrap"], previous => applyTelemetry(previous, event));
      else {
        for (const key of ["bootstrap", "incident", "report", "detections"]) {
          void client.invalidateQueries({ queryKey: [key] });
        }
      }
    },
  }), [client]);
  return { ...query, connected };
}
