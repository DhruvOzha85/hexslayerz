import type { Checkpoint } from "../services";
import { CheckpointCard } from "./CheckpointCard";
import { useCheckpointStore } from "../stores";

interface Props {
  checkpoints: Checkpoint[];
}

export function CheckpointList({ checkpoints }: Props) {
  const { isLoading, searchQuery, providerFilter } = useCheckpointStore();

  if (isLoading && checkpoints.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  if (checkpoints.length === 0) {
    const isFiltering = searchQuery !== "" || providerFilter !== "ALL";
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-800 p-6 text-center text-sm text-neutral-500">
        {isFiltering ? (
          <p>No checkpoints match your filters.</p>
        ) : (
          <>
            <p>No checkpoints saved yet.</p>
            <p className="text-xs text-neutral-600">
              Open a ChatGPT conversation and click "Extract Checkpoint".
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {checkpoints.map((cp) => (
        <CheckpointCard key={cp.id} checkpoint={cp} />
      ))}
    </div>
  );
}
