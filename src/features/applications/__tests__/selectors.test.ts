import { ApplicationIdSchema, NextStepIdSchema } from '@/lib/ids';
import { STAGES } from '@/lib/stage';
import { makeStore } from '@/store/store';

import {
  selectApplicationsByStage,
  selectPipelineCounts,
  selectUpcomingNextSteps,
  selectUrgentApplicationIds,
  selectUrgentNextStepByApplication,
} from '../selectors';
import type { Application } from '../schema';
import { applicationsState, makeApplication, makeNextStep } from '../testing/fixtures';

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
    expect([...selectUrgentApplicationIds(state, NOW)]).toEqual([globexId]);
    expect(selectUrgentNextStepByApplication(state, NOW).get(globexId)?.title).toBe('Today');
  });
});
