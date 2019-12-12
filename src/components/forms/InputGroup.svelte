<style type="text/scss">
div {
	position: relative;
	width: 100vw;
	margin: 0 -8px;
	padding-left: 6vw;
	background: var(--white);
    border-top: 1px solid var(--borderGray);
    border-bottom: 1px solid var(--borderGray);
    box-sizing: border-box;
	float: left;

	&:after {
		content: '';
		position: absolute;
		width: 100%;
		height: 2px;
		bottom: 0;
	    background: var(--white);
	}
}
</style>

<div><slot/></div>
