const { execSync } = require('child_process');
console.log("Installing puppeteer-core...");
execSync('npm install puppeteer-core --no-save', { stdio: 'inherit' });
const puppeteer = require('puppeteer-core');

(async () => {
  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      defaultViewport: { width: 390, height: 844 } // 模拟手机屏幕
    });
    const page = await browser.newPage();
    
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/echoes_phone/');
    await page.waitForTimeout(1000);
    
    console.log("Clicking '直接进入'...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const enter = btns.find(b => b.innerText.includes('直接进入'));
      if (enter) enter.click();
    });
    await page.waitForTimeout(1000);

    console.log("Clicking '通讯'...");
    await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const nav = all.reverse().find(el => el.innerText === '通讯' && el.tagName !== 'SCRIPT');
      if (nav) nav.click();
    });
    await page.waitForTimeout(1000);

    console.log("Clicking the '+' button...");
    await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg.lucide-plus');
      if(svgs.length > 0) {
        const btn = svgs[0].closest('button');
        if (btn) btn.click();
      } else {
        // Fallback: click the last button in the input bar
        const btns = document.querySelectorAll('button');
        btns[btns.length - 1].click();
      }
    });
    await page.waitForTimeout(1000);

    console.log("Clicking '表情'...");
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, span, div'));
      const emoji = elements.find(b => b.innerText && b.innerText.trim() === '表情');
      if (emoji) emoji.click();
    });
    await page.waitForTimeout(1500); // 等待动画展开

    console.log("Taking screenshot...");
    await page.screenshot({ path: 'C:\\Users\\bichenxi\\echoes_phone\\actual_screen.png' });
    await browser.close();
    console.log("Screenshot saved to actual_screen.png!");
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
})();
