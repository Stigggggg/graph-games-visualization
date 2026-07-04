import cytoscape from 'cytoscape';
import { useEffect, useRef } from 'react';

export interface GraphProps {
  data: any[];
  color: string;
  selectedNodes?: string[];
  pebbles?: Record<string, string>;
  nodeDetails?: Record<string, { player: string; round: number }>;
  nodeClick?: (nodeId: string) => Promise<boolean> | void | boolean;
}

const pebble_colors: Record<string, string> = {
  '1': '#f1c40f',
  '2': '#e67e22',
  '3': '#1abc9c',
  '4': '#fd79a8',
  '5': '#34495e'
};

const getPebbleSvg = (pebbleId: string) => {
  const bgColor = pebble_colors[pebbleId] || '#95a5a6';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="9" fill="${bgColor}" stroke="#ffffff" stroke-width="2"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

const getBadgeSvg = (player: string, round: number) => {
  const isSpoiler = player === 'spoiler';
  const emoji = isSpoiler ? '😈' : '👼';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <text x="50%" y="18" text-anchor="middle" font-size="20">${emoji}</text>
      <text x="50%" y="38" text-anchor="middle" fill="#000000" stroke="#ffffff" stroke-width="1" font-family="sans-serif" font-size="16" font-weight="900">R${round}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
};

export function Graph({ data, color, selectedNodes = [], pebbles, nodeDetails, nodeClick }: GraphProps) {
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
    if (!cyContainerRef.current) return;
    
    const cy = cytoscape({
      container: cyContainerRef.current,
      elements: data,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (e: any) => colors[e.data('color')] || '#95a5a6',
            'label': (e: any) => e.data('id'),
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
          const cy = cyInstanceRef.current;
          cy.nodes().removeClass('selected');
          cy.nodes().style({
            'background-image': 'none'
          });
          cy.nodes().forEach(node => {
              node.style('label', node.data('id'));
          });
          
          selectedNodes.forEach(nodeId => {
              cy.getElementById(nodeId).addClass('selected');
          });
          
          if (pebbles) {
            const pebblesByNode: Record<string, string[]> = {};
            Object.entries(pebbles).forEach(([pebbleId, nodeId]) => {
              if (!pebblesByNode[nodeId]) {
                pebblesByNode[nodeId] = [];
              }
              pebblesByNode[nodeId].push(pebbleId);
            });

            Object.entries(pebblesByNode).forEach(([nodeId, pebbleIds]) => {
              const node = cy.getElementById(nodeId);
              if (node.length > 0) {
                node.addClass("selected");
                const bgImages = pebbleIds.map(pid => getPebbleSvg(pid));
                const positionsX = ['85%', '15%', '85%', '15%'];
                const positionsY = ['15%', '15%', '85%', '85%'];
                node.style({
                    'background-image': bgImages,
                    'background-position-x': bgImages.map((_, i) => positionsX[i % 4]),
                    'background-position-y': bgImages.map((_, i) => positionsY[i % 4]),
                    'background-width': bgImages.map(() => '16px'),
                    'background-height': bgImages.map(() => '16px')
                });
              }
            });
          }
          if (nodeDetails) {
            Object.entries(nodeDetails).forEach(([nodeId, detail]) => {
                const node = cy.getElementById(nodeId);
                if (node.length > 0) {
                    const bgImage = getBadgeSvg(detail.player, detail.round);
                    node.style({
                        'background-image': bgImage,
                        'background-position-x': '50%', 
                        'background-position-y': '-26px',
                        'background-width': '35px',
                        'background-height': '35px',
                        'background-clip': 'none',
                        'bounds-expansion': 30 
                    });
                }
            });
          }
      }
  }, [selectedNodes, pebbles, nodeDetails]);

  return <div ref={cyContainerRef} className='w-[90vw] md:w-[42vw] max-w-[550px] h-[40vh] md:h-[45vh] min-h-[280px] border-2 border-gray-300 bg-white rounded-xl shadow-lg relative text-left' />;
}