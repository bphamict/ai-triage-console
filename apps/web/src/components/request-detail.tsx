"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRole } from "@/components/role-provider";
import {
  approveRequest,
  clarifyRequest,
  editProposal,
  getRequest,
  mergeRequest,
  rejectRequest,
} from "@/lib/api";
import type { RequestDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function RequestDetailView({ id }: { id: string }) {
  const { role } = useRole();
  const [data, setData] = useState<RequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [mergeTarget, setMergeTarget] = useState("REQ-001");
  const [editSummary, setEditSummary] = useState("");
  const [clarifyNote, setClarifyNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const detail = await getRequest(id, role);
      setData(detail);
      setEditSummary(detail.proposal?.summary ?? "");
      if (detail.request.duplicateOf) {
        setMergeTarget(detail.request.duplicateOf);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load request");
    }
  }, [id, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!data && !error) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const { request, proposal, audit } = data;
  const isManager = role === "Manager";
  const canDecide =
    request.state === "Draft" || request.state === "Needs Review";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to list
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {request.externalId}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{request.state}</Badge>
            {request.department && (
              <Badge variant="secondary">{request.department}</Badge>
            )}
            {request.priority && (
              <Badge variant="outline">{request.priority}</Badge>
            )}
            {(request.riskFlags ?? []).map((f) => (
              <Badge key={f} variant="destructive">
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {request.triageError && (
        <Alert variant="destructive">
          <AlertTitle>AI adapter issue</AlertTitle>
          <AlertDescription>
            {request.triageError}. Request left in a safe reviewable state.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raw request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Meta label="Source" value={request.source} />
            <Meta label="Requester role" value={request.requesterRole} />
            <Meta
              label="Department hint"
              value={request.departmentHint ?? "—"}
            />
            <Meta
              label="Submitted"
              value={new Date(request.submittedAt).toLocaleString()}
            />
            <Separator />
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Content</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans text-sm leading-relaxed">
                {request.content}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI proposal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!proposal && (
              <p className="text-muted-foreground">
                No validated proposal stored. Check triage/AI error above.
              </p>
            )}
            {proposal && (
              <>
                <Meta label="Summary" value={proposal.summary} />
                <Meta
                  label="Confidence"
                  value={proposal.confidence.toFixed(2)}
                />
                <Meta
                  label="Recommended state"
                  value={proposal.recommendedState}
                />
                <Meta label="Proposed owner" value={proposal.proposedOwner} />
                <Meta label="Priority" value={proposal.priority} />
                <Meta label="Department" value={proposal.department} />
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Proposed steps
                  </p>
                  <ul className="list-disc space-y-2 pl-5">
                    {proposal.proposedSteps.map((step, i) => (
                      <li key={i}>
                        <span className="font-medium">{step.action}</span>
                        <div className="text-muted-foreground">
                          Done when: {step.completion_condition}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {request.duplicateOf && (
                  <Alert>
                    <AlertTitle>Duplicate candidate</AlertTitle>
                    <AlertDescription>
                      Suggested merge into {request.duplicateOf}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isManager && (
            <Alert>
              <AlertTitle>Viewer mode</AlertTitle>
              <AlertDescription>
                You can inspect requests and audit history. Approve / Edit /
                Reject / Merge require the Manager role.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Decision reason (required for Manager actions)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you taking this action?"
              disabled={!isManager}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!isManager || !canDecide || busy}
              onClick={() =>
                void run(() => approveRequest(request.id, reason, role))
              }
            >
              Approve → Open
            </Button>
            <Button
              variant="secondary"
              disabled={!isManager || !canDecide || busy}
              onClick={() =>
                void run(() =>
                  editProposal(
                    request.id,
                    reason,
                    { summary: editSummary },
                    role,
                  ),
                )
              }
            >
              Save edit
            </Button>
            <Button
              variant="destructive"
              disabled={!isManager || !canDecide || busy}
              onClick={() =>
                void run(() => rejectRequest(request.id, reason, role))
              }
            >
              Reject
            </Button>
          </div>
          {isManager && canDecide && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Edit summary (max 240 chars)
              </label>
              <Input
                value={editSummary}
                maxLength={240}
                onChange={(e) => setEditSummary(e.target.value)}
              />
            </div>
          )}
          <Separator />
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Merge into canonical ID
              </label>
              <Input
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                disabled={!isManager}
                className="w-40"
              />
            </div>
            <Button
              variant="outline"
              disabled={!isManager || !canDecide || busy}
              onClick={() =>
                void run(() =>
                  mergeRequest(request.id, mergeTarget, reason, role),
                )
              }
            >
              Merge
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[240px] flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">
                Clarification note (audit)
              </label>
              <Input
                value={clarifyNote}
                onChange={(e) => setClarifyNote(e.target.value)}
                placeholder="e.g. Asked for printer floor/model"
              />
            </div>
            <Button
              variant="outline"
              disabled={busy || !clarifyNote.trim()}
              onClick={() =>
                void run(() =>
                  clarifyRequest(request.id, clarifyNote, role).then(() =>
                    setClarifyNote(""),
                  ),
                )
              }
            >
              Record clarification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {audit.length === 0 && (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          )}
          {audit.map((event) => (
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}
