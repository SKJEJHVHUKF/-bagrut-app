// Ignore CSS imports so a component that imports a stylesheet can be rendered
// in Node. Only used by the _render-* probes.
require.extensions['.css'] = function () {};
