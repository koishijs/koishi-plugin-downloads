import { defineExtension } from '@koishijs/client'

export default defineExtension(ctx => {
  ctx.page({
    name: 'downloads',
    path: '/downloads',
    component: () => import('./downloads.vue')
  })
})