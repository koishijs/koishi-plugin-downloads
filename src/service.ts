import { Context } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { ResolveOptions, State, sync } from 'nereid'
import { Config } from '.'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      downloads: Downloads
    }
  }

  interface Events {
  }
}

export interface DownloadsClientData {

}

export class Downloads extends DataService<DownloadsClientData> {
  tasks: Record<string, State> = {}
  data: DownloadsClientData = {}
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

  async get() {
    return this.data
  }
}
