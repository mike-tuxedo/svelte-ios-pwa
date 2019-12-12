export default function useLocalStorage(store, key) {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const json = localStorage.getItem(key);
        if (json) {
            store.set(JSON.parse(json));
        }
        const unsubscribe = store.subscribe(current => {
            localStorage.setItem(key, JSON.stringify(current));
        });
    }
}
