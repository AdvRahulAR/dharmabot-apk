/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/auth`; params?: Router.UnknownInputParams; } | { pathname: `/document-drafting`; params?: Router.UnknownInputParams; } | { pathname: `/find-lawyer`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/research`; params?: Router.UnknownInputParams; } | { pathname: `/voicenote`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/auth`; params?: Router.UnknownOutputParams; } | { pathname: `/document-drafting`; params?: Router.UnknownOutputParams; } | { pathname: `/find-lawyer`; params?: Router.UnknownOutputParams; } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/research`; params?: Router.UnknownOutputParams; } | { pathname: `/voicenote`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/auth${`?${string}` | `#${string}` | ''}` | `/document-drafting${`?${string}` | `#${string}` | ''}` | `/find-lawyer${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `/research${`?${string}` | `#${string}` | ''}` | `/voicenote${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/auth`; params?: Router.UnknownInputParams; } | { pathname: `/document-drafting`; params?: Router.UnknownInputParams; } | { pathname: `/find-lawyer`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/research`; params?: Router.UnknownInputParams; } | { pathname: `/voicenote`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; };
    }
  }
}
