import dotProp from 'dot-prop';
import { print } from 'graphql';
import { extractDefinition } from './operation';
export function makeBreadcrumb(operation, options) {
    const attachBreadcrumbs = options.attachBreadcrumbs;
    const definition = extractDefinition(operation);
    const data = {};
    const uri = options.uri;
    if (uri) {
        data.url = uri;
    }
    const operationName = definition.name?.value;
    if (operationName) {
        data.operationName = operationName;
    }
    if (attachBreadcrumbs.includeQuery) {
        data.query =
            definition.loc?.source?.body ?? print(definition);
    }
    if (attachBreadcrumbs.includeVariables) {
        data.variables = operation.variables;
    }
    if (attachBreadcrumbs.includeCache) {
        data.cache =
            operation.getContext().cache?.data?.data ??
                undefined;
    }
    const contextKeys = attachBreadcrumbs.includeContext;
    if (contextKeys) {
        data.context = extractKeys(operation.getContext(), contextKeys);
    }
    return {
        type: 'http',
        category: `graphql.${definition.operation}`,
        data,
    };
}
function extractKeys(context, keys) {
    const result = {};
    keys.forEach((key) => {
        result[key] = dotProp.get(context, key);
    });
    return result;
}
