import {
  createAction,
  createEntityAdapter,
  createSlice,
  type EntityState,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type { IsoDate } from '@/lib/dates';
import type { ApplicationId, MessageId, NextStepId } from '@/lib/ids';
import type { Stage } from '@/lib/stage';

import type { Application, ApplicationInput, NextStep } from './schema';

export const applicationsAdapter = createEntityAdapter<Application, ApplicationId>({
  selectId: (application) => application.id,
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
});

export type ApplicationsState = EntityState<Application, ApplicationId>;

/** Fields that go with an action are passed in, so reducers stay pure and testable. */
interface Stamped {
  now: string;
}

export const applicationsSlice = createSlice({
  name: 'applications',
  initialState: applicationsAdapter.getInitialState(),
  reducers: {
    applicationAdded(
      state,
      action: PayloadAction<{ id: ApplicationId; input: ApplicationInput } & Stamped>,
    ) {
      const { id, input, now } = action.payload;
      applicationsAdapter.addOne(state, {
        ...input,
        id,
        nextSteps: [],
        createdAt: now,
        updatedAt: now,
      });
    },
    applicationUpdated(
      state,
      action: PayloadAction<{ id: ApplicationId; input: ApplicationInput } & Stamped>,
    ) {
      const { id, input, now } = action.payload;
      applicationsAdapter.updateOne(state, { id, changes: { ...input, updatedAt: now } });
    },
    applicationRemoved(state, action: PayloadAction<ApplicationId>) {
      applicationsAdapter.removeOne(state, action.payload);
    },
    stageChanged(state, action: PayloadAction<{ id: ApplicationId; stage: Stage } & Stamped>) {
      const { id, stage, now } = action.payload;
      applicationsAdapter.updateOne(state, { id, changes: { stage, updatedAt: now } });
    },
    nextStepAdded(
      state,
      action: PayloadAction<
        {
          applicationId: ApplicationId;
          id: NextStepId;
          title: string;
          dueDate: IsoDate;
          source: NextStep['source'];
          messageId?: MessageId;
        } & Stamped
      >,
    ) {
      const { applicationId, now, ...step } = action.payload;
      const existing = state.entities[applicationId];
      if (existing === undefined) return;
      const nextSteps = [...existing.nextSteps, { ...step, title: step.title.trim(), done: false }];
      applicationsAdapter.updateOne(state, {
        id: applicationId,
        changes: { nextSteps, updatedAt: now },
      });
    },
    nextStepToggled(
      state,
      action: PayloadAction<{ applicationId: ApplicationId; id: NextStepId } & Stamped>,
    ) {
      const { applicationId, id, now } = action.payload;
      const existing = state.entities[applicationId];
      if (existing === undefined || !existing.nextSteps.some((s) => s.id === id)) return;
      const nextSteps = existing.nextSteps.map((s) => {
        if (s.id !== id) return s;
        if (!s.done) return { ...s, done: true, completedAt: now };
        const { completedAt: _completedAt, ...reopened } = s;
        return { ...reopened, done: false };
      });
      applicationsAdapter.updateOne(state, {
        id: applicationId,
        changes: { nextSteps, updatedAt: now },
      });
    },
    nextStepRemoved(
      state,
      action: PayloadAction<{ applicationId: ApplicationId; id: NextStepId } & Stamped>,
    ) {
      const { applicationId, id, now } = action.payload;
      const existing = state.entities[applicationId];
      if (existing === undefined) return;
      const nextSteps = existing.nextSteps.filter((s) => s.id !== id);
      applicationsAdapter.updateOne(state, {
        id: applicationId,
        changes: { nextSteps, updatedAt: now },
      });
    },
  },
});

export const {
  applicationAdded,
  applicationUpdated,
  applicationRemoved,
  stageChanged,
  nextStepAdded,
  nextStepToggled,
  nextStepRemoved,
} = applicationsSlice.actions;

/**
 * The user saved a new application from a form (manual entry or a confirmed draft). Other features
 * start follow-up work on it, such as prep questions. Demo data doesn't send it, so loading samples
 * never queues on-device AI work.
 */
export const applicationSaved = createAction<{ id: ApplicationId }>('applications/saved');
