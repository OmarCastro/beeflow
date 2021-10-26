const { css } = await import('../../../../util/css/css.ts')

export default css`
.input {
    color: var(--color);
}

.input__connector {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    cursor: pointer;
    background-color: var(--color);
}
`