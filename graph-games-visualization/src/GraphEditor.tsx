import cytoscape from "cytoscape";
import { useEffect, useRef, useState } from "react";

export interface GraphEditorProps {
    onUpdate: (elements: any[]) => void;
    prefix: string;
}

export function GraphEditor({ onUpdate, prefix }: GraphEditorProps) {
    const cyContainerRef = useRef<HTMLDivElement>(null);
    const cyInstanceRef = useRef<cytoscape.Core | null>(null);
    const nodeIdCounter = useRef(1);
    const selectedNode = useRef<string | null>(null);
    const [activeColor, setActiveColor] = useState<'a' | 'b' | 'c'>('a');
    const colorRef = useRef(activeColor);
    const colors = {
        'a': '#e74c3c',
        'b': '#e84393',
        'c': '#9b59b6'
    };
    
    useEffect(() => {
        colorRef.current = activeColor;
    }, [activeColor]);

    useEffect(() => {
        if (!cyContainerRef.current) {
            return;
        }

        const cy = cytoscape({
            container: cyContainerRef.current,
            elements: [],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': (e: any) => colors[e.data('color') as 'a' | 'b' | 'c'] || '#95a5a6',
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
                        'border-width': 4,
                        'border-color': '#2ecc71'
                    }
                }
            ],
            layout: {
                name: 'preset',
            }
        });

        cyInstanceRef.current = cy;

        cy.on('tap', (event) => {
            const target = event.target;
            if (target === cy) {
                const newId = `${prefix}${nodeIdCounter.current}`;
                nodeIdCounter.current++;
                cy.add({
                    group: 'nodes',
                    data: { id: newId, color: colorRef.current},
                    position: { x: event.position.x, y: event.position.y}
                });
                if (selectedNode.current) {
                    cy.getElementById(selectedNode.current).removeClass('selected');
                    selectedNode.current = null;
                }
            } else if (target.isNode()) {
                const clicked = target.id();
                if (!selectedNode.current) {
                    selectedNode.current = clicked;
                    target.addClass('selected');
                } else {
                    if (selectedNode.current !== clicked) {
                        const edgeId = `${selectedNode.current}->${clicked}`;
                        if (cy.getElementById(edgeId).length === 0) {
                            cy.add({
                                group: 'edges',
                                data: { id: edgeId, source: selectedNode.current, target: clicked, color: 'a' }
                            });
                        }
                    }
                    cy.getElementById(selectedNode.current).removeClass('selected');
                    selectedNode.current = null;   
                }
            }
            const elements = cy.elements().map(e => e.json());
            onUpdate(elements);
        });

        return () => cy.destroy();
    }, [prefix]);

    return (
        <div className="flex flex-col items-center">
            <div className="flex gap-4 mb-3">
                {(['a', 'b', 'c'] as const).map((color) => (
                    <button key={color} onClick={() => setActiveColor(color)} className={`px-4 py-1 rounded-full text-white font-bold text-sm transition-transform ${activeColor === color ? 'scale-110 shadow-md border-2 border-gray-800' : 'opacity-70 hover:opacity-100'}`} style={{ backgroundColor: colors[color] }}>
                        Color {color.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="text-sm text-gray-500 mb-1">Click background to add node. Click two nodes to add edge.</div>
            
            <div ref={cyContainerRef} className="w-full max-w-[400px] h-[300px] border-2 border-dashed border-gray-400 bg-gray-50 rounded-xl relative cursor-crosshair" />
        </div>
    );
}