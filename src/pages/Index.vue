<template>
  <q-page class="flex flex-start" style="max-width:700px;min-width: 400px; height: 400px">
    <div class="column q-pa-xs">
      <div class="row q-pb-xs">
        <div class="row q-gutter-xs">
          <q-btn style="width: 60px;" color="primary" v-if="timerRunning === false" @click="startTimer">Start</q-btn>
          <q-btn style="width: 60px;" v-if="timerRunning" color="red" @click="stopTimer">Stop</q-btn>
<!-- TODO save interval to storage  -->
          <q-input :disable="timerRunning" style="width:100px" label="Interval [min]" v-model="screenshotInterval"
                   :min="1" :max="10" dense outlined type="number"></q-input>

        </div>
        <div class="column col">
          <div class="row" v-if="history.length > 0">
            <div v-for="(obj, index) in history" :key="index">
              <div v-if="index === 0" class="row" :class="{'bg-orange': obj.img.length === 21750 }">
                <q-btn icon="filter" flat :color="obj.changed > 0 ? 'red' : 'primary'" @click="showHistory(obj.img)">
                  <q-tooltip anchor="top middle" self="center middle">
                    Latest screenshot - {{ formatDate(obj.time) }}
                  </q-tooltip>
                </q-btn>
              </div>
              <div v-else>
                <q-btn :icon="`filter_${index}`" flat :color="obj.changed > 0 ? 'red' : 'primary'"
                       :class="{'bg-orange': obj.img.length === 21750 }"
                       @click="showHistory(obj.img)">
                  <q-tooltip anchor="top middle" self="center middle">
                    {{ formatDate(obj.time) }} - change level: {{ obj.changed }}
                  </q-tooltip>
                </q-btn>
              </div>
            </div>
            <q-space></q-space>
            <q-btn color="red" v-if="history.length > 0" icon="remove" flat @click="removeLatestScreenshot">
              <q-tooltip anchor="top middle" self="center middle">Remove oldest screenshot</q-tooltip>
            </q-btn>
          </div>
        </div>
        <!--        <small class="text-grey debug" style="max-width: 500px; max-height: 30px;">-->
        <!--          vis. area: {{ crop.visibleArea }} -<br>-->
        <!--          coordinates: {{ crop.coordinates }}-->
        <!--        </small>-->
      </div>

      <div class="row" v-if="false">
        <q-btn :disable="screenshot === null" color="primary" outline no-caps label="Use screenshot"
               @click="applyCrop()"
               icon="add"></q-btn>

        <!-- NOTE pridat dropdown s moznosti: crop editor, crop editor new page       -->

        <!--          <template v-slot:append><small>[min]</small></template>-->

        <!--        <q-toggle v-model="timerRunning" :label="!timerRunning ? 'Enabled' : 'Disabled'"></q-toggle>-->
      </div>
      <div class="row q-pt-xs" v-if="false">
        <q-space></q-space>
        <!--      <div style="max-width: 50vw; max-height: 50vh; min-width: 400px; min-height: 400px; border: solid red 1px">-->
        <q-btn @click.prevent="saveCrop()" label="crop" flat color="primary"></q-btn>
        <q-btn @click.prevent="applyCrop()" label="apply crop" flat color="primary"></q-btn>

        <!--        <div style="width: 40px; height: 80px">-->
        <!--        </div>-->
      </div>
      <div class="row q-py-sm">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-body2"><small>Cropped image for comparison</small></div>
            <img id="image" ref="img" :src="screenshot" style="max-height:100px;" class="q-pb-md bg-grey-3"/>
          </q-card-section>
        </q-card>
      </div>
      <!--        <div style="max-height: 300px; max-width: 400px">-->
      <div class="row bg-grey-4 q-pa-sm" :class="{invisible: timerRunning}">
        <div style="position:absolute; z-index: 100; right: 10px" class="q-pa-sm">
          <q-btn @click="takeScreenshot" color="primary" size="sm" dense no-caps icon="sync">
            <q-tooltip>refresh</q-tooltip>
          </q-btn>
        </div>
        <cropper ref="cropper"
                 style="max-width: 650px;"
                 :resize-image="false"
                 :move-image="false"
                 @change="getCropData"
                 :default-size="{
                     width: 800,
                    height: 600}"
                 :default-position="{
                   width: crop.coordinates.width,
                   height: crop.coordinates.height,
                   left: crop.coordinates.left,
                    top: crop.coordinates.top}"
                 :src="cropperSrc"
        ></cropper>
      </div>
    </div>
    <!--        </div>-->
  </q-page>
</template>

<script>
import { date, extend } from "quasar";
import * as utils from "../assets/utils";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
// import VueCropper from "vue-cropperjs";
// import Cropper from "cropperjs";
// import "cropperjs/dist/cropper.css";

