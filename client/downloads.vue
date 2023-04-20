<template>
  <k-layout main="darker">
    <div class="downloads">
      <virtual-list :data="list" #="data">
        <div class="task">
          <div class="name">{{ data.name }}</div>
          <el-progress class="progress" v-if="data.progress !== 1" :percentage="data.progress * 100" />
          <el-progress class="progress" v-else status="success" :percentage="100" />
        </div>
      </virtual-list>
    </div>
    <template #right>
      <div class="status"></div>
    </template>
  </k-layout>
</template>

<script lang="ts" setup>
import { VirtualList } from '@koishijs/client'
import { store, send, receive } from '@koishijs/client'
import { computed, ref } from 'vue'

const data = [
  { name: 'go-cqhttp1', progress: 0.5 },
  { name: 'go-cqhttp2', progress: 0.6 },
  { name: 'go-cqhttp3', progress: 0.7 },
  { name: 'go-cqhttp4', progress: 1   },
  { name: 'go-cqhttp5', progress: 0.5 },
  { name: 'go-cqhttp6', progress: 1   },
  { name: 'go-cqhttp7', progress: 0.5 },
]

const list = computed(() => data.sort((_, b) => b.progress === 1 ? -1 : 1))

</script>

<style scoped>

.downloads {
  height: 100%;
  padding: 5px;
}

.task {
  margin: 30px 20px 30px 20px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 6px #AAAAAA;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

.task > * {
  margin: 0 10px 0 10px;
}

.progress {
  flex-grow: 1;
}

.status {
  width: 300px;
}

</style>