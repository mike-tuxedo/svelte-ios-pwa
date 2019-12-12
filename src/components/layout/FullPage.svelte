<script>
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';

	let flyOptions = { y: window.innerHeight, duration: 600, opacity: 1, easing: expoOut }
</script>

<style>
div {
    position: fixed;
	z-index: 6;
	top: 0;
	bottom: 0;
	overflow-x: hidden;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
	width: 100vw;
	padding: 45px 8px 8px 8px;
	box-sizing: border-box;
	background: var(--lightGray);
}
div::-webkit-scrollbar {
    display: none;
}
</style>

<div in:fly="{flyOptions}" out:fly="{flyOptions}">
    <slot></slot>
</div>
