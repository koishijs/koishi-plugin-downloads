<template>
  <k-layout main="darker">
    <div class="downloads">
      <el-empty v-if="list.length === 0" class="empty" description="当前没有需要进行的下载任务。" />
      <virtual-list v-else :data="list" #="task">
        <div class="task">
          <div class="name">{{ task.name }}</div>
          <el-progress
            class="progress"
            :status="status(task)"
            :indeterminate="indeterminate(task)"
            :percentage="indeterminate(task) ? 50 : Math.round(task.progress * 1000) / 10" />
          <el-button
            v-if="task.status !== 'done'"
            circle
            :icon="downloading(task) ? Pause : Play"
            @click="toggle(task)" />
        </div>
      </virtual-list>
    </div>
    <template #right>
      <div class="status">
        <div>{{ message }}</div>
      </div>
    </template>
  </k-layout>
</template>

<script lang="ts" setup>
import { VirtualList, store, send, receive } from '@koishijs/client'
import { computed, ref } from 'vue'
import { Play, Pause } from './icons'
import { ClientTask } from '..'

const list = computed(() => store.downloads.sort((_, b) => b.progress === 1 ? -1 : 1))
const message = ref('')

receive('download/message', (text) => {
  message.value = text
})

function status(task: ClientTask) {
  if (indeterminate(task)) {
    return 'warning'
  }
  switch (task.status) {
    case 'downloading':
    case 'checking':
    case 'linking':
    case 'pause':
      return null
    case 'canceled':
    case 'failed':
      return 'exception'
    case 'done':
      return 'success'
  }
}

function indeterminate(task: ClientTask) {
  return ['checking', 'linking'].includes(task.status)
}

function downloading(task: ClientTask) {
  return ['checking', 'downloading', 'linking'].includes(task.status)
}

function toggle(task: ClientTask) {
  const pause = downloading(task)
  if (pause) {
    send('download/pause', task.name)
  } else {
    send('download/start', task.name)
  }
}

</script>

<style scoped>
.downloads {
  height: 100%;
  padding: 5px;
}

.empty {
  width: 100%;
  height: 100%;
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

.name {
  line-height: 30px;
}

.progress {
  flex-grow: 1;
}

.status {
  width: 350px;
  height: 100%;
  background-color: var(--bg2);
  border-left: var(--border) 1px solid;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
