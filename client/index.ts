import { defineExtension } from '@koishijs/client'
import './icons'

export default defineExtension(ctx => {
  ctx.page({
    name: 'downloads',
    path: '/downloads',
    icon: 'activity:download',
    component: () => import('./downloads.vue')
  })
})
