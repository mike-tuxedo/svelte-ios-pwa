export function swipe(node) {
	let x;
	let y;

	function handleMousedown(event) {
		x = event.changedTouches[0].clientX;
		y = event.changedTouches[0].clientY;

		node.dispatchEvent(new CustomEvent('panstart', {
			detail: { x, y }
		}));

		window.addEventListener('touchmove', handleMousemove);
		window.addEventListener('touchend', handleMouseup);
	}

	function handleMousemove(event) {
		const dx = event.changedTouches[0].clientX - x;
		const dy = event.changedTouches[0].clientY - y;
		x = event.changedTouches[0].clientX;
		y = event.changedTouches[0].clientY;

		node.dispatchEvent(new CustomEvent('panmove', {
			detail: { x, y, dx, dy }
		}));
	}

	function handleMouseup(event) {
	    event.preventDefault();
		x = event.changedTouches[0].clientX;
		y = event.changedTouches[0].clientY;

		node.dispatchEvent(new CustomEvent('panend', {
			detail: { x, y }
		}));

		window.removeEventListener('touchmove', handleMousemove);
		window.removeEventListener('touchend', handleMouseup);
	}

	node.addEventListener('touchstart', handleMousedown);

	return {
		destroy() {
			node.removeEventListener('touchstart', handleMousedown);
		}
	};
}
