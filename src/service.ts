import { promises as fsp } from 'fs'
import { Context, Service } from 'koishi'
import { ResolveOptions } from 'nereid'
import { NereidTask, SimpleTask, Task } from './tasks'
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
    this.ctx.inject(['console'], ctx => {
      if (ctx.console.downloads) {
        this.ctx.console.downloads.refresh()
      }
    })
  }

  message(text: string) {
    this.ctx.inject(['console'], ctx => {
      if (ctx.console.downloads) {
        this.ctx.console.downloads.message(text)
      }
    })
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

  private simple(name: string, url: string, filename: string, options: {
    headers?: Record<string, string>,
    timeout?: number,
    hashMode?: string,
    hash?: string
  } = {}): SimpleTask {
    if (this.tasks[name]) return this.tasks[name] as any
    const task = new SimpleTask(
      name, this, this.config.output, url,
      this.ctx.http, options.headers, filename,
      options.timeout, options.hashMode, options.hash,
    )
    this.register(name, task)
    return task
  }

  private register(name: string, task: Task) {
    this[Context.current].effect(() => {
      this.tasks[name] = task
      task.restart()
      this.refresh()
      return () => {
        const task = this.tasks[name]
        if (!task) return
        task.cancel()
        delete this.tasks[name]
        this.refresh()
      }
    })
  }
}
