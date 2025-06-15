'use client';

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'motion/react';
import type { ProcessedData } from '@/lib/gemini'; // Assuming this type is defined for the API response
import { SkillNode } from '@/components/skill-node';

interface InterviewMapProps {
  jobDescription: string;
  resume: string;
  processedJobDescriptionData: any;
  processedResumeData: any;
}

interface SkillClusterNode {
  label: string;
  type: 'matched' | 'gap' | 'quickWin';
  description: string;
  percentage: number;
  talkingPoint: string;
}

interface Connection {
  source: string;
  target: string;
  type: 'matched' | 'gap' | 'quickWin';
}

const nodeTypes = {
  skillNode: SkillNode,
};

export function InterviewMap({ jobDescription, resume, processedJobDescriptionData, processedResumeData }: InterviewMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to process the job description and resume
  const processData = useCallback(async () => {
    if (!jobDescription || !resume || !processedJobDescriptionData || !processedResumeData) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/process-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: processedJobDescriptionData,
          resume: processedResumeData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process data from API');
      }

      const data = await response.json() as ProcessedData;
      
      // Convert skill clusters to nodes using SkillNode
      const newNodes: Node[] = data.skillClusters.map((cluster, index) => {
        // Calculate positions dynamically for other nodes, avoiding the central node for position calculation
        const angle = index * (2 * Math.PI / (data.skillClusters.length - 1)); // Adjust for one less node (the center one)
        const radius = 250;
        const centerX = 400;
        const centerY = 300;

        return {
          id: cluster.label,
          type: 'skillNode',
          position: {
            x: cluster.label === 'Interview Strategy Map' ? centerX : centerX + Math.cos(angle) * radius,
            y: cluster.label === 'Interview Strategy Map' ? centerY : centerY + Math.sin(angle) * radius,
          },
          data: {
            label: cluster.label,
            type: cluster.type === 'matched' ? 'matched' : cluster.type === 'gap' ? 'gap' : 'strength',
            description: cluster.description,
            confidence: cluster.percentage,
            talkingPoint: cluster.talkingPoint,
          },
        };
      });

      // Edges: ensure connections point to the correct 'Interview Strategy Map' node ID
      const newEdges: Edge[] = data.connections.map((connection, index) => ({
        id: `e${index}-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        animated: true,
        style: {
          stroke: connection.type === 'matched' 
            ? '#3b82f6' 
            : connection.type === 'gap'
            ? '#ef4444'
            : '#10b981',
        },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      setError('Failed to process the data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [jobDescription, resume, processedJobDescriptionData, processedResumeData, setNodes, setEdges]);

  React.useEffect(() => {
    processData();
  }, [processData]);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] bg-black/50 rounded-xl border border-white/10 backdrop-blur-sm flex items-center justify-center">
        <div className="text-white">Processing your data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] bg-black/50 rounded-xl border border-white/10 backdrop-blur-sm flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-black/50 rounded-xl border border-white/10 backdrop-blur-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#1e40af" gap={20} size={1} className="opacity-20" />
        <Controls className="bg-gray-800 border-blue-500/30" />
      </ReactFlow>
    </div>
  );
}