export function swipe(node) {
	let x;
	let y;
	let startX = 0;
	let endX = 0;

	function handleMousedown(event) {
		x = event.changedTouches[0].clientX;
		y = event.changedTouches[0].clientY;
		startX = x;

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
		x = event.changedTouches[0].clientX;
		y = event.changedTouches[0].clientY;
        endX = x;

        // Fix iOS fireing clickevent
        if (startX - endX > 5) {
            event.preventDefault();
        }

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
