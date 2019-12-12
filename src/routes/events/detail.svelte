<script>
	import SubPage from '../../components/layout/SubPage.svelte';
	import { navConfig, events } from '../../stores.js';
	import { formatToReadable } from '../../utils/datetime.js';

	$navConfig = {
		type: 'subpage',
		title: 'Event detail',
		tools: []
	}

	export let params;
	const  { slug } = params;
	let event = $events.find(event => event.id === slug);
</script>

<svelte:head>
	<title>Event detail</title>
</svelte:head>

<SubPage>
{#if event}
	<h3>Event</h3>
	<div class="group">
		<p><strong>Title:</strong><br>{event.title}</p>
		{#if event.location}<p><strong>Location:</strong><br>{event.location}</p>{/if}
		{#if event.description}<p><strong>Description:</strong><br>{event.description}</p>{/if}
	</div>
	<h3>Date/Time</h3>
	<div class="group">
        {#if event.startDate}<p class="half left"><strong>From:</strong><br> {formatToReadable(event.startDate)}</p>{/if}
        {#if event.endDate}<p class="half right"><strong>To:</strong><br> {formatToReadable(event.endDate)}</p>{/if}
        {#if event.startTime}<p class="half left"><strong>Starttime:</strong><br> {formatToReadable(event.startTime)}</p>{/if}
        {#if event.endTime}<p class="half right"><strong>Endtime:</strong><br> {formatToReadable(event.endTime)}</p>{/if}
	</div>
{/if}
</SubPage>

<style type="text/scss">
h3 {
	width: 100%;
	padding: 30px 0 0 0;
	color: var(--gray);
	float: left;
	clear: both;

	&:first-child {
		padding: 20px 0 0 0;
	}
}
p, a {
	display: block;
	margin: 0;
	padding: 8px 10px;
	min-height: 44px;
	line-height: 22px;
	text-decoration: none;
	float: left;
	width: 100%;
    box-sizing: border-box;
	background: var(--white);
}
.group {
	position: relative;
	width: 100vw;
	margin: 0 -8px;
	background: var(--white);
    border-top: 1px solid var(--borderGray);
    border-bottom: 1px solid var(--borderGray);
    box-sizing: border-box;
	float: left;

	&:after {
		content: '';
		position: absolute;
		width: 100%;
		height: 2px;
		bottom: 0;
	    background: var(--white);
	}
}
p.half {
	float: left;
    width: 50%;
}

</style>
