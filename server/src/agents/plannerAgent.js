import { AgentMemory } from '../models/AgentMemory.js';

export class PlannerAgent {
  constructor() {
    this.name = 'planner';
  }

  /**
   * Plans execution order by performing a topological sort on the workflow DAG.
   * Emits execution plan and confidence score.
   */
  async plan(workflow, executionId) {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];

    if (nodes.length === 0) {
      throw new Error('PLANNER_ERROR: Cannot plan execution for empty workflow graph.');
    }

    // Build adjacency list and in-degree map
    const inDegree = new Map();
    const adjList = new Map();
    const nodeMap = new Map();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adjList.set(n.id, []);
      nodeMap.set(n.id, n);
    });

    edges.forEach((e) => {
      if (adjList.has(e.source) && inDegree.has(e.target)) {
        adjList.get(e.source).push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    // Kahn's algorithm for topological sorting
    const queue = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    const executionPlan = [];
    while (queue.length > 0) {
      const current = queue.shift();
      const node = nodeMap.get(current);
      if (node) executionPlan.push(node);

      const neighbors = adjList.get(current) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Cycle detection check
    const hasCycle = executionPlan.length !== nodes.length;
    if (hasCycle) {
      // Append any unvisited nodes to ensure fallback execution path
      nodes.forEach((n) => {
        if (!executionPlan.some((p) => p.id === n.id)) {
          executionPlan.push(n);
        }
      });
    }

    // Compute confidence score based on connectivity and known types
    let validTypes = 0;
    const knownTypes = ['trigger', 'ai_agent', 'gmail', 'slack', 'discord', 'google_sheets', 'logic_filter'];
    nodes.forEach((n) => {
      if (knownTypes.includes(n.type)) validTypes++;
    });

    const connectivityRatio = edges.length >= nodes.length - 1 ? 1.0 : edges.length / (nodes.length || 1);
    const typeRatio = nodes.length > 0 ? validTypes / nodes.length : 1.0;
    const confidenceScore = Number(Math.min(0.99, Math.max(0.70, ((connectivityRatio + typeRatio) / 2) * 0.95 + (hasCycle ? -0.2 : 0.05))).toFixed(2));

    // Save decision to AgentMemory
    await AgentMemory.create({
      workflowId: workflow._id || workflow.id,
      executionId,
      agentId: 'planner',
      key: 'execution_plan',
      value: {
        totalSteps: executionPlan.length,
        sequence: executionPlan.map((n) => ({ id: n.id, type: n.type, label: n.label })),
        hasCycle,
      },
      confidenceScore,
    });

    return {
      agent: this.name,
      executionPlan,
      totalSteps: executionPlan.length,
      confidenceScore,
      strategy: 'topological_dag_traversal',
      hasCycle,
    };
  }
}

export default new PlannerAgent();
