<script>
import Icon from "./Icon.svelte";
import { fade, fly } from 'svelte/transition';
</script>
<style>
div {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 44px;
}
span {
    width: 28px;
    height: 28px;
    animation: spinners-animation 1200ms linear infinite;
    transform-origin: center;
}
 @keyframes spinners-animation {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
 }
</style>

<div transition:fly={{duration: 300, y: -50}}><span><Icon name="loader"/></span></div>
