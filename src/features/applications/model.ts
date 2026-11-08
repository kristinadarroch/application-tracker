/**
 * The applications domain without any UI: schemas, slice actions, and selectors.
 *
 * Other features' non-UI code (slices, selectors, thunks, schemas, API calls) and
 * intake's review screen import this instead of the barrel. The barrel also exports
 * the pipeline screens, which render intake's DraftsBanner, so going through it from
 * intake (or from any reducer the store loads) would close an import cycle.
 */
export { ApplicationInputSchema, NextStepInputSchema } from './schema';
export type { Application, ApplicationFormValues, ApplicationInput, NextStepInput } from './schema';
export {
  applicationAdded,
  applicationRemoved,
  applicationSaved,
  applicationsAdapter,
  nextStepAdded,
  nextStepRemoved,
  nextStepToggled,
  stageChanged,
} from './slice';
export { selectAllApplications, selectApplicationById } from './selectors';
