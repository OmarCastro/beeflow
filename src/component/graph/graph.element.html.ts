const { html } = await import('../../util/html/html.ts')

export default html`
<div class="graph">
    <div class=graph__nodes>
        <slot></slot>
    </div>
    <svg class="graph__edges">

    </svg>
</div>
`