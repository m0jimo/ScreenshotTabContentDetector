<template>
  <q-page class="xflex xflex-center">
    <div class="column col q-pa-xs">
      <div class="row">
        <div v-for="(obj, index) in history" :key="index">
          <div v-if="index === 0" class="row">
            <q-btn icon="filter" flat :color="obj.changed > 0 ? 'red' : 'primary'" @click="showHistory(obj.img)">
              <q-tooltip anchor="top middle" self="center middle">Latest screenshot - {{ formatDate(obj.time) }}</q-tooltip>
            </q-btn>
          </div>
          <div v-else>
            <q-btn :icon="`filter_${index}`" flat :color="obj.changed > 0 ? 'red' : 'primary'"
                   @click="showHistory(obj.img)">
              <q-tooltip anchor="top middle" self="center middle">{{ formatDate(obj.time) }} - change level: {{
                  obj.changed
                }}
              </q-tooltip>
            </q-btn>
          </div>
        </div>
        <q-space></q-space>
        <q-btn color="red" v-if="history.length > 0" icon="remove" flat @click="removeLatestScreenshot">
          <q-tooltip anchor="top middle" self="center middle">Remove oldest screenshot</q-tooltip>
        </q-btn>
      </div>
      <div class="row q-gutter-sm">
        <q-btn @click="takeScreenshot" flat color="primary" no-caps icon="add_a_photo">
          <q-tooltip>Take a screenshot</q-tooltip>
        </q-btn>
        <q-btn :disable="screenshot === null" color="primary" outline no-caps label="Use screenshot" @click="addScreenshot"
               icon="add"></q-btn>

<!-- NOTE pridat dropdown s moznosti: crop editor, crop editor new page       -->

        <q-input :disable="!screenshotTimer" style="width:100px" label="Interval [min]" v-model="screenshotInterval" :min="1" :max="10" dense outlined type="number">
<!--          <template v-slot:append><small>[min]</small></template>-->
        </q-input>
        <q-toggle v-model="screenshotTimer" :label="screenshotTimer ? 'Enabled' : 'Disabled'"></q-toggle>
      </div>
      <div class="row q-pt-xs">
        <!--      <div style="max-width: 50vw; max-height: 50vh; min-width: 400px; min-height: 400px; border: solid red 1px">-->
        <div style="width: 90vh; height: 90vw; padding:20px; border: solid red 1px">
          <q-img :src="screenshot" contain></q-img>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { date } from "quasar";

export default {
  name: "PageIndex",
  data () {
    return {
      screenshot: null,
      history: [],
      screenshotInterval: 1,
      screenshotTimer: false
    };
  },
  beforeCreate () {
    // TODO nacist globalni nastaveni BEX
  },
  mounted () {
    chrome.storage.local.get(["history"], (items) => {
      // console.log("---items", items);
      this.history = JSON.parse(items.history);
    });
  },
  methods: {
    formatDate (__date) {
      return date.formatDate(__date, "HH:MM:ss");
    },
    addScreenshot () {
      const img = this.screenshot;
      const changeLevel = this.isChanged(img, this.history);
      this.history.unshift({
        img: img,
        time: new Date(),
        changed: changeLevel // 0 - 1
      });
      if (this.history.length > 5) {
        this.history.splice(-1, 1);
      }
      chrome.storage.local.set({ history: JSON.stringify(this.history) }, () => {
        console.log("---ulozeno do storage");
      });
    },
    removeLatestScreenshot () {
      this.history.splice(-1, 1);
      chrome.storage.local.set({ history: JSON.stringify(this.history) }, () => {
        console.log("---ulozeno do storage");
      });
    },
    showHistory (img) {
      this.screenshot = img;
    },
    isChanged (img, history) {
      if (history.length > 0) {
        // TODO porovnat obrazky, resp. vyrezy
        if (img.length !== history[0].img.length) {
          return 1;
        }
      }
      // bez zmeny
      return 0;
    },
    takeScreenshot () {
      console.log("---screenshot");
      chrome.tabs.captureVisibleTab((img) => {
        this.screenshot = img;
      });
    }
  }
};
</script>
