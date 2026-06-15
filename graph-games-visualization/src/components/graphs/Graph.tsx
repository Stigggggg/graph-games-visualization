import cytoscape from 'cytoscape';
import { useEffect, useRef } from 'react';

export interface GraphProps {
  data: any[];
  color: string;
  selectedNodes?: string[];
  pebbles?: Record<string, string>;
  nodeClick?: (nodeId: string) => Promise<boolean> | void | boolean;
}

export function Graph({ data, color, selectedNodes = [], pebbles, nodeClick }: GraphProps) {
  const cyContainerRef = useRef<HTMLDivElement>(null); // div in DOM tree
  const cyInstanceRef = useRef<cytoscape.Core | null>(null); // access to graph without recreating it
  const nodeClickRef = useRef(nodeClick);
  const colors: Record<string, string> = {
    'a': '#e74c3c',
    'b': '#e84393',
    'c': '#9b59b6'
  };

  // guarantees the newest state of nodeClick, for example after choosing the vertice
  useEffect(() => { 
      nodeClickRef.current = nodeClick;
  }, [nodeClick]);
  

  useEffect(() => {
    // hasPos enables to distinguish draw mode, when it is not undefined, we draw vertices in the exact position they were clicked
    const hasPos = data.some((element: any) => element.position !== undefined)
    if (!cyContainerRef.current) {
      return;
    }
    
    // main graph instance, with a specific syntax
    // container is a space where a graph is drawn, elements are vertices and edges
    // cytoscape.js has its .css version, a different class was designed for selected (clicked on) vertices
    const cy = cytoscape({
      container: cyContainerRef.current,
      elements: data,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (e: any) => colors[e.data('color')] || '#95a5a6',
            'label': (e: any) => `${e.data('id')}, ${e.data('color')}`,
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '45px',
            'height': '45px',
            'font-size': '14px',
            'transition-property': 'background-color', 
            'transition-duration': 0.2
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: '.selected',
          style: {
              'background-color': '#2ecc71',
              'transition-property': 'background-color',
              'transition-duration': 0.2
          }
        }
      ],
      layout: {
        name: hasPos ? 'preset' : 'circle',
        fit: true,
        padding: 40
      }
    });

    cyInstanceRef.current = cy;

    // clicking on vertice handling
    // we change color by adding selected class
    // then we send the move to backend with async function
    // if the move is not approved, we remove selected class
    cy.on('tap', 'node', async (e) => {
        const node = e.target;
        const nodeId = node.id();
        if (nodeClickRef.current) {
            node.addClass('selected');
            const ok = await nodeClickRef.current(nodeId);
            if (ok === false) {
                node.removeClass('selected');
            }
        }
    });
    
    // cleanup function, happens when the component is destroyed or data/color is changed
    // helps us to avoid memory leaks
    return () => {
      cy.destroy();
    };
  }, [data, color]);

  // rebuilding the graph after the state changes
  useEffect(() => {
      if (cyInstanceRef.current) {
          // removing selected class from all the nodes
          cyInstanceRef.current.nodes().removeClass('selected');
          // removing all the labels
          cyInstanceRef.current.nodes().forEach(node => {
              node.style('label', node.id());
          });
          
          // adding selected class once again for every selected node
          selectedNodes.forEach(nodeId => {
              cyInstanceRef.current!.getElementById(nodeId).addClass('selected');
          });
          
          // changing pebbles object to the pair list
          // after that we update the label with pebbles laying on vertices
          if (pebbles) {
              Object.entries(pebbles).forEach(([pebbleId, nodeId]) => {
                  const node = cyInstanceRef.current!.getElementById(nodeId as string);
                  if (node.length > 0) {
                      node.addClass('selected');
                      const oldLabel = `${node.id()}`;
                      node.style('label', `${oldLabel} P${pebbleId}`);
                  }
              });
          }
      }
  }, [selectedNodes, pebbles]);

  return <div ref={cyContainerRef} className='w-[90vw] md:w-[42vw] max-w-[550px] h-[50vh] md:h-[55vh] min-h-[350px] border-2 border-gray-300 bg-white rounded-xl shadow-lg relative text-left' />;
}