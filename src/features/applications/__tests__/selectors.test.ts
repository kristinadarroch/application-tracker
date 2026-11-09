import { ApplicationIdSchema, NextStepIdSchema, QuestionIdSchema } from '@/lib/ids';
import { STAGES } from '@/lib/stage';
import { makeStore } from '@/store/store';

import {
  selectApplicationsByStage,
  selectNextInterview,
  selectPipelineCounts,
  selectPracticedQuestionCount,
  selectPrepSummaryByApplication,
  selectSentThisWeekCount,
  selectUpcomingNextSteps,
  selectUrgentNextStepByApplication,
} from '../selectors';
import type { Application } from '../schema';
import { applicationsState, makeApplication, makeNextStep, prepState } from '../testing/fixtures';

/** Thursday, Nov 5 2026, 09:00 local time. */
const NOW = new Date(2026, 10, 5, 9, 0);

const acmeId = ApplicationIdSchema.parse('app_acme');
const globexId = ApplicationIdSchema.parse('app_globex');
const northwindId = ApplicationIdSchema.parse('app_northwind');

function stateWith(...applications: Application[]) {
  return makeStore({ applications: applicationsState(...applications) }).getState();
}

describe('selectApplicationsByStage', () => {
  it('returns every stage in pipeline order, keeping empty stages', () => {
    const state = stateWith(
      makeApplication({ id: acmeId, stage: 'interviewing' }),
      makeApplication({ id: globexId, company: 'Globex', stage: 'saved' }),
    );
    const byStage = selectApplicationsByStage(state);
    expect(Object.keys(byStage)).toEqual([...STAGES]);
    expect(byStage.interviewing.map((a) => a.company)).toEqual(['Acme Health']);
    expect(byStage.saved.map((a) => a.company)).toEqual(['Globex']);
    expect(byStage.offer).toEqual([]);
  });
});

describe('selectPipelineCounts', () => {
  it('counts applications per stage, with 0 for empty stages', () => {
    const state = stateWith(
      makeApplication({ id: acmeId, stage: 'applied' }),
      makeApplication({ id: globexId, stage: 'applied' }),
      makeApplication({ id: northwindId, stage: 'rejected' }),
    );
    expect(selectPipelineCounts(state)).toEqual({
      saved: 0,
      applied: 2,
      interviewing: 0,
      offer: 0,
      rejected: 1,
      withdrawn: 0,
    });
  });
});

describe('selectUpcomingNextSteps', () => {
  const state = stateWith(
    makeApplication({
      id: acmeId,
      nextSteps: [
        makeNextStep({
          id: NextStepIdSchema.parse('s_later'),
          title: 'Later',
          dueDate: '2026-11-20',
        }),
        makeNextStep({
          id: NextStepIdSchema.parse('s_done'),
          title: 'Done',
          dueDate: '2026-11-04',
          done: true,
        }),
      ],
    }),
    makeApplication({
      id: globexId,
      company: 'Globex',
      nextSteps: [
        makeNextStep({
          id: NextStepIdSchema.parse('s_overdue'),
          title: 'Overdue',
          dueDate: '2026-11-03',
        }),
        makeNextStep({
          id: NextStepIdSchema.parse('s_soon'),
          title: 'In two days',
          dueDate: '2026-11-07',
        }),
        makeNextStep({
          id: NextStepIdSchema.parse('s_tomorrow'),
          title: 'Tomorrow',
          dueDate: '2026-11-06',
        }),
      ],
    }),
  );

  it('lists open steps across applications, soonest first, without done steps', () => {
    expect(selectUpcomingNextSteps(state, NOW).map((item) => item.step.title)).toEqual([
      'Overdue',
      'Tomorrow',
      'In two days',
      'Later',
    ]);
  });

  it('marks steps overdue or due within 48 hours as urgent', () => {
    const urgency = Object.fromEntries(
      selectUpcomingNextSteps(state, NOW).map((item) => [item.step.title, item.urgent]),
    );
    // Nov 7 ends at 23:59, ~63 hours after NOW, so it is outside the 48-hour window.
    expect(urgency).toEqual({ Overdue: true, Tomorrow: true, 'In two days': false, Later: false });
  });
});

describe('urgent applications', () => {
  it('flags only applications with an urgent open step, linked to the soonest one', () => {
    const state = stateWith(
      makeApplication({
        id: acmeId,
        nextSteps: [makeNextStep({ dueDate: '2026-11-05', done: true })],
      }),
      makeApplication({
        id: globexId,
        nextSteps: [
          makeNextStep({
            id: NextStepIdSchema.parse('s_b'),
            title: 'Tomorrow',
            dueDate: '2026-11-06',
          }),
          makeNextStep({
            id: NextStepIdSchema.parse('s_a'),
            title: 'Today',
            dueDate: '2026-11-05',
          }),
        ],
      }),
      makeApplication({ id: northwindId, nextSteps: [makeNextStep({ dueDate: '2026-12-01' })] }),
    );
    expect([...selectUrgentNextStepByApplication(state, NOW).keys()]).toEqual([globexId]);
    expect(selectUrgentNextStepByApplication(state, NOW).get(globexId)?.title).toBe('Today');
  });
});

