import { htmlToText, readListingHtml } from '../listingText';
import {
  LISTING_PAGE_HTML,
  LOGIN_FORM_HTML,
  LOGIN_PROMPT_HTML,
  SPA_SHELL_HTML,
} from '../testing/fixtures';

describe('htmlToText', () => {
  it('keeps the listing and drops scripts, styles, navigation, header, footer, and comments', () => {
    const text = htmlToText(LISTING_PAGE_HTML);
    expect(text).toContain('Senior React Native Engineer – Acme Health Careers');
    expect(text).toContain('Acme Health · Austin, TX (hybrid) · $150,000 – $180,000');
    expect(text).toContain(
      'You’ll build patient-facing mobile features in React Native & TypeScript,',
    );
    expect(text).toContain('TypeScript & Redux Toolkit');
    const dropped = [
      'dataLayer',
      'font-family',
      'All jobs',
      'Life at Acme',
      'Privacy policy',
      'tracking pixel',
    ];
    for (const fragment of dropped) {
      expect(text).not.toContain(fragment);
    }
  });

  it('puts each block on its own line with collapsed whitespace', () => {
    expect(htmlToText('<ul><li>  One\n  thing </li><li>Two</li></ul><p>Three<br>Four</p>')).toBe(
      'One thing\nTwo\nThree\nFour',
    );
  });

  it('decodes numeric entities and decodes each entity only once', () => {
    expect(htmlToText('<p>&#36;120k &#x2013; &#8364;90k &amp;lt;tag&amp;gt; &unknown;</p>')).toBe(
      '$120k – €90k &lt;tag&gt; &unknown;',
    );
  });
});

describe('readListingHtml (INT-3)', () => {
  it('returns the text of a readable listing', () => {
    const page = readListingHtml(LISTING_PAGE_HTML);
    expect(page.ok && page.value).toContain('5+ years of React Native');
  });

  it('reports a JavaScript-only app shell as empty', () => {
    expect(readListingHtml(SPA_SHELL_HTML)).toEqual({ ok: false, error: 'empty' });
  });

  it('reports a page with almost no text as empty', () => {
    expect(
      readListingHtml('<html><body><h1>Careers</h1><p>Coming soon.</p></body></html>'),
    ).toEqual({
      ok: false,
      error: 'empty',
    });
  });

  it('reports a sign-in form as a login wall', () => {
    expect(readListingHtml(LOGIN_FORM_HTML)).toEqual({ ok: false, error: 'login_wall' });
  });

  it('reports "sign in to view" pages as a login wall', () => {
    expect(readListingHtml(LOGIN_PROMPT_HTML)).toEqual({ ok: false, error: 'login_wall' });
  });

  it('accepts a full listing even when the page has a hidden sign-in form', () => {
    const withSignIn = LISTING_PAGE_HTML.replace(
      '</main>',
      '<div hidden><input type="password" name="password"></div></main>',
    );
    expect(readListingHtml(withSignIn).ok).toBe(true);
  });

  it('accepts a full listing even when the page asks members to sign in', () => {
    const withPrompt = LISTING_PAGE_HTML.replace(
      '</main>',
      '<p>Sign in to see who you already know at Acme Health.</p></main>',
    );
    expect(readListingHtml(withPrompt).ok).toBe(true);
  });
});
