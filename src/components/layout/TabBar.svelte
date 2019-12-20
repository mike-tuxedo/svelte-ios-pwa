<script>
	import {link, push, pop, replace, location, querystring} from 'svelte-spa-router'
	import active from 'svelte-spa-router/active'
    import IoIosSend from 'svelte-icons/io/IoIosSend.svelte'
    import IoIosCalendar from 'svelte-icons/io/IoIosCalendar.svelte'
    import IoIosSettings from 'svelte-icons/io/IoIosSettings.svelte'
</script>

<span class="wrapper">
    <a use:link use:active={'/chat*'} href="/chat"><span class="linkIcon"><IoIosSend/></span><div>Chat</div></a>
	<a use:link use:active={'/events*'} href='/events'><span class="linkIcon"><IoIosCalendar/></span><div>Events</div></a>
	<a use:link use:active={'/settings*'} href='/settings'><span class="linkIcon"><IoIosSettings/></span><div>Settings</div></a>
</span>

<style type="text/scss">
	.wrapper {
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

        .linkIcon {
            display: inline-block;
            width: 28px;
            height: 28px;
        }
        div {
            margin-top: -5px;
        }
	}
	:global(a.active) {
		color: var(--blue);
	}
</style>
