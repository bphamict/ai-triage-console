"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRole } from "@/components/role-provider";
import { importFixture, listRequests } from "@/lib/api";
import type { TriageRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATES = [
  "Received",
  "Triaged",
  "Draft",
  "Needs Review",
  "Approved",
  "Open",
  "Rejected",
  "Merged",
];
const DEPARTMENTS = [
  "IT",
  "Marketing",
  "E-commerce",
  "Customer Service",
  "SCM",
  "Finance",
  "HR",
  "Production",
  "Needs Review",
];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const RISK_FLAGS = [
  "duplicate",
  "conflict",
  "security",
  "privacy",
  "missing-information",
];
const SOURCES = ["chat", "email", "form"];

function stateVariant(state: string) {
  if (state === "Open" || state === "Approved") return "default" as const;
  if (state === "Needs Review") return "destructive" as const;
  if (state === "Rejected" || state === "Merged") return "secondary" as const;
  return "outline" as const;
}

export function RequestsConsole() {
  const { role } = useRole();
  const [rows, setRows] = useState<TriageRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    state: "",
    department: "",
    priority: "",
    riskFlag: "",
    source: "",
    search: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRequests(filters, role);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [filters, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const onImport = async () => {
    setImportMsg(null);
    setError(null);
    try {
      const result = await importFixture(role);
      setImportMsg(
        `Import complete: ${result.imported} new, ${result.skipped} skipped, ${result.total} total unique source requests.`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Request triage
          </h1>
          <p className="text-sm text-muted-foreground">
            AI proposes; humans approve. Import the fixture twice to verify
            idempotency.
          </p>
        </div>
        <Button onClick={() => void onImport()}>Import fixture</Button>
      </div>

      {importMsg && (
        <Alert>
          <AlertTitle>Import</AlertTitle>
          <AlertDescription>{importMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <FilterSelect
            label="State"
            value={filters.state}
            options={STATES}
            onChange={(state) => setFilters((f) => ({ ...f, state }))}
          />
          <FilterSelect
            label="Department"
            value={filters.department}
            options={DEPARTMENTS}
            onChange={(department) =>
              setFilters((f) => ({ ...f, department }))
            }
          />
          <FilterSelect
            label="Priority"
            value={filters.priority}
            options={PRIORITIES}
            onChange={(priority) => setFilters((f) => ({ ...f, priority }))}
          />
          <FilterSelect
            label="Risk flag"
            value={filters.riskFlag}
            options={RISK_FLAGS}
            onChange={(riskFlag) => setFilters((f) => ({ ...f, riskFlag }))}
          />
          <FilterSelect
            label="Source"
            value={filters.source}
            options={SOURCES}
            onChange={(source) => setFilters((f) => ({ ...f, source }))}
          />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Search</label>
            <Input
              placeholder="ID or content…"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No requests yet. Import the assessment fixture to begin.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/requests/${row.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {row.externalId}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={stateVariant(row.state)}>{row.state}</Badge>
                </TableCell>
                <TableCell>{row.department ?? "—"}</TableCell>
                <TableCell>{row.priority ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(row.riskFlags ?? []).length === 0 && "—"}
                    {(row.riskFlags ?? []).map((flag) => (
                      <Badge key={flag} variant="outline">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{row.source}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(row.submittedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select
        value={value || "all"}
        onValueChange={(v) => onChange(v === "all" || v == null ? "" : String(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
