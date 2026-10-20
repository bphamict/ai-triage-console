"use client";

import { use } from "react";
import { RequestDetailView } from "@/components/request-detail";

export default function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <RequestDetailView id={id} />;
}
