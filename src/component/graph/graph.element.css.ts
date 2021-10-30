const { css } = await import('../../util/css/css.ts')

export default css`
:host {
    display: inline-block;
    width: 100%;
    height: 100%;
}

.graph {
    width: 100%;
    height: 100%;
    background: #aaa;
    overflow: hidden;
    --scale: 1;
    --x: 0;
    --y: 0;
}

.graph__nodes, .graph__edges{
    width: 0;
    height: 0;
    transform: translate3d(var(--x), var(--y), 0)  scale(var(--scale));
    overflow: visible;

}

.graph__nodes{
    position: relative;
    z-index: 2;
    white-space: nowrap;
}

.graph__edges {
    width: 1px;
    height: 1px;
    overflow: visible;
}

.graph__edges path {
    fill: none;
}

.graph__edges path.bg-edge {
    stroke: #456;
    stroke-width: 10px;
}

.graph__edges path.fg-edge {
    stroke-width: 5px;
}

.graph__edges path.menu-edge {
    stroke-linecap: round
}


`