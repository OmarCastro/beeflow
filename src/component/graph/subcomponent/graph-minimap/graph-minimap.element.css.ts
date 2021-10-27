const { css } = await import('../../../../util/css/css.ts')

export default css`
:host {
    display: inline-block;
    background-color: #aaa;
    border: solid 0.2em #456;
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 20vmin;
    height: 20vmin;

}

.minimap, .minimap__svg{
    width: 100%;
    height: 100%;

}

.minimap__nodes {
    fill: white;
    stroke: #456;
    stroke-width: 1em;
}
`