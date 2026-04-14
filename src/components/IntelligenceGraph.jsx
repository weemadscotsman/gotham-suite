import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function IntelligenceGraph() {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    // Fetch graph data
    fetch('/api/graph/nodes')
      .then(r => r.json())
      .then(data => setNodes(data.nodes || []))
      .catch(() => setNodes([]));

    fetch('/api/graph/links')
      .then(r => r.json())
      .then(data => setLinks(data.links || []))
      .catch(() => setLinks([]));
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Color scale by type
    const colorScale = {
      email: '#00ff88',
      domain: '#00ccff',
      ip: '#ff6b6b',
      username: '#ffcc00',
      hash: '#ff3366',
      phone: '#cc66ff',
      cve: '#ff6600',
      document: '#66ffcc',
      vulnerability: '#ff3333',
      credential: '#ffcc66',
      target: '#ffffff'
    };

    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#333')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5);

    // Draw nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 12)
      .attr('fill', d => colorScale[d.type] || '#888')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => setSelectedNode(d));

    // Add labels
    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('font-size', 10)
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', -15)
      .text(d => d.value?.substring(0, 12) + (d.value?.length > 12 ? '...' : ''));

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    return () => simulation.stop();
  }, [nodes, links]);

  return (
    <div className="intelligence-graph">
      <h3>🕸️ Intelligence Graph</h3>
      <svg ref={svgRef} className="graph-svg" />
      {selectedNode && (
        <div className="node-detail">
          <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
          <div className="node-type">{selectedNode.type}</div>
          <div className="node-value">{selectedNode.value}</div>
          <div className="node-source">{selectedNode.source_module}</div>
        </div>
      )}
      {nodes.length === 0 && (
        <div className="empty-graph">
          <p>No intelligence data yet.</p>
          <p>Run NOX scans or Decepticon ops to populate the graph.</p>
        </div>
      )}
    </div>
  );
}
