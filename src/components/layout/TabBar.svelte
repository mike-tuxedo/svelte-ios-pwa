<script>
	import {link, push, pop, replace, location, querystring} from 'svelte-spa-router'
	import active from 'svelte-spa-router/active'
	import Icon from '../Icon.svelte';
</script>

<span>
	<a use:link use:active={'/events*'} href='/events'><Icon size={22} name="calendar"/><div>Events</div></a>
	<a use:link use:active={'/settings*'} href='/settings'><Icon size={22} name="settings"/><div>Settings</div></a>
</span>

<style type="text/scss">
	span {
		display: flex;
	    align-items: center;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 5;
		height: 49px;
		border-top: 1px solid var(--border-bars);
		background: var(--white-glass-fallback);

		@supports (backdrop-filter: blur(10px)) {
			-webkit-backdrop-filter: blur(10px);
			backdrop-filter: blur(10px);
			background: var(--white-glass);
		}
	}
	a {
		width: 33.33%;
		text-align: center;
		font-size: 11px;
		text-decoration: none;
	}
	:global(a.active) {
		color: var(--blue);
	}
</style>
