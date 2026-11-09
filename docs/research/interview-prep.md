# Interview prep: what works, how the tools do it

Researched 2026-11-08. Every claim links to its source. **[INFERENCE]** marks my reasoning, not a source.

## 1. What interviewers actually score

- **Structured interviews are the most valid common predictor.** Mean operational validity is .42, against .19 for unstructured interviews. The spread is wide: the 80% credibility interval runs .18–.66 ([Sackett et al. 2023, Table 1](https://static1.squarespace.com/static/5dd4c2c45ccc387bd8ffb210/t/64fc6585cdab061b3887be16/1694262661826/Revisiting_the_design_of_selection_systems_in_light_of_new_findings_regarding_the_validity_of_widely_used_predictors.pdf), summarizing [Sackett et al. 2022](https://pubmed.ncbi.nlm.nih.gov/34968080/)).
- **Google** asks every candidate the same questions. It scores answers against rubrics that describe *poor, borderline, solid, and outstanding* answers. The attributes are role-related knowledge, problem solving, and leadership. Questions are **behavioral** ("Tell me about a time…") or **hypothetical** ("Imagine…"), each with **predetermined follow-ups** ([re:Work](https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices)).
- **OPM:** highly structured interviews use the same lead and **probe** questions for everyone and score answers against proficiency benchmarks. Behavioral questions show higher validity for complex professional work ([OPM](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews)).
- **SHRM (Aug 2026):** rating scales should be anchored to observable, job-related behavior, with examples of poor, acceptable, and excellent answers. It warns about halo and similarity bias ([SHRM](https://www.shrm.org/topics-tools/news/talent-acquisition/build-consistent-hiring-decisions-with-job-interview-rating-scal)).
- [INFERENCE] Practice should mirror this scoring: questions aimed at a competency, follow-up probes, and rubric-level feedback. A made-up 0–100 score doesn't match how answers are judged.

## 2. STAR and answer structure

- DDI introduced STAR in 1974 as part of Targeted Selection: Situation/Task, Action, Result. Its advice is to "focus on what *they* did — not their team or what they 'would' do," and to ask follow-ups when a part is missing ([DDI](https://www.ddi.com/solutions/behavioral-interviewing/star-method)).
- **Field evidence on structure:** Maurer et al. studied 213 police and fire promotion candidates. Coaching and specific preparation (study groups, role-play) predicted interview performance. Part of the effect ran through **better-organized answers** ([Maurer 2001](https://pubmed.ncbi.nlm.nih.gov/11519654); earlier study: [Maurer 1998](https://pubmed.ncbi.nlm.nih.gov/9494444)). Both studies are correlational and limited to public-safety jobs.
- I found no randomized trial showing that STAR itself raises offer rates.

## 3. Learning science, applied to interview prep

| Finding | Source | Use in prep [INFERENCE] |
|---|---|---|
| Retrieval beats restudy at 2-day and 1-week delays. Restudy *felt* more effective to students. | [Roediger & Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066) | Answer first, then see the model answer. Rereading a list of questions doesn't count as practice. |
| Practice testing and distributed practice rate "high utility." Rereading and highlighting rate low. | [Dunlosky et al. 2013](https://pubmed.ncbi.nlm.nih.gov/26173288) | A one-time "practiced ✓" checkbox wastes the spacing benefit. |
| The best review gap is about 20–40% of a 1-week retention interval. | [Cepeda et al. 2008](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2008.02209.x) | Interview in 7 days: re-practice around day 2, then the day before. |
| Deliberate practice explains 26% of performance variance in games, 4% in education, and under 1% in professions. | [Macnamara et al. 2014](https://pubmed.ncbi.nlm.nih.gov/24986855) | Feedback loops help, but don't promise big gains. |
| Interview anxiety correlates r = −.19 with interview performance. | [Powell et al. 2018](https://doi.org/10.1037/cbs0000108) | Realistic, repeated rehearsal is a plausible lever, but untested. |

## 4. Company research and questions to ask

- In a survey of 1,000+ senior managers, 38% named "little or no knowledge of the company" as candidates' most common interview mistake ([Accountemps 2011](https://www.prnewswire.com/news-releases/accountemps-survey-managers-cite-lack-of-knowledge-about-the-company-as-biggest-interview-mistake-124274784.html)). The survey is old and comes from a staffing firm.
- People who ask more questions, especially **follow-up questions**, are liked more. People don't expect this effect ([Huang et al. 2017](https://pubmed.ncbi.nlm.nih.gov/28447835)). The studies used chat and speed-dating, not interviews, so applying it to interviews is [INFERENCE].
- Anthropic's candidate guidance *encourages* AI for researching the company, practicing answers, and preparing questions. It says live interviews are "all you": no AI unless allowed ([Anthropic](https://www.anthropic.com/candidate-ai-guidance)).

## 5. Voice vs text practice

- **Speaking aloud:** saying words aloud improves memory compared with silent reading (the "production effect"). The effect is narrow: recognition memory, mixed lists ([MacLeod et al. 2010](https://pubmed.ncbi.nlm.nih.gov/20438265)). Students who rehearsed speeches before an audience got higher delivery ratings ([Smith, Miami U. thesis](https://etd.ohiolink.edu/acprod/odb_etd/ws/send_file/send?accession=miami1058484247&disposition=inline); published as [Smith & Frymier 2006](https://www.tandfonline.com/doi/abs/10.1080/01463370500270538)). That evidence is correlational.
- **Filler words:** listeners assume "um" signals anxiety or poor preparation. Speech with no pauses rated best, but filled pauses beat *silent* pauses ([Christenfeld 1995](https://old.filledpause.org/references/Christenfeld_95.htm)). [INFERENCE] Coach shorter, planned answers instead of "zero ums."
- **Pace:** Yoodli cites 115–180 words per minute as conversational pace. This is a vendor blog with no source ([Yoodli](https://yoodli.ai/blog/yoodli-weekly-tip-slow-down)).
- **Speech-recognition caveat:** speech-to-text engines often strip "uh/um" by default; Deepgram does unless you opt in ([Deepgram](https://developers.deepgram.com/docs/filler-words)). Apple doesn't document how it handles fillers. [INFERENCE] Filler counts from Apple transcripts may be unreliable; test on a device before showing them.

## 6. How leading tools work

| Tool | Practice | Feedback | Price | Privacy |
|---|---|---|---|---|
| **Google Interview Warmup** | Speak or type, transcribed live | Job-related terms, most-used words, talking points; "don't 'grade' your answer." Expert-written questions, not AI-generated | Free | "We don't save your audio or the transcripts" ([archived Mar 2026](https://web.archive.org/web/20260305072254/https://grow.google/interview-warmup)). **Retired:** the URL now redirects to a generic article, and the tool URL returns 404 (checked 2026-11-08) |
| **Big Interview** | Recorded video answers; Answer Builder | VideoAI medal (gold 76–100). Rate, tone, filler and "power" words; clarity, role alignment, confidence; lighting. Answers must be ≥30 s; scored after upload ([help](https://support.biginterview.com/en/article/videoai-feedback-9vhrsb/)) | $39/mo, $99/3 mo, $299 lifetime ([pricing](https://www.biginterview.com/pricing/personal)) | Cloud upload; VideoAI is enabled per institution |
| **Yoodli** | AI interviewer asks preset questions plus dynamic follow-ups ([help](https://support.yoodli.ai/en/articles/9550465-practice-with-yoodli)) | Pacing, filler words; body language via camera | Starter: 5 lifetime sessions; Pro $8/mo, Advanced $20/mo, billed annually ([pricing](https://yoodli.ai/pricing)) | Starter/Pro session data "may be used to improve the platform"; excluded from AI training on Advanced and up |
| **Aced** (was Exponent; runs Pramp) | AI interviewer; free peer mocks (Pramp sessions moved to Aced in July 2024: [pramp.com](https://www.pramp.com/)) | Rubric scores: structure, communication, depth ([aced.io](https://www.aced.io/)) | Vendor page hides prices (rendered by JavaScript). Third parties report Pro at $79/mo or $12/mo annually ([unverified](https://copilotinterview.com/blog/exponent-pricing)) | Cloud |
| **Final Round AI** | Practice, plus a **live in-interview copilot** "hidden from screen sharing" | Automatic debrief | Pro $25+/mo; macOS/Windows ([site](https://www.finalroundai.com/)) | Cloud; SOC 2 badges. Conflicts with employer rules on AI in live interviews (see §4) |

[INFERENCE] Every remaining tool processes voice or video in the cloud. The only one that promised not to store answers (Warmup) is gone. A private, on-device voice practice tool fills that gap.

## 7. Can voice practice run fully on-device on iOS?

**Yes, on iOS 26+, with libraries this repo already has.**

1. **Apple SpeechAnalyzer + SpeechTranscriber (iOS 26+):** Apple's new on-device model, built for long, conversational audio. It returns quick draft results that are later replaced by final ones. Apple: "we wanted to keep speech private. Our new, on-device model achieves all of that" ([WWDC25 session 277](https://developer.apple.com/videos/play/wwdc2025/277/)). Check `isAvailable` first; `DictationTranscriber` covers older devices ([SpeechTranscriber](https://developer.apple.com/documentation/speech/speechtranscriber), [DictationTranscriber](https://developer.apple.com/documentation/speech/dictationtranscriber)).
2. **`@react-native-ai/apple` is already a dependency (0.12.0, the latest on npm).** I checked `node_modules`: `apple.transcriptionModel()` wraps SpeechTranscriber. It takes a complete recording and returns segments with start and end seconds, plus the total duration. `prepare()` downloads the language model. The package's `main` branch adds `transcribeStream` (iOS 26), `transcribeLive` (iOS 27), per-word timings, and `getModelInfo` ([docs](https://www.react-native-ai.dev/docs/apple/transcription)). Those changes are unreleased as of 2026-11-08 and remove `isAvailable` (breaking).
3. **Recorder:** `expo-audio` provides `useAudioRecorder(RecordingPresets.HIGH_QUALITY)`, which saves an `.m4a` file; the microphone permission is set through its config plugin ([Expo docs](https://docs.expo.dev/versions/latest/sdk/audio/)). It isn't installed yet and needs a native rebuild.
4. **Avoid `expo-speech-recognition` for this.** Version 58.0.1 supports Expo 58, but its iOS engine is the older `SFSpeechRecognizer` ([source](https://github.com/jamsch/expo-speech-recognition/blob/main/ios/ExpoSpeechRecognizer.swift)). Open [issue #169](https://github.com/jamsch/expo-speech-recognition/issues/169) reports a silent fallback to network recognition, which breaks the privacy promise.
5. **Context budget:** Apple's on-device model allows 4,096 tokens per session ([TN3193](https://developer.apple.com/documentation/technotes/tn3193-managing-the-on-device-foundation-model-s-context-window)). [INFERENCE] A 2-minute answer is about 300 words, roughly 400 tokens, which fits.

## Opportunities for Application Tracker

| # | What to build | Why | Impact | Effort | On-device fit |
|---|---|---|---|---|---|
| 1 | **STAR check + rubric level per answer.** Add flat booleans (`hasSituation`, `hasAction`, `hasResult`) and a level (borderline/solid/outstanding) to `MockInterviewTurnOutputSchema`. Code-side checks: "I" vs "we" count, whether the Result has a number. | [DDI](https://www.ddi.com/solutions/behavioral-interviewing/star-method), [re:Work rubrics](https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices), [Maurer 2001](https://pubmed.ncbi.nlm.nih.gov/11519654) | High | S | Yes; flat schema only (nested schemas hang on device) |
| 2 | **One follow-up probe per question** ("What did *you* do?", "How did you measure it?") before moving on, based on the gaps in the answer | [re:Work](https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices), [OPM](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews), [Yoodli](https://support.yoodli.ai/en/articles/9550465-practice-with-yoodli) | High | S | Yes |
| 3 | **Answer first, then reveal; spaced re-practice.** Replace `practiced: boolean` with a log of attempts. Mark questions "due again" at about 25% of the days left before the interview. Hide `strongerAnswer` until the user has answered. | [Roediger 2006](https://pubmed.ncbi.nlm.nih.gov/16507066), [Cepeda 2008](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2008.02209.x), [Dunlosky 2013](https://pubmed.ncbi.nlm.nih.gov/26173288) | High | M | Yes |
| 4 | **Speak your answer in Mock interview:** record with `expo-audio`, transcribe with the installed `apple.transcriptionModel()`, delete the audio after transcription. Text stays as the fallback, and Android stays gated off. | [WWDC25](https://developer.apple.com/videos/play/wwdc2025/277/), [RN AI docs](https://www.react-native-ai.dev/docs/apple/transcription), [Smith & Frymier](https://www.tandfonline.com/doi/abs/10.1080/01463370500270538), Warmup's retirement | High | L | Yes; a "nothing leaves your phone" claim no competitor makes |
| 5 | **Delivery stats from the timings** (after #4): answer length, words per minute, long pauses. No filler count until it's verified on a device. | [Big Interview](https://support.biginterview.com/en/article/videoai-feedback-9vhrsb/), [Yoodli pace](https://yoodli.ai/blog/yoodli-weekly-tip-slow-down), [Deepgram caveat](https://developers.deepgram.com/docs/filler-words) | Med | S | Yes; computed in code, no model call |
| 6 | **Company brief + better "Questions to ask":** paste an About page or news → 3 facts, each tied to a question to ask plus one suggested follow-up. Never fetched automatically. | [Accountemps](https://www.prnewswire.com/news-releases/accountemps-survey-managers-cite-lack-of-knowledge-about-the-company-as-biggest-interview-mistake-124274784.html), [Huang 2017](https://pubmed.ncbi.nlm.nih.gov/28447835), [Anthropic](https://www.anthropic.com/candidate-ai-guidance) | Med | M | Yes; follows the existing paste-only pattern |
| 7 | **Story bank:** save strong STAR answers as reusable stories, link them to questions across applications, and suggest a story when a similar question comes up | [Maurer 2001](https://pubmed.ncbi.nlm.nih.gov/11519654) (prep and organized answers) | Med | L | Yes |

**Non-goal:** a live in-interview copilot like Final Round AI. Employers forbid it ([Anthropic](https://www.anthropic.com/candidate-ai-guidance)), and it undercuts the product's "practice" framing.
