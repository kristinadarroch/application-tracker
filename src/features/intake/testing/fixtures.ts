import { DraftIdSchema } from '@/lib/ids';

import { draftAdded, draftsSlice, type DraftsState } from '../draftsSlice';
import type { ApplicationDraft, ListingExtraction } from '../schema';

/** Fixtures for intake tests. Only imported by tests. */

export const LISTING_TEXT = `Acme Health is hiring a Senior React Native Engineer (hybrid, Austin, TX).
Salary: $150,000 - $180,000. You will build patient-facing mobile features in React Native and
TypeScript, own our component library, and partner with design.
Requirements: 5+ years React Native, TypeScript, Redux Toolkit, accessibility experience.`;

export const ACME_EXTRACTION: ListingExtraction = {
  company: 'Acme Health',
  role: 'Senior React Native Engineer',
  location: 'Austin, TX',
  salary: '$150,000 - $180,000',
  requirements: ['5+ years React Native', 'TypeScript', 'Redux Toolkit'],
};

/** A server-rendered careers page with navigation, scripts, and a footer around the listing. */
export const LISTING_PAGE_HTML = `<!doctype html>
<html>
<head>
  <title>Senior React Native Engineer &ndash; Acme Health Careers</title>
  <style>body { font-family: sans-serif; }</style>
  <script>window.dataLayer = [{ event: 'page_view' }];</script>
</head>
<body>
  <header><a href="/">Acme Health</a> <a href="/jobs">All jobs</a></header>
  <nav><ul><li>Life at Acme</li><li>Benefits</li></ul></nav>
  <main>
    <h1>Senior React Native Engineer</h1>
    <p>Acme Health &middot; Austin, TX (hybrid) &middot; $150,000&nbsp;&ndash;&nbsp;$180,000</p>
    <p>You&rsquo;ll build patient-facing mobile features in React Native &amp; TypeScript,
       own our component library, and partner closely with design.</p>
    <h2>About the team</h2>
    <p>Our mobile team of six ships the Acme Health app to more than 400,000 patients. We
       review each other&rsquo;s code, pair often, and release every two weeks. You&rsquo;ll
       report to the Director of Mobile Engineering and mentor two mid-level engineers.</p>
    <h2>Requirements</h2>
    <ul>
      <li>5+ years of React Native</li>
      <li>TypeScript &amp; Redux Toolkit</li>
      <li>Accessibility experience (VoiceOver, TalkBack)</li>
    </ul>
    <!-- tracking pixel -->
  </main>
  <footer>&copy; 2026 Acme Health. Privacy policy. Terms of use.</footer>
</body>
</html>`;

/** A client-rendered app: the listing only appears after JavaScript runs. */
export const SPA_SHELL_HTML = `<!doctype html>
<html>
<head><title>Jobs</title><script src="/static/js/main.4f2a.js" defer></script></head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>`;

export const LOGIN_FORM_HTML = `<!doctype html>
<html><body>
  <main>
    <h1>Welcome back</h1>
    <form action="/session" method="post">
      <label>Email <input type="email" name="email"></label>
      <label>Password <input type="password" name="password"></label>
      <button>Continue</button>
    </form>
  </main>
</body></html>`;

export const LOGIN_PROMPT_HTML = `<!doctype html>
<html><body><main>
  <h1>Senior React Native Engineer</h1>
  <p>Sign in to view the full job description, salary, and requirements for this role,
  and to see how you compare with other applicants. Members get alerts for similar roles,
  insights about the hiring team, and one-click applications. Joining is free and takes a minute.</p>
</main></body></html>`;

export function makeDraft(overrides: Partial<ApplicationDraft> = {}): ApplicationDraft {
  return {
    id: DraftIdSchema.parse('draft_acme'),
    source: 'pasted_text',
    sourceText: LISTING_TEXT,
    extraction: ACME_EXTRACTION,
    notes: '',
    trimmed: false,
    createdAt: '2026-11-05T10:00:00.000Z',
    ...overrides,
  };
}

/** Drafts state built with the real reducer, so ordering matches the app (newest first). */
export function draftsState(...drafts: ApplicationDraft[]): DraftsState {
  return drafts.reduce(
    (state, draft) => draftsSlice.reducer(state, draftAdded(draft)),
    draftsSlice.getInitialState(),
  );
}
