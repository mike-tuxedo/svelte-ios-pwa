import { writable, get } from 'svelte/store';
import useLocalStorage from './useLocalStorage';

// User Settings
export const darkmode = writable(false);
useLocalStorage(darkmode, 'svelteIOSPWAdarkmode');

darkmode.subscribe(darkmode => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const bodyClassList = document.body.classList;
        darkmode ? bodyClassList.add('darkmode') : bodyClassList.remove('darkmode');
    }
});

// Navigation Config
export const navConfig = writable({
    type: 'page',
    title: 'Home',
    tools: [],
    actions: {}
});

// Eventsdata
export const events = writable([]);
useLocalStorage(events, 'events');
export const activeFilter = writable('');
useLocalStorage(activeFilter, 'activeFilter');
