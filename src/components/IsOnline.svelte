<script>
import isOnline from 'is-online';
import { fly } from 'svelte/transition';

let online = true;
let showBanner = false;

(async () => {
    online = await isOnline({timeout: 3000});
})();

const hideBanner = () => {
    showBanner = false;
}

$: if (online) {
    setTimeout(() => showBanner = false, 7000);
} else {
    showBanner = true;
}
</script>

<style>
.banner {
    position: fixed;
    top: 20px;
    left: 8px;
    right: 8px;
    background: var(--red);
    color: var(--white);
    text-align: center;
    z-index: 50;
    padding: 20px;
    box-sizing: border-box;
    border-radius: 6px;
}
.button {
    border-top: 1px solid var(--white);
    text-align: center;
    padding-top: 12px;
    margin-top: 20px;
    font-size: 17px;
}
span {
    position: absolute;
    right: 10px;
}
</style>

{#if showBanner}
    <div class="banner" in:fly="{{ y: -100, duration: 600 }}" out:fly="{{ y: -100, duration: 600 }}">
    Schlechte oder keine Internetverbindung! Bearbeiten und erstellen von Terminen und Links daher nicht möglich.
    <div class="button" on:click={hideBanner}>Verstanden</div>
    </div>
{/if}
