<script>
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';

	let flyOptions = { x: window.innerWidth, duration: 600, opacity: 1, easing: expoOut }
</script>

<style>
div {
    position: fixed;
	z-index: 2;
	top: 0;
	bottom: 0;
	overflow-x: hidden;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
	width: 100vw;
	padding: 55px 8px 70px 8px;
	box-sizing: border-box;
	background: var(--lightGray);
	box-shadow: -15px 38px 15px -15px rgba(0,0,0,0.5);
}
div::-webkit-scrollbar {
    display: none;
}
</style>

<div in:fly="{flyOptions}" out:fly="{flyOptions}">
    <slot></slot>
</div>
