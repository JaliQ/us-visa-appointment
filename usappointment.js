const puppeteer = require('puppeteer');
const parseArgs = require('minimist');
const axios = require('axios');

(async () => {
  //#region Command line args
  const args = parseArgs(process.argv.slice(2), { string: ['u', 'p', 'c', 'a', 'n', 'd', 'r'], boolean: ['g'] });
  const currentDate = new Date(args.d);
  const usernameInput = args.u;
  const passwordInput = args.p;
  const appointmentId = args.a;
  const consularId = args.c;
  const userToken = args.n;
  const region = args.r;
  //#endregion

  //#region Helper functions
  async function waitForSelectors(selectors, frame, options) {
    for (const selector of selectors) {
      try {
        return await waitForSelector(selector, frame, options);
      } catch (err) { }
    }
    throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
  }

  async function scrollIntoViewIfNeeded(element, timeout) {
    await waitForConnected(element, timeout);
    const isInViewport = await element.isIntersectingViewport({ threshold: 0 });
    if (isInViewport) {
      return;
    }
    await element.evaluate(element => {
      element.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'auto',
      });
    });
    await waitForInViewport(element, timeout);
  }

  async function waitForConnected(element, timeout) {
    await waitForFunction(async () => {
      return await element.getProperty('isConnected');
    }, timeout);
  }

  async function waitForInViewport(element, timeout) {
    await waitForFunction(async () => {
      return await element.isIntersectingViewport({ threshold: 0 });
    }, timeout);
  }

  async function waitForSelector(selector, frame, options) {
    if (!Array.isArray(selector)) {
      selector = [selector];
    }
    if (!selector.length) {
      throw new Error('Empty selector provided to waitForSelector');
    }
    let element = null;
    for (let i = 0; i < selector.length; i++) {
      const part = selector[i];
      if (element) {
        element = await element.waitForSelector(part, options);
      } else {
        element = await frame.waitForSelector(part, options);
      }
      if (!element) {
        throw new Error('Could not find element: ' + selector.join('>>'));
      }
      if (i < selector.length - 1) {
        element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
      }
    }
    if (!element) {
      throw new Error('Could not find element: ' + selector.join('|'));
    }
    return element;
  }

  async function waitForFunction(fn, timeout) {
    let isActive = true;
    setTimeout(() => {
      isActive = false;
    }, timeout);
    while (isActive) {
      const result = await fn();
      if (result) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Timed out');
  }

  async function sleep(timeout) {
    return await new Promise(resolve => setTimeout(resolve, timeout));
  }

  async function log(msg) {
    const currentDate = '[' + new Date().toLocaleString() + ']';
    console.log(currentDate, msg);
  }

  async function notify(msg, agent) {
    log(msg);

    if (!userToken) {
      return;
    }

    const pushOverAppToken = userToken;
    const apiEndpoint = 'https://api.pushbullet.com/v2/pushes';
    const headers = {
      "Access-Token": pushOverAppToken,
      "User-Agent": agent
    }
    const data = {
      title: "US Visa Appointment Notification",
      type: "note",
      body: msg
    };

    await axios.post(apiEndpoint, data, {
      headers: headers
    });
  }
  //#endregion

  async function runLogic() {
    log("Initializing Puppeteer...");

    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Script timed out. Terminating...'));
      }, 60000);
    });

    try {
      //#region Init puppeteer
      const browser = await puppeteer.launch();
      const agent = await browser.userAgent();
      // Comment above line and uncomment following line to see puppeteer in action
      //const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      const timeout = 5000;
      const navigationTimeout = 60000;
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(navigationTimeout);
      //#endregion
      await Promise.race([timeoutPromise, runPuppeteerLogic(browser, page)]);

      async function runPuppeteerLogic(browser, page) {
        log("Puppeteer initialized.");

        //#region Logic

        // Set the viewport to avoid elements changing places
        {
          const targetPage = page;
          await targetPage.setViewport({ "width": 2078, "height": 1479 });
          log("Viewport set.");
        }

        // Go to login page
        {
          const targetPage = page;
          await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/users/sign_in', { waitUntil: 'domcontentloaded' });
          log("Navigated to login page.");
        }

        // Click on username input
        {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Email *"], ["#user_email"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 118, y: 21.453125 } });
          log("Username input clicked.");
        }

        // Type username
        {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Email *"], ["#user_email"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          const type = await element.evaluate(el => el.type);
          if (["textarea", "select-one", "text", "url", "tel", "search", "password", "number", "email"].includes(type)) {
            await element.type(usernameInput);
          } else {
            await element.focus();
            await element.evaluate((el, value) => {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, usernameInput);
          }
          log("Username typed.");
        }

        // Hit tab to go to the password input
        {
          const targetPage = page;
          await targetPage.keyboard.down("Tab");
        }
        {
          const targetPage = page;
          await targetPage.keyboard.up("Tab");
          log("Tabbed to password input.");
        }

        // Type password
        {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Password"], ["#user_password"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          const type = await element.evaluate(el => el.type);
          if (["textarea", "select-one", "text", "url", "tel", "search", "password", "number", "email"].includes(type)) {
            await element.type(passwordInput);
          } else {
            await element.focus();
            await element.evaluate((el, value) => {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, passwordInput);
          }
          log("Password typed.");
        }

        // Tick the checkbox for agreement
        {
          const targetPage = page;
          const element = await waitForSelectors([["#sign_in_form > div.radio-checkbox-group.margin-top-30 > label > div"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 9, y: 16.34375 } });
          log("Agreement checkbox ticked.");
        }

        // Click login button
        {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Sign In[role=\"button\"]"], ["#new_user > p:nth-child(9) > input"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 34, y: 11.34375 } });
          await targetPage.waitForNavigation();
          log("Login button clicked. Navigating...");
        }

        // We are logged in now. Check available dates from the API
        {
          log("Fetching available dates...");
          const cookies = await page.cookies();
          const filteredCookies = cookies.filter(cookie => cookie.name === '_yatri_session');
          const targetPage = page;
          const response = await axios.get(`https://ais.usvisa-info.com/en-${region}/niv/schedule/${appointmentId}/appointment/days/${consularId}.json?appointments[expedite]=false`, {
            headers: {
              'Accept': 'application/json, text/javascript, */*; q=0.01',
              'Accept-Encoding': 'gzip, deflate, br, zstd',
              'Accept-Language': 'en-US,en;q=0.9',
              'Connection': 'keep-alive',
              'Cookie': filteredCookies.map(cookie => `${cookie.name}=${cookie.value}`)[0],
              'Host': 'ais.usvisa-info.com',
              'Referer': `https://ais.usvisa-info.com/en-${region}/niv/schedule/${appointmentId}/appointment`,
              'User-Agent': `${agent}`,
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          const availableDates = response.data;
          //If a status code of response is 304 than data is cached in the browser, pull it 

          if (availableDates.length <= 0) {
            log("There are no available dates for consulate with id " + consularId);
            await browser.close();
            return false;
          }

          const firstDate = new Date(availableDates[0].date);

          log(`There are available dates. Your current date is ${currentDate}. The first available date is ${firstDate}`)

          if (firstDate < currentDate) {
            log("There is an earlier date available for the appointment! " + firstDate.toDateString());
            await notify("There is an earlier date available for the appointment! " + firstDate.toDateString(), agent);
          } else {
            log("No earlier date available yet. First available date: " + firstDate.toDateString());
          }
        }

        //#endregion

        await browser.close();
      }
    } catch (error) {
      console.error(error);

    }

  }

  await runLogic()
  process.exit()
})();
