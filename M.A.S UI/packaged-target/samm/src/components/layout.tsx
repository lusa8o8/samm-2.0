import { WorkspaceShell, useInspector } from "@/components/shell/WorkspaceShell";
import type { WorkspaceInspectorPayload } from "@/lib/workspace-adapter";
import type { WidgetDescriptor } from "@/types";
import {
  CalendarStudioWorkflowProvider,
  useCalendarStudioWorkflow,
  useRegisterCalendarStudioWorkflow,
} from "../../../../src/lib/calendar-studio-workflow";

export function useWorkspaceInspector() {
  const { inspector, openInspector, closeInspector } = useInspector();

  return {
    payload: inspector.isOpen
      ? {
          title: inspector.title ?? "",
          widget: inspector.widget,
        }
      : null,
    openInspector: (payload: WorkspaceInspectorPayload) => {
      if (!payload.widget) return;
      openInspector(payload.title, payload.widget as WidgetDescriptor);
    },
    closeInspector,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CalendarStudioWorkflowProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </CalendarStudioWorkflowProvider>
  );
}

export { useCalendarStudioWorkflow, useRegisterCalendarStudioWorkflow };
