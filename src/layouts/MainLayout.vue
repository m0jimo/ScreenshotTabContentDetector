<template>
  <q-layout view="lHh Lpr lFf">
    <q-bar class="text-body2 bg-primary text-white">
      <div class="text-body2">
        Chrome Screenshot Change Detector
      </div>
      <q-space></q-space>
      <div>Quasar v{{ $q.version }}</div>
    </q-bar>
    <q-page-container style="padding-top: 0; margin-top: 0">
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script>

export default {
  name: "MainLayout",
  // components: { EssentialLink },
  data () {
    return {
      leftDrawerOpen: false
    };
  }
};
</script>
