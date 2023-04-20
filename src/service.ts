import { Context } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { ResolveOptions, State, sync } from 'nereid'
import { debounce } from 'throttle-debounce'
import { Config } from '.'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      downloads: Downloads
    }
  }

  interface Events {
    'download/start'(name: string): void
    'download/pause'(name: string): void
    'download/message'(text: string): void
  }
}

export interface ClientTask {
  name: string
  progress: number
  status: State['status']
}

const clearMessage = debounce(3000, (ctx: Context) => {
  ctx.console.broadcast('download/message', '')
})

type Restart = () => State

export class Downloads extends DataService<ClientTask[]> {
  tasks: Record<string, [State, Restart]> = {}

  constructor(public ctx: Context, public config: Config) {
    super(ctx, 'downloads')
    ctx.console.addListener('download/start', (name) => {
      const task = this.tasks[name]
      if (!task) return
      if (['failed', 'canceled'].includes(task[0].status)) {
        this.tasks[name] = [task[1](), task[1]]
        this.refresh()
      } else {
        this.tasks[name]?.[0].resume()
        this.refresh()
      }
    }, { authority: 3 })
    ctx.console.addListener('download/pause', (name) => {
      this.tasks[name]?.[0].pause()
      this.refresh()
    }, { authority: 3 })
  }

  start(): void {
    this.task('www', [], 'xxx')
  }

  task(name: string, srcs: string[], bucket: string, options?: ResolveOptions): State {
    const restart = () => {
      return sync(srcs, bucket, {
        ...options,
        output: this.config.output,
      })
    }
    const state = restart()
    this.tasks[name] = [state, restart]
    this.refresh()
    return state
  }

  message(text: string) {
    this.ctx.console.broadcast('download/message', text)
    clearMessage(this.ctx)
  }

  async get() {
    return Object.entries(this.tasks).map(([name, [task]]) => ({
      name,
      progress: task.progress(),
      status: task.status,
    }))
  }
}
