import {
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
      const existing = state.entities[id];
      if (existing === undefined) return;
      state.entities[id] = { ...existing, ...input, updatedAt: now };
    },
    applicationRemoved(state, action: PayloadAction<ApplicationId>) {
      applicationsAdapter.removeOne(state, action.payload);
    },
    stageChanged(state, action: PayloadAction<{ id: ApplicationId; stage: Stage } & Stamped>) {
      const existing = state.entities[action.payload.id];
      if (existing === undefined) return;
      existing.stage = action.payload.stage;
      existing.updatedAt = action.payload.now;
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
      existing.nextSteps.push({ ...step, title: step.title.trim(), done: false });
      existing.updatedAt = now;
    },
    nextStepToggled(
      state,
      action: PayloadAction<{ applicationId: ApplicationId; id: NextStepId } & Stamped>,
    ) {
      const { applicationId, id, now } = action.payload;
      const step = state.entities[applicationId]?.nextSteps.find((s) => s.id === id);
      if (step === undefined) return;
      step.done = !step.done;
      if (step.done) step.completedAt = now;
      else delete step.completedAt;
    },
    nextStepRemoved(
      state,
      action: PayloadAction<{ applicationId: ApplicationId; id: NextStepId }>,
    ) {
      const existing = state.entities[action.payload.applicationId];
      if (existing === undefined) return;
      existing.nextSteps = existing.nextSteps.filter((s) => s.id !== action.payload.id);
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
