<script>
    export let active;
    export let first;
    export let last;
</script>

<style type="text/scss">
    button {
        border: 1px solid var(--blue);
        border-left: none;
        background: var(--white);
        color: var(--blue);
        padding: 0 30px;
        line-height: 26px;
        font-size: 12px;
        width: 33.33%;

        &.active {
            background: var(--blue);
            color: var(--white);
        }
        &.first {
            border-left: 1px solid var(--blue);
            border-radius: 3px 0 0 3px;
        }
        &.last {
            border-radius: 0 3px 3px 0;
        }
    }
</style>

<button on:click class:active class:first class:last><slot/></button>
