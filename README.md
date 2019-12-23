## Svelte 3 PWA in iOS style

### What's in the Demo:
- check if device has internet connection
- of course a service-worker build with https://www.pwabuilder.com/ with litte modifications for onlinecheck
- show "update app" modal for the user, by changing serviceworker versionnumber
- iOS titlebar at the top (iOS Navigationbar component)
- iOS navigationbar at the bottom (iOS TabBar component)
- iOS pagetypes to implement custom pageentry/pageleave-animation
- iOS forms (only small selection used in this demo)
- iOS filterbar (iOS tab/tabs component)
- iOS loading
- iOS list with swipeable listitems and options behind them
- added Sass/Scss styling possibility to config
- add, update, delete listitems (events page)
- basic chat-ui with auto growing textarea and autoscroll to last message
- basic theming for a light and a dark theme
- the demo uses localstorage for some custom svelte-stores (find in store.js file)

### Extra libraries used:
 - is-online https://github.com/sindresorhus/is-online
 - sass https://github.com/sass/dart-sass
 - svelte-icons: https://github.com/gibdig/svelte-icons
 - svelte-preprocess: https://github.com/kaisermann/svelte-preprocess
 - svelte-spa-router: https://github.com/ItalyPaleAle/svelte-spa-router


Be aware that there is much room for optimisations in this code. I didn't had time to look at best coding-practice,
i just coded my first ideas down. But nevertheless, i think i've implemented the most important parts for a basic
pwa, so this could be a startingpoint for your iOS-like webapp.

Have fun with https://svelte.dev/
