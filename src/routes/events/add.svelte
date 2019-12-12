<script>
	import { push } from 'svelte-spa-router';
	import FullPage from '../../components/layout/FullPage.svelte';
	import { navConfig, events } from '../../stores.js';
	import Headline from '../../components/forms/Headline.svelte';
	import InputGroup from '../../components/forms/InputGroup.svelte';
	import Input from '../../components/forms/Input.svelte';
	import Button from '../../components/Button.svelte';
	import Loading from '../../components/Loading.svelte';

	let calendarType = '';
	let title = '';
	let location = '';
	let description = '';
	let startDate = '';
	let endDate = '';
	let startTime = '';
	let endTime = '';
	let loading = false;

	$navConfig = {
		type: 'createpage',
		title: 'Add event',
		tools: [],
		actions: {
			save: () => save()
		}
	}

	const save = () => {
        if (!calendarType.length) {
            alert('First set calendartype');
            return;
        }

        const date = new Date(startDate);
        const month = date.getMonth();

		const data = {
		    "id": Date.now().toString(),
			"title": title,
			"location": location,
			"description": description,
			"startDate": startDate,
			"endDate": endDate,
			"startTime": startTime,
			"endTime": endTime,
            "type": calendarType,
            "month": month
		};

        $events = [...$events, data];
        loading = true;
        setTimeout(()=> {
            push('/events');
        }, 1000)
	}
</script>

<svelte:head>
	<title>Add event</title>
</svelte:head>

<FullPage>
	{#if loading}<Loading />{/if}

	<Headline>Kalender</Headline>
	<InputGroup>
		<Input type="radio" bind:group={calendarType} value="eventsA" text="FilterA"/>
		<Input type="radio" bind:group={calendarType} value="eventsB" text="FilterB"/>
	</InputGroup>

	{#if calendarType}
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
	{/if}
</FullPage>
