# koishi-plugin-downloads

koishi-plugin-downloads 为 Koishi 提供了下载服务，用于 Koishi 启动后在后台下载文件，并在控制台展示与管理。

## nereid

koishi-plugin-downloads 使用了 [nereid](https://github.com/Anillc/nereid) 作为下载库，提供了下载的分片、从多个下载源下载文件、文件完整性检查、断点续传等功能，优化了访问性、下载速度等问题。

## 构建源

使用 nereid 下载文件之前，需要构建源，将源部署到不同的下载服务提供商后，即可通过 downloads 插件的 API 进行下载。

```bash
mkdir resource && cd resource
yarn init -y && yarn add -D nereid-cli
mkdir bucket1
mkdir bucket2
# 将你的文件放入这些文件夹中，一个源内可以有多个 bucket
yarn nereid-cli build bucket1
yarn nereid-cli build bucket2
```

此时将会生成一个名为 nereid 的目录。

需要注意的是，每个 bucket 必须是文件夹，在插件中完成下载后将会获得下载完成的目录的地址。

## 部署源

### http

如果你有可以提供 http 服务的服务器，或者使用 [alist](https://github.com/alist-org/alist) 等服务，将构建好的 nereid 目录下所有内容上传至服务器上即可。此时的下载链接即为下载源。

下载源链接示例: `https://example.com/foo/bar`

### npm

::: warning
使用 npm 作为下载源可能会造成一定程度的滥用，请谨慎使用，珍惜 npm 账号。
:::

你也可以使用 npm 作为下载源。在构建好 nereid 目录后，使用 `yarn nereid-cli pub <package name> --token <npm token>` 即可上传到 npm 中。

下载源链接示例: `npm://@foo/bar`

如果你想要使用 `https://registry.npmjs.com` 以外的 registry, 可以使用 registry 参数:

`npm://foobar?registry=https://registry.npmmirror.com`

### file

使用本地文件作为下载源可以作为下载的测试。

示例: `file:///foo/bar`

## 使用 downloads 插件下载

以下是使用 downloads 插件下载文件的示例:

```typescript
import { Context } from 'koishi'
import {} from 'koishi-plugin-downloads'

export const using = ['downloads']

export function apply(ctx: Context) {
  const task1 = ctx.downloads.nereid('task1', [
    'npm://@foo/bar',
    'npm://@foo/bar?registry=https://registry.npmmirror.com',
    'https://example.com/foo/bar',
  ], 'bucket1')
  const task2 = ctx.downloads.nereid('task2', [
    'npm://@foo/bar',
    'npm://@foo/bar?registry=https://registry.npmmirror.com',
    'https://example.com/foo/bar',
  ], 'bucket2')
  task1.promise.then((path) => {
    console.log(path)
  })
  task2.promise.then((path) => {
    console.log(path)
  })
}
```

当下载完成时将会 resolve promise。需要注意的是，如果下载始终未能完成，promise 也不会失败。
