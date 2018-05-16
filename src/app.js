const cytoscape = require('cytoscape')
const dagre = require('cytoscape-dagre')
const qs = require('querystring')
const prettyHash = require('pretty-hash')

cytoscape.use(dagre)

const {search} = window.location
const params = search ? qs.parse(search.substring(1)) : {}
const {path} = params

renderTree(window.ipfs, path)

function addIpfsLinks (parent, links, cy) {
  if (!links.length) return

  const edges = links.map(link => {
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

  const nodes = links.map(link => {
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

  cy.add([...edges, ...nodes])
}

async function renderTree (ipfs, path) {
  const cy = cytoscape({
    container: document.getElementById('ipld-graph'), // container to render in

    elements: [ // list of graph elements to start with
      { // node a
        group: 'nodes',
        data: {
          id: path,
          prettyHash: prettyHash(path)
        }
      }
    ],

    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'background-color': '#666'
        }
      },

      {
        selector: 'edge',
        style: {
          'width': 1,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'target-label': 'data(prettyHash)',
          'text-rotation': 'autorotate'

        }
      }
    ],

    layout: {
      name: 'dagre'
    }
  })

  const links = await ipfs.object.links(path)
  addIpfsLinks(path, links, cy)
  cy.layout({ name: 'dagre' }).run()

  cy.on('tap', async (e) => {
    const data = e.target.data()
    const links = await ipfs.object.links(data.id)
    addIpfsLinks(data.id, links, cy)
    cy.layout({ name: 'dagre', animate: true, fit: false }).run()
  })

  return cy
}
