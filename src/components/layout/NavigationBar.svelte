<script>
	import { navConfig, activeFilter, role } from '../../stores.js';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import Icon from '../Icon.svelte';

	const titleLeft = tweened(1, {
		duration: 600,
		easing: cubicOut
	});
	const subTitleLeft = tweened(1, {
		duration: 600,
		easing: cubicOut
	});


	let pageTitlePos = '';
	let fadeOptions = {duration: 100};
	let subTitleFlyOptions = {x: 320, duration: 600, opacity: 1}

	let pageTitle = '';
	let subPageTitle = '';
	let prevPageType = 'page';

	const back = () => {
		if ($navConfig.type !== 'page') window.history.back();
	}

	$: if($navConfig.title) {
		if ($navConfig.type === 'subpage') {
			subPageTitle = $navConfig.title;
		} else {
			pageTitle = $navConfig.title;
		}

		if ($navConfig.type === 'page' && prevPageType === 'subpage') {
			$titleLeft = 1;
			$subTitleLeft = 0;
			pageTitlePos = '';
		} else if ($navConfig.type === 'subpage') {
			$titleLeft = 0;
			$subTitleLeft = 1;
			pageTitlePos = 'left';
		} else {
			$titleLeft = 1;
			$subTitleLeft = 0;
			pageTitlePos = '';
		}

		prevPageType = $navConfig.type;
	}

	onMount(() => {
		subTitleFlyOptions = {x: window.innerWidth, duration: 600, opacity: 1};
	})
</script>

<nav>
	<div class="title {pageTitlePos}" style="transform: translateX(-{$titleLeft*50}%); left: {$titleLeft*50}vw;" on:click={back}>
	{#if ($navConfig.type === 'subpage')}<Icon name="back"/>{/if}
	{pageTitle}
	</div>
	<div class="subTitle" style="left: -{$subTitleLeft*100}vw">{subPageTitle}</div>

	{#if ($navConfig.type === 'createpage')}
		<div class="save right" transition:fade="{fadeOptions}" on:click={$navConfig.actions.save}>Save</div>
		<div class="back left" transition:fade="{fadeOptions}" on:click={back}>Cancel</div>
	{/if}

	{#if ($navConfig.type === 'editpage')}
		<div class="save right" transition:fade="{fadeOptions}" on:click={$navConfig.actions.update}>Save</div>
		<div class="cancel left" transition:fade="{fadeOptions}" on:click={back}>Cancel</div>
	{/if}

	{#if (pageTitle === 'Links' && $navConfig.type === 'page')}
		<div class="add right" transition:fade="{fadeOptions}" on:click={$navConfig.actions.add}><Icon name="add" active={true}/></div>
	{:else if pageTitle === 'Events' && $navConfig.type === 'page'}
		<div class="add right" transition:fade="{fadeOptions}" on:click={$navConfig.actions.add}><Icon name="add" active={true}/></div>
	{/if}
</nav>

<style type="text/scss">
	nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 11;
		min-height: 44px;
		background: var(--white-glass-fallback);
		border-bottom: 1px solid var(--border-bars);

        @supports (backdrop-filter: blur(10px)) {
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
            background: var(--white-glass);
        }
	}
	.row1 {
		height: 44px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	div {
		position: absolute;
		font-size: 16px;
	    line-height: 44px;
		white-space: nowrap;

		&.left {
			left: 8px;
			color: var(--blue);
		}
		&.right {
			right: 8px;
			color: var(--blue);
		}
		&.subTitle {
			margin-left: 150vw;
			transform: translateX(-50%);
		}
		&.title {
			&.left {
				display: inline-flex;
				align-items: center;
				color: var(--blue);
			}
		}
	}
</style>
