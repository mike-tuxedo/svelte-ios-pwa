<script>
	import { navConfig, darkmode } from '../stores.js';
	import Page from '../components/layout/Page.svelte';
	import Input from '../components/Input.svelte';
	import Headline from '../components/Headline.svelte';
	import InputGroup from '../components/InputGroup.svelte';

	const switchTheme = () => {
		$darkmode = !$darkmode;
	};

	$navConfig = {
		type: 'page',
		title: 'Settings',
		tools: []
	};
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<Page>
	<Headline>Change theme</Headline>
	<InputGroup>
		<Input on:change={switchTheme} type="checkbox" text="Dark Theme" checked={$darkmode}/>
	</InputGroup>
</Page>

<style>
	div {
		height: 10px;
	    clear: both;
	}
	span {
		display: block;
		margin: 0 auto;
		width: 240px;
	}
</style>
