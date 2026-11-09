# Job-seeker needs: measurable pain points and behaviors

Researched 2026-11-08. Sources are first-party industry reports (Greenhouse, Indeed, Glassdoor, Huntr, Accountemps), Federal Reserve survey research, and peer-reviewed psychology. **Caveats:** Industry surveys are self-reported and run by vendors. Huntr data comes from people who log applications in Huntr's own tracker, so the sample is self-selected and skews toward heavy appliers [INFERENCE]. Nothing below is causal unless it says RCT or experiment.

## TL;DR

- **Most applications fail silently.** About 1 in 20 applications gets an interview. 52–61% of candidates report being ghosted after an interview.
- **The process is long and opaque.** A first offer takes about 3 months. Any single application gets a decision in about 3–4 weeks. Seekers get almost no feedback.
- **Planning and steady self-regulation predict success.** Raw volume does not. If-then plans, learning goals, and self-compassion have experimental or longitudinal support.

## 1. Volume: applications, interviews, offers

| Metric | Value | Source |
|---|---|---|
| Interview rate per application, by user volume | 8.0% at 11–20 apps; 2.4% at >100 apps. More of the >100 group got at least one interview (72% vs 48%). | [Huntr Q3 2026](https://huntr.co/research/job-search-trends-q3-2026) |
| Applications before first offer | 65% within 50 (users with ≥11 apps). Largest group: 11–20. | same |
| Median time to first offer | 102 days (up from 78 a year earlier) | same |
| Median time to first interview | 52 days | same |
| Interview rate by channel | Employer career site 6.0%, ATS page 4.8%, job board 3.4%. Former employer 17.6% vs 8.6% elsewhere (same people). | same |
| Unemployed vs employed seekers | Unemployed are ~7% of the sample and send ~40% of applications, but get 16% of offers. More than a quarter of offers go to employed people who aren't searching (referrals, unsolicited contacts). | [Faberman et al., NY Fed SCE](https://www.makro.rw.fau.de/files/2017/09/Mueller-et-al-Job-Search-Behavior-among-the-Employed-and-Non%E2%80%90Employed.pdf) ([Econometrica 2022](https://www.econometricsociety.org/publications/econometrica/2022/07/01/job-search-behavior-among-employed-and-non-employed)) |
| Mass applying | 38% of seekers mass-apply. Recruiter workload rose 26% in one quarter. | [Greenhouse, Dec 2024](https://www.greenhouse.com/uk/blog/greenhouse-2024-state-of-job-hunting-report) |

**What this means for the product:** Rejections and silence are the base rate, not personal failure. Channel and relationships (referrals, former employers, career sites) matter as much as volume. A tracker should capture *where* an application came from.

## 2. Employer ghosting and ghost jobs

- **Greenhouse:** 52% of candidates had been ghosted ([Apr 2024](https://www.greenhouse.com/blog/2024-greenhouse-candidate-experience-report)). By Nov 2024, 61% had been ghosted *after an interview* (n = 2,500 US/UK/DE). In the same survey, 79% felt heightened anxiety and 42% wanted stronger recruiter communication. Greenhouse classifies 18–22% of jobs posted on its platform in any quarter as ghost jobs ([source](https://www.greenhouse.com/uk/blog/greenhouse-2024-state-of-job-hunting-report)).
- **Indeed (2023, US):** 35% of job seekers said an employer never acknowledged their application. 40% were ghosted after a 2nd- or 3rd-round interview, up from 30% in 2022 ([Indeed Ghosting in Hiring Report](https://d341ezm4iqaae0.cloudfront.net/assets/2023/12/07011245/Indeeds-Ghosting-in-Hiring-Report.pdf)). Caveat: respondents were seekers who admitted ghosting employers themselves.
- **Huntr survey (n = 329):** 37% say employers often stop responding after an interview. 43% of open-text answers asked employers to respond "even with a no" ([Huntr Q3 2026](https://huntr.co/research/job-search-trends-q3-2026)).
- **Feedback matters:** 79% would reapply to a company that gave feedback after a rejection ([Greenhouse Apr 2024](https://www.greenhouse.com/blog/2024-greenhouse-candidate-experience-report)).

**What this means for the product:** "No reply" is the most common outcome, yet it has no Stage. The app should infer it from elapsed time, label it neutrally, and offer one bounded action (a follow-up), not an open loop.

## 3. Timelines and follow-up

- **Length of the interview process:** Application to offer or rejection averaged 23.8 days in the US (2017, ~84k Glassdoor interview reviews). By industry it ranges from 10.2 days (restaurants) to 53.8 days (government). Software engineers averaged 21 days in the [2015 study](https://blog.glassdoor.com/site-us/wp-content/uploads/sites/2/why-is-hiring-taking-longer.pdf) ([Glassdoor 2017](http://www.prnewswire.com/news-releases/glassdoor-study-reveals-interview-process-getting-longer-averaging-about-24-days-across-25-countries-300501746.html)).
- **Per-job medians:** 5 days from application to interview, 7 days from interview to offer ([Huntr Q3 2026](https://huntr.co/research/job-search-trends-q3-2026)). Responses that do come tend to come fast. Silence past ~2–3× those medians likely means a ghost [INFERENCE].
- **Thank-you notes (Accountemps, >300 US HR managers, 2017):**
  - 80% take thank-you messages into account.
  - Only 24% of candidates send one, down from 51% in 2007.
  - Email is rated appropriate by 94%.
  - Advice: send within 24 hours, and follow up if there's no word within a week of the interview ([Robert Half press release](https://press.roberthalf.com/2017-11-20-Thank-You-Notes-Can-Tip-Scale-in-Job-Candidates-Favor-Yet-Few-Write-Them)).
- **Evidence gap:** I found no peer-reviewed or controlled data on whether follow-up emails *after an application* raise response rates. Treat follow-up timing as convention, not proven effect.

**What this means for the product:** Make the thank-you a default Next Step due the day after an interview. Make follow-up reminders time-based: about 7 days after an interview and about 14 days after applying, with no other activity [INFERENCE from the medians and the Accountemps guidance].

## 4. Stress, burnout, rejection

- **Unemployment and mental health:** Unemployment causes distress (d = 0.51 across 324 studies). 34% of unemployed people have psychological problems vs 16% of employed people. Interventions reduce distress (d = −0.35) ([Paul & Moser 2009](https://eric.ed.gov/?id=EJ836788)).
- **Daily rollercoaster:** A diary study of 233 unemployed people found that low perceived progress lowered mood and confidence, especially under financial hardship. People coasted the day after a good day. Average search time was 17.8 h/week ([Wanberg, Zhu & van Hooft 2010](https://bm.hkust.edu.hk/bizinsight/2011/01/insights-job-search-grind)).
- **Sustained effort:** Over 20 weeks (n = 177), sustained search intensity predicted more interviews and faster reemployment. "Motivation control" (redirecting attention, goal setting) mattered more than negative self-talk ([Wanberg et al. 2012](https://bm.hkust.edu.hk/bizinsight/2012/11/after-pink-slip-understanding-job-search-experience)).
- **Self-compassion:** In a 5-wave diary study (N = 227), self-compassion weakened the link between lack of progress and negative affect. The authors note self-compassion is trainable ([Kreemers, van Hooft & van Vianen 2018](https://pure.uva.nl/ws/files/22282603/1_s2.0_S0001879118300186_main.pdf)). The same paper summarises the "black hole" problem: seekers get little feedback other than rejections.
- **In seekers' own words:** 18% of Huntr's open-text respondents said the search leaves them tired, lonely, or discouraged. 41% had been searching 10+ months ([Huntr](https://huntr.co/research/job-search-trends-q3-2026)).

**What this means for the product:** Show progress on things the user controls (applications sent, questions practiced, mocks done), not just outcomes. Rejection copy should be kind and normalizing. Warn gently about coasting after a good day.

## 5. What predicts job-search success

- **Meta-analysis of 378 samples (N = 165,933):** Search intensity predicts interviews (ρ = .23), offers (.14), and employment (.19), but **not** job quality. Self-regulation and search *quality* predicted both quantity and quality ([van Hooft et al. 2021](https://pubmed.ncbi.nlm.nih.gov/32658493/); earlier: [Kanfer, Wanberg & Kantrowitz 2001](https://pubmed.ncbi.nlm.nih.gov/11596801)).
- **Interventions (47 studies):** Odds of employment were 2.67× higher. Effective components were skills, self-presentation, self-efficacy, proactivity, goal setting, and social support. Programs worked only when they paired skill-building **with** motivation ([Liu, Huang & Wang 2014](https://pubmed.ncbi.nlm.nih.gov/24588365/)).
- **JOBS RCT (n = 1,801):** At 2 years, participants had higher reemployment and income and fewer depressive symptoms. Benefits were largest for low-mastery participants ([Vinokur et al. 2000](https://pubmed.ncbi.nlm.nih.gov/10658883)).
- **If-then plans:**
  - Implementation intentions mediated the step from intending to search to actually searching (N = 175 unemployed) ([van Hooft et al. 2005](https://repub.eur.nl/pub/1728)).
  - Across 94 tests, if-then plans had a d = .65 effect on goal attainment ([Gollwitzer & Sheeran 2006](https://www.socmot.uni-konstanz.de/sites/default/files/06_Gollwitzer_Sheeran_Implementation_Intentions_And_Goal.pdf)).
- **Learning goals:** In a field experiment, a learning-goal focus increased search behavior and reemployment probability ([van Hooft & Noordzij 2009](https://pubmed.ncbi.nlm.nih.gov/19916665)).
- **Search strategy:** Focused and exploratory strategies were associated with more job offers. Haphazard search is defined by trial and error with no clear standards ([Koen et al. 2010](https://jlupub.ub.uni-giessen.de/server/api/core/bitstreams/dee53a28-bbfe-4c3b-b2a9-1778218aa14b/content)).

**What this means for the product:** The app's prep loop (practice, mock, feedback) is already a learning-goal intervention, so lean into it. What's missing is the *motivation and planning* half: weekly if-then plans, effort tracking, and kinder handling of setbacks.

## Opportunities for Application Tracker

Context checked in code: `Application` has only `createdAt`/`updatedAt` and no stage history (`src/features/applications/schema.ts`). State persists via `redux-persist`. There is no notifications dependency in `package.json`.

| # | What to build | Why (evidence) | Impact | Effort | On-device fit |
|---|---|---|---|---|---|
| 1 | **"No reply yet" flag + one-tap follow-up.** Add `stageChangedAt` (with a persist migration). Flag Applied apps after 14 days with no activity, and Interviewing apps 7 days after the last interview step. Offer a Next Step "Send follow-up" with a short follow-up drafted on-device. | 52–61% ghosted ([Greenhouse](https://www.greenhouse.com/uk/blog/greenhouse-2024-state-of-job-hunting-report)); follow up after a week ([Accountemps](https://press.roberthalf.com/2017-11-20-Thank-You-Notes-Can-Tip-Scale-in-Job-Candidates-Favor-Yet-Few-Write-Them)) | High | M | Yes: local timestamps, on-device draft, user sends from their own mail |
| 2 | **Auto thank-you Next Step.** When an interview is scheduled (manually or via inbox triage), propose "Send thank-you" due the day after. The AI drafts it from the prep notes. | 80% of HR managers weigh it; only 24% of candidates send one ([Accountemps](https://press.roberthalf.com/2017-11-20-Thank-You-Notes-Can-Tip-Scale-in-Job-Candidates-Favor-Yet-Few-Write-Them)) | High | S | Yes |
| 3 | **Effort-based weekly progress on Home.** Example: "This week: 4 applied · 12 questions practiced · 1 mock." Show it alongside, not instead of, outcomes. | Perceived progress drives mood and next-day effort ([Wanberg 2010](https://bm.hkust.edu.hk/bizinsight/2011/01/insights-job-search-grind)); intensity predicts interviews ([van Hooft 2021](https://pubmed.ncbi.nlm.nih.gov/32658493/)) | High | S–M (needs a `practicedAt` timestamp) | Yes: local counts only |
| 4 | **Weekly if-then plan.** Example: "When Tue 9am, I'll apply to 2 roles on career sites." Plans become dated Next Steps. Optional local reminders. | d = .65 ([Gollwitzer & Sheeran](https://www.socmot.uni-konstanz.de/sites/default/files/06_Gollwitzer_Sheeran_Implementation_Intentions_And_Goal.pdf)); mediates search behavior ([van Hooft 2005](https://repub.eur.nl/pub/1728)); goal setting is an effective intervention component ([Liu 2014](https://pubmed.ncbi.nlm.nih.gov/24588365/)) | High | M without reminders, L with `expo-notifications` | Yes |
| 5 | **Kind rejection moment.** When a Stage becomes Rejected, show self-compassionate, base-rate copy (e.g. "most applications don't get a reply; this isn't a verdict on you"). Add one optional learning prompt saved to notes, plus an optional AI-drafted feedback request. | Self-compassion buffers lack of progress ([Kreemers 2018](https://pure.uva.nl/ws/files/22282603/1_s2.0_S0001879118300186_main.pdf)); 79% would reapply after feedback ([Greenhouse](https://www.greenhouse.com/blog/2024-greenhouse-candidate-experience-report)) | Med | S | Yes |
| 6 | **Source & referral field with a personal funnel.** The AI infers the source from the listing URL host (career site / ATS / board). Add a "referral?" toggle. Show the user's own interview rate per source. | Career sites 1.7× job boards; former employers ~2× ([Huntr](https://huntr.co/research/job-search-trends-q3-2026)); referrals and unsolicited contacts drive offers ([Faberman et al.](https://www.makro.rw.fau.de/files/2017/09/Mueller-et-al-Job-Search-Behavior-among-the-Employed-and-Non%E2%80%90Employed.pdf)) | Med | M | Yes: stats stay on device |
| 7 | **Timeline calibration hint.** Example: "Typical decision: ~3–4 weeks. You're on day 31." Show on the detail screen. Depends on #1's timestamp. | US average 23.8 days ([Glassdoor](http://www.prnewswire.com/news-releases/glassdoor-study-reveals-interview-process-getting-longer-averaging-about-24-days-across-25-countries-300501746.html)); uncertainty raises anxiety ([Greenhouse 79%](https://www.greenhouse.com/uk/blog/greenhouse-2024-state-of-job-hunting-report)) | Low–Med | S (after #1) | Yes: static benchmark |
