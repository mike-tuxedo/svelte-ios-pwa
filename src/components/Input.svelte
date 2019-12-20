<script>
	import { formatToReadable } from '../utils/datetime.js';
    import IoIosCheckbox from 'svelte-icons/io/IoIosCheckbox.svelte'

	export let value;
	export let type;
	export let placeholder;
	export let group;
	export let text;
	export let size;
	export let pos;
	export let checked;
	export let min="10";
	export let max="60";
	export let step="5";
</script>

<style type="text/scss">
input {
    -webkit-appearance: none;
	&::-webkit-inner-spin-button, &::-webkit-calendar-picker-indicator {
	    display: none;
	    -webkit-appearance: none;
	}
	&:placeholer, &::-webkit-input-placeholder, &::-moz-placeholder, &:-ms-input-placeholder {
		color: var(--gray);
	}
	&:checked {
		border-right: var(--green);
	}
}
input[type="text"], input[type="password"], input[type="date"], input[type="time"], label, textarea {
	border: none;
	border-bottom: 1px solid var(--borderGray);
	border-radius: none;
	box-sizing: border-box;
	width: 100%;
	height: 44px;
    line-height: 44px;
	float: right;
	font-size: 17px;
	background: var(--white);
	color: var(--type);
}

.range {
	display: flex;
    justify-content: space-between;
	color: var(--gray);
    padding-right: 5px;

	span {
		display: flex;
		color: var(--typo);
	}
	input {
		margin-left: 15px;
		background: transparent;
	    -webkit-appearance: none;

		&::-webkit-slider-runnable-track {
		    width: 300px;
		    height: 2px;
			background: var(--blue);
		    border: none;
		    border-radius: 1px;
		}
		&::-webkit-slider-thumb {
		    -webkit-appearance: none;
		    border: none;
		    height: 28px;
		    width: 28px;
		    border-radius: 50%;
		    background: var(--blue);
		    margin-top: -12px;
			background: var(--white);
			box-shadow: -1px 1px 4px #33333388;

		}
		&:focus {
		    outline: none;
		}
	}
}
textarea {
	resize: none;
	height: 88px;
	font-family: Arial;
}
label {
	&.half {
		width: calc(50% - 3vw);

		&.left {
			float: left;
		}
		&.right {
			float: right;
		}
	}
}
.radio {
	position: relative;

	input {
		display: none;
	}
	span {
        display: flex;
		&:first-child {
			color: var(--gray);
		}
		&:last-child {
			height: 44px;
			position: absolute;
			right: 8px;
			top: 0;
		}
	}
    .icon {
        width: 28px;
        height: 28px;
        color: var(--blue);
    }
}
.checkbox {
	position: relative;

	input {
		opacity: 0;
	}
	div {
		position: absolute;
	    right: 8px;
	    top: 6px;

		&:before {
			content: '';
			display: inline-block;
			width: 44px;
			height: 22px;
			border-radius: 11px;
			background: var(--gray);
			border: 1px solid var(--gray);
		}
		&:after {
			content: '';
			display: inline-block;
			position: absolute;
			width: 22px;
			height: 22px;
			border-radius: 11px;
			background: var(--lightGray);
			box-shadow: -1px 1px 4px #33333388;
			top: 4px;
			left: 0;
			transition: all 0.4s;
		}
	}
	input:checked + div {
		&:before {
			background: var(--blue);
		}
		&:after {
			border: none;
			top: 5px;
			left: 22px;
			width: 20px;
			height: 20px;
		}
	}
}
.time, .date {
	input {
	    color: transparent;
	}
	span {
		position: absolute;
		color: var(--gray);

		&.hasValue {
			color: var(--typo);
		}
	}
}
</style>

{#if type === 'text'}
<input type="text" bind:value={value} placeholder={placeholder} class={`${size} ${pos}`}>
{:else if (type === 'password')}
<input type="password" bind:value={value} placeholder={placeholder} class={`${size} ${pos}`}>
{:else if (type === 'date')}
<label class="date {size} {pos}">
	<input type="date" bind:value={value} placeholder={placeholder} class={size}>
	<span class:hasValue={!!value}>{formatToReadable(value) || placeholder}</span>
</label>
{:else if (type === 'time')}
<label class="time {size} {pos}">
	<input type="time" bind:value={value} placeholder={placeholder} class={size}>
	<span class:hasValue={!!value}>{value || placeholder}</span>
</label>
{:else if (type === 'radio')}
<label class="radio {size} {pos}">
	<span>{text}</span>
	<input type="radio" bind:group={group} value={value} class={size}>
	{#if group === value}<span class="icon"><IoIosCheckbox /></span>{/if}
</label>
{:else if (type === 'checkbox')}
<label class="checkbox {size} {pos}">
	<span>{text}</span>
	<input type="checkbox" on:change value={value} class={size} checked={checked}>
	{#if group === value}<div></div>{/if}
</label>
{:else if (type === 'range')}
<label class="range {size} {pos}">
	{placeholder}
	<span>{value} <input type="range" min={min} max={max} step={step} on:change bind:value={value} class={size}></span>
</label>
{:else if (type === 'textarea')}
<textarea class="textarea {size} {pos}" on:change bind:value={value} placeholder={placeholder}/>
{/if}
