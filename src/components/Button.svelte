<style>
button {
    display: block;
    transition: all 0.2s;
    background: var(--blue);
    color: var(--white);
    border: none;
    box-sizing: border-box;
    width: 240px;
    padding: 10px 20px;
    font-size: 17px;
    border-radius: 4px;
}
button:active {
    background: var(--white);
}
</style>

<button on:click><slot/></button>
