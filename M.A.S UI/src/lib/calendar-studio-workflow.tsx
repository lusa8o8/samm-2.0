import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import type {
  AssetReadinessRecordViewData,
  CalendarDayPanelViewData,
  CampaignPanelViewData,
  MonthlyPlanningSessionViewData,
} from "@/components/workspace/calendar-studio/types";

export interface CalendarStudioWorkflowActions {
  reviewPlanningSession?: (data: MonthlyPlanningSessionViewData) => void;
  commitPlanningSession?: (data: MonthlyPlanningSessionViewData) => void;
  addCampaignOrKeyDate?: (data: MonthlyPlanningSessionViewData) => void;
  createDraftsForDay?: (data: CalendarDayPanelViewData) => void;
  addManualForDay?: (data: CalendarDayPanelViewData) => void;
  editRulesForDay?: (data: CalendarDayPanelViewData) => void;
  createDraftsForCampaign?: (data: CampaignPanelViewData) => void;
  editCampaignRules?: (data: CampaignPanelViewData) => void;
  updateAssetStatus?: (data: AssetReadinessRecordViewData, intent?: "mark_ready" | "request_assets" | "update_notes") => void;
}

type CalendarStudioWorkflowContextValue = {
  actions: CalendarStudioWorkflowActions;
  registerActions: (actions: CalendarStudioWorkflowActions | null) => void;
};

const NOOP_ACTIONS: CalendarStudioWorkflowActions = {};

const CalendarStudioWorkflowContext = createContext<CalendarStudioWorkflowContextValue>({
  actions: NOOP_ACTIONS,
  registerActions: () => {},
});

export function CalendarStudioWorkflowProvider({ children }: { children: ReactNode }) {
  const actionsRef = useRef<CalendarStudioWorkflowActions>(NOOP_ACTIONS);

  const registerActions = useCallback((nextActions: CalendarStudioWorkflowActions | null) => {
    actionsRef.current = nextActions ?? NOOP_ACTIONS;
  }, []);

  const actions = useMemo<CalendarStudioWorkflowActions>(
    () => ({
      reviewPlanningSession: (data) => actionsRef.current.reviewPlanningSession?.(data),
      commitPlanningSession: (data) => actionsRef.current.commitPlanningSession?.(data),
      addCampaignOrKeyDate: (data) => actionsRef.current.addCampaignOrKeyDate?.(data),
      createDraftsForDay: (data) => actionsRef.current.createDraftsForDay?.(data),
      addManualForDay: (data) => actionsRef.current.addManualForDay?.(data),
      editRulesForDay: (data) => actionsRef.current.editRulesForDay?.(data),
      createDraftsForCampaign: (data) => actionsRef.current.createDraftsForCampaign?.(data),
      editCampaignRules: (data) => actionsRef.current.editCampaignRules?.(data),
      updateAssetStatus: (data, intent) => actionsRef.current.updateAssetStatus?.(data, intent),
    }),
    [],
  );

  const value = useMemo(
    () => ({
      actions,
      registerActions,
    }),
    [actions, registerActions],
  );

  return <CalendarStudioWorkflowContext.Provider value={value}>{children}</CalendarStudioWorkflowContext.Provider>;
}

export function useCalendarStudioWorkflow() {
  return useContext(CalendarStudioWorkflowContext).actions;
}

export function useRegisterCalendarStudioWorkflow(actions: CalendarStudioWorkflowActions | null) {
  const { registerActions } = useContext(CalendarStudioWorkflowContext);

  useEffect(() => {
    registerActions(actions);
    return () => registerActions(null);
  }, [actions, registerActions]);
}
