import { ApolloLink, FetchResult, NextLink, Operation } from '@apollo/client/core';
import { Observable } from 'zen-observable-ts';
import { SentryLinkOptions } from './options';
export declare class SentryLink extends ApolloLink {
    private readonly options;
    constructor(options?: SentryLinkOptions);
    request(operation: Operation, forward: NextLink): Observable<FetchResult> | null;
}
