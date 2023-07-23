import { defineExtension } from '@koishijs/client'
import Downloads from './downloads.vue'
import './icons'

export default defineExtension(async ctx => {
  ctx.page({
    name: '下载',
    path: '/downloads',
    icon: 'activity:download',
    component: Downloads,
  })
})
