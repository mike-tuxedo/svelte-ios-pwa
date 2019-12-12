<script>
	import routes from './routes.js';
	import Router from 'svelte-spa-router';
	import { darkmode } from './stores.js';
	import { onMount } from 'svelte';
	import NavigationBar from './components/layout/NavigationBar.svelte';
	import TabBar from './components/layout/TabBar.svelte';
	import Button from './components/Button.svelte';
	import IsOnline from './components/IsOnline.svelte';

	onMount(() => {
		if ("serviceWorker" in navigator) {
		  if (navigator.serviceWorker.controller) {
			console.log("Active service worker found, no need to register");
		  } else {
			navigator.serviceWorker
			  .register("service-worker.js", {
				scope: "./"
			  })
			  .then(reg => {
				console.log("Service worker has been registered for scope: " + reg.scope);
			  });
		  }
		}
	});
</script>

<main>
    <NavigationBar/>
    <Router {routes}/>
    <TabBar/>
</main>
<IsOnline/>

<style type="text/scss">
	main {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}
	div {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}
	input {
		transition: all 0.2s;
		background: var(--white);
		border: none;
		border-bottom: 1px solid var(--blue);
		box-sizing: border-box;
		padding: 10px 20px;
		font-size: 4vw;
		margin-bottom: 20px;
		width: 240px;
		color: var(--typo);

		&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus,
		&:-webkit-autofill:active  {
			-webkit-box-shadow: 0 0 0 30px var(--white) inset !important;
		}
	}
</style>
