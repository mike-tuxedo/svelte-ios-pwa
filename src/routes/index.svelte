<script>
    import { fly } from 'svelte/transition'
    import { expoOut } from 'svelte/easing'
    import Page from '../components/layout/Page.svelte'
    import Icon from '../components/Icon.svelte'
    import { navConfig } from '../stores.js'

    $navConfig = {
        type: 'page',
        pageTitle: '',
        tools: [],
    }

    let flyOptions = { x: 300, duration: 600, easing: expoOut }
</script>

<style type="text/scss">
    .wrapper {
        padding: 32px 8px 8px 8px;
    }
    h1,
    p {
        text-align: center;
        margin: 0 auto;
    }

    h1 {
        text-align: left;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 6px;
        font-size: 26px;
    }

    h2 {
        font-size: 20px;
        margin-bottom: 60px;
    }

    h3 {
        margin-top: 30px;

        &.link1 {
            margin-left: 10px;
        }
        &.link2 {
            margin-left: 20px;
        }
        &.link3 {
            margin-left: 30px;
        }
    }

    svg {
        width: 100%;
    }

    @media (min-width: 480px) {
        h1 {
            font-size: 4em;
        }
    }
</style>

<Page>
    <div class="wrapper">
        <h1 in:fly={flyOptions}>Hi,</h1>
        <h2 in:fly={flyOptions}>
            at the bottom navigation you find links to ...
        </h2>
        <h3 class="link1" in:fly={{ ...flyOptions, delay: 1500 }}>
            <Icon name="calendar" />
            your events
        </h3>
        <h3 class="link3" in:fly={{ ...flyOptions, delay: 2500 }}>
            <Icon name="settings" />
            and your settings
        </h3>
    </div>
</Page>
