"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRole } from "@/components/role-provider";
import { listAudit } from "@/lib/api";
import type { AuditEvent } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuditConsole() {
  const { role } = useRole();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEvents(await listAudit(role));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit");
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Chronological history of meaningful triage actions.
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">No audit events yet.</p>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border bg-muted/20 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{event.action}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString()} ·{" "}
                  {event.actorRole}
                </span>
              </div>
              {event.requestId && (
                <Link
                  href={`/requests/${event.requestId}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  View request
                </Link>
              )}
              {event.reason && (
                <p className="mt-1 text-muted-foreground">{event.reason}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
