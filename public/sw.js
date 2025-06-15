/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-c008c882'], (function (workbox) { 'use strict';

  importScripts();
  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "/_next/app-build-manifest.json",
    "revision": "e94aa09d51b42d2e9d929139d805e77f"
  }, {
    "url": "/_next/build-manifest.json",
    "revision": "9cb6afb2be56767e85f623122637a919"
  }, {
    "url": "/_next/react-loadable-manifest.json",
    "revision": "3ac0ba1724dd05999e4eea6afc29cf1f"
  }, {
    "url": "/_next/server/app/learn/page_client-reference-manifest.js",
    "revision": "f4f878a20af9df239d843325dbc58166"
  }, {
    "url": "/_next/server/app/mindmap/page_client-reference-manifest.js",
    "revision": "ad18a2582db3204b24ff404a114a24d8"
  }, {
    "url": "/_next/server/app/page_client-reference-manifest.js",
    "revision": "48d0918c9138904bba4048231f2d9bad"
  }, {
    "url": "/_next/server/middleware-build-manifest.js",
    "revision": "bbc5b5443a06ed383d19c7d003e8bd5f"
  }, {
    "url": "/_next/server/middleware-react-loadable-manifest.js",
    "revision": "b81ff2f6cb8d36bfd484ff743898f317"
  }, {
    "url": "/_next/server/next-font-manifest.js",
    "revision": "f7097bf7c93c1cbb4c118491ca6d2b04"
  }, {
    "url": "/_next/server/next-font-manifest.json",
    "revision": "d51420cd4aa5d37d6719849cf36d0d6f"
  }, {
    "url": "/_next/static/chunks/_app-pages-browser_node_modules_clerk_nextjs_dist_esm_app-router_client_keyless-creator-reader_js.js",
    "revision": "afeee516184a3692acee5008e80a6c7d"
  }, {
    "url": "/_next/static/chunks/_app-pages-browser_node_modules_clerk_nextjs_dist_esm_app-router_keyless-actions_js.js",
    "revision": "3bc54e21f97002f7cae61bf4c6dadf17"
  }, {
    "url": "/_next/static/chunks/app-pages-internals.js",
    "revision": "d26c17802f4a993a8066c284acf0314a"
  }, {
    "url": "/_next/static/chunks/app/layout.js",
    "revision": "3e88835de0b6e63653d45327d25e5251"
  }, {
    "url": "/_next/static/chunks/polyfills.js",
    "revision": "846118c33b2c0e922d7b3a7676f81f6f"
  }, {
    "url": "/_next/static/chunks/webpack.js",
    "revision": "d3911d717720d0e7400cb261419ae064"
  }, {
    "url": "/_next/static/css/app/layout.css",
    "revision": "2ed0df4f39511125f2147e8bc6761fdb"
  }, {
    "url": "/_next/static/css/app/mindmap/page.css",
    "revision": "292a142a8c4bb0e0e1270dc6de901ddd"
  }, {
    "url": "/_next/static/development/_buildManifest.js",
    "revision": "4d0d8cbc8169bdf91cc559eaf46d2784"
  }, {
    "url": "/_next/static/development/_ssgManifest.js",
    "revision": "abee47769bf307639ace4945f9cfd4ff"
  }, {
    "url": "/_next/static/webpack/288ddef4d40aa90c.webpack.hot-update.json",
    "revision": "development"
  }, {
    "url": "/_next/static/webpack/app/layout.288ddef4d40aa90c.hot-update.js",
    "revision": "development"
  }, {
    "url": "/_next/static/webpack/webpack.288ddef4d40aa90c.hot-update.js",
    "revision": "development"
  }], {
    "ignoreURLParametersMatching": [/ts/]
  });
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute("/", new workbox.NetworkFirst({
    "cacheName": "start-url",
    plugins: [{
      cacheWillUpdate: async ({
        request,
        response,
        event,
        state
      }) => {
        if (response && response.type === 'opaqueredirect') {
          return new Response(response.body, {
            status: 200,
            statusText: 'OK',
            headers: response.headers
          });
        }
        return response;
      }
    }]
  }), 'GET');
  workbox.registerRoute(/.*/i, new workbox.NetworkOnly({
    "cacheName": "dev",
    plugins: []
  }), 'GET');

}));
//# sourceMappingURL=sw.js.map
