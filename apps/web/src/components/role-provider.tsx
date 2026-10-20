"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Role } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const RoleContext = createContext<{
  role: Role;
  setRole: (role: Role) => void;
} | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("Viewer");

  useEffect(() => {
    const saved = localStorage.getItem("triage-role");
    if (saved === "Manager" || saved === "Viewer") setRoleState(saved);
  }, []);

  const setRole = (next: Role) => {
    setRoleState(next);
    localStorage.setItem("triage-role", next);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  return (
    <div className="flex items-center gap-2">
      <Badge variant={role === "Manager" ? "default" : "secondary"}>
        Demo role
      </Badge>
      <Select value={role} onValueChange={(v) => setRole(v as Role)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Viewer">Viewer</SelectItem>
          <SelectItem value="Manager">Manager</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
