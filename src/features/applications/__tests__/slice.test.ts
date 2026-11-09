import { ApplicationIdSchema, NextStepIdSchema } from '@/lib/ids';

import type { ApplicationInput } from '../schema';
import {
  applicationAdded,
  applicationRemoved,
  applicationsSlice,
  applicationUpdated,
  nextStepAdded,
  nextStepRemoved,
  nextStepToggled,
  stageChanged,
  type ApplicationsState,
} from '../slice';

const reducer = applicationsSlice.reducer;
const id = ApplicationIdSchema.parse('app_acme');
const stepId = NextStepIdSchema.parse('step_1');
const T0 = '2026-11-05T09:00:00.000Z';
const T1 = '2026-11-05T10:00:00.000Z';

const input: ApplicationInput = {
  company: 'Acme Health',
  role: 'Senior React Native Engineer',
  location: 'Austin, TX',
  salary: undefined,
  listingUrl: undefined,
  stage: 'saved',
  notes: '',
  requirements: ['TypeScript'],
};

function withApplication(): ApplicationsState {
  return reducer(undefined, applicationAdded({ id, input, now: T0 }));
}

function withStep(): ApplicationsState {
  return reducer(
    withApplication(),
    nextStepAdded({
      applicationId: id,
      id: stepId,
      title: '  Book the onsite  ',
      dueDate: '2026-11-06',
      source: 'manual',
      now: T1,
    }),
  );
}

describe('applications slice', () => {
  it('adds an application with no Next Steps and both timestamps set', () => {
    expect(withApplication().entities[id]).toEqual({
      ...input,
      id,
      nextSteps: [],
      createdAt: T0,
      updatedAt: T0,
    });
  });

  it('moves an application to the front when its Stage changes', () => {
    const otherId = ApplicationIdSchema.parse('app_globex');
    let state = reducer(withApplication(), applicationAdded({ id: otherId, input, now: T1 }));
    expect(state.ids[0]).toBe(otherId);
    state = reducer(state, stageChanged({ id, stage: 'applied', now: '2026-11-05T11:00:00.000Z' }));
    expect(state.ids[0]).toBe(id);
  });

  it('updates fields and the updatedAt timestamp', () => {
    const state = reducer(
      withApplication(),
      applicationUpdated({ id, input: { ...input, role: 'Staff Engineer' }, now: T1 }),
    );
    expect(state.entities[id]).toMatchObject({
      role: 'Staff Engineer',
      createdAt: T0,
      updatedAt: T1,
    });
  });

  it('ignores updates and stage changes for an unknown application', () => {
    const before = withApplication();
    const unknown = ApplicationIdSchema.parse('app_missing');
    expect(reducer(before, applicationUpdated({ id: unknown, input, now: T1 }))).toBe(before);
    expect(reducer(before, stageChanged({ id: unknown, stage: 'offer', now: T1 }))).toBe(before);
  });

  it('changes the stage', () => {
    const state = reducer(withApplication(), stageChanged({ id, stage: 'interviewing', now: T1 }));
    expect(state.entities[id]).toMatchObject({ stage: 'interviewing', updatedAt: T1 });
  });

  it('adds a Next Step with a trimmed title, open by default', () => {
    expect(withStep().entities[id]?.nextSteps).toEqual([
      {
        id: stepId,
        title: 'Book the onsite',
        dueDate: '2026-11-06',
        source: 'manual',
        done: false,
      },
    ]);
  });

  it('toggles a Next Step done and back, tracking completion time', () => {
    const done = reducer(withStep(), nextStepToggled({ applicationId: id, id: stepId, now: T1 }));
    expect(done.entities[id]?.nextSteps[0]).toMatchObject({ done: true, completedAt: T1 });
    const reopened = reducer(done, nextStepToggled({ applicationId: id, id: stepId, now: T1 }));
    expect(reopened.entities[id]?.nextSteps[0]?.done).toBe(false);
    expect(reopened.entities[id]?.nextSteps[0]).not.toHaveProperty('completedAt');
  });

  it('removes a Next Step', () => {
    const state = reducer(withStep(), nextStepRemoved({ applicationId: id, id: stepId, now: T1 }));
    expect(state.entities[id]?.nextSteps).toEqual([]);
  });

  it('removes an application with its Next Steps', () => {
    const state = reducer(withStep(), applicationRemoved(id));
    expect(state.ids).toEqual([]);
    expect(state.entities[id]).toBeUndefined();
  });
});
