import { useCheckpointStore } from "../stores";
import { AIProviderType } from "../services";

export function Controls() {
  const {
    searchQuery,
    setSearchQuery,
    providerFilter,
    setProviderFilter,
    sortDirection,
    setSortDirection,
  } = useCheckpointStore();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <input
        type="text"
        placeholder="Search checkpoints..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search checkpoints"
        className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
      />

      <div className="flex gap-2">
        <select
          value={providerFilter}
          onChange={(e) =>
            setProviderFilter(e.target.value as AIProviderType | "ALL")
          }
          aria-label="Filter by provider"
          className="flex-1 rounded-lg border border-neutral-800 bg-black px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
        >
          <option value="ALL">All Providers</option>
          {Object.values(AIProviderType).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={sortDirection}
          onChange={(e) => setSortDirection(e.target.value as "desc" | "asc")}
          aria-label="Sort direction"
          className="rounded-lg border border-neutral-800 bg-black px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
        >
          <option value="desc">Newest</option>
          <option value="asc">Oldest</option>
        </select>
      </div>
    </div>
  );
}
