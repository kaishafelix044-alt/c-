import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  optimizeDeps: { include: ['mathjs'] },
  plugins: [{
    name: 'bundled-content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [{
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; worker-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'",
        },
        injectTo: 'head-prepend',
      }];
    },
  }],
});
