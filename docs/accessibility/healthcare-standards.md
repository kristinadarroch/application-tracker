# Standards for a healthcare UI component library

Checked against primary sources on **2026-11-09**. This is an engineering summary, not legal advice. `[INFERENCE]` marks a conclusion drawn from the sources rather than stated in them.

## Bottom line

1. **The bar is WCAG 2.1 Level AA, applied to web and native mobile apps.** For a health system that receives HHS federal financial assistance (commonly through Medicare Part A or Medicaid), the HHS Section 504 rule makes this binding on **May 11, 2027** ([45 CFR 84.84](https://www.ecfr.gov/current/title-45/section-84.84)). The definition of federal financial assistance excludes contracts of insurance or guaranty ([84.10](https://www.ecfr.gov/current/title-45/section-84.10)), so Medicare Part B payment alone may not trigger it; whether a given organization is a recipient needs legal review. ACA Section 1557 points back to that rule ([45 CFR 92.204(b)](https://www.ecfr.gov/current/title-45/section-92.204)).
2. **Build to WCAG 2.2 AA.** It includes everything in 2.1 and adds target size, focus-not-obscured, and accessible-authentication criteria, which component code controls directly ([WCAG 2.2 §New Features](https://www.w3.org/TR/WCAG22/#new-features-in-wcag-2-2)).
3. **A component library can't claim conformance by itself.** WCAG conformance applies only to full pages and complete processes ([WCAG 2.2 §5.2.2–5.2.3](https://www.w3.org/TR/WCAG22/#cc2)). A library makes conformance possible: its accessible defaults, documented usage rules, and per-component test evidence feed the product's Accessibility Conformance Report (ACR).
4. **HIPAA adds UI requirements that interact with accessibility.** Automatic logoff is an *addressable* specification under the current Security Rule: each covered entity decides through its risk analysis whether to use it or an equivalent. When it is used, the timeout must be an accessible warning that lets the user extend (WCAG 2.2.1), so the library should ship that component. PHI masking must not hide content from screen readers in a way that breaks role, name, and state. Security hardening must not block paste in login fields (WCAG 3.3.8).
5. **FDA rules usually don't apply.** Patient-portal functions such as viewing your record, scheduling, and paying bills are listed by FDA as not medical devices. IEC 62366-1 usability engineering applies only if a feature becomes device software.

---

## 1. Accessibility law and the technical standard each adopts

### 1.1 HHS Section 504 rule, 45 CFR part 84 subpart I (the rule that binds a private health system)

- **Who:** recipients of HHS federal financial assistance. HHS describes these recipients as including "health care providers of all sizes, ranging from large hospital systems to small local clinics" ([91 FR 25496, §I](https://www.federalregister.gov/documents/2026/05/11/2026-09266/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web)). Federal financial assistance excludes "a contract of insurance or guaranty" ([84.10](https://www.ecfr.gov/current/title-45/section-84.10)). `[INFERENCE]` A hospital system funded through Medicare Part A or Medicaid is typically a recipient; Medicare Part B payment alone may not be. Confirm applicability with counsel.
- **What:** web content and mobile apps the recipient "provides or makes available, directly or through contractual, licensing, or other arrangements" must comply with WCAG 2.1 Level A and AA success criteria and conformance requirements ([84.84(a)–(b)](https://www.ecfr.gov/current/title-45/section-84.84)). The rule incorporates the June 2018 edition of WCAG 2.1 by reference (same section, (b)(3)). The "contractual, licensing" wording means vendor portals and SDK screens a hospital licenses are covered too.
- **Mobile apps:** defined as "software applications that are downloaded and designed to run on mobile devices, such as smartphones and tablets" ([84.10](https://www.ecfr.gov/current/title-45/section-84.10)).
- **Compliance dates, current text:**
  - **May 11, 2027** for recipients with 15 or more employees.
  - **May 10, 2028** for recipients with fewer than 15 employees.
  - Source: [84.84(b)](https://www.ecfr.gov/current/title-45/section-84.84).
- **2026 change:** on May 7, 2026, an HHS interim final rule (IFR) pushed both dates back by one year. They had been May 11, 2026 and May 10, 2027 ([91 FR 25496](https://www.federalregister.gov/documents/2026/05/11/2026-09266/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web)). In the same IFR, HHS said it "plans to engage in future rulemaking related to the substantive requirements" and "will consider issuing an NPRM." Absent that, it "fully anticipates implementing the regulation at the new deadline." Comments closed July 6, 2026. A Federal Register search on 2026-11-09 found no follow-up proposed rule on the web or app requirements.
- **Litigation:** *Texas v. Kennedy* (N.D. Tex. No. 5:24-cv-00225) challenged the 2024 rule.
  - The parties' joint proposed final judgment vacates only the "most integrated setting" provisions: §84.76 and related sentences ([joint motion, ECF 124](https://dredf.org/wp-content/uploads/2026/09/124.-Corrected-Jt-Mot-for-Entry-Final-J-Access-Pass.pdf)). It does not touch subpart I, the web and app rules.
  - Advocates report the court entered that judgment on September 23, 2026 ([Disability Rights Texas](https://disabilityrightstx.org/en/press_release/statement-from-disability-rights-texas-on-final-ruling-in-texas-v-kennedy/); secondary source).
  - A separate HHS final rule dated November 3, 2026, effective January 4, 2027, deals only with the gender-dysphoria definition ([91 FR 69207](https://www.federalregister.gov/documents/2026/11/03/2026-22380/nondiscrimination-on-the-basis-of-disability-in-programs-or-activities-receiving-federal-financial)).
  - `[INFERENCE]` As of today, §84.84 is in force with the 2027 and 2028 dates.

### 1.2 ACA Section 1557, 45 CFR part 92

- **[92.204](https://www.ecfr.gov/current/title-45/section-92.204), accessible ICT:**
  - (a) A covered entity's health programs delivered through information and communication technology (ICT) must be accessible unless that would cause undue burden or fundamental alteration.
  - (b) A recipient's "websites and mobile applications" must "comply with the requirements of section 504 … as interpreted consistent with title II of the ADA."
  - The text names no WCAG level. `[INFERENCE]` The cross-reference to 504 brings in the WCAG 2.1 AA bar and its 2027/2028 dates. The general duty in (a) has applied since the July 5, 2024 effective date ([92.1(b)](https://www.ecfr.gov/current/title-45/section-92.1)).
- **[92.11](https://www.ecfr.gov/current/title-45/section-92.11), notice of language assistance and auxiliary aids:**
  - Content: the notice says these services are free. It must appear in English plus at least the 15 languages most commonly spoken by people with limited English proficiency in the relevant state, and in alternate formats.
  - Placement: "at a conspicuous location" on the website and in listed electronic communications, including intake forms, consent forms, discharge papers, and billing.
  - Deadline: one year after July 5, 2024, so July 5, 2025 ([92.1(b)](https://www.ecfr.gov/current/title-45/section-92.1)).
- **[92.201(c)(3)](https://www.ecfr.gov/current/title-45/section-92.201), machine translation:** machine translation of critical text must be reviewed by a qualified human translator.
- **Litigation:** on October 22, 2025, *Tennessee v. Kennedy* (S.D. Miss.) vacated the 1557 rule provisions to the extent they extend sex discrimination to gender identity. HHS's notice states: "The other provisions of the Section 1557 Rule remain in force" ([91 FR, June 2, 2026, notice of vacatur](https://www.federalregister.gov/documents/2026/06/02/2026-11015/notice-of-vacatur-regarding-certain-provisions-of-the-2024-nondiscrimination-in-health-programs-and)). §§92.204 and 92.11 are unaffected.

### 1.3 ADA Title III (private hospitals and medical offices)

- Hospitals and offices of health care providers are "public accommodations" ([28 CFR 36.104](https://www.ecfr.gov/current/title-28/section-36.104)).
- **No codified technical standard.** DOJ says it "does not have a regulation setting out detailed standards." Businesses "can currently choose how they will ensure" online accessibility. DOJ points to WCAG and the Section 508 Standards as "helpful guidance" ([DOJ, Guidance on Web Accessibility and the ADA, Mar. 18, 2022](https://www.ada.gov/resources/web-guidance/)). That page also says it has "no legally binding effect."
- `[INFERENCE]` For a private health system, Title III adds legal exposure but no different technical bar. Section 504 already sets WCAG 2.1 AA for the same apps.

### 1.4 ADA Title II, 28 CFR part 35 subpart H (public hospitals and state entities)

- **Who:** state and local governments. In healthcare this means public hospital districts, county hospitals, and state university medical centers. `[INFERENCE]` A Texas hospital district is probably a "special district government."
- **What:** the same WCAG 2.1 Level A and AA bar for web content and mobile apps, including those provided through contracts ([35.200](https://www.ecfr.gov/current/title-28/section-35.200)).
- **Compliance dates, current text:**
  - **April 26, 2027** for entities with a total population of 50,000 or more.
  - **April 26, 2028** for entities under 50,000 and for all special district governments.
  - Source: [35.200(b)](https://www.ecfr.gov/current/title-28/section-35.200).
- **2026 change:** a DOJ interim final rule effective April 20, 2026 extended the dates from April 24, 2026 and April 26, 2027 ([91 FR 20902](https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web)). DOJ also "plans to engage in future rulemaking processes related to the substantive requirements". As of 2026-11-09, no such proposed rule is in the Federal Register.
- `[INFERENCE]` A public hospital that also takes HHS funding is covered by both rules. The earlier date governs in practice. For a special district with 15 or more employees, that is the 504 date of May 11, 2027, not April 26, 2028.

### 1.5 Section 508 (federal agencies, and vendors that sell to them)

- **Who:** federal agencies that develop, procure, maintain, or use ICT, for example VA, IHS, CMS, and DoD health ([36 CFR 1194, Appendix A, E201.1](https://www.ecfr.gov/current/title-36/chapter-XI/part-1194)). Contractors are affected through procurement requirements.
- **Bar:** WCAG 2.0 Level A and AA. This applies to electronic content (E205.4) and to the user interface components and content of software (E207.2).
  - Non-web software is exempt from four criteria: 2.4.1, 2.4.5, 3.2.3, and 3.2.4.
  - Software must also expose object information. "The object role, state(s), properties, boundary, name, and description shall be programmatically determinable" (502.3.1). It must "not disrupt platform features that are defined in the platform documentation as accessibility features" (502.2.2).
- **Date:** in force since January 18, 2018. Unaltered existing ICT that met the old standard is grandfathered (E202.2).
- The Access Board's [ICT page](https://www.access-board.gov/ict/) holds the current text. A Federal Register search found no rule since 2018 changing 36 CFR 1194.

### 1.6 Medicaid managed care (if the health system runs a health plan)

- State-contracted managed care plans must provide information that is "readily accessible." The definition: "comply with modern accessibility standards such as section 508 guidelines, section 504 … and … WCAG 2.0 AA and successor versions" ([42 CFR 438.10(a)](https://www.ecfr.gov/current/title-42/section-438.10)).
- `[INFERENCE]` This applies to a health system that also operates a Medicaid health plan.

### 1.7 Texas state rules

- 1 TAC 206 (state websites) and 1 TAC 213 (electronic and information resources) bind "Texas state agencies and institutions of higher education" ([Texas DIR](https://dir.texas.gov/electronic-information-resources-eir-accessibility/eir-accessibility-roles-and-responsibilities)).
- `[INFERENCE]` They **don't apply to a private nonprofit health system**. They do apply to state university health centers, which are also Title II entities. They can reach a private vendor through a contract with one of those entities.

### 1.8 WCAG 2.2 (current W3C Recommendation)

- **Status:** W3C Recommendation, current edition dated 12 December 2024 ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).
  - W3C: sites that conform to 2.2 also conform to 2.1. W3C "recommends that sites adopt WCAG 2.2 as their new conformance target, even if formal obligations mention previous versions" ([§New Features](https://www.w3.org/TR/WCAG22/#new-features-in-wcag-2-2)).
  - 4.1.1 Parsing is "obsolete and removed" in 2.2. The current WCAG 2.1 edition adds a note that 4.1.1 "should be considered as always satisfied for any content using HTML or XML" ([WCAG 2.1](https://www.w3.org/TR/WCAG21/)). The regulations, however, incorporate the 2018 text.
- **New Level A and AA criteria in 2.2 and what they mean for components:**

| SC | Level | Component impact |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | Sticky headers, floating tab bars, toasts, and bottom sheets must not fully cover the focused element. |
| 2.5.7 Dragging Movements | AA | Sliders, reorderable lists, swipe-to-dismiss, and drag-to-schedule each need a single-pointer alternative, such as buttons or tap-to-select. |
| 2.5.8 Target Size (Minimum) | AA | Targets of at least 24 × 24 CSS px, or enough spacing around them. Icon buttons, chips, and close "×" buttons are where this usually fails. |
| 3.2.6 Consistent Help | A | A help or contact component, such as "Call the nurse line," appears in the same relative order on every screen. |
| 3.3.7 Redundant Entry | A | Multi-step forms such as intake and registration auto-fill or offer earlier answers instead of asking again. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Login, one-time-code, and identity-verification components allow paste, password managers, and OS one-time-code autofill. No cognitive-test CAPTCHAs. |

- WCAG 2.2 has a privacy and security considerations section that explains how these criteria interact with security controls ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).

### 1.9 WCAG2ICT and WCAG2Mobile (how WCAG applies to native apps)

- **WCAG2ICT** is a W3C Group Note dated 11 December 2025 and covers WCAG 2.2 ([WCAG2ICT](https://www.w3.org/TR/wcag2ict-22/)). It is informative, not a requirement. It explains how each success criterion applies to non-web software. The parts that matter most for React Native:
  - **CSS pixel → platform unit.** "Use platform-defined density-independent pixel measurements … points (pt) for iOS … density-independent pixels (dp) for Android." So 2.5.8's 24 × 24 CSS px becomes 24 × 24 pt or dp.
  - **2.2.1 Timing Adjustable** "applies directly as written."
  - **1.4.4 Resize Text** is "problematic to apply directly to non-web software." Apps must "work with platform capabilities where they exist," meaning Dynamic Type on iOS and font scale on Android.
  - **1.4.10 Reflow** applies with "content" substituted for "web content."
- **WCAG2Mobile** ([Guidance on Applying WCAG 2.2 to Mobile Applications](https://www.w3.org/TR/wcag2mobile-22/)) is the W3C's mobile-specific guidance. The latest published version is a Group Draft Note dated 6 May 2025, still in progress ([W3C Mobile Accessibility](https://www.w3.org/WAI/standards-guidelines/mobile/)).
- **Platform guidance, stricter than WCAG on size:**
  - Apple HIG: iOS default control size **44 × 44 pt**, minimum 28 × 28 pt. Apps should "give people the option to enlarge text by at least 200 percent." Apps should respond to Reduce Motion and keep contrast in both light and dark appearances ([Apple HIG, Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
  - Android: touch targets "at least 48dpx48dp" and text contrast of 4.5:1 ([Android, Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps)).

### 1.10 EU, briefly

- The European Accessibility Act, [Directive (EU) 2019/882](https://eur-lex.europa.eu/eli/dir/2019/882/oj), has applied since 28 June 2025 to covered consumer products and services in the EU.
- Its technical reference is [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf). V3.2.1 is aligned with WCAG 2.1.
- `[INFERENCE]` It is not relevant to a Texas health system unless it serves EU consumers. It matters only if the component library is sold as a product.

---

## 2. Exceptions, including mobile apps and conforming alternate versions

The 504 and Title II rules have the same structure. Section numbers below are 504 first, Title II in brackets.

| Provision | Text | Practical reading for a patient app |
|---|---|---|
| Archived web content, [84.85(a)](https://www.ecfr.gov/current/title-45/section-84.85) [35.201(a)] | Created before the compliance date, kept only for reference, not altered, and stored in a clearly labeled archive. | The definition says **web content**, so `[INFERENCE]` it does not cover in-app screens. |
| Preexisting conventional electronic documents, 84.85(b) [35.201(b)] | PDFs, word-processing files, presentations, and spreadsheets posted before the compliance date, unless still "used to apply for, gain access to, or participate in" the program. | Old intake PDFs that are still in use are **not** exempt. |
| Third-party content, 84.85(c) [35.201(c)] | Exempt **unless** the third party posts "due to contractual, licensing, or other arrangements" with the entity. | Vendor portals, scheduling widgets, and payment SDKs are in scope. |
| Individualized, password-protected documents, 84.85(d) [35.201(d)] | **Conventional electronic documents** about a specific person and secured by password. | Covers the downloaded PDF statement, **not** the app or portal screens that show the person's results. The definition of conventional electronic documents is limited to file formats ([84.10](https://www.ecfr.gov/current/title-45/section-84.10)). |
| Preexisting social media posts, 84.85(e) [35.201(e)] | Posts made before the compliance date. | Not relevant to components. |
| Conforming alternate versions, [84.86](https://www.ecfr.gov/current/title-45/section-84.86) [[35.202](https://www.ecfr.gov/current/title-28/section-35.202)] | Allowed "only where it is not possible to make web content directly accessible due to technical or legal limitations." | A separate "accessible version" is a last resort. The text says **web content**. `[INFERENCE]` For native apps, rely on direct conformance. |
| Equivalent facilitation, [84.87](https://www.ecfr.gov/current/title-45/section-84.87) | Other designs are allowed if they give "substantially equivalent or greater accessibility and usability." | Where a native pattern is a better fit than a literal WCAG technique, document it as equivalent facilitation. |
| Fundamental alteration or undue burden, [84.88](https://www.ecfr.gov/current/title-45/section-84.88) [35.204] | The entity carries the burden of proof. The decision must be made by the head of the entity or a designee and put in writing. | Not a design-time escape hatch. |
| Minimal-impact noncompliance, [84.89](https://www.ecfr.gov/current/title-45/section-84.89) [[35.205](https://www.ecfr.gov/current/title-28/section-35.205)] | Deemed compliant if the gap does not affect the ability to access the same information, interactions, and transactions with "substantially equivalent timeliness, privacy, independence, and ease of use." | A narrow safety valve. "Privacy" and "independence" mean, for example, that a blind patient must not need a sighted helper to read their own results. |

`[INFERENCE]` No exception covers native mobile apps as a category. A patient app and every component in it must meet WCAG 2.1 AA.

---

## 3. Accessibility Conformance Report (ACR) and the VPAT

- **What it is:** the ITI Voluntary Product Accessibility Template (VPAT®) is a free template. "Once completed, the VPAT® with documented testing results is referred to as an Accessibility Conformance Report (ACR)" ([ITI VPAT](https://www.itic.org/policy/accessibility/vpat)). Each criterion is rated as Supports, Partially Supports, Does Not Support, or Not Applicable, with remarks.
- **Current version:** VPAT 2.5Rev, April 2025. There are four editions:

| Edition | Standard covered | WCAG version |
|---|---|---|
| 508 | Revised Section 508 | WCAG 2.0 |
| EU | EN 301 549 | WCAG 2.1 |
| WCAG | WCAG only | 2.0, 2.1, and 2.2 |
| INT | All three of the above | WCAG 2.2 |

- **Why health systems ask for one:**
  - Section 504 and Title II cover apps provided "through contractual, licensing, or other arrangements" (§1.1). The hospital stays responsible for a vendor's inaccessible portal, so procurement asks for an ACR as evidence.
  - Federal buyers use ACRs "to assess ICT for accessibility when doing market research and evaluating proposals" ([Section508.gov, ACR](https://www.section508.gov/sell/acr/)).
  - `[INFERENCE]` Hospital procurement follows the same pattern.
- **For a component library** `[INFERENCE]`: products ship ACRs, libraries don't, because conformance applies to full pages (§Bottom line, item 3). The library's job is to make product ACRs cheap and true. For each component, publish:
  - which success criteria it satisfies by default;
  - which ones depend on the consumer, such as a meaningful `accessibilityLabel`, or a heading level that fits the page;
  - automated and manual test evidence, with the screen readers and versions tested.

---

## 4. Other compliance that touches UI components

### 4.1 HIPAA Security Rule, technical safeguards ([45 CFR 164.312](https://www.ecfr.gov/current/title-45/section-164.312))

| Requirement | Text | UI implication |
|---|---|---|
| (a)(1) Access control | Allow access only to authorized persons or software. | Role-aware components that don't render data the user isn't entitled to. Don't just hide it with styling. |
| (a)(2)(i) Unique user identification (Required) | — | No shared-login UI patterns. |
| (a)(2)(iii) Automatic logoff (Addressable) | "Terminate an electronic session after a predetermined time of inactivity." | A session-timeout warning component (§4.4). |
| (b) Audit controls | Record and examine activity in systems containing ePHI. | Audit events for viewing or revealing PHI, sent server-side, never through analytics. |
| (d) Person or entity authentication | Verify identity. | Login and MFA components, which must also meet WCAG 3.3.8. |

**2025 proposed update status:**
- HHS proposed a major Security Rule revision on January 6, 2025 ([90 FR 898](https://www.federalregister.gov/documents/2025/01/06/2024-30983/hipaa-security-rule-to-strengthen-the-cybersecurity-of-electronic-protected-health-information)). Comments closed March 7, 2025.
- It would remove the required/addressable distinction. Automatic logoff would move to proposed §164.312(a)(2)(iv) and require "technical controls that terminate an electronic session after a period of inactivity." It would also define and require multi-factor authentication (proposed §164.312(f)).
- The latest Unified Agenda entry, labeled "2026" on reginfo.gov and replacing the Spring 2025 target of 05/2026, lists it under **Long-Term Actions** with final action dated **07/2027** ([RIN 0945-AA22](https://www.reginfo.gov/public/do/eAgendaViewRule?pubId=202510&RIN=0945-AA22)).
- **The 2003 rule, as amended in 2013, is what applies today**, so automatic logoff stays addressable for now. `[INFERENCE]` Recommendation, not a current requirement: build the timeout component as if logoff were required. The proposed rule would require it, and hospital security teams usually choose it already.

### 4.2 HIPAA Privacy Rule: minimum necessary and incidental disclosure

- **Minimum necessary** ([164.502(b)](https://www.ecfr.gov/current/title-45/section-164.502), [164.514(d)](https://www.ecfr.gov/current/title-45/section-164.514)):
  - Covered entities must identify which workforce roles need which categories of PHI, and "make reasonable efforts to limit" their access.
  - It does **not** apply to disclosures to the patient or to providers for treatment (164.502(b)(2)).
  - `[INFERENCE]` For clinician-facing UI: list and table components should support column- or field-level role filtering, and summary-first views that drill into detail. For patient-facing UI, minimum necessary isn't the driver. Shoulder-surfing is.
- **Safeguards and incidental disclosures** ([164.530(c)](https://www.ecfr.gov/current/title-45/section-164.530)): "reasonably safeguard protected health information to limit incidental uses or disclosures." This is the legal basis for masking, privacy screens, and generic notification text.
- **Tracking technologies:** OCR's guidance treats tracking on authenticated pages and inside apps as handling PHI ([HHS OCR, Use of Online Tracking Technologies](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-online-tracking/index.html)). On June 20, 2024, *AHA v. Becerra* (N.D. Tex.) vacated the part of that guidance about unauthenticated pages. `[INFERENCE]` Component analytics hooks must never receive labels, values, or screen text from authenticated screens.

### 4.3 Platform controls for PHI

| Risk | iOS | Android |
|---|---|---|
| App-switcher snapshot | UIKit snapshots the UI after the app is backgrounded. "Your app's UI must not contain any sensitive user information" ([Apple](https://developer.apple.com/documentation/uikit/preparing-your-ui-to-run-in-the-background)). Cover the screen on background. | `FLAG_SECURE` keeps the window out of screenshots and non-secure displays ([Android](https://developer.android.com/reference/android/view/WindowManager.LayoutParams#FLAG_SECURE)). |
| Notification preview | `hiddenPreviewsBodyPlaceholder` ([Apple](https://developer.apple.com/documentation/usernotifications/unnotificationcategory/hiddenpreviewsbodyplaceholder)). | `VISIBILITY_PRIVATE` with a redacted public version ([Android](https://developer.android.com/develop/ui/views/notifications/build-notification)). |
| Clipboard | Pasteboard `localOnly` and `expirationDate` options ([Apple](https://developer.apple.com/documentation/uikit/uipasteboard/optionskey/expirationdate)). | `ClipDescription.EXTRA_IS_SENSITIVE` hides clipboard previews ([Android](https://developer.android.com/develop/ui/views/touch-and-input/copy-paste)). |
| Secure fields | `isSecureTextEntry` disables copying and hides text ([Apple](https://developer.apple.com/documentation/uikit/uitextinputtraits/issecuretextentry)). | Password input type. |

**Accessibility tension** `[INFERENCE]`: don't apply `FLAG_SECURE` or paste-blocking to the whole app.
- Blocking paste in login fields fails WCAG 3.3.8.
- Blocking screenshots everywhere removes a memory aid that some patients rely on.
- Scope these controls to screens and fields that show PHI. Never apply them to authentication input.

### 4.4 Session timeout: one component, two rules

HIPAA 164.312(a)(2)(iii) names automatic logoff after inactivity as an addressable specification: the covered entity implements it, or documents an equivalent alternative, based on its risk analysis (45 CFR 164.306(d)(3)). Where a product does log users off, WCAG 2.2.1 Timing Adjustable applies: for each time limit set by the content, the user can turn it off, adjust it, or extend it. Extending means the user "is warned before time expires and given at least 20 seconds to extend the time limit with a simple action … and … allowed to extend the time limit at least ten times."
- WCAG2ICT says this "applies directly as written" to apps ([WCAG2ICT, 2.2.1](https://www.w3.org/TR/wcag2ict-22/)).
- W3C's Understanding document counts security time limits as set by the content. Only some, such as time-limited two-factor tokens, "can be considered essential" and exempt ([Understanding 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)).
- `[INFERENCE]` Inactivity logoff is not exempt. Satisfy both rules with the **Extend** option:
  - Show a modal warning before logoff, with a visible countdown and at least 20 seconds to respond.
  - Move focus into the warning and announce it (4.1.3).
  - Offer a single "Stay signed in" action. Any response counts as activity, so extensions are unlimited.
  - Preserve entered form data across re-authentication. This is 2.2.5 Re-authenticating, Level AAA, which is best practice rather than required.

### 4.5 FDA: when software becomes a medical device

- **Software excluded by statute.** The 21st Century Cures Act removed some software from the device definition ([21 U.S.C. 360j(o)](https://www.govinfo.gov/content/pkg/USCODE-2023-title21/html/USCODE-2023-title21-chap9-subchapV-partA-sec360j.htm)): administrative support, general wellness, electronic patient records, transferring or displaying data, and certain clinical decision support.
- **FDA's list of non-devices** ([Policy for Device Software Functions and Mobile Medical Applications, Sept. 28, 2022, Appendix A](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/policy-device-software-functions-and-mobile-medical-applications)) includes:
  - software that generates "reminders for scheduled medical appointments";
  - software that helps "patients track, review, and pay medical claims and bills online";
  - "electronic check-in";
  - software that enables "individuals to interact with electronic health record (EHR) software certified under the ONC Health IT Certification Program", including functions that "only allow individuals to view, transfer, or download EHR data."
  - `[INFERENCE]` A typical patient portal, meaning records, messaging, scheduling, and bill pay, is **not a device**.
- **When it becomes a device:** software that performs "patient-specific analysis and provid[es] specific output(s) or directive(s)" for diagnosis or treatment. Examples include insulin dosing, sepsis alerts, and arrhythmia detection (same guidance, §V.A). The line for clinician tools is in the [Clinical Decision Support Software guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software), revised January 29, 2026.
- **Then usability engineering applies.** FDA recognizes **IEC 62366-1 Edition 1.1 (2020-06)** as a consensus standard, recognition number 5-129 ([FDA Recognized Consensus Standards](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfStandards/detail.cfm?standard__identification_no=41235)). Its scope is "a PROCESS for a MANUFACTURER to analyse, specify, develop and evaluate the USABILITY of a MEDICAL DEVICE as it relates to SAFETY." Related FDA guidance: [Applying Human Factors and Usability Engineering to Medical Devices](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/applying-human-factors-and-usability-engineering-medical-devices).
- `[INFERENCE]` Shared components used inside device software need version pinning, change control, and usability-risk notes, for example the misreading risk of a dosage number component. A general-purpose library doesn't carry that burden for non-device screens.

### 4.6 Health literacy, plain language, and language access

- **Plain language:** the [Federal Plain Language Guidelines](https://www.plainlanguage.gov/guidelines/) are mandatory only for federal agencies. The [CDC Clear Communication Index](https://www.cdc.gov/ccindex/index.html) scores materials out of 100, and CDC recommends 90 or higher. The [AHRQ Health Literacy Universal Precautions Toolkit, 3rd ed.](https://www.ahrq.gov/health-literacy/improve/precautions/toolkit.html) assumes every patient may misunderstand.
- **Health literacy definitions:** [Healthy People 2030](https://odphp.health.gov/healthypeople/priority-areas/health-literacy-healthy-people-2030).
- **Binding hooks:**
  - WCAG 3.3.2 Labels or Instructions (A) and 3.3.3 Error Suggestion (AA) require usable labels and corrective error text.
  - Section 1557 requires language notices (§1.2) and human review of critical machine-translated text (§1.2).
- `[INFERENCE]` What this means for components:
  - Copy lives in props or i18n, not inside components.
  - Layouts survive translated strings that run longer than English.
  - Error components take a "what to do next" message.
  - Number, date, and unit formatting is consistent, for example "120/80 mmHg" and "Tue, Nov 10, 2026."
  - The library supports locale-specific `lang` or `accessibilityLanguage` for mixed-language content (WCAG 3.1.2).

---

## 5. Summary table

| Standard | Applies when | Technical bar | Deadline (as of 2026-11-09) | What it means for a component library |
|---|---|---|---|---|
| HHS §504, [45 CFR 84.84](https://www.ecfr.gov/current/title-45/section-84.84) | Receives HHS federal financial assistance, typically through Medicare Part A or Medicaid; contracts of insurance (Medicare Part B alone) may not count `[INFERENCE]`; needs legal review. Includes vendor-provided apps. | WCAG 2.1 A + AA, web and mobile apps | **May 11, 2027** (15+ employees); May 10, 2028 (fewer than 15) | The primary target. The library's job is accessible defaults and per-component evidence that help each iOS, Android, or web product meet 2.1 AA; conformance is tested on the complete product. |
| ADA Title II, [28 CFR 35.200](https://www.ecfr.gov/current/title-28/section-35.200) | Public hospitals, hospital districts, state academic medical centers | WCAG 2.1 A + AA | Apr 26, 2027 (≥50k population); Apr 26, 2028 (<50k and special districts) | Same as 504. Public entities that also get HHS funding meet the earlier 504 date. |
| ADA Title III, [28 CFR 36.104](https://www.ecfr.gov/current/title-28/section-36.104) | Private hospitals and provider offices | None codified. DOJ points to WCAG and Section 508. | None (general duty) | No extra bar beyond 504. Adds legal exposure. |
| ACA §1557, [92.204](https://www.ecfr.gov/current/title-45/section-92.204), [92.11](https://www.ecfr.gov/current/title-45/section-92.11), [92.201](https://www.ecfr.gov/current/title-45/section-92.201) | HHS-funded health programs | Accessible ICT; websites and apps follow §504. Language notices. | 92.204 since Jul 5, 2024; 92.11 by Jul 5, 2025 | Language-notice footer and banner components. Translation-safe layouts. |
| Section 508, [36 CFR 1194](https://www.ecfr.gov/current/title-36/chapter-XI/part-1194) | Federal agencies (VA, IHS, CMS) and their vendors | WCAG 2.0 A + AA; 502.3 object information | Since Jan 18, 2018 | Meeting 2.1 or 2.2 AA covers it. Expose role, state, name, and description through platform APIs. |
| Medicaid managed care, [42 CFR 438.10](https://www.ecfr.gov/current/title-42/section-438.10) | System runs a Medicaid health plan | "WCAG 2.0 AA and successor versions" | In force | Covered by the same components. |
| Texas 1 TAC 206/213 | State agencies and public universities | State EIR rules | In force | Doesn't apply to a private system `[INFERENCE]`. |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | W3C recommends it as the target | 2.1 plus 6 new A/AA criteria | Not legally mandated in the US | Build to 2.2 AA: target size, focus not obscured, accessible authentication. |
| [WCAG2ICT](https://www.w3.org/TR/wcag2ict-22/) and [WCAG2Mobile](https://www.w3.org/TR/wcag2mobile-22/) | Native apps | Informative interpretation | — | Use pt/dp for CSS px. Honor Dynamic Type and font scale. |
| EAA / EN 301 549 | Products and services for EU consumers | EN 301 549 (WCAG 2.1-aligned) | Since Jun 28, 2025 | Only if the system serves the EU. |
| HIPAA Security, [164.312](https://www.ecfr.gov/current/title-45/section-164.312) | Covered entities and business associates handling ePHI | Access control, audit, authentication; automatic logoff is addressable (risk-analysis decision) | In force; update projected Jul 2027 | Accessible timeout warning for products that log off, audit hooks, MFA components. |
| HIPAA Privacy, [164.502(b)](https://www.ecfr.gov/current/title-45/section-164.502), [164.514(d)](https://www.ecfr.gov/current/title-45/section-164.514), [164.530(c)](https://www.ecfr.gov/current/title-45/section-164.530) | Same | Minimum necessary (workforce); safeguard incidental disclosure | In force | Masked or sensitive text, generic notifications, no PHI to analytics. |
| FDA device rules / [IEC 62366-1](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfStandards/detail.cfm?standard__identification_no=41235) | Software meets the device definition (e.g., dosing, diagnostic alerts) | Usability engineering process | When marketed as a device | Usually none for portals. Device screens need change control and usability risk files. |
| Plain language ([CDC CCI](https://www.cdc.gov/ccindex/index.html), [AHRQ](https://www.ahrq.gov/health-literacy/improve/precautions/toolkit.html)) | Best practice; WCAG 3.3.2/3.3.3 are binding through 504 | CCI ≥ 90 | — | Copy slots, actionable error text, consistent number formats. |

---

## 6. Checklist for a healthcare component library

Every row can be tested by a unit test, a snapshot, or a scripted manual pass. Criteria are WCAG 2.2 success criteria unless noted.

| # | Requirement | How to test | Maps to |
|---|---|---|---|
| 1 | Every interactive component exposes a **role, an accessible name, and its state or value** (selected, checked, expanded, disabled, busy) through `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` or `accessibilityValue`, and through ARIA on web. | RNTL `getByRole(role, { name })` plus a state assertion per component. VoiceOver and TalkBack pass. | 4.1.2 (A); 1.3.1 (A); 508 502.3.1 |
| 2 | The **visible label text is contained in the accessible name.** Icon-only buttons require a label prop, enforced by the type system. | A type test that omitting `label` on `IconButton` doesn't compile. Name ⊇ visible text test. | 2.5.3 (A); 1.1.1 (A) |
| 3 | **Text contrast is ≥ 4.5:1**, or ≥ 3:1 for large text, for every foreground/background token pair in **every theme**: light, dark, and high-contrast. | A unit test computes WCAG ratios over all semantic token pairs and fails below threshold. | 1.4.3 (AA); Apple HIG Increase Contrast |
| 4 | **Non-text contrast is ≥ 3:1** for input borders, focus indicators, meaningful icons, chart marks, and selected-state indicators against adjacent colors. | The same token test, run on border, focus, and icon tokens. | 1.4.11 (AA) |
| 5 | **Pointer targets are ≥ 24 × 24 pt/dp**, or properly spaced, at minimum. The default is **44 × 44 pt on iOS and 48 × 48 dp on Android**, using `hitSlop` when the visual is smaller. | `onLayout` plus `hitSlop` sum ≥ the platform minimum, per component. | 2.5.8 (AA); [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility); [Android](https://developer.android.com/guide/topics/ui/accessibility/apps) |
| 6 | **Text scales to at least 200%** with Dynamic Type and Android font scale, with no clipping, overlap, or lost function. Layout works in portrait and landscape. Web reflows at 320 CSS px and tolerates the text-spacing overrides. | Renders at the largest accessibility text size, both orientations. Web: 400% zoom check. | 1.4.4 (AA); 1.3.4 (AA); 1.4.10 (AA); 1.4.12 (AA); WCAG2ICT |
| 7 | **No information by color alone.** Status, lab flags ("High" or "Low"), errors, and required fields carry text or an icon as well as color. | Grayscale snapshot review. Each status variant has a text token. | 1.4.1 (A) |
| 8 | **Form fields** have a persistent visible label. Errors are **programmatically tied to the field** and say how to fix the problem. Fields declare an input purpose for autofill. Multi-step forms don't re-ask for answers already given. | RNTL: the error text is part of the field's accessible description, or is announced on submit. `autoComplete` and `textContentType` are set for personal data. | 1.3.1, 3.3.1, 3.3.2 (A); 3.3.3, 1.3.5 (AA); 3.3.7 (A) |
| 9 | **Status messages are announced without moving focus.** This covers saved, sent, loading, results-ready, and toasts. | Assert `accessibilityLiveRegion` or `announceForAccessibility` and `role="status"` on web. Screen-reader pass. | 4.1.3 (AA) |
| 10 | **Focus is visible, follows a logical order, and is not obscured** by sticky headers, floating tab bars, or toasts. Modals and sheets trap focus and return it on close. All components work with a hardware keyboard and Switch Control. | A keyboard/switch traversal script per component. A focus-ring contrast token test. Scroll-into-view under a floating bar. | 2.4.7 (AA); 2.4.3, 2.1.1, 2.1.2 (A); 2.4.11 (AA) |
| 11 | **Motion respects Reduce Motion** (`AccessibilityInfo.isReduceMotionEnabled` and `prefers-reduced-motion`). Nothing auto-moves for more than 5 seconds without a pause control. Nothing flashes more than 3 times a second. | A unit test sets reduce-motion to true and asserts duration 0 or a cross-fade. | 2.2.2, 2.3.1 (A); 2.3.3 (AAA); Apple HIG |
| 12 | **Every gesture has a single-pointer alternative**: drag, swipe-to-delete, pinch, and multi-finger gestures. Actions fire on release and can be cancelled. Nothing is triggered only by shaking the device. | Each gesture component exposes an equivalent button or `accessibilityActions`. | 2.5.1, 2.5.2, 2.5.4 (A); 2.5.7 (AA) |
| 13 | For products that use automatic logoff (addressable under HIPAA, so a risk-analysis decision), a **session-timeout warning component** appears before the inactivity logoff. It gives at least 20 seconds, takes focus and is announced, extends the session with one action, and preserves entered data. | Fake timers: the warning appears at T−N, a "Stay signed in" press resets, and form state survives re-login. | 2.2.1 (A); 2.2.5, 2.2.6 (AAA); HIPAA [164.312(a)(2)(iii)](https://www.ecfr.gov/current/title-45/section-164.312) |
| 14 | **Authentication components allow paste, password managers, and one-time-code autofill.** There are no cognitive-function tests. The secure-entry show/hide toggle is labeled with its state. | A test asserts paste isn't blocked and `textContentType="oneTimeCode"` or `autoComplete="one-time-code"` is set. | 3.3.8 (AA); 1.3.5 (AA) |
| 15 | **PHI-safe defaults:** a `SensitiveText` or masked variant is announced as "hidden" until revealed, and doesn't speak the value while masked. Components never forward labels or values to analytics or logs. PHI screens opt into app-switcher cover or `FLAG_SECURE`. Notification and clipboard helpers default to generic, sensitive-flagged content. Auth fields are excluded from these controls. | A unit test checks the masked accessible name. A lint rule bans PHI-bearing props in analytics calls. Background-snapshot test. | HIPAA [164.312](https://www.ecfr.gov/current/title-45/section-164.312), [164.530(c)](https://www.ecfr.gov/current/title-45/section-164.530), [164.514(d)](https://www.ecfr.gov/current/title-45/section-164.514); OCR tracking guidance; 4.1.2 |

Map this checklist against `src/design-system/` together with the existing per-PR list in [`docs/design-system.md#accessibility-checklist`](../design-system.md#accessibility-checklist). This app handles job-application data, not PHI, so HIPAA rows 13 and 15 apply to it only as patterns to demonstrate.
