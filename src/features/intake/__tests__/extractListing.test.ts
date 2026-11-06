import { err, ok } from '@/lib/result';

import { extractListing, withGroundedFacts, withoutImplausibleNames } from '../extractListing';
import { createFakeModel } from '../testing/fakeModel';
import { ACME_EXTRACTION, LISTING_PAGE_HTML, LISTING_TEXT } from '../testing/fixtures';

const NOW = new Date('2026-11-05T12:00:00.000Z');

describe('extractListing', () => {
  afterEach(() => jest.restoreAllMocks());

  it('turns pasted text into an Application Draft (INT-2)', async () => {
    const model = createFakeModel();
    model.nextResult = ok({ ...ACME_EXTRACTION, company: '  Acme Health ', location: '' });
    const generate = jest.spyOn(model, 'generate');

    const result = await extractListing(
      model,
      { kind: 'text', text: LISTING_TEXT, source: 'pasted_text' },
      { now: NOW },
    );

    expect(result).toEqual({
      ok: true,
      value: {
        status: 'drafted',
        draft: {
          id: expect.stringMatching(/^draft_/),
          source: 'pasted_text',
          sourceText: LISTING_TEXT,
          extraction: {
            company: 'Acme Health',
            role: 'Senior React Native Engineer',
            salary: '$150,000 - $180,000',
            requirements: ['5+ years React Native', 'TypeScript', 'Redux Toolkit'],
          },
          notes: '',
          trimmed: false,
          createdAt: NOW.toISOString(),
        },
      },
    });
    expect(model.prompts[0]).toContain('Acme Health is hiring');
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 20_000, maxOutputTokens: 400, sampling: 'repeatable' }),
    );
  });

  it('keeps a link that came with pasted text', async () => {
    const model = createFakeModel();
    model.nextResult = ok(ACME_EXTRACTION);
    const result = await extractListing(model, {
      kind: 'text',
      text: LISTING_TEXT,
      source: 'pasted_text',
      listingUrl: 'https://acme.example/jobs/42',
    });
    expect(result.ok && result.value.status === 'drafted' && result.value.draft.listingUrl).toBe(
      'https://acme.example/jobs/42',
    );
  });

  it('fetches a link, sends the page text, and stores the link (INT-3)', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(LISTING_PAGE_HTML, { headers: { 'content-type': 'text/html' } }),
      );
    const model = createFakeModel();
    model.nextResult = ok(ACME_EXTRACTION);

    const result = await extractListing(model, {
      kind: 'url',
      url: 'https://acme.example/jobs/42',
      source: 'shared',
    });

    expect(result.ok && result.value.status === 'drafted' && result.value.draft).toMatchObject({
      source: 'shared',
      listingUrl: 'https://acme.example/jobs/42',
    });
    expect(model.prompts[0]).toContain('5+ years of React Native');
    expect(model.prompts[0]).not.toContain('All jobs');
  });

  it('does not call the model when the page can’t be read', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network request failed'));
    const model = createFakeModel();

    const result = await extractListing(model, {
      kind: 'url',
      url: 'https://acme.example/jobs/42',
      source: 'pasted_url',
    });

    expect(result).toEqual({ ok: false, error: { kind: 'network' } });
    expect(model.prompts).toHaveLength(0);
  });

  it('reports a missing company or role instead of making a draft', async () => {
    const model = createFakeModel();
    model.nextResult = ok({ ...ACME_EXTRACTION, company: '   ' });

    const result = await extractListing(model, {
      kind: 'text',
      text: 'We are hiring a Senior React Native Engineer.',
      source: 'pasted_text',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        status: 'missing_company_or_role',
        extraction: expect.objectContaining({ company: '', role: 'Senior React Native Engineer' }),
        sourceText: 'We are hiring a Senior React Native Engineer.',
      },
    });
  });

  it('passes model errors through unchanged', async () => {
    const model = createFakeModel();
    model.nextResult = err({ kind: 'invalid_response', issues: ['company: expected string'] });

    const result = await extractListing(model, {
      kind: 'text',
      text: LISTING_TEXT,
      source: 'pasted_text',
    });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'invalid_response', issues: ['company: expected string'] },
    });
  });

  it('trims a listing that doesn’t fit the context window and marks the draft (INT-5)', async () => {
    const model = createFakeModel();
    model.nextResult = ok(ACME_EXTRACTION);
    const longListing = `${LISTING_TEXT}\n${'Responsibilities include shipping features. '.repeat(400)}`;

    const result = await extractListing(model, {
      kind: 'text',
      text: longListing,
      source: 'pasted_text',
    });

    if (!result.ok || result.value.status !== 'drafted') throw new Error('expected a draft');
    expect(result.value.draft.trimmed).toBe(true);
    expect(result.value.draft.sourceText.length).toBeLessThan(longListing.length);
    expect(result.value.draft.sourceText.startsWith('Acme Health is hiring')).toBe(true);
  });
});

