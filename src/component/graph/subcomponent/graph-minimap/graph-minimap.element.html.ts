const { html } = await import('../../../../util/html/html.ts')

export default html`
<div class="minimap">
    <svg class="minimap__svg" viewBox="0 0 100 100">
        <g class="minimap__edges"></g>
        <g class="minimap__nodes"></g>
    </svg>
</div>
`