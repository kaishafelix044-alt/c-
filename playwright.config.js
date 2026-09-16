import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',
  use:{baseURL:'http://127.0.0.1:5174',headless:true,channel:'msedge'},
  webServer:{command:'npm.cmd run dev -- --port 5174 --strictPort',url:'http://127.0.0.1:5174',reuseExistingServer:!process.env.CI},
});
