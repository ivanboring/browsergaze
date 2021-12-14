const webdriver = require('selenium-webdriver');
const fs = require('fs');

(async function example() {
    let driver = new webdriver.Builder()
    .withCapabilities({
        'platform': 'windows 10',
        'browserName': 'opera',
    })
    .usingServer('http://192.168.178.26:4444/wd/hub')
    .build();
  try {
    await driver.get('http://www.google.com/ncr');
    let image = await driver.takeScreenshot();
    fs.writeFileSync('/home/marcus/Documents/out.png', image, 'base64');
  } catch(e) {
      console.log(e)
  } finally {
    await driver.quit();
  }
})();