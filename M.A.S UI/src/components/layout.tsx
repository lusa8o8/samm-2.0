import { WorkspaceShell, useWorkspaceInspector } from "@/components/workspace/WorkspaceShell";
import {
  CalendarStudioWorkflowProvider,
  useCalendarStudioWorkflow,
  useRegisterCalendarStudioWorkflow,
} from "@/lib/calendar-studio-workflow";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CalendarStudioWorkflowProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </CalendarStudioWorkflowProvider>
  );
}

export { useWorkspaceInspector, useCalendarStudioWorkflow, useRegisterCalendarStudioWorkflow };
