import { test, expect } from '@playwright/test';
test('scientific, algebra, memory and persistent history work together',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Mathematical expression').fill('sin(30)');
  await page.getByLabel('Mathematical expression').press('Enter');
  await expect(page.locator('#result')).toHaveText('0.5');
  await page.getByRole('button',{name:'MS',exact:true}).click();
  await page.getByRole('button',{name:'C',exact:true}).click();
  await page.getByRole('button',{name:'MR',exact:true}).click();
  await page.locator('#expression').press('Enter');
  await expect(page.locator('#result')).toHaveText('0.5');
  await page.getByRole('button',{name:'Algebra',exact:true}).click();
  await page.getByLabel('Mathematical expression').fill('x^3 + sin(x)');
  await page.getByRole('combobox',{name:'Operation',exact:true}).selectOption('derivative');
  await page.locator('#algebra-run').click();
  await expect(page.locator('#result')).toHaveText('3 * x ^ 2 + cos(x)');
  await page.reload();
  await expect(page.locator('.history-item')).toHaveCount(3);
  await page.locator('.history-item').first().click();
  await expect(page.locator('#mode-title')).toHaveText('Algebra workspace');
  await expect(page.locator('#operation')).toHaveValue('derivative');
  await page.getByRole('button',{name:'Clear history',exact:true}).click();
  await expect(page.locator('.history-item')).toHaveCount(0);
});
test('errors, angle controls, theme and help remain usable',async({page})=>{
  await page.goto('/');
  await page.locator('#expression').fill('1/0');await page.locator('#expression').press('Enter');
  await expect(page.locator('#error')).toContainText('undefined');
  await page.getByRole('button',{name:'RAD',exact:true}).click();
  await page.locator('#expression').fill('sin(pi/2)');await page.locator('#expression').press('Enter');
  await expect(page.locator('#result')).toHaveText('1');
  await expect(page.locator('#error')).toBeEmpty();
  await page.getByRole('button',{name:'Toggle dark theme'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.getByRole('button',{name:'Open calculator help'}).click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('dialog')).not.toBeVisible();
});
test('desktop and mobile layouts fit the viewport',async({page})=>{
  await page.goto('/');
  for(const [width,height] of [[1440,1100],[375,812],[812,375]]){
    await page.setViewportSize({width,height});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
    await expect(page.locator('[data-key="="]')).toBeVisible();
  }
  await page.setViewportSize({width:1440,height:1100});
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:'test-results/mobile.png',fullPage:true});
});
