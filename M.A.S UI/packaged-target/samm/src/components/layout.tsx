import type { WorkspaceInspectorPayload } from "@/lib/workspace-adapter";
import { WorkspaceShell, useInspector } from "./shell/WorkspaceShell";
import type { WidgetDescriptor } from "../types";

export { WorkspaceShell as Layout };

function fallbackWidget(payload: WorkspaceInspectorPayload): WidgetDescriptor {
  return {
    type: "failure_group",
    title: payload.title,
    data: payload,
  };
}

export function useWorkspaceInspector() {
  const { inspector, openInspector, closeInspector } = useInspector();

  return {
    payload: inspector.title
      ? {
          title: inspector.title,
          widget: inspector.widget,
        }
      : null,
    openInspector: (payload: WorkspaceInspectorPayload) => {
      openInspector(payload.title, (payload.widget as WidgetDescriptor | undefined) ?? fallbackWidget(payload));
    },
    closeInspector,
  };
}
