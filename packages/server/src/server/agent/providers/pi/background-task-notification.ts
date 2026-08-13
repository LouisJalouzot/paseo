import type { AgentTimelineItem } from "../../agent-sdk-types.js";

const MARKER = "<background-task-notification>";

type ToolCallItem = Extract<AgentTimelineItem, { type: "tool_call" }>;

function readTag(text: string, tag: string): string | null {
  const value = text.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, "i"))?.[1];
  if (!value) {
    return null;
  }
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

export function mapPiBackgroundTaskNotification(text: string): ToolCallItem | null {
  if (!text.includes(MARKER)) {
    return null;
  }

  const taskId = readTag(text, "task-id");
  const status = readTag(text, "status")?.toLowerCase();
  if (!taskId || !status) {
    return null;
  }

  const summary = readTag(text, "summary") ?? `Background task ${status}`;
  const error = readTag(text, "error");
  const outputFile = readTag(text, "output-file");
  const exitCode = readTag(text, "exit-code");
  const failed = status === "failed";
  const canceled = status === "killed" || status === "canceled" || status === "cancelled";
  const detail = [
    error,
    exitCode ? `Exit code: ${exitCode}` : null,
    outputFile ? `Output: ${outputFile}` : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n");

  const item = {
    type: "tool_call" as const,
    callId: `pi-background-task-${taskId}`,
    name: "background_task",
    detail: {
      type: "plain_text" as const,
      label: summary,
      icon: "wrench" as const,
      ...(detail ? { text: detail } : {}),
    },
    metadata: {
      synthetic: true,
      source: "pi_background_task_notification",
      taskId,
      status,
      ...(outputFile ? { outputFile } : {}),
    },
  };

  if (failed) {
    return { ...item, status: "failed", error: { message: error ?? summary } };
  }
  if (canceled) {
    return { ...item, status: "canceled", error: null };
  }
  return { ...item, status: "completed", error: null };
}