describe('selectSentThisWeekCount', () => {
  it('counts applications added in the last 7 days that reached Applied or later', () => {
    const state = stateWith(
      makeApplication({ id: acmeId, stage: 'applied', createdAt: '2026-11-04T09:00:00.000Z' }),
      makeApplication({ id: globexId, stage: 'saved', createdAt: '2026-11-04T09:00:00.000Z' }),
      makeApplication({
        id: northwindId,
        stage: 'interviewing',
        createdAt: '2026-10-01T09:00:00.000Z',
      }),
    );
    expect(selectSentThisWeekCount(state, NOW)).toBe(1);
  });
});

describe('selectPracticedQuestionCount', () => {
  it('counts practiced prep questions across applications', () => {
    const question = (id: string, practiced: boolean) => ({
      id: QuestionIdSchema.parse(id),
      type: 'behavioral' as const,
      text: 'Tell me about a time…',
      practiced,
    });
    const state = makeStore({
      prep: {
        questionSets: {
          [acmeId]: {
            applicationId: acmeId,
            generatedAt: '2026-11-04T09:00:00.000Z',
            questions: [question('q1', true), question('q2', false)],
          },
          [globexId]: {
            applicationId: globexId,
            generatedAt: '2026-11-04T09:00:00.000Z',
            questions: [question('q3', true)],
          },
        },
        sessions: { ids: [], entities: {} },
      },
    }).getState();
    expect(selectPracticedQuestionCount(state)).toBe(2);
  });
});

describe('selectPrepSummaryByApplication', () => {
  it('counts practiced and total questions and mock interviews per application', () => {
    const state = makeStore({
      applications: applicationsState(
        makeApplication({ id: acmeId }),
        makeApplication({ id: globexId }),
      ),
      prep: prepState({ [acmeId]: { practiced: 4, total: 10, mockCount: 2 } }),
    }).getState();
    const summaries = selectPrepSummaryByApplication(state);
    expect(summaries.get(acmeId)).toEqual({ practiced: 4, total: 10, mockCount: 2 });
    expect(summaries.get(globexId)).toEqual({ practiced: 0, total: 0, mockCount: 0 });
  });
});

describe('selectNextInterview', () => {
  const interviewing = (id: Application['id'], overrides: Partial<Application> = {}) =>
    makeApplication({ id, company: id, stage: 'interviewing', ...overrides });

  it('returns undefined when no application is Interviewing', () => {
    const state = stateWith(makeApplication({ id: acmeId, stage: 'applied' }));
    expect(selectNextInterview(state)).toBeUndefined();
  });

  it('picks the soonest open Next Step, ignoring done steps and other stages', () => {
    const state = makeStore({
      applications: applicationsState(
        interviewing(acmeId, {
          nextSteps: [
            makeNextStep({ dueDate: '2026-11-03', done: true }),
            makeNextStep({ id: NextStepIdSchema.parse('s_open'), dueDate: '2026-11-12' }),
          ],
        }),
        interviewing(globexId, { nextSteps: [makeNextStep({ dueDate: '2026-11-08' })] }),
        makeApplication({
          id: northwindId,
          stage: 'applied',
          nextSteps: [makeNextStep({ dueDate: '2026-11-01' })],
        }),
      ),
      prep: prepState({ [globexId]: { practiced: 1, total: 3, mockCount: 1 } }),
    }).getState();
    expect(selectNextInterview(state)).toEqual({
      application: expect.objectContaining({ id: globexId }),
      practiced: 1,
      total: 3,
      mockCount: 1,
      otherCount: 1,
    });
  });

  it('puts applications without an open Next Step last', () => {
    const state = stateWith(
      interviewing(acmeId, { updatedAt: '2026-11-05T08:00:00.000Z' }),
      interviewing(globexId, {
        updatedAt: '2026-10-01T08:00:00.000Z',
        nextSteps: [makeNextStep({ dueDate: '2026-12-20' })],
      }),
    );
    expect(selectNextInterview(state)?.application.id).toBe(globexId);
  });

  it('breaks a due-date tie by the most recently updated application', () => {
    const state = stateWith(
      interviewing(acmeId, {
        updatedAt: '2026-11-02T08:00:00.000Z',
        nextSteps: [makeNextStep({ dueDate: '2026-11-09' })],
      }),
      interviewing(globexId, {
        updatedAt: '2026-11-04T08:00:00.000Z',
        nextSteps: [makeNextStep({ dueDate: '2026-11-09' })],
      }),
      interviewing(northwindId, { updatedAt: '2026-11-05T08:00:00.000Z' }),
    );
    expect(selectNextInterview(state)).toMatchObject({
      application: { id: globexId },
      otherCount: 2,
      practiced: 0,
      total: 0,
      mockCount: 0,
    });
  });
});
