const { css } = await import('../../../../util/css/css.ts')

export default css`
.output {
    color: var(--color);
}

.output__connector {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    cursor: pointer;
    background-color: var(--color);
}
`