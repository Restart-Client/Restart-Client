import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpDown, Blocks, Hash } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { CountCard } from "@/components/features/CountCard";
import { useMaterials } from "@/hooks/queries";
import { ApiError } from "@/api/client";

type Sort = "id" | "count";

export function MaterialsPage() {
  const { data, isLoading, isError, error, refetch } = useMaterials();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("count");

  const filtered = useMemo(() => {
    const mats = data?.materials ?? [];
    const qq = q.trim().toLowerCase();
    const matched = qq
      ? mats.filter(
          (m) =>
            m.material_name.toLowerCase().includes(qq) ||
            String(m.material_id).includes(qq),
        )
      : mats;
    return [...matched].sort((a, b) =>
      sort === "count" ? b.count - a.count : a.material_id - b.material_id,
    );
  }, [data, q, sort]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <PageHeader
        eyebrow="Stockpile"
        title="素材"
        description="クラフトに使う素材の一覧です。"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchField
          placeholder="素材名またはID で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          className="max-w-sm flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSort(sort === "count" ? "id" : "count")}
          leftIcon={
            sort === "count" ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <Hash className="h-3.5 w-3.5" />
            )
          }
          rightIcon={<ArrowUpDown className="h-3 w-3 opacity-40" />}
        >
          {sort === "count" ? "所持数順" : "ID順"}
        </Button>
        {data && (
          <div className="ml-auto font-mono text-xs text-ink-500">
            {filtered.length} / {data.materials.length}
          </div>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px]" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            message={humanize(error)}
            action={
              <Button size="sm" onClick={() => refetch()}>
                再試行
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Blocks className="h-5 w-5" />}
            title={q ? "該当する素材がありません" : "素材を所持していません"}
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((m) => (
              <CountCard
                key={m.material_id}
                id={m.material_id}
                name={m.material_name}
                count={m.count}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function humanize(e: unknown): string {
  if (e instanceof ApiError) return e.body.error ?? e.message;
  return e instanceof Error ? e.message : "不明なエラー";
}
