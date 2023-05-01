import { ResolveOptions, State, sync } from 'nereid'
import { Downloads } from './service'

export type Status = 'warning' | 'exception' | 'success'
export type Button = 'play' | 'pause' | 'none'

export interface Task {
  name: string
  downloads: Downloads
  status: Status
  button: Button
  indeterminate: boolean
  progress: number
  restart(): void
  pause(): void
  cancel(): void
}

export class NereidTask implements Task {
  state: State

  constructor(
    public name: string,
    public downloads: Downloads,
    public srcs: string[],
    public bucket: string,
    public options: ResolveOptions,
  ) {}

  get progress() {
    return this.state?.progress() || 0
  }

  get status() {
    if (this.indeterminate) return 'warning'
    switch (this.state?.status) {
      case 'downloading':
      case 'checking':
      case 'linking':
      case 'pause':
        return null
      case 'canceled':
      case 'failed':
        return 'exception'
      case 'done':
        return 'success'
      default:
        return 'exception'
    }
  }

  get button() {
    switch (this.state?.status) {
      case 'downloading':
      case 'checking':
        return 'pause'
      case 'canceled':
      case 'failed':
      case 'pause':
        return 'play'
      // case 'linking':
      // case 'done':
      default:
        return 'none'
    }
  }

  get indeterminate() {
    return ['checking', 'linking'].includes(this.state?.status)
  }

  pause() {
    this.state?.pause()
  }

  cancel() {
    if (!this.state || this.state.status === 'done') return
    this.state.cancel()
  }

  restart() {
    if (this.state?.status === 'pause') {
      this.state.resume()
      return
    }
    const state = sync(this.srcs, this.bucket, this.options)
    state.on('check/start', () => {
      this.downloads.message(`正在检查 ${this.name}`)
      this.downloads.refresh()
    })
    state.on('check/failed', (error) => {
      this.downloads.message(error.message)
      this.downloads.refresh()
    })
    state.on('download/start', () => {
      this.downloads.message(`${this.name} 开始下载`)
      this.downloads.refresh()
    })
    state.on('download/done', () => {
      this.downloads.message(`${this.name} 下载完成`)
      this.downloads.refresh()
    })
    state.on('download/failed', (error) => {
      this.downloads.message(error.message)
      this.downloads.refresh()
    })
    state.on('download/composable/start', (composable) => {
      this.downloads.message(`${composable.hash} 开始下载`)
      this.downloads.refresh()
    })
    state.on('download/composable/retry', (composable) => {
      this.downloads.message(`${composable.hash} 将重试`)
      this.downloads.refresh()
    })
    state.on('download/composable/done', (composable) => {
      this.downloads.message(`${composable.hash} 下载成功`)
      this.downloads.refresh()
    })
    state.on('link/start', () => this.downloads.refresh())
    state.on('link/done', () => this.downloads.refresh())
    state.on('link/failed', (error) => {
      this.downloads.message(error.message)
      this.downloads.refresh()
    })
    state.on('done', () => {
      this.downloads.message(`${this.name} 下载成功`)
      this.downloads.refresh()
    })
    this.state = state
  }
}
