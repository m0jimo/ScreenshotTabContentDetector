// Hooks added here have a bridge allowing communication between the BEX Background Script and the BEX Content Script.
// Note: Events sent from this background script using `bridge.send` can be `listen`'d for by all client BEX bridges for this BEX

// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/background-hooks
// const cc = chrome.extension.getBackgroundPage().console;
const isChanged = (img, history) => {
  console.log("----isChanged", img.length, history);
  if (history.length > 0) {
    // TODO porovnat obrazky, resp. vyrezy
    if (history[0].img) {
      if (img.length !== history[0].img.length) {
        return 1;
      }
    }
  }
  // bez zmeny
  return 0;
};

const retStorage = (items) => {
  // console.log("---retStorage", items);
  let history = [];
  if (items.history) {
    history = JSON.parse(items.history);
  }
  console.log("---retStorage", history);
  return history;
};

const getHistory = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["history"], (items) => {
      resolve(JSON.parse(items.history));
    });
  });
};

const removeLatestScreenshot = (history) => {
  history.splice(-1, 1);
  // chrome.storage.local.set({ history: JSON.stringify(this.history) }, () => {
  //   console.log("---ulozeno do storage");
  // });
};
const clearScreenshotHistory = () => {
  chrome.storage.local.set({ history: [] }, () => {
    console.log("---ulozeno do storage");
  });
};

const addScreenshot = (img, bridge) => {
  getHistory().then((history) => {
    console.log("----history", history);
    const changeLevel = isChanged(img, history);
    // history = removeLatestScreenshot(history);
    history.unshift({
      img: img,
      time: new Date(),
      changed: changeLevel // 0 - 1
    });
    if (history.length > 5) {
      history.splice(-1, 1);
    }
    const toSave = { history: JSON.stringify(history) };
    chrome.storage.local.set(toSave, () => {
      console.log("---ulozeno do storage", JSON.parse(toSave.history));
      bridge.send("quasar.history.changed", JSON.parse(toSave.history));
    });
  });
};

export default function attachBackgroundHooks (bridge /* , allActiveConnections */) {
  bridge.on("quasar.start.timer", event => {
    console.log("---start timer", event);
    // chrome.alarms.clearAll(() => {
    chrome.tabs.captureVisibleTab((img) => {
      // console.log(img);
      // this.screenshot = img;
      addScreenshot(img, bridge);
    });
    chrome.alarms.create("screenshotAlarm", {
      delayInMinutes: 0,
      periodInMinutes: 0.20 // event.data.interval
    });
    chrome.alarms.onAlarm.addListener((res) => {
      // console.log("---timer", res);
      chrome.tabs.captureVisibleTab((img) => {
        // console.log(img);
        // this.screenshot = img;
        addScreenshot(img, bridge);
      });
    });
    bridge.send(event.eventResponseKey, { data: null });
  });

  bridge.on("quasar.stop.timer", event => {
    console.log("--- stop timer");
    // chrome.alarms.clear("screenshotAlarm");
    chrome.alarms.clearAll(() => {
      bridge.send(event.eventResponseKey, event);
    });
  });

  bridge.on("storage.get", event => {
    const payload = event.data;
    if (payload.key === null) {
      chrome.storage.local.get(null, r => {
        const result = [];

        // Group the items up into an array to take advantage of the bridge's chunk splitting.
        for (const itemKey in r) {
          result.push(r[itemKey]);
        }
        bridge.send(event.eventResponseKey, result);
      });
    } else {
      chrome.storage.local.get([payload.key], r => {
        bridge.send(event.eventResponseKey, r[payload.key]);
      });
    }
  });

  bridge.on("storage.set", event => {
    const payload = event.data;
    chrome.storage.local.set({ [payload.key]: payload.data }, () => {
      bridge.send(event.eventResponseKey, payload.data);
    });
  });

  bridge.on("storage.remove", event => {
    const payload = event.data;
    chrome.storage.local.remove(payload.key, () => {
      bridge.send(event.eventResponseKey, payload.data);
    });
  });

  /*
  // EXAMPLES
  // Listen to a message from the client
  bridge.on('test', d => {
    console.log(d)
  })

  // Send a message to the client based on something happening.
  chrome.tabs.onCreated.addListener(tab => {
    bridge.send('browserTabCreated', { tab })
  })

  // Send a message to the client based on something happening.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      bridge.send('browserTabUpdated', { tab, changeInfo })
    }
  })
   */
}
