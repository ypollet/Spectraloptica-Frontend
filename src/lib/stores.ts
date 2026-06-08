import { defineStore, type PiniaPluginContext, type StateTree } from 'pinia'
import { Distance } from '@/data/models/distance'
import { Landmark } from '@/data/models/landmark'
import Color from 'color'
import { type SpectralData, type SpectralImage, SpectralGroup } from '@/data/models/spectral_image'
import { RepositoryFactory } from '@/data/repositories/repository_factory'
import { repositorySettings } from '@/config/appSettings'
import { DEFAULT_CAMERA, DEFAULT_IMAGE, DEFAULT_SIZE, replacer, reviver } from '@/lib/utils'
import type { Position } from '@/data/models/coordinates'
import { DEFAULT_GROUP } from '@/data/models/spectral_image'
import destr from 'destr'
import { isProxy, toRaw } from 'vue';

const repository = RepositoryFactory.get(repositorySettings.type)


export const useSettingsStore = defineStore('settings', {
  state: () => ({ isLeft: false }),
  actions: {
    useToggleLeft(value: boolean) {
      this.isLeft = value
    },
  },

  persist: {
    storage: localStorage,
    key: 'settings',
  }
})


export const useImagesStore = defineStore('images', {
  state: () => ({
    objectPath: "",
    index: "",
    spectralImages: new Map<string, SpectralGroup>(),
  }),
  getters: {
    selectedGroup: (state) => state.spectralImages.get(state.index) || DEFAULT_GROUP,
    selectedImage: (state) => (state.spectralImages.has(state.index)) ? state.spectralImages.get(state.index)!.selectedImage : DEFAULT_IMAGE,
    camera: (state) => (state.spectralImages.has(state.index)) ? state.spectralImages.get(state.index)!.camera : structuredClone(DEFAULT_CAMERA),
    size: (state) => (state.spectralImages.has(state.index)) ? state.spectralImages.get(state.index)!.size : DEFAULT_SIZE,
    listGradients: (state) => (state.spectralImages.has(state.index)) ? state.spectralImages.get(state.index)!.listGradients : []
  },
  actions: {
    setPath(path: string) {
      this.$reset()
      this.objectPath = path
    },
  },

  persist: {
    storage: sessionStorage,
    key: 'images',
    serializer: {
      deserialize: (value: string) => {
        let state = destr<StateTree>(value)
        let stateCopy = Object.assign({}, state)
        let spectralImages = new Map<string, SpectralGroup>()
        let mapSpectralImages = new Map<string, SpectralData>(Object.entries(state.spectralImages))
        mapSpectralImages.forEach((spectralData: SpectralData, key: string) => {
          console.log(key)
          spectralImages.set(key, new SpectralGroup({
            spectralImages: Array.from(spectralData.spectralImages),
            individualImages: new Map<string, SpectralImage>(Object.entries(spectralData.individualImages)),
            size: spectralData.size,
            thumbnails: spectralData.thumbnails
          }))
        })
        console.log(spectralImages.size)
        stateCopy.spectralImages = spectralImages
        console.log(stateCopy)
        return stateCopy
      },
      serialize: (state: StateTree) => {
        return JSON.stringify(state, replacer)
      }
    }
  }  
})



export const useLandmarksStore = defineStore('landmarks', {
  state: () => ({
    landmarks: Array<Landmark>(),
    distances: Array<Distance>(),
    adjustFactor: 1,
    scale: "px",
    tab: "landmarks",
    selectedDistanceIndex: -1
  }),
  getters: {
    indexes: (state) => new Map(state.distances.map((distance, index) => [distance.label, index])),
    selectedDistance: (state) => (state.selectedDistanceIndex >= 0 && state.selectedDistanceIndex < state.distances.length) ? state.distances[state.selectedDistanceIndex] : null
  },
  actions: {
    generateID() {
      let check: boolean = false
      let id: string = ""
      while (!check) {
        id = (Math.random() + 1).toString(36).substring(2);
        this.distances.forEach(distance => {
          if (distance.landmarks.filter(e => e.equals(id)).length == 0) {
            check = true
          }
        })
        if (this.landmarks.filter(e => e.equals(id)).length == 0) {
          check = true
        }
      }
      return id;
    },
  },
  persist: {
    storage: sessionStorage,
    key: 'landmarks',
    afterHydrate: (ctx: PiniaPluginContext) => {
      // restore landmarks
      let landmarks = new Array<Landmark>()
      ctx.store.$state.landmarks.forEach((jsonObject: Landmark) => {
        let landmark = new Landmark(jsonObject.id, jsonObject.label, jsonObject.pose, jsonObject.position, Color(jsonObject.color))
        landmarks.push(landmark)
      })
      ctx.store.$state.landmarks = landmarks

      let distances = new Array<Distance>()
      ctx.store.$state.distances.forEach((jsonObject: Distance) => {
        let landmarks = jsonObject.landmarks.map((x: Landmark) => new Landmark(x.id, x.label, x.pose, x.position, Color(x.color)))
        let distance = new Distance(jsonObject.label, landmarks, Color(jsonObject.color))
        distances.push(distance)
      })
      ctx.store.$state.distances = distances
    },
  },
})