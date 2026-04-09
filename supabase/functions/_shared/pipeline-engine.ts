import { PIPELINE_RUN_STATUS, type PipelineRunStatus } from './pipeline-run-status.ts'

export type PipelineStepArgs<TState, TContext> = {
  state: TState
  context: TContext
}

export type PipelineTaskStep<TState, TContext> = {
  kind: 'task'
  id: string
  run: (args: PipelineStepArgs<TState, TContext>) => Promise<void>
}

export type PipelineForEachStep<TState, TContext, TItem = unknown> = {
  kind: 'for_each'
  id: string
  getItems: (args: PipelineStepArgs<TState, TContext>) => TItem[] | Promise<TItem[]>
  runItem: (args: PipelineStepArgs<TState, TContext> & { item: TItem; index: number }) => Promise<void>
}

export type PipelineParallelStep<TState, TContext> = {
  kind: 'parallel'
  id: string
  steps: PipelineExecutableStep<TState, TContext>[]
}

export type PipelineExecutableStep<TState, TContext> =
  | PipelineTaskStep<TState, TContext>
  | PipelineForEachStep<TState, TContext, any>
  | PipelineParallelStep<TState, TContext>

async function executePipelineStep<TState, TContext>(
  step: PipelineExecutableStep<TState, TContext>,
  args: PipelineStepArgs<TState, TContext>,
): Promise<void> {
  if (step.kind === 'task') {
    await step.run(args)
    return
  }

  if (step.kind === 'for_each') {
    const items = await step.getItems(args)
    for (let index = 0; index < items.length; index += 1) {
      await step.runItem({
        ...args,
        item: items[index],
        index,
      })
    }
    return
  }

  await Promise.all(step.steps.map((parallelStep) => executePipelineStep(parallelStep, args)))
}

export async function executePipelineSteps<TState, TContext>(
  steps: PipelineExecutableStep<TState, TContext>[],
  args: PipelineStepArgs<TState, TContext>,
): Promise<void> {
  for (const step of steps) {
    await executePipelineStep(step, args)
  }
}

type PipelineExecutionParams<TState> = {
  supabase: any
  orgId: string
  pipeline: string
  state: TState
  execute: (state: TState) => Promise<void>
}

type PipelineExecutionSuccess<TState> = {
  ok: true
  state: TState
  runId: string | null
}

type PipelineExecutionFailure<TState> = {
  ok: false
  state: TState
  runId: string | null
  error: Error
}

export type PipelineExecutionResult<TState> =
  | PipelineExecutionSuccess<TState>
  | PipelineExecutionFailure<TState>

export async function runPipelineExecution<TState>(
  params: PipelineExecutionParams<TState>,
): Promise<PipelineExecutionResult<TState>> {
  const { supabase, orgId, pipeline, state, execute } = params
  const runId = await startRun(supabase, orgId, pipeline)

  try {
    await execute(state)
    await finishRun(supabase, runId, PIPELINE_RUN_STATUS.SUCCESS, state)
    return {
      ok: true,
      state,
      runId,
    }
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error))
    await finishRun(supabase, runId, PIPELINE_RUN_STATUS.FAILED, {
      error: failure.message,
      ...(state as Record<string, unknown>),
    })
    return {
      ok: false,
      state,
      runId,
      error: failure,
    }
  }
}

async function startRun(
  supabase: any,
  orgId: string,
  pipeline: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('pipeline_runs')
    .insert({
      org_id: orgId,
      pipeline,
      status: PIPELINE_RUN_STATUS.RUNNING,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  return data?.id ?? null
}

async function finishRun(
  supabase: any,
  runId: string | null,
  status: PipelineRunStatus,
  result: unknown,
) {
  if (!runId) return

  const { error } = await supabase
    .from('pipeline_runs')
    .update({
      status,
      result,
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId)

  if (error) {
    console.error('Failed to finish pipeline run:', error.message)
  }
}