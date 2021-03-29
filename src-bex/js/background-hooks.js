// Hooks added here have a bridge allowing communication between the BEX Background Script and the BEX Content Script.
// Note: Events sent from this background script using `bridge.send` can be `listen`'d for by all client BEX bridges for this BEX
import * as utils from "../../src/assets/utils";
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/background-hooks
// const cc = chrome.extension.getBackgroundPage().console;
const isChanged = (img, history) => {
  // console.log("----isChanged", img.length, history);
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
  // console.log("---retStorage", history);
  return history;
};

const getStorageItemByKey = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (items) => {
      // console.log("---key", items[key]);
      if (items[key]) {
        resolve(items[key]);
      }
      resolve(null);
    });
  });
};
const setStorageItemByKey = (key, value) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      // console.log("---ulozeno do storage");
      resolve();
    });
  });
};

const removeLatestScreenshot = (history) => {
  history.splice(-1, 1);
  // chrome.storage.local.set({ history: JSON.stringify(this.history) }, () => {
  //   console.log("---ulozeno do storage");
  // });
};
// const clearScreenshotHistory = () => {
//   chrome.storage.local.set({ history: [] }, () => {
//     // console.log("---ulozeno do storage");
//   });
// };

const addScreenshot = (imgObj, bridge) => {
  // console.log("---add screenshot");
  getStorageItemByKey("history").then((__history) => {
    // console.log("---history", __history);
    const history = __history === null ? [] : JSON.parse(__history);
    // console.log("----history");
    getStorageItemByKey("uiSettings").then((uiSettings) => {
      // console.log("---uiSettings", uiSettings);
      let crop = {
        visibleArea: {
          width: 800,
          height: 600
        },
        coordinates: {
          width: 200,
          height: 200,
          left: 20,
          top: 20
        }
      };
      // console.log("--uiSettings", uiSettings);
      if (uiSettings.crop) {
        crop = uiSettings.crop;
      }
      const img = new Image();
      img.src = imgObj;
      const { src } = utils.cropImage(img, crop);
      // console.log("---croppedImg", src);
      const changeLevel = isChanged(src, history);
      if (changeLevel > 0) {
        console.log("---needs notification", changeLevel);
        chrome.notifications.create({
          type: "basic",
          title: "Screenshot detector",
          message: "Change has been detected",
          requireInteraction: true,
          iconUrl: "../icons/icon-48x48.png"
        }, () => console.log("---notification fired"));
      }
      // history = removeLatestScreenshot(history);
      history.unshift({
        img: src,
        time: new Date(),
        changed: changeLevel // 0 - 1
      });
      if (history.length > 5) {
        history.splice(-1, 1);
      }
      const toSave = { history: JSON.stringify(history) };
      chrome.storage.local.set(toSave, () => {
        // console.log("---ulozeno do storage", JSON.parse(toSave.history));
        bridge.send("quasar.history.changed", JSON.parse(toSave.history));
      });
    });
  });
};

export default function attachBackgroundHooks (bridge /* , allActiveConnections */) {
  bridge.on("quasar.start.timer", (event) => {
    // musime poslat aktualni screenshot
    console.log("---start timer", event);
    // chrome.alarms.clearAll(() => {
    chrome.tabs.captureVisibleTab((img) => {
      // console.log(img);
      // this.screenshot = img;
      addScreenshot(img, bridge);
    });
    chrome.alarms.create("screenshotAlarm", {
      delayInMinutes: 0,
      periodInMinutes: event.data.interval
    });
    chrome.alarms.onAlarm.addListener((res) => {
      // console.log("---timer", res);
      chrome.tabs.captureVisibleTab((img) => {
        // TODO oriznout podle nastaveni
        // console.log(img);
        // this.screenshot = img;
        addScreenshot(img, bridge);
      });
    });
    bridge.send(event.eventResponseKey, { data: null });
  });

  bridge.on("quasar.stop.timer", event => {
    // console.log("--- stop timer");
    chrome.notifications.getAll((items) => {
      if (items) {
        for (const key in items) {
          chrome.notifications.clear(key);
        }
      }
    });
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
