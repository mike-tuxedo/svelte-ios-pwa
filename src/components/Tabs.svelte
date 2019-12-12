<style type="text/scss">
.outer {
    text-align: center;
    padding: 4px 8px 8px 8px;
}
.inner {
    display: flex;
    justify-content: center;
    width: 100%;
}
</style>

<div class="outer">
    <div class="inner">
        <slot/>
    </div>
</div>
