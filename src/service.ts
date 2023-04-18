import { Context, Service } from 'koishi'
import { ResolveOptions, State, sync } from 'nereid'
import { Config } from '.'

export class Downloads extends Service {
  tasks: Record<string, State> = {}
  constructor(public ctx: Context, public config: Config) {
    super(ctx, 'downloads')
  }

  start() {

  }

  task(name: string, srcs: string[], bucket: string, options?: ResolveOptions) {
    const state = sync(srcs, bucket, {
      ...options,
      output: this.config.output,
    })
    this.tasks[name] = state
  }
}
