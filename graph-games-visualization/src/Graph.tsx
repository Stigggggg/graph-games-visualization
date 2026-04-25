import cytoscape from 'cytoscape';
import { useEffect, useRef } from 'react';

export interface GraphProps {
  data: any[];
  color: string;
  nodeClick?: (nodeId: string) => void;
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
            'font-size': '14px'
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
          selector: '.hovered',
          style: {
            'background-color': 'green',
            'line-color': 'green',
            'target-arrow-color': 'green'
          }
        }
      ],
      layout: {
        name: 'circle',
        fit: true,
        padding: 40
      }
    });

    cy.on('tap', 'node', (e) => {
        const nodeId = e.target.id();
        if (nodeClick) {
            nodeClick(nodeId)
        }
    });

    return () => {
      cy.destroy();
    };
  }, [data, color]);

  return <div ref={cyContainerRef} className='graph-container' />;
}