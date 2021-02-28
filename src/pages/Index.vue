<template>
  <q-page class="flex flex-start">
    <div class="column col q-pa-xs">
      <div class="row q-gutter-sm items-center">
        <q-btn @click="startTimer">Start</q-btn>
        <q-btn @click="stopTimer">Stop</q-btn>
      </div>
      <div class="row">
        <div v-for="(obj, index) in history" :key="index">
          <div v-if="index === 0" class="row">
            <q-btn icon="filter" flat :color="obj.changed > 0 ? 'red' : 'primary'" @click="showHistory(obj.img)">
              <q-tooltip anchor="top middle" self="center middle">
                Latest screenshot - {{ formatDate(obj.time) }}
              </q-tooltip>
            </q-btn>
          </div>
          <div v-else>
            <q-btn :icon="`filter_${index}`" flat :color="obj.changed > 0 ? 'red' : 'primary'"
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
      <div class="row">
        <q-btn @click="takeScreenshot" flat color="primary" no-caps icon="add_a_photo">
          <q-tooltip>Take a screenshot</q-tooltip>
        </q-btn>
        <q-btn :disable="screenshot === null" color="primary" outline no-caps label="Use screenshot"
               @click="applyCrop()"
               icon="add"></q-btn>

        <!-- NOTE pridat dropdown s moznosti: crop editor, crop editor new page       -->

        <q-input :disable="!screenshotTimer" style="width:100px" label="Interval [min]" v-model="screenshotInterval"
                 :min="1" :max="10" dense outlined type="number">
          <!--          <template v-slot:append><small>[min]</small></template>-->
        </q-input>
        <q-toggle v-model="screenshotTimer" :label="screenshotTimer ? 'Enabled' : 'Disabled'"></q-toggle>
      </div>
      <div class="row q-pt-xs">
        <!--      <div style="max-width: 50vw; max-height: 50vh; min-width: 400px; min-height: 400px; border: solid red 1px">-->
        <q-btn @click.prevent="saveCrop()" label="crop" flat color="primary"></q-btn>
        <q-btn @click.prevent="applyCrop()" label="apply crop" flat color="primary"></q-btn>
        <small class="text-grey debug" style="min-width: 200px">
          {{ crop.visibleArea }} -
          {{ crop.coordinates }}
        </small>
        <!--        <div style="width: 40px; height: 80px">-->
        <!--        </div>-->
        <div style="width: 700px; height: 470px; border: solid red 1px">
          <!--          <img id="image" ref="img" :src="screenshot" style="width: 100%"/>-->
          <cropper ref="cropper"
                   @change="getCropData"
                   :default-position="{left: 184,
                    top: 72}"
                   :default-size="{
                     width: 114,
                    height: 754}"
                   :src="screenshot"
          ></cropper>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { date, extend } from "quasar";
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
      history: [],
      screenshotInterval: 1,
      screenshotTimer: false,
      result: null,
      crop: {
        coordinates: null,
        visibleArea: null
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
      console.log("----listen to history changed", evt);
      this.history = extend(true, [], evt.data);
      // this.$bex.bridge.send(evt.eventResponseKey);
    });
  },
  beforeDestroy () {
    // this.$q.bex.off("start.timer", this.testMessage());
  },
  methods: {
    applyCrop () {
      const item = this.screenshot;
      const img = new Image();
      img.src = item;
      const cropped = this.cropMyImage(img);
      console.log("--croppedImage", cropped);
      this.addScreenshot(cropped.src);
    },
    cropMyImage (source) {
      // https://medium.com/trabe/manipulating-images-using-the-canvas-api-98dc77352ddc
      if (this.crop.coordinates && this.crop.visibleArea) {
        const { visibleArea } = this.crop;
        const canvas = document.createElement("canvas");
        canvas.width = visibleArea.width;
        canvas.height = visibleArea.height;
        const ctx = canvas.getContext("2d");
        const { coordinates } = this.crop;
        console.log("---use coordinates", coordinates);
        ctx.drawImage(
          source,
          coordinates.left,
          coordinates.top,
          coordinates.width,
          coordinates.height,
          0,
          0,
          coordinates.width,
          coordinates.height
        );
        // const img = ctx.getImageData(0, 0, coordinates.width, coordinates.height);
        // const imgData = img.data;
        // const nctx = ctx.getImageData(0,0, coordinates.width, coordinates.height);

        const img = new Image();
        img.src = canvas.toDataURL("image/png");
        return img;
      }
    },
    setCropDimension (evt) {
      this.crop.coordinates = evt.coordinates;
      this.crop.visibleArea = evt.visibleArea;
    },
    saveCrop () {
      const obj = this.$refs.cropper.getResult();
      // console.log("---obj", obj);
      this.screenshot = obj.canvas.toDataURL();
    },
    getCropData (evt) {
      // const cropData = JSON.stringify(this.$refs.img.cropper.getData(), null, 4);
      // console.log("----val", evt);
      if (evt.image) {
        this.setCropDimension(evt);
        // const res = this.$refs.cropper.getResults();
        // console.log("---res", res);
        this.screenshot = evt.image.src;
      }
      // if (cropData) {
      // this.$refs.cropper.setData(JSON.parse(cropData));
      // }
    },
    reloadHistory () {
      chrome.storage.local.get(["history"], (items) => {
        this.history = JSON.parse(items.history);
        console.log("---items", this.history);
      });
    },
    stopTimer () {
      this.$q.bex.send("quasar.stop.timer", {}).then((res) => {
        // console.log("---stop timer", res);
        // this.screenshot = res.data.data;
      });
    },
    startTimer () {
      this.$q.bex.send("quasar.start.timer", { interval: this.screenshotInterval }).then((res) => {
        // console.log("---start timer", res.data);
        this.screenshot = res.data.data;
      });
    },
    formatDate (__date) {
      return date.formatDate(__date, "HH:MM:ss");
    },
    addScreenshot (img) {
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
      chrome.tabs.captureVisibleTab((img) => {
        this.screenshot = img;
        console.log("---screenshot", img);
        // const image = document.getElementById("image");
        // const base64toBlob = (base64Data, contentType) => {
        //   contentType = contentType || "";
        //   const sliceSize = 512;
        //   const byteCharacters = atob(base64Data);
        //   const bytesLength = byteCharacters.length;
        //   const slicesCount = Math.ceil(bytesLength / sliceSize);
        //   const byteArrays = new Array(slicesCount);
        //
        //   for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        //     const begin = sliceIndex * sliceSize;
        //     const end = Math.min(begin + sliceSize, bytesLength);
        //
        //     const bytes = new Array(end - begin);
        //     for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        //       bytes[i] = byteCharacters[offset].charCodeAt(0);
        //     }
        //     byteArrays[sliceIndex] = new Uint8Array(bytes);
        //   }
        //   return new Blob(byteArrays, { type: contentType });
        // };
        // const imgc = new Image();
        // imgc.src = this.screenshot;
        // console.log("----imgc", imgc);
        // const xx = this.$refs.img;
        // xx.cropper("destroy");
        // console.log(xx);
        // const xx = document.getElementById("image");
        // const minAspectRatio = 0.5;
        // const maxAspectRatio = 1.5;
        // const cropper = new Cropper(xx, {
        // ready: function () {
        //   const cropper = this.cropper;
        //   const containerData = cropper.getContainerData();
        //   const cropBoxData = cropper.getCropBoxData();
        //   const aspectRatio = cropBoxData.width / cropBoxData.height;
        //   let newCropBoxWidth = null;
        //
        //   if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
        //     newCropBoxWidth = cropBoxData.height * ((minAspectRatio + maxAspectRatio) / 2);
        //
        //     cropper.setCropBoxData({
        //       left: (containerData.width - newCropBoxWidth) / 2,
        //       width: newCropBoxWidth
        //     });
        //   }
        // },
        //   crop (event) {
        //     console.log(event);
        //   }
        // });
        // console.log("---", cropper);
        // const reader = new FileReader();
        // reader.onload = (evt) => {
        //   this.$refs.cropper.replace(evt.target.result);
        // };
        // reader.readAsDataURL(new Blob(this.screenshot, { type: "image/png" }));
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
