<script>
	import { push } from 'svelte-spa-router';
	import { navConfig, events } from '../../stores.js';
	import { formatToInputDateTime } from '../../utils/datetime.js';

	import FullPage from '../../components/layout/FullPage.svelte';
	import Headline from '../../components/Headline.svelte';
	import InputGroup from '../../components/InputGroup.svelte';
	import Input from '../../components/Input.svelte';
	import Button from '../../components/Button.svelte';
	import Loading from '../../components/Loading.svelte';

	$navConfig = {
		type: 'editpage',
		title: 'Edit event',
		tools: [],
		actions: {
			update: () => update()
		}
	}

	export let params = {}
	const  { slug } = params;
	let event = $events.find(event => event.id === slug);

	let loading = false;
	let error = false;
	let title = event.title || '';
	let location = event.location || '';
	let description = event.description || '';
	let startDate = formatToInputDateTime(event.startDate);
	let endDate = formatToInputDateTime(event.endDate);
	let startTime = event.startTime;
	let endTime = event.endTime;
	let type = event.type;

	const update = () => {
        loading = true;

        startDate = startDate ? new Date(startDate) : new Date();
        endDate = endDate && endDate > startDate ? new Date(endDate) : new Date(startDate);
        const month = startDate.getMonth();

        const data = {
            "id": Date.now().toString(),
            "title": title,
            "location": location,
            "description": description,
            "startDate": startDate,
            "endDate": endDate,
            "startTime": startTime,
            "endTime": endTime,
            "type": type,
            "month": month
        };

        let event = $events.find((event, id) => {
            if (event.id === slug) {
                $events[id] = data;
            }
        });

        setTimeout(()=> {
            push('/events');
        }, 1000)
	}
</script>

<style>

</style>

<svelte:head>
	<title>Edit event</title>
</svelte:head>

<FullPage>
	{#if error}<div class="error">Error.</div>{/if}
	{#if loading}<Loading />{/if}

    <Headline>Location</Headline>
    <InputGroup>
        <Input type="text" bind:value={title} placeholder="Name"/>
        <Input type="text"  bind:value={location} placeholder="Address"/>
        <Input type="textarea"  bind:value={description} placeholder="Description"/>
        <Input type="date" bind:value={startDate} placeholder="From" size="half" pos="left"/>
        <Input type="date" bind:value={endDate} placeholder="To" size="half" pos="right"/>
        <Input type="time" bind:value={startTime} placeholder="Starttime" size="half" pos="left"/>
        <Input type="time" bind:value={endTime} placeholder="Endtime" size="half" pos="right"/>
    </InputGroup>
</FullPage>