/** Sample 5 from the on-device check: no employer named, and the model copied prose instead. */
const NO_EMPLOYER_TEXT =
  "We're looking for someone passionate about mobile to join a fast-growing team. You'll collaborate with design and product, write clean code, and have fun. Apply today!";
const NO_EMPLOYER_EXTRACTION = {
  company: "We're looking for someone passionate about mobile",
  role: 'mobile',
  requirements: [],
};

describe('withoutImplausibleNames', () => {
  it.each(['Acme Health', 'Northwind Labs', 'Initech', 'Acme Inc.', 'Booking.com'])(
    'keeps the company name %s',
    (company) => {
      expect(withoutImplausibleNames({ ...ACME_EXTRACTION, company }).company).toBe(company);
    },
  );

  it.each([
    ["We're looking for someone passionate about mobile", 'it starts with "we"'],
    ['You’ll join a fast-growing team', 'it starts with "you"'],
    ['A fast growing team building great mobile apps for everyone', 'it is longer than 6 words'],
    ['Apply today!', 'it has sentence punctuation'],
    ['Fast-growing team. Great culture', 'it has a sentence break'],
  ])('blanks the company "%s" because %s', (company) => {
    expect(withoutImplausibleNames({ ...ACME_EXTRACTION, company }).company).toBe('');
  });

  it('keeps a real job title and blanks a lone lowercase word', () => {
    expect(withoutImplausibleNames(ACME_EXTRACTION).role).toBe('Senior React Native Engineer');
    expect(withoutImplausibleNames({ ...ACME_EXTRACTION, role: 'iOS Engineer' }).role).toBe(
      'iOS Engineer',
    );
    expect(withoutImplausibleNames({ ...ACME_EXTRACTION, role: 'mobile' }).role).toBe('');
  });

  it('turns a listing that never names the employer into the missing-fields outcome (INT-2)', async () => {
    const model = createFakeModel();
    model.nextResult = ok(NO_EMPLOYER_EXTRACTION);

    const result = await extractListing(model, {
      kind: 'text',
      text: NO_EMPLOYER_TEXT,
      source: 'pasted_text',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        status: 'missing_company_or_role',
        extraction: { company: '', role: '', requirements: [] },
        sourceText: NO_EMPLOYER_TEXT,
      },
    });
  });
});

describe('withGroundedFacts', () => {
  it('keeps company, location, and salary that appear in the text, ignoring case and punctuation', () => {
    const grounded = withGroundedFacts(
      {
        company: 'ACME HEALTH',
        role: 'Senior React Native Engineer',
        location: 'Austin TX',
        salary: '$150,000-$180,000',
        requirements: [],
      },
      LISTING_TEXT,
    );
    expect(grounded).toEqual({
      company: 'ACME HEALTH',
      role: 'Senior React Native Engineer',
      location: 'Austin TX',
      salary: '$150,000-$180,000',
      requirements: [],
    });
  });

  it('blanks invented values that the text never states', () => {
    const grounded = withGroundedFacts(
      {
        company: 'Acme Tech',
        role: 'Mobile Developer',
        location: 'Remote',
        salary: 'No salary range stated',
        requirements: [],
      },
      NO_EMPLOYER_TEXT,
    );
    expect(grounded).toEqual({ company: '', role: 'Mobile Developer', requirements: [] });
  });

  it('matches whole words only and needs a digit in the salary', () => {
    const text = 'Northwind Laboratories pays competitively. Based in Portland.';
    expect(
      withGroundedFacts(
        { company: 'Northwind Lab', role: 'Engineer', salary: 'competitively', requirements: [] },
        text,
      ),
    ).toEqual({ company: '', role: 'Engineer', requirements: [] });
  });

  it('sends an invented employer to the missing-fields outcome (INT-2)', async () => {
    const model = createFakeModel();
    model.nextResult = ok({
      company: 'Acme Tech',
      role: 'Mobile Developer',
      salary: 'No salary range stated',
      requirements: [],
    });

    const result = await extractListing(model, {
      kind: 'text',
      text: NO_EMPLOYER_TEXT,
      source: 'pasted_text',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        status: 'missing_company_or_role',
        extraction: { company: '', role: 'Mobile Developer', requirements: [] },
        sourceText: NO_EMPLOYER_TEXT,
      },
    });
  });
});
