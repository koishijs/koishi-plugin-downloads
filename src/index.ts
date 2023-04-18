import { Context, Schema } from 'koishi'
import { Downloads } from './service'

export interface Config {
  output: string
}

export const Config: Schema<Config> = Schema.object({
  output: Schema.string().default('./nereid'),
})

export const name = 'downloads'

export function apply(ctx: Context, config: Config) {
  ctx.plugin(Downloads, config)
}