import { ApolloError, ApolloLink, } from '@apollo/client/core';
import { Observable } from 'zen-observable-ts';
import { makeBreadcrumb } from './breadcrumb';
import { withDefaults } from './options';
import { attachBreadcrumbToSentry, setFingerprint, setTransaction, } from './sentry';
export class SentryLink extends ApolloLink {
    options;
    constructor(options = {}) {
        super();
        this.options = withDefaults(options);
    }
    request(operation, forward) {
        const options = this.options;
        if (!(options.shouldHandleOperation?.(operation) ?? true)) {
            return forward(operation);
        }
        if (options.setTransaction) {
            setTransaction(operation);
        }
        if (options.setFingerprint) {
            setFingerprint(operation);
        }
        const attachBreadcrumbs = options.attachBreadcrumbs;
        const breadcrumb = attachBreadcrumbs
            ? makeBreadcrumb(operation, options)
            : undefined;
        return new Observable((originalObserver) => {
            const subscription = forward(operation).subscribe({
                next: (result) => {
                    if (attachBreadcrumbs) {
                        breadcrumb.level = severityForResult(result);
                        if (attachBreadcrumbs.includeFetchResult) {
                            breadcrumb.data.fetchResult = result;
                        }
                        if (attachBreadcrumbs.includeError &&
                            result.errors &&
                            result.errors.length > 0) {
                            breadcrumb.data.error = new ApolloError({
                                graphQLErrors: result.errors,
                            });
                        }
                        attachBreadcrumbToSentry(operation, breadcrumb, options);
                    }
                    originalObserver.next(result);
                },
                complete: () => {
                    originalObserver.complete();
                },
                error: (error) => {
                    if (attachBreadcrumbs) {
                        breadcrumb.level = 'error';
                        let scrubbedError;
                        if (isServerError(error)) {
                            const { result, response, ...rest } = error;
                            scrubbedError = rest;
                            if (attachBreadcrumbs.includeFetchResult) {
                                breadcrumb.data.fetchResult = result;
                            }
                        }
                        else {
                            scrubbedError = error;
                        }
                        if (attachBreadcrumbs.includeError) {
                            breadcrumb.data.error = scrubbedError;
                        }
                        attachBreadcrumbToSentry(operation, breadcrumb, options);
                    }
                    originalObserver.error(error);
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    }
}
function isServerError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        'result' in error &&
        'statusCode' in error);
}
function severityForResult(result) {
    return result.errors && result.errors.length > 0 ? 'error' : 'info';
}
