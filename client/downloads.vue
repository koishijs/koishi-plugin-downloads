<template>
  <k-layout main="darker">
    <div class="downloads">
      <div v-if="list.length === 0" class="empty">
        <div>当前没有需要进行的下载任务。</div>
      </div>
      <virtual-list v-else :data="list" #="data">
        <div class="task">
          <div class="name">{{ data.name }}</div>
          <el-progress
            class="progress"
            :status="data.status === 'done' ? 'success' : null"
            :indeterminate="data.status === 'check'"
            :percentage="data.progress * 100" />
          <el-button circle :icon="Pause" />
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
import { Pause } from './icons'
import {} from '..'

const list = computed(() => store.downloads.sort((_, b) => b.progress === 1 ? -1 : 1))

</script>

<style scoped>
.downloads {
  height: 100%;
  padding: 5px;
}

.empty {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
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
}
</style>