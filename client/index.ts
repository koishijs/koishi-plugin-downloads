import { defineExtension } from '@koishijs/client'
import './icons'

export default defineExtension(ctx => {
  ctx.page({
    name: '下载',
    path: '/downloads',
    icon: 'activity:download',
    component: () => import('./downloads.vue')
  })
})
