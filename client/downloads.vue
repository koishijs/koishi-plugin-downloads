<template>
  <k-layout :menu="menu">
    <template #header>下载</template>
    <div class="downloads">
      <el-empty v-if="list.length === 0" class="empty" description="当前没有需要进行的下载任务。" />
      <virtual-list v-else :data="list" #="task">
        <div class="task">
          <div class="name">{{ task.name }}</div>
          <el-progress
            class="progress"
            :status="task.status"
            :indeterminate="task.indeterminate"
            :percentage="task.indeterminate ? 50 : Math.round(task.progress * 1000) / 10" />
          <el-button
            v-if="task.button !== 'none'"
            circle
            :icon="task.button === 'pause' ? Pause : Play"
            @click="toggle(task)" />
          <!-- TODO: cancel button -->
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

const menu = [{
  icon: 'folder-open',
  label: '打开下载目录',
  action: () => send('download/open-folder'),
}]

receive('download/message', (text) => {
  message.value = text
})

function toggle(task: ClientTask) {
  if (task.button === 'none') return
  if (task.button === 'pause') {
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
  box-shadow: 0 0 6px var(--downloads-shadow);
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

<style>
:root {
  --downloads-shadow: #AAAAAA;
}

html.dark {
  --downloads-shadow: #222222;
}
</style>
