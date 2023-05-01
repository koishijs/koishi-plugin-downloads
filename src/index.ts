import { resolve } from 'path'
import { Context, Schema } from 'koishi'
import {} from '@koishijs/plugin-console'
import { ClientDownloads } from './client'
import { Downloads } from './service'

export interface Config {
  output: string
}

export const Config: Schema<Config> = Schema.object({
  output: Schema.string().default('./downloads').description('下载结束后的输出目录。'),
})

export const name = 'downloads'

export function apply(ctx: Context, config: Config) {
  ctx.using(['console'], (ctx) => {
    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  })
  ctx.plugin(ClientDownloads, config)
  ctx.plugin(Downloads, config)
}

export * from './service'
export * from './client'
export * from './tasks'
