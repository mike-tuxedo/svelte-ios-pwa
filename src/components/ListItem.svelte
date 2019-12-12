<script>
	import { push, link } from 'svelte-spa-router';
	import { spring } from 'svelte/motion';
	import { swipe } from './swipe.js';
	import Loading from './Loading.svelte';
	import { navConfig, events } from '../stores.js';

	export let id, title, location, startDate, endDate, startTime, endTime;

	let isDeleting = false;
	let open = false;
	let startDay = '';
	let endDay = '';

	const coords = spring({ x: 0, y: 0 }, {
		stiffness: 1,
		damping: 1
	});

	function handlePanStart() {
		coords.stiffness = coords.damping = 1;
	}

	function handlePanMove(event) {
		if (Math.abs(event.detail.dx)/2 > Math.abs(event.detail.dy)) {
			coords.update($coords => ({
				x: $coords.x + event.detail.dx,
				y: $coords.y + event.detail.dy
			}));
		}
	}

	function handlePanEnd(event) {
		coords.stiffness = 0.15;
		coords.damping = 0.6;

		if (!open && $coords.x < -50) {
			open = true;
			coords.set({ x: -150, y: 0 });
		} else {
			open = false;
			coords.set({ x: 0, y: 0 });
		}
	}

    const deleteItem = (id) => {
		if (!confirm('Realy delete event?')) return;

		isDeleting = true;
        const newEvents = $events.filter(event => event.id !== id);
        $events = [...$events, newEvents];

        setTimeout(()=> {
            isDeleting = falseM
        }, 1000)
	}

	$: if (startDate) {
		let date = new Date(startDate);
		startDay = date.getDate();
	}
	$: if (endDate) {
		let date = new Date(endDate);
		endDay = date.getDate();
	}
</script>

<div class="listitem" on:click>
	<div class="options">
        <a use:link href="/events/edit/{id}">
			edit
		</a>
        <a href="/events" on:click|preventDefault={() => deleteItem(id)}>
		{#if isDeleting}
			<Loading />
		{:else}
			delete
		{/if}
		</a>
	</div>
	<div class="box"
    	use:swipe
    	on:panstart={handlePanStart}
    	on:panmove={handlePanMove}
    	on:panend={handlePanEnd}
    	style="transform: translate({$coords.x}px);"
		on:click={() => push(`/events/${id}`)}
    >
		<div class="shortDate">{startDay}. {#if startDay !== endDay} - {endDay}.{/if}</div>
		<div class="shortDescription">
			{#if title}<h4>{title}</h4>{/if}
        	{#if location}<p>{location}</p>{/if}
		</div>
        <slot></slot>
    </div>
</div>

<style>
	.listitem {
		position: relative;
		height: 70px;
		border-bottom: 1px solid var(--border);
	}
	.box {
		--width: 100%;
		--height: 100%;
		position: absolute;
		width: var(--width);
		height: var(--height);
		left: calc(50% - var(--width) / 2);
		top: calc(50% - var(--height) / 2);
		background: var(--white);
		cursor: move;
	}
	.shortDate {
		background: var(--blue);
		color: var(--white);
		float: left;
		width: 70px;
		height: var(--height);
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 14px;
	}
	.shortDescription {
		float: left;
		width: calc(100% - 70px);
		height: var(--height);
		padding: 5px;
		box-sizing: border-box;
	}
	h4 {
		margin: 0;
		font-weight: 600;
		font-size: 15px;
	}
	p {
		margin: 0;
	}
	.options {
		position: absolute;
		height: 100%;
		width: 150px;
		right: 0;
		background-image: linear-gradient(-90deg, var(--red) 0%, var(--red) 50%, var(--yellow) 50%, var(--yellow) 100%);
	}
    .options a {
		display: flex;
		justify-content: center;
		align-items: center;

        width: 50%;
        height: 100%;
        float: left;
		text-decoration: none;
		color: #ffffff;
    }
</style>
