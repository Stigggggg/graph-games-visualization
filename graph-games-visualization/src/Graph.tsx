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
  const cyContainerRef = useRef<HTMLDivElement>(null);
  const cyInstanceRef = useRef<cytoscape.Core | null>(null);
  const nodeClickRef = useRef(nodeClick);
  const colors: Record<string, string> = {
    'a': '#e74c3c',
    'b': '#e84393',
    'c': '#9b59b6'
  };

  useEffect(() => {
      nodeClickRef.current = nodeClick;
  }, [nodeClick]);
  

  useEffect(() => {
    const hasPos = data.some((element: any) => element.position !== undefined)
    if (!cyContainerRef.current) {
      return;
    }

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

    return () => {
      cy.destroy();
    };
  }, [data, color]);

  useEffect(() => {
      if (cyInstanceRef.current) {
          cyInstanceRef.current.nodes().removeClass('selected');
          cyInstanceRef.current.nodes().forEach(node => {
              node.style('label', node.id());
          });
          
          selectedNodes.forEach(nodeId => {
              cyInstanceRef.current!.getElementById(nodeId).addClass('selected');
          });

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