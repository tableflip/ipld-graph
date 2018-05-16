const cytoscape = require('cytoscape')
const qs = require('querystring')
const prettyHash = require('pretty-hash')

const {search} = window.location
const params = search ? qs.parse(search.substring(1)) : {}
const {path} = params

renderTree(window.ipfs, path)

async function renderTree (ipfs, path) {
  const links = await ipfs.object.links(path)

  const cytoscapeEdges = links.map(link => {
    const obj = link.toJSON()
    const {multihash} = obj
    return {
      group: 'edges',
      data: {
        prettyHash: prettyHash(multihash),
        source: path,
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
      ...nodes,
      ...cytoscapeEdges
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
      name: 'breadthfirst'
    }
  })

  return cy
}
