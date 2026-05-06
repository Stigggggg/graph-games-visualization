import cytoscape from 'cytoscape';
import { useEffect, useRef } from 'react';

export interface GraphProps {
  data: any[];
  color: string;
  nodeClick?: (nodeId: string) => Promise<boolean> | void | boolean;
}

export function Graph({ data, color, nodeClick }: GraphProps) {
  const cyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cyContainerRef.current) return;

    const cy = cytoscape({
      container: cyContainerRef.current,
      elements: data,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': color,
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
        name: 'circle',
        fit: true,
        padding: 40
      }
    });

    cy.on('tap', 'node', async (e) => {
        const node = e.target;
        const nodeId = node.id();
        if (nodeClick) {
            node.addClass('selected');
            const ok = await nodeClick(nodeId);
            if (ok === false) {
                node.removeClass('selected')
            }
        }
    });

    return () => {
      cy.destroy();
    };
  }, [data, color]);

  return <div ref={cyContainerRef} className='graph-container' />;
}