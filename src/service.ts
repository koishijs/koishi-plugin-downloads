import { Context, Service } from 'koishi'
import { ResolveOptions, State, sync } from 'nereid'
import { Config } from '.'

declare module 'koishi' {
  interface Context {
    downloads: Downloads
  }
}

type Restart = () => State

export class Downloads extends Service {
  tasks: Record<string, [State, Restart]> = {}

  constructor(
    public ctx: Context,
    public config: Config,
  ) {
    super(ctx, 'downloads')
  }

  refresh() {
    if (this.ctx.console?.downloads) {
      this.ctx.console.downloads.refresh()
    }
  }

  message(text: string) {
    if (this.ctx.console?.downloads) {
      this.ctx.console.downloads.message(text)
    }
  }

  task(name: string, srcs: string[], bucket: string, options?: ResolveOptions): State {
    if (this.tasks[name]) return this.tasks[name][0]
    const restart = () => {
      const state = sync(srcs, bucket, {
        ...options,
        output: this.config.output,
      })
      state.on('check/start', () => {
        this.message(`正在检查 ${name}`)
        this.refresh()
      })
      state.on('check/failed', (error) => {
        this.message(error.message)
        this.refresh()
      })
      state.on('download/start', () => {
        this.message(`${name} 开始下载`)
        this.refresh()
      })
      state.on('download/done', () => {
        this.message(`${name} 下载完成`)
        this.refresh()
      })
      state.on('download/failed', (error) => {
        this.message(error.message)
        this.refresh()
      })
      state.on('download/composable/start', (composable) => {
        this.message(`${composable.hash} 开始下载`)
        this.refresh()
      })
      state.on('download/composable/retry', (composable) => {
        this.message(`${composable.hash} 将重试`)
        this.refresh()
      })
      state.on('download/composable/done', (composable) => {
        this.message(`${composable.hash} 下载成功`)
        this.refresh()
      })
      state.on('link/start', () => this.refresh())
      state.on('link/done', () => this.refresh())
      state.on('link/failed', (error) => {
        this.message(error.message)
        this.refresh()
      })
      state.on('done', () => {
        this.message(`${name} 下载成功`)
        this.refresh()
      })
      return state
    }
    const state = restart() 
    this.tasks[name] = [state, restart]
    const current: Context = this[Context.current]
    current.collect('tasks', () => {
      const task = this.tasks[name]
      if (!task) return false
      if (task[0].status !== 'done') {
        task[0].cancel()
      }
      delete this.tasks[name]
      this.refresh()
      return true
    })
    this.refresh()
    return state
  }
}
