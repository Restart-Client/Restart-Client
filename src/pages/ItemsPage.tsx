// アイテム一覧画面。
// - 検索フィルタ
// - ソート (ID昇順 / 所持数降順)
// - ツール装備 (所持アイテムを選んで /tool/{id}/set)
//
// API 上「どのアイテムがツールか」の判定手段がないため、UI では
// 「任意のアイテムID を指定してツール装備する」ボタンを別途用意する。

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpDown, Hash, Package2, Wrench } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { CountCard } from "@/components/features/CountCard";
import { useItems } from "@/hooks/queries";
import { useSetTool } from "@/hooks/mutations";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";

type Sort = "id" | "count";

export function ItemsPage() {
  const { data, isLoading, isError, error, refetch } = useItems();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("count");
  const [toolInputOpen, setToolInputOpen] = useState(false);
  const [toolInput, setToolInput] = useState("");
  const setTool = useSetTool();

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const qq = q.trim().toLowerCase();
    const matched = qq
      ? items.filter(
          (it) =>
            it.item_name.toLowerCase().includes(qq) ||
            String(it.item_id).includes(qq),
        )
      : items;
    return [...matched].sort((a, b) =>
      sort === "count" ? b.count - a.count : a.item_id - b.item_id,
    );
  }, [data, q, sort]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <PageHeader
        eyebrow="Inventory"
        title="アイテム"
        description="所持しているアイテムの一覧です。ツール系はここから装備できます。"
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Wrench className="h-3.5 w-3.5" />}
            onClick={() => setToolInputOpen((v) => !v)}
          >
            ツール装備
          </Button>
        }
      />

      {/* ツール装備インラインパネル */}
      {toolInputOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-5 rounded-2xl border border-ink-700 bg-ink-900/50 p-4"
        >
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              placeholder="アイテムID (0 で解除)"
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              className="h-10 max-w-xs"
            />
            <Button
              variant="primary"
              size="sm"
              loading={setTool.isPending}
              onClick={() => {
                const id = Number(toolInput);
                if (!Number.isFinite(id) || id < 0) return;
                setTool.mutate(id);
                setToolInput("");
              }}
            >
              装備
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTool.mutate(0)}
              loading={setTool.isPending}
            >
              解除 (0)
            </Button>
          </div>
          <p className="mt-2 font-body text-xs text-ink-500">
            ツールでないアイテムIDや未所持IDを指定すると自動的に解除扱いになります。
          </p>
        </motion.div>
      )}

      {/* 検索 + ソート */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchField
          placeholder="アイテム名またはID で検索"
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
            {filtered.length} / {data.items.length}
          </div>
        )}
      </div>

      {/* 本体 */}
      <div className="mt-5">
        {isLoading ? (
          <SkeletonGrid />
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
            icon={<Package2 className="h-5 w-5" />}
            title={q ? "該当するアイテムがありません" : "アイテムを所持していません"}
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((it) => (
              <CountCard
                key={it.item_id}
                id={it.item_id}
                name={it.item_name}
                count={it.count}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-[58px]" />
      ))}
    </div>
  );
}

function humanize(e: unknown): string {
  if (e instanceof ApiError) return e.body.error ?? e.message;
  return e instanceof Error ? e.message : "不明なエラー";
}
