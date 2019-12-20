<script>
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

<div transition:fly={{duration: 300, y: -50}}>
    <span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-loader"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
    </span>
</div>
