const cytoscape = require('cytoscape')
const dagre = require('cytoscape-dagre')
const qs = require('querystring')
const prettyHash = require('pretty-hash')

cytoscape.use(dagre)

const {search} = window.location
const params = search ? qs.parse(search.substring(1)) : {}
const {path} = params
const layoutOpts = {
  name: 'dagre',
  animate: true,
  animationDuration: 300,
  animationEasing: 'ease-in-out',
  rankSep: 100,
  nodeSep: 10
}

renderTree(window.ipfs, path)

function ipfsLinksToCy (parent, links) {
  if (!links.length) return
  const showLinks = links // .slice(0, 6)

  const edges = showLinks.map(link => {
    const obj = link.toJSON()
    const {multihash} = obj
    return {
      group: 'edges',
      data: {
        prettyHash: prettyHash(multihash),
        source: parent,
        target: multihash
      }
    }
  })

  const nodes = showLinks.map(link => {
    const obj = link.toJSON()
    const {multihash, size, name} = obj
    return {
      group: 'nodes',
      data: {
        id: multihash,
        prettyHash: prettyHash(multihash),
        size,
        name
      }
    }
  })

  return [...edges, ...nodes]
}

async function renderTree (ipfs, path) {
  const links = await ipfs.object.links(path)
  const layer1 = ipfsLinksToCy(path, links)
  const cy = cytoscape({
    container: document.getElementById('ipld-graph'), // container to render in

    elements: [ // list of graph elements to start with
      { // node a
        group: 'nodes',
        data: {
          id: path,
          prettyHash: prettyHash(path)
        }
      },
      ...layer1
    ],

    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          shape: 'roundrectangle',
          width: '16px',
          height: '16px',
          'background-color': '#4A90E2'
        }
      },

      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'width': 2,
          'line-color': '#bedbd6',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#bedbd6',
          'label': 'data(prettyHash)',
          'font-family': 'courier, avenir, sans-serif',
          'font-size': '10px',
          'text-rotation': 'autorotate',
          'color': '#243a53'
        }
      }
    ],

    layout: layoutOpts
  })

  cy.on('tap', async (e) => {
    const data = e.target.data()
    const links = await ipfs.object.links(data.id)
    cy.add(ipfsLinksToCy(data.id, links))
    runLayout(cy)
  })

  return cy
}

function runLayout (cy) {
  cy.layout(layoutOpts).run()
}
