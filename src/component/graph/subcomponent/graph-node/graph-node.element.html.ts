const { html } = await import('../../../../util/html/html.ts')

export default html`
<div class="node node--loading">
    <div class="node__title"></div>
    <div class="node__body">
        <div class="node__ports node__ports--in">
            <slot name="inputs"></slot>
        </div>
        <div class="node__config">
            <slot></slot>
        </div>
        <div class="node__ports node__ports--out">
            <slot name="outputs"></slot>
        </div>
    </div>

   
</div>
`