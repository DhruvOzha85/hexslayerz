import React, { useState } from "react";
import type { Checkpoint } from "../services";
import { useCheckpointStore } from "../stores";
import { TabService } from "../services/chrome/TabService";

interface Props {
  checkpoint: Checkpoint;
}

export const CheckpointCard = React.memo(function CheckpointCard({
  checkpoint,
}: Props) {
  const { deleteCheckpoint, isLoading } = useCheckpointStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(checkpoint.createdAt).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-4 transition-all duration-300 hover:border-violet-500/50 shadow-sm hover:shadow-md hover:shadow-violet-900/20 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <h3 
          className="text-base font-bold text-white cursor-pointer hover:text-violet-400 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {checkpoint.summary.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteCheckpoint(checkpoint.id);
          }}
          disabled={isLoading}
          className="text-neutral-500 hover:text-red-400"
          title="Delete Checkpoint"
          aria-label="Delete Checkpoint"
        >
          ✕
        </button>
      </div>

      <p 
        className={`text-sm text-neutral-400 cursor-pointer ${isExpanded ? "" : "line-clamp-2"}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {checkpoint.summary.content}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
          <span className="rounded bg-neutral-800 px-2 py-1">
            {checkpoint.summary.provider}
          </span>
          <span className="rounded bg-neutral-800 px-2 py-1">
            {formattedDate}
          </span>
          <span className="rounded bg-neutral-800 px-2 py-1">
            {checkpoint.conversation.messageCount} msgs
          </span>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const tab = await TabService.getActiveTab();
              if (tab?.id) {
                await TabService.injectReaderModal(
                  tab.id,
                  checkpoint.summary.title,
                  checkpoint.summary.content
                );
                window.close(); // Close extension popup to reveal the host page modal
              }
            }}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
          >
            Read Full
          </button>
          <a
            href={checkpoint.conversation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-neutral-400 hover:text-neutral-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            Open Link
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(JSON.stringify(checkpoint.conversation, null, 2));
              alert("Conversation context (JSON) copied to clipboard!");
            }}
            className="text-xs font-medium text-green-400 hover:text-green-300 underline"
          >
            Copy JSON
          </button>
        </div>
      </div>
    </div>
  );
});
