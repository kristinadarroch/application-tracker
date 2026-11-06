import {
  ApplicationPrefillSchema,
  formStateFromPrefill,
  splitRequirements,
  validateApplicationForm,
} from '../form';
import { dueLabel } from '../nextStepDue';
import { NextStepInputSchema } from '../schema';

describe('splitRequirements', () => {
  it('splits on commas and new lines, dropping blanks', () => {
    expect(splitRequirements(' React Native, TypeScript\n\nRedux ,')).toEqual([
      'React Native',
      'TypeScript',
      'Redux',
    ]);
  });
});

describe('validateApplicationForm', () => {
  const blank = formStateFromPrefill({});

  it('returns one message per invalid field', () => {
    const result = validateApplicationForm({ ...blank, company: '  ', listingUrl: 'acme.com' });
    expect(result).toEqual({
      ok: false,
      error: {
        company: 'Add the company',
        role: 'Add the role',
        listingUrl: 'Enter a link that starts with http:// or https://',
      },
    });
  });

  it('trims text and turns blank optional fields into undefined', () => {
    const result = validateApplicationForm({
      ...blank,
      company: ' Acme ',
      role: ' Engineer ',
      location: '   ',
      requirements: 'TypeScript, Redux',
    });
    expect(result).toEqual({
      ok: true,
      value: {
        company: 'Acme',
        role: 'Engineer',
        location: undefined,
        salary: undefined,
        listingUrl: undefined,
        stage: 'saved',
        notes: '',
        requirements: ['TypeScript', 'Redux'],
      },
    });
  });
});

describe('ApplicationPrefillSchema', () => {
  it('keeps string params and drops malformed ones instead of throwing', () => {
    expect(
      ApplicationPrefillSchema.parse({ company: 'Acme', stage: 'nope', role: ['a', 'b'] }),
    ).toEqual({ company: 'Acme' });
  });
});

describe('NextStepInputSchema', () => {
  it('rejects dates that do not exist', () => {
    const result = NextStepInputSchema.safeParse({ title: 'Call', dueDate: '2026-02-31' });
    expect(result.success).toBe(false);
  });
});

describe('dueLabel', () => {
  const now = new Date(2026, 10, 5, 9, 0);
  it.each([
    ['2026-11-05', 'Due today'],
    ['2026-11-06', 'Due tomorrow'],
  ])('labels %s as %s', (date, label) => {
    expect(dueLabel(date, now)).toBe(label);
  });

  it('labels past dates as overdue', () => {
    expect(dueLabel('2026-11-01', now)).toMatch(/^Overdue · /);
  });
});
