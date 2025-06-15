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
    "revision": "65f7dd76a586a2474bf413ba7fe65b6d"
  }, {
    "url": "/_next/build-manifest.json",
    "revision": "9cb6afb2be56767e85f623122637a919"
  }, {
    "url": "/_next/react-loadable-manifest.json",
    "revision": "3ac0ba1724dd05999e4eea6afc29cf1f"
  }, {
    "url": "/_next/server/app/_not-found/page_client-reference-manifest.js",
    "revision": "93ce38d88fa719f6b70645048510fd0c"
  }, {
    "url": "/_next/server/app/dashboard/page_client-reference-manifest.js",
    "revision": "66e5210dd9d399341dc8e59d58a8bdbd"
  }, {
    "url": "/_next/server/app/reverse-interview/page_client-reference-manifest.js",
    "revision": "a23a0f0487b6de09133e1964f803eff1"
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
    "revision": "34d77237be829c88ceac9b50ab53ace3"
  }, {
    "url": "/_next/static/chunks/_app-pages-browser_node_modules_clerk_nextjs_dist_esm_app-router_keyless-actions_js.js",
    "revision": "77f8d6abbf69c96cbfb64e389a604df1"
  }, {
    "url": "/_next/static/chunks/app-pages-internals.js",
    "revision": "31db7eadef488b8c4b2cb2c616900540"
  }, {
    "url": "/_next/static/chunks/app/_not-found/page.js",
    "revision": "6bd2a7dc3bad43413e14d23318e23a45"
  }, {
    "url": "/_next/static/chunks/app/layout.js",
    "revision": "aea7e7e599d504fccf4bc9c6b1715348"
  }, {
    "url": "/_next/static/chunks/polyfills.js",
    "revision": "846118c33b2c0e922d7b3a7676f81f6f"
  }, {
    "url": "/_next/static/chunks/webpack.js",
    "revision": "46407250b3d0f2ed970b74a7702855a9"
  }, {
    "url": "/_next/static/css/app/layout.css",
    "revision": "338767bdf6d4929087b23fd0efc1bdf2"
  }, {
    "url": "/_next/static/development/_buildManifest.js",
    "revision": "4d0d8cbc8169bdf91cc559eaf46d2784"
  }, {
    "url": "/_next/static/development/_ssgManifest.js",
    "revision": "abee47769bf307639ace4945f9cfd4ff"
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
