<script>
    import Page from '../components/layout/Page.svelte'
    import {
        navConfig,
        messages,
    } from '../stores.js'
    import {fade} from 'svelte/transition'
    import {onMount} from 'svelte'
    import Loading from '../components/Loading.svelte'
    import Button from '../components/Button.svelte'
    import IoMdSend from 'svelte-icons/io/IoMdSend.svelte'

    $navConfig = {
        type: 'page',
        title: 'Chat',
        tools: [],
        actions: {},
    }

    let messageText = ''
    let textarea
    let inputWrapper
    let loading = true
    let error = false

    const dateFormater = new Intl.DateTimeFormat('en', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
    })

    const resetInputField = () => {
        messageText = ''
        textarea.style.height = ''
    }

    // Saves a new message to your Cloud Firestore database.
    const sendMessage = () => {
        loading = true
        setTimeout(()=> {
            $messages = [...$messages, messageText]
            messageText = ''
            loading = false;
        }, 1000)
    }

    $: if (messageText && textarea) {
        textarea.style.height = ''
        textarea.style.height = textarea.scrollHeight + 'px'
    }

    $: if ($messages) loading = false

    onMount(() => {
        textarea = document.querySelector('textarea')
        inputWrapper = document.querySelector('.inputWrapper')
    })
</script>

<style lang="scss">
    .messages {
        height: 100%;
        overflow: auto;
        transform: rotateZ(180deg);
    }

    .messagesInner {
        transform: rotateZ(180deg);
    }

    .message {
        width: 70%;
        height: auto;
        margin: 20px 0 20px 20%;
        padding: 10px 0;
        border: 1px solid var(--border);
        border-bottom-left-radius: 12px;
        border-top-left-radius: 12px;
        border-bottom-right-radius: 12px;
        padding: 8px;
        background: var(--blue);

        &__from {
            font-size: 10px;
            color: var(--lightGray);
        }

        &__content {
            color: var(--white);
        }
    }

    .inputWrapper {
        position: fixed;
        bottom: 50px;
        width: 100vw;
        margin-left: -8px;
        padding: 10px;
        box-sizing: border-box;
        background: var(--lightGray);
    }

    textarea {
        height: 26px;
        max-height: 300px;
        padding: 0 4px;
        margin: 0;
        resize: none;
        border-radius: 4px;
        border: 1px solid var(--borderGray);
        font-family: Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        line-height: 24px;
        width: calc(100% - 44px);
        float: left;
        background: var(--lightGray);
        color: var(--typo);
        -webkit-appearance: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }

    button {
        outline: none;
        border: none;
        background: none;
        padding: 3px;
        float: right;
        color: var(--typo);
        position: absolute;
        bottom: 10px;
        right: 9px;
        width: 28px;
        height: 28px;
    }

    .loading,
    .error {
        text-align: center;
    }
</style>

<svelte:head>
    <title>Chat</title>
</svelte:head>

<Page>
    {#if loading}
        <Loading/>
        <div class="loading">Message are loading...</div>
    {/if}
    {#if error}
        <div class="error">
            Sorry, no messages found, or network problem.
        </div>
    {/if}
    <div class="messages">
    <div class="messagesInner">
        {#each $messages as message}
            <div transition:fade class="message">
                <div class="message__from">#user</div>
                <div class="message__content">{@html message}</div>
            </div>
        {/each}
    </div>
    </div>
    <div class="inputWrapper">
        <textarea
                name="text"
                bind:value={messageText}
                placeholder="Type your message here"/>
        <button on:click={sendMessage}>
            <IoMdSend/>
        </button>
    </div>
</Page>
