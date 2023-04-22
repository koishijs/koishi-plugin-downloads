import { Context } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { State } from 'nereid'
import { debounce } from 'throttle-debounce'
import open from 'open'
import { Config } from '.'

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      downloads: ClientDownloads
    }
  }

  interface Events {
    'download/start'(name: string): void
    'download/pause'(name: string): void
    'download/message'(text: string): void
    'download/open-folder'(): void
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

export class ClientDownloads extends DataService<ClientTask[]> {
  static using = ['console', 'downloads']

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
    ctx.console.addListener('download/open-folder', () => {
      open(config.output)
    }, { authority: 3 })
  }

  start() {
    this.ctx.setInterval(() => {
      this.refresh()
    }, 3000)
  }

  message(text: string) {
    this.ctx.console.broadcast('download/message', text)
    clearMessage(this.ctx)
  }

  get tasks() {
    return this.ctx.downloads.tasks
  }

  async get() {
    return Object.entries(this.tasks).map(([name, [task]]) => ({
      name,
      progress: task.progress(),
      status: task.status,
    }))
  }
}
