import { promises as fsp } from 'fs'
import { Context, Service } from 'koishi'
import { ResolveOptions } from 'nereid'
import { NereidTask, NormalTask, Task } from './tasks'
import { Config } from '.'

declare module 'koishi' {
  interface Context {
    downloads: Downloads
  }
}
export class Downloads extends Service {
  tasks: Record<string, Task> = {}

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

  async start() {
    await fsp.mkdir(this.config.output, { recursive: true })
  }
  
  nereid(name: string, srcs: string[], bucket: string, options?: Omit<ResolveOptions, 'output'>): NereidTask {
    if (this.tasks[name]) return this.tasks[name] as any
    const task = new NereidTask(name, this, srcs, bucket, {
      ...options,
      output: this.config.output,
    })
    this.register(name, task)
    return task
  }

  normal(name: string, url: string, filename: string, headers?: Record<string, string>, timeout?: number) {
    if (this.tasks[name]) return this.tasks[name] as any
    const task = new NormalTask(
      name, this, this.config.output, url,
      this.ctx.http, headers, filename, timeout
    )
    this.register(name, task)
    return task
  }

  private register(name: string, task: Task) {
    this.tasks[name] = task
    task.restart()
    this.caller.collect('tasks', () => {
      const task = this.tasks[name]
      if (!task) return false
      task.cancel()
      delete this.tasks[name]
      this.refresh()
      return true
    })
    this.refresh()
  }
}
