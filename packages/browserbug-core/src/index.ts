export * from './parser/parser.js';
export { getBrowserSupportStatus } from './getBrowserSupportStatus.js';
export {
  getLastCheckedStatus,
  type LastCheckedStatus,
} from './getLastCheckedStatus.js';
export {
  getWebFeatureSupportStatus,
  browserslistToWebFeaturesBrowser,
  type WebFeatureBlocker,
  type WebFeatureSupportStatus,
} from './getWebFeatureSupportStatus.js';
export { webFeatures } from './webFeaturesData.js';
export {
  getVersionDriftStatus,
  isValidVersionDrift,
  type ReleasedVersionsData,
  type VersionDriftStatus,
} from './versionDrift.js';
