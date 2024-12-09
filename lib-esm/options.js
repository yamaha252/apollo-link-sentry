import deepMerge from 'deepmerge';
export const defaultOptions = {
    shouldHandleOperation: undefined,
    uri: undefined,
    setTransaction: true,
    setFingerprint: true,
    attachBreadcrumbs: {
        includeQuery: false,
        includeVariables: false,
        includeFetchResult: false,
        includeError: false,
        includeCache: false,
        includeContext: false,
        transform: undefined,
    },
};
export function withDefaults(options) {
    return deepMerge(defaultOptions, options);
}
