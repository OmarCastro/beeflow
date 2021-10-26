const { css } = await import('../../../../util/css/css.ts')

export default css`
.node {
    font-size: 20px;
    display: inline-block;
    background-color: #aaa;
    border: solid 0.2em #456;
    border-radius: 0.5em;
    position: absolute  

}

.node__title{
    background-color: #eee;
    text-align: center;
    border-top-left-radius: 0.5em;
    border-top-right-radius: 0.5em;

}

.node__body {
    display: inline-flex;
    flex-direction: row;
}

.node__config {
    display: inline-flex;
    flex-direction: column;
}

.node__ports {
    display: inline-flex;
    flex-direction: column
}

.node__ports--in {
    padding-right: 1em;
}

.node__ports--out {
    padding-left: 1em;
    text-align: right;
}
`