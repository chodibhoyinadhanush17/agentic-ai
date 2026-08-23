import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import { customNodeTypes } from './CustomNodes.jsx';

export const WorkflowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setEdges,
  onNodeClick,
  onDropNode,
}) => {
  const reactFlowWrapper = useRef(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/agentflow-nodetype');
      const nodeLabel = event.dataTransfer.getData('application/agentflow-nodelabel');
      const nodeDesc = event.dataTransfer.getData('application/agentflow-nodedesc');

      if (!nodeType) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      if (onDropNode) {
        onDropNode({
          type: nodeType,
          label: nodeLabel,
          data: { label: nodeLabel, description: nodeDesc },
          position,
        });
      }
    },
    [onDropNode]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(e, node) => onNodeClick && onNodeClick(node)}
        onPaneClick={() => onNodeClick && onNodeClick(null)}
        nodeTypes={customNodeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        className="bg-surface-950"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'trigger') return '#f59e0b';
            if (n.type === 'ai_agent') return '#6366f1';
            if (n.type === 'gmail') return '#ef4444';
            if (n.type === 'slack') return '#10b981';
            if (n.type === 'discord') return '#818cf8';
            if (n.type === 'google_sheets') return '#14b8a6';
            return '#64748b';
          }}
          maskColor="rgba(8, 13, 26, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
