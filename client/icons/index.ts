import { icons } from '@koishijs/client'
import Play from './play.vue'
import Pause from './pause.vue'
import Download from './download.vue'
import Open from './open.vue'

icons.register('activity:download', Download)
icons.register('folder-open', Open)

export { Play, Pause }