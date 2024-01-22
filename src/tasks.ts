import { Logger, Quester } from 'koishi'
import { ResolveOptions, State, exists, sync } from 'nereid'
import { resolve } from 'path'
import { Stats, WriteStream, createReadStream, createWriteStream, promises as fsp } from 'fs'
import { createHash } from 'crypto'
import { Downloads } from './service'

const logger = new Logger('downloads')

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
  promise: Promise<string>
}

export class NereidTask implements Task {
  state: State
  promise: Promise<string>
  private resolve: (path: string) => void

  constructor(
    public name: string,
    public downloads: Downloads,
    public srcs: string[],
    public bucket: string,
    public options: ResolveOptions,
  ) {
    this.promise = new Promise((resolve) => this.resolve = resolve)
  }

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
    state.on('done', (path) => {
      this.downloads.message(`${this.name} 下载成功`)
      this.downloads.refresh()
      this.resolve(path)
    })
    this.state = state
  }
}

export class SimpleTask implements Task {
  current = 0
  total = -1

  status: Status
  button: Button
  indeterminate: boolean

  path: string
  stream: WriteStream

  abort: AbortController
  promise: Promise<string>
  private resolve: (path: string) => void

  constructor(
    public name: string,
    public downloads: Downloads,
    public prefix: string,
    public url: string,
    public http: Quester,
    public headers: Record<string, string> = {},
    public filename: string,
    public timeout?: number,
    public hashMode?: string,
    public hash?: string
  ) {
    this.path = resolve(this.prefix, this.filename)
    this.promise = new Promise((resolve) => this.resolve = resolve)
  }

  get progress() {
    if (this.total === -1) return 0
    return this.current / this.total
  }

  async restart() {
    if (this.abort) this.abort.abort()
    this.setStatus('warning', 'none', true)
    this.abort = new AbortController()
    let headers: Record<string, any>
    let stat: Stats
    try {
      const response = await this.http.axios({
        url: this.url,
        method: 'HEAD',
        headers: this.headers,
        timeout: this.timeout,
        signal: this.abort.signal,
      })
      headers = response.headers
      stat = await fsp.stat(this.path)
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        this.setStatus('exception', 'play', false)
        logger.error(error)
        return
      }
    }
    const length = headers['content-length']
    if (length) {
      this.total = +length
    }
    if (stat) {
      this.current = stat.size
      if (this.total === -1) {
        this.total = this.current
      }
      if (await this.verify()) {
        this.setStatus('success', 'none', false)
        this.resolve(this.path)
        return
      }
    }
    try {
      const headersWithRange = { ...this.headers }
      if (this.current !== 0) headersWithRange['Range'] = `bytes=${this.current}-`
      const response = await this.http.axios({
        url: this.url,
        method: 'GET',
        headers: headersWithRange,
        responseType: 'stream',
        timeout: this.timeout,
        signal: this.abort.signal,
      })
      this.setStatus(null, 'pause', false)
      if (response.status === 200) {
        if (this.stream)
          await new Promise(resolve => this.stream.close(resolve))
        await fsp.rm(this.path, { force: true })
        this.stream = createWriteStream(this.path)
        this.current = 0
      }
      if (!this.stream) this.stream = createWriteStream(this.path)
            response.data.on('data', data => {
        if (typeof data === 'string') data = Buffer.from(data)
        this.stream.write(data)
        this.current += data.byteLength
      })
      response.data.on('end', () => {
        this.stream.end()
        if (this.total === -1) {
          this.total = this.current
        }
        this.setStatus('success', 'none', false)
        this.resolve(this.path)
      })
      response.data.on('error', (error) => {
        if (error?.code !== 'ERR_CANCELED') {
          this.setStatus('exception', 'play', false)
          logger.error(error)
        }
      })
    } catch(error) {
      this.setStatus('exception', 'play', false)
      logger.error(error)
    }
  }

  pause() {
    this.abort?.abort()
    this.setStatus(null, 'play', false)
  }

  async cancel() {
    this.abort?.abort()
    if (this.stream)
      await new Promise(resolve => this.stream.close(resolve))
    if (!await this.verify()) {
      await fsp.rm(this.path, { force: true })
      this.current = 0
      this.setStatus('exception', 'play', false)
    }
  }

  async verify() {
    try {
      const stat = await fsp.stat(this.path)
      if (stat.size !== this.total) return false
      if (!this.hashMode) return true
      const stream = createReadStream(this.path)
      const hasher = createHash(this.hashMode)
      const hash = await new Promise<string>((resolve, reject) => {
        stream.pipe(hasher).on('finish', () => {
          resolve(hasher.digest('hex'))
        }).on('error', reject)
      })
      return hash === this.hash
    } catch (error) {
      return false
    }
  }

  private setStatus(status: Status, button: Button, indeterminate: boolean) {
    this.status = status
    this.button = button
    this.indeterminate = indeterminate
    this.downloads.refresh()
  }
}
