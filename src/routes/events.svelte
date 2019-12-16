<script>
    import { push } from 'svelte-spa-router';
    import Page from '../components/layout/Page.svelte';
    import ListItem from '../components/ListItem.svelte';
    import { navConfig, events, activeFilter } from '../stores.js';
    import { monthMap } from '../utils/constants.js';
    import Tabs from '../components/Tabs.svelte';
    import Tab from '../components/Tab.svelte';

    $navConfig = {
        type: 'page',
        title: 'Events',
        tools: ['add'],
        actions: {
            add: () => push('/events/add')
        }
    };

    let prevEvent = new Date();
    let prevMonth = prevEvent.getMonth();
    let preparedEvents = [];

    for(event of $events) {
        const preparedEvent = {...event};
        const date = new Date(preparedEvent.startDate);
        const month = date.getMonth();
        preparedEvent.month = monthMap[month];

        preparedEvents.push(preparedEvent);
    }
</script>

<svelte:head>
	<title>Events</title>
</svelte:head>

<Page>
	{#if preparedEvents.length}
		<div class="tabs">
			<Tabs>
				<Tab on:click={() => $activeFilter = 'all'} active={$activeFilter === 'all'} first>All</Tab>
				<Tab on:click={() => $activeFilter = 'eventsA'} active={$activeFilter === 'eventsA'} >FilterA</Tab>
				<Tab on:click={() => $activeFilter = 'eventsB'} active={$activeFilter === 'eventsB'} last>FilterB</Tab>
			</Tabs>
		</div>

        <span>{preparedEvents[0].month}</span>
		{#each preparedEvents as event, id}
            {#if $activeFilter === 'all' || $activeFilter === event.type}
                <ListItem {...event}></ListItem>
                {#if preparedEvents[id+1] && preparedEvents[id+1].month !== event.month}
                    <span>{preparedEvents[id+1].month}</span>
                {/if}
			{/if}
		{/each}
	{/if}
</Page>

<style>
.tabs {
	padding: 10px 0;
}
span {
	display: block;
	padding: 10px 0 4px 4px;
    color: var(--gray);
}
</style>
