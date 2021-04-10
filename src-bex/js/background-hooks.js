// Hooks added here have a bridge allowing communication between the BEX Background Script and the BEX Content Script.
// Note: Events sent from this background script using `bridge.send` can be `listen`'d for by all client BEX bridges for this BEX
// import { date } from "quasar";
import * as utils from "../../src/assets/utils";
import { format } from "quasar";
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/background-hooks
// const cc = chrome.extension.getBackgroundPage().console;
const isChanged = (img, history, notifiId) => {
  // console.log("--- check isChanged", img.length, history);
  if (history.length > 0) {
    // TODO porovnat obrazky, resp. vyrezy
    if (history[0].img) {
      // console.log("---compare result", img.length, history[0].img.length);
      if (img.length !== history[0].img.length) {
        return {
          len: history[0].img.length,
          changed: true,
          notifiId: notifiId,
          time: history[0].time
        };
      }
    }
  }
  // bez zmeny
  return {
    len: 0,
    changed: false,
    notifiId: 0,
    time: 0
  };
};
const clearAllNotifications = (id = null) => {
  if (id !== null) {
    // console.log("---clear notification id", id);
    chrome.notifications.clear(id);
  } else {
    chrome.notifications.getAll((items) => {
      if (items) {
        for (const key in items) {
          // console.log("---clear all notifications", key);
          chrome.notifications.clear(key);
        }
      }
    });
  }
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

const addScreenshot = (imgObj, bridge, alarm) => {
  // console.log("---add screenshot");
  getStorageItemByKey("history").then((__history) => {
    const history = (__history === null || typeof __history === "undefined") ? [] : __history;
    // console.log("---history", JSON.parse(JSON.stringify(history)));
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
      if (uiSettings.crop) {
        crop = uiSettings.crop;
      }
      // console.log("--uiSettings", uiSettings);
      const img = new Image();
      img.src = imgObj;
      const { src } = utils.cropImage(img, crop);
      // console.log("---croppedImg", src);
      // history = removeLatestScreenshot(history);

      const timeAlarmMs = Math.floor(alarm.scheduledTime);
      const timeAlarmDate = new Date(timeAlarmMs);
      // const timeNowMs = (new Date()).getTime();
      const notifiId = `N${timeAlarmDate.getTime().toString()}`;
      const changeInfo = isChanged(src, history, notifiId);

      // const interval = timeNow.getTime() - 30000;
      // const plusTime = alarm.scheduledTime + 2000;
      history.unshift({
        img: src,
        time: timeAlarmMs,
        notifiId: notifiId,
        changed: changeInfo.changed // true | false
      });

      // let isOk = true;
      // if (history.length > 0) {
      //   const index = history.findIndex(r => r.notifiId === notifiId);
      //   console.log("----index", index, history);
      //   if (index > 0) {
      //     isOk = false;
      //   }
      // }

      // && notifiId !== `N${changeInfo.time}`
      // if (changeInfo.changed && src.length !== changeInfo.len) {
      if (changeInfo.changed) {
        console.log("---changeInfo notification", history, timeAlarmMs, changeInfo.time, src.length, changeInfo.len, changeInfo.changed);
        // const formatedDate = `${timeAlarmDate.getHours().toString()}:${timeAlarmDate.getMinutes().toString()}:${timeAlarmDate.getSeconds().toString()}`;
        // NOTE notification should have id based on time to be identified
        // console.log("---create notifiId", notifiId);
        const audio = new Audio("../icons/A.m4a");
        audio.play();
        // chrome.notifications.create(notifiId, {
        //   type: "basic",
        //   title: "Screenshot detector notification",
        //   message: `Change has been detected. Id: ${notifiId}, time: ${formatedDate}`,
        //   requireInteraction: true,
        //   iconUrl: "../icons/icon-48x48.png"
        // }, () => {
        //   console.log("---notification fired", notifiId);
        // });
        // }
      }

      if (history.length > 5) {
        history.splice(-1, 1);
      }
      const noOfChanges = history.filter((i) => i.changed);
      if (noOfChanges.length > 0) {
        chrome.browserAction.setBadgeBackgroundColor({ color: [205, 92, 92, 230] });
        chrome.browserAction.setBadgeText({ text: noOfChanges.length.toString() });
      } else {
        chrome.browserAction.setBadgeText({ text: "" });
      }

      const toSave = { history: history };
      chrome.storage.local.set(toSave, () => {
        // console.log("---ulozeno do storage", JSON.parse(JSON.stringify(toSave)));
        bridge.send("quasar.history.changed", toSave.history);
      });
    });
  });
};
// const captureTab = (bridge) => {
//   chrome.tabs.captureVisibleTab((img) => {
//     if (img) {
//       console.log("---raw screenshot", img.length);
//     }
//     // TODO oriznout podle nastaveni
//     // console.log(img);
//     // this.screenshot = img;
//     addScreenshot(img, bridge);
//   });
// };

export default function attachBackgroundHooks (bridge /* , allActiveConnections */) {
  // bridge.on("quasar.tab.capture", (event) => {
  //   captureTab(bridge);
  //   bridge.send(event.eventResponseKey, event);
  // });

  bridge.on("quasar.start.timer", (event) => {
    // musime poslat aktualni screenshot
    // console.log("---start timer", event);
    // chrome.alarms.clearAll(() => {
    // chrome.tabs.captureVisibleTab((img) => {
    //   // console.log(img);
    //   // this.screenshot = img;
    //   addScreenshot(img, bridge);
    // });
    // chrome.notifications.onButtonClicked.addListener((notifiId) => {
    //   // console.log("---clear notification id", notifiId);
    //   clearAllNotifications(notifiId);
    // });

    chrome.alarms.create("screenshotAlarm", {
      delayInMinutes: 0,
      periodInMinutes: parseInt(event.data.interval)
    });
    chrome.alarms.onAlarm.addListener((alarm) => {
      console.log("---on Alarm added listenner", alarm);
      // captureTab(bridge);
      // const timeNow = (new Date()).getTime();
      // const plusTime = alarm.scheduledTime + 2000;
      // if (plusTime > timeNow) {
      console.log("---capture vivisble tab");
      chrome.tabs.captureVisibleTab((img) => {
        if (img) {
          // console.log("---raw screenshot", img.length);
          addScreenshot(img, bridge, alarm);
        }
      });
      // }
    });
    bridge.send(event.eventResponseKey, { data: null });
  });

  bridge.on("quasar.stop.timer", event => {
    // console.log("--- stop timer");
    // clearAllNotifications();
    chrome.browserAction.setBadgeText({ text: "" });
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