export default {
  name: "PageIndex",
  components: {
    Cropper
  },
  data () {
    return {
      screenshot: null,
      cropperSrc: null,
      history: [],
      screenshotInterval: process.env.DEV ? 0.3 : 1.1,
      result: null,
      timerRunning: false,
      crop: {
        coordinates: {
          width: 200,
          height: 200,
          left: 20,
          top: 20
        },
        visibleArea: {
          top: 0,
          left: 0,
          width: 1200,
          height: 800
        }
      }
    };
  },
  computed: {},
  beforeCreate () {
    // TODO nacist globalni nastaveni BEX
  },
  created () {
    this.reloadHistory();
    this.$q.bex.on("quasar.history.changed", (evt) => {
      // console.log("----listen to history changed", evt);
      this.history = extend(true, [], evt.data);
      // this.$bex.bridge.send(evt.eventResponseKey);
    });
  },
  mounted () {
    this.takeScreenshot();
    this.getSettings();
    setTimeout(() => this.takeScreenshot(), 500);
    this.checkTimer();
  },
  beforeDestroy () {
    // this.$q.bex.off("start.timer", this.testMessage());
  },
  methods: {
    checkTimer () {
      chrome.alarms.get("screenshotAlarm", (res) => {
        // console.log("---res screenshotAlarm", res);
        if (res) {
          this.screenshotInterval = res.periodInMinutes;
          this.timerRunning = true;
        }
      });
    },
    getSettings () {
      this.$q.bex.send("storage.get", { key: "uiSettings" }).then((res) => {
        console.log("---ui settings", res);
        if (Object.prototype.hasOwnProperty.call(res, "data")) {
          if (res.data.crop) {
            this.crop = Object.assign({}, res.data.crop);
          }
          // console.log("----nastaven crop", this.crop);
        }
      });
    },
    applyCrop () {
      const item = this.cropperSrc;
      const img = new Image();
      img.src = item;
      const cropped = utils.cropImage(img, this.crop);
      // console.log("--croppedImage", cropped);
      this.addScreenshot(cropped.src);
      this.saveCropSettings(this.crop);
    },
    saveCropSettings (crop) {
      const storageData = {
        uiSettings: {
          crop: crop
        }
      };
      chrome.storage.local.set(storageData, () => {
        // console.log("---ulozeno do storage", storageData);
      });
    },
    setCropDimension (evt) {
      this.crop.coordinates = evt.coordinates;
      this.crop.visibleArea = evt.visibleArea;
      this.saveCropSettings(this.crop);
    },
    saveCrop () {
      const obj = this.$refs.cropper.getResult();
      console.log("---obj", obj);
      this.screenshot = obj.canvas.toDataURL();
    },
    getCropData (evt) {
      // const cropData = JSON.stringify(this.$refs.img.cropper.getData(), null, 4);
      // console.log("----val", evt);
      if (evt.image) {
        this.setCropDimension(evt);
        // this.screenshot = evt.image.src;
        this.saveCrop();
      }
    },
    reloadHistory () {
      chrome.storage.local.get(["history"], (items) => {
        console.log("---items", items);
        if (Object.prototype.hasOwnProperty.call(items, "history")) {
          this.history = extend(true, [], items.history);
        }
      });
    },
    stopTimer () {
      this.timerRunning = false;
      this.$q.bex.send("quasar.stop.timer", {}).then((res) => {
        // console.log("---stop timer", res);
        // this.screenshot = res.data.data;
      });
    },
    startTimer () {
      // chrome.notifications.clear("screenshotDetector");
      // this.applyCrop();
      this.$q.bex.send("quasar.start.timer", { interval: this.screenshotInterval }).then((res) => {
        // console.log("---start timer", res.data);
        this.timerRunning = true;
        // this.screenshot = res.data.data;
      });
    },
    formatDate (__date) {
      const d = new Date(__date);
      return date.formatDate(d, "HH:MM:ss");
    },
    addScreenshot (img) {
      const changeLevel = this.isChanged(img, this.history);
      const timeNow = new Date().getTime();
      console.log("---timeNow", timeNow);
      this.history.unshift({
        img: img,
        time: timeNow,
        changed: changeLevel // 0 - 1
      });
      if (this.history.length > 5) {
        this.history.splice(-1, 1);
      }
      chrome.storage.local.set({ history: this.history }, () => {
        // console.log("---ulozeno do storage");
      });
    },
    removeLatestScreenshot () {
      this.history.splice(-1, 1);
      chrome.storage.local.set({ history: this.history }, () => {
        // console.log("---ulozeno do storage");
      });
    },
    showHistory (img) {
      // console.log("---img", img.length);
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
      chrome.tabs.captureVisibleTab((__img) => {
        // console.log("----takescreenshot on mount");
        const img = new Image();
        img.src = __img;
        const { src } = utils.cropImage(img, this.crop);
        this.screenshot = src; // nastavime automaticky vytvoreny screenshost
        this.cropperSrc = __img; // nahrajeme pro priravu vyrezu
      });
    }
  }
};
</script>
<style>
.debug {
  outline: solid 1px red;
}
</style>
