import Home from './routes/index.svelte'
import Chat from './routes/chat.svelte'
import Events from './routes/events.svelte'
import EventDetail from './routes/events/detail.svelte'
import EditEvent from './routes/events/edit.svelte'
import AddEvent from './routes/events/add.svelte'
import Settings from './routes/settings.svelte'
import NotFound from './routes/notFound.svelte'

export default {
    '/': Home,
    '/chat': Chat,
    '/settings': Settings,
    '/events': Events,
    '/events/add': AddEvent,
    '/events/edit/:slug': EditEvent,
    '/events/:slug': EventDetail,
    '*': NotFound,
}
