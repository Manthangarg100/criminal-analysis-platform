/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { motion, AnimatePresence } from 'motion/react';
import { GraphNode, GraphEdge, EntityType } from '../types.ts';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Filter,
  Route,
  Activity,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Eye,
  Sliders,
  Plus,
  Trash2,
  X,
  UserPlus,
  LayoutGrid,
  GitBranch,
  Compass,
  TableProperties,
  Search,
  Move,
  Smartphone,
  Car,
  Building2,
  MapPin,
  CreditCard,
  User,
  Shield,
  ExternalLink,
  Focus,
  Network,
} from 'lucide-react';

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  onSelectNode: (node: GraphNode | null) => void;
  onSelectEdge: (edge: GraphEdge | null) => void;
  onAddNode?: (node: GraphNode) => void;
  onRemoveNode?: (nodeId: string) => void;
}

type CentralityMode = 'none' | 'degree' | 'betweenness' | 'closeness' | 'louvain';
type LayoutFormat = 'force' | 'hierarchy' | 'radial' | 'grid';
type ViewMode = 'canvas' | 'cards' | 'matrix';

interface SimNode extends SimulationNodeDatum, GraphNode {
  radius?: number;
  tier?: number;
  clusterCol?: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  type: string;
  label: string;
  verificationStatus: string;
  isDirect: boolean;
  confidenceScore: number;
  originalEdge: GraphEdge;
}

export const GraphView: React.FC<GraphViewProps> = ({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  onSelectNode,
  onSelectEdge,
  onAddNode,
  onRemoveNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const prevNodesPosRef = useRef<Map<string, { x: number; y: number; vx?: number; vy?: number }>>(new Map());

  // View & Layout configuration
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [layoutFormat, setLayoutFormat] = useState<LayoutFormat>('force');
  const [isExpanded, setIsExpanded] = useState(false);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Hover & Detail Mode
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [labelDetail, setLabelDetail] = useState<'full' | 'compact'>('full');

  // Node Dragging on Canvas
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<EntityType[]>([
    'Person',
    'Phone',
    'Vehicle',
    'Organisation',
    'Location',
    'FinancialAccount',
  ]);
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified_only' | 'pending_only'>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0.5);

  // Analytical modes
  const [centralityMode, setCentralityMode] = useState<CentralityMode>('none');
  const [egoFocusNodeId, setEgoFocusNodeId] = useState<string | null>(null);

  // Path finding
  const [pathSourceId, setPathSourceId] = useState<string>('');
  const [pathTargetId, setPathTargetId] = useState<string>('');
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [highlightedPathNodes, setHighlightedPathNodes] = useState<string[]>([]);
  const [highlightedPathEdges, setHighlightedPathEdges] = useState<string[]>([]);
  const [pathNotification, setPathNotification] = useState<string | null>(null);

  // Add Entity Node Modal State
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<EntityType>('Person');
  const [newNodeStatus, setNewNodeStatus] = useState<'verified' | 'ai_suggested'>('verified');
  const [newNodeConfidence, setNewNodeConfidence] = useState<number>(0.92);

  // Simulation / Placed nodes & links
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);

  // Filtered nodes and edges
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (!selectedEntityTypes.includes(n.type)) return false;
      if (verificationFilter === 'verified_only' && n.verificationStatus !== 'verified') return false;
      if (verificationFilter === 'pending_only' && n.verificationStatus !== 'ai_suggested') return false;
      if (n.confidenceScore < minConfidence) return false;
      return true;
    });
  }, [nodes, selectedEntityTypes, verificationFilter, minConfidence]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return edges.filter((e) => {
      if (!filteredNodeIds.has(e.source) || !filteredNodeIds.has(e.target)) return false;
      if (verificationFilter === 'verified_only' && e.verificationStatus !== 'verified') return false;
      if (verificationFilter === 'pending_only' && e.verificationStatus !== 'ai_suggested') return false;
      if (e.confidenceScore < minConfidence) return false;
      return true;
    });
  }, [edges, filteredNodeIds, verificationFilter, minConfidence]);

  // Handle Ego Focus
  const effectiveNodes = useMemo(() => {
    if (!egoFocusNodeId) return filteredNodes;
    const neighborSet = new Set<string>([egoFocusNodeId]);
    filteredEdges.forEach((e) => {
      if (e.source === egoFocusNodeId) neighborSet.add(e.target);
      if (e.target === egoFocusNodeId) neighborSet.add(e.source);
    });
    return filteredNodes.filter((n) => neighborSet.has(n.id));
  }, [filteredNodes, filteredEdges, egoFocusNodeId]);

  const effectiveNodeIds = useMemo(() => new Set(effectiveNodes.map((n) => n.id)), [effectiveNodes]);

  const effectiveEdges = useMemo(() => {
    return filteredEdges.filter(
      (e) => effectiveNodeIds.has(e.source) && effectiveNodeIds.has(e.target)
    );
  }, [filteredEdges, effectiveNodeIds]);

  // Search matches
  const matchedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    return new Set(
      effectiveNodes
        .filter(
          (n) =>
            n.label.toLowerCase().includes(q) ||
            n.type.toLowerCase().includes(q) ||
            (n.maskedValue && n.maskedValue.toLowerCase().includes(q)) ||
            (n.unmaskedValue && n.unmaskedValue.toLowerCase().includes(q)) ||
            (n.attributes?.roleInNetwork && String(n.attributes.roleInNetwork).toLowerCase().includes(q))
        )
        .map((n) => n.id)
    );
  }, [effectiveNodes, searchQuery]);

  // Auto-fit function: Centers and scales view to frame all nodes comfortably
  const handleFitView = useCallback(() => {
    if (!containerRef.current || simNodes.length === 0) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    const xs = simNodes.map((n) => n.x ?? width / 2);
    const ys = simNodes.map((n) => n.y ?? height / 2);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Padding ensures all node labels and badges stay fully visible within viewport
    const pad = 95;
    const graphW = Math.max(220, maxX - minX + pad * 2);
    const graphH = Math.max(220, maxY - minY + pad * 2);

    const scale = Math.min(1.2, Math.max(0.35, Math.min(width / graphW, height / graphH)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(scale);
    setPan({
      x: width / 2 - centerX * scale,
      y: height / 2 - centerY * scale,
    });
  }, [simNodes]);

  // Connected nodes to currently hovered entity
  const connectedNodeIdsToHovered = useMemo(() => {
    if (!hoveredNodeId) return null;
    const set = new Set<string>([hoveredNodeId]);
    for (const link of simLinks) {
      const sId = typeof link.source === 'object' ? (link.source as SimNode).id : link.source;
      const tId = typeof link.target === 'object' ? (link.target as SimNode).id : link.target;
      if (sId === hoveredNodeId) set.add(tId);
      if (tId === hoveredNodeId) set.add(sId);
    }
    return set;
  }, [hoveredNodeId, simLinks]);

  const hoveredNode = useMemo(() => {
    if (!hoveredNodeId) return null;
    return effectiveNodes.find((n) => n.id === hoveredNodeId) || null;
  }, [hoveredNodeId, effectiveNodes]);

  // Node position calculators for different layouts
  const computeStructuredLayout = useCallback(
    (nodesToPlace: GraphNode[], layout: LayoutFormat, width: number, height: number): SimNode[] => {
      if (layout === 'hierarchy') {
        // Operational Command Strata:
        // Tier 0: Primary Suspects / Syndicate Heads
        // Tier 1: Facilitators / Mid-level Operatives / Organisations
        // Tier 2: Communication (Phones) & Financial Mule Accounts
        // Tier 3: Logistics (Vehicles) & Safehouses (Locations)
        const tiers: Record<number, GraphNode[]> = { 0: [], 1: [], 2: [], 3: [] };

        nodesToPlace.forEach((n) => {
          if (n.type === 'Person' && ((n.degreeCentrality ?? 0) >= 0.7 || String(n.attributes?.roleInNetwork || '').includes('Kingpin') || String(n.attributes?.roleInNetwork || '').includes('Hawala Banker') || String(n.attributes?.roleInNetwork || '').includes('Mastermind'))) {
            tiers[0].push(n);
          } else if (n.type === 'Person' || n.type === 'Organisation') {
            tiers[1].push(n);
          } else if (n.type === 'Phone' || n.type === 'FinancialAccount') {
            tiers[2].push(n);
          } else {
            tiers[3].push(n);
          }
        });

        const activeTiers = [0, 1, 2, 3].filter((t) => tiers[t].length > 0);
        const tierHeight = Math.max(140, (height - 180) / Math.max(1, activeTiers.length));

        const placedNodes: SimNode[] = [];
        activeTiers.forEach((tierIdx, rowIdx) => {
          const tierNodes = tiers[tierIdx];
          const y = 90 + rowIdx * tierHeight;
          tierNodes.forEach((n, colIdx) => {
            const spacing = (width - 160) / (tierNodes.length + 1);
            const x = 80 + (colIdx + 1) * spacing;
            placedNodes.push({
              ...n,
              x,
              y,
              tier: tierIdx,
            });
          });
        });

        return placedNodes;
      }

      if (layout === 'radial') {
        // Concentric Radar Rings:
        // Center: Ego Focus node, or highest degree hub
        const sorted = [...nodesToPlace].sort((a, b) => (b.degreeCentrality ?? 0) - (a.degreeCentrality ?? 0));
        const centerNode = egoFocusNodeId
          ? nodesToPlace.find((n) => n.id === egoFocusNodeId) || sorted[0]
          : sorted[0];

        const cx = width / 2;
        const cy = height / 2;
        const placedNodes: SimNode[] = [];

        if (centerNode) {
          placedNodes.push({ ...centerNode, x: cx, y: cy });
        }

        const others = nodesToPlace.filter((n) => n.id !== centerNode?.id);
        const ring1 = others.slice(0, Math.min(8, others.length));
        const ring2 = others.slice(8);

        // Ring 1 (R = 180)
        ring1.forEach((n, i) => {
          const angle = (i / ring1.length) * 2 * Math.PI;
          placedNodes.push({
            ...n,
            x: cx + Math.cos(angle) * 190,
            y: cy + Math.sin(angle) * 190,
          });
        });

        // Ring 2 (R = 340)
        ring2.forEach((n, i) => {
          const angle = (i / Math.max(1, ring2.length)) * 2 * Math.PI + 0.3;
          placedNodes.push({
            ...n,
            x: cx + Math.cos(angle) * 350,
            y: cy + Math.sin(angle) * 350,
          });
        });

        return placedNodes;
      }

      if (layout === 'grid') {
        // Categorical Columns:
        const categories: EntityType[] = ['Person', 'Phone', 'FinancialAccount', 'Vehicle', 'Location', 'Organisation'];
        const activeCategories = categories.filter((cat) => nodesToPlace.some((n) => n.type === cat));
        const colWidth = Math.max(160, (width - 120) / Math.max(1, activeCategories.length));

        const placedNodes: SimNode[] = [];
        activeCategories.forEach((cat, colIdx) => {
          const catNodes = nodesToPlace.filter((n) => n.type === cat);
          const x = 70 + colIdx * colWidth + colWidth / 2;
          catNodes.forEach((n, rowIdx) => {
            const y = 90 + rowIdx * 95;
            placedNodes.push({
              ...n,
              x,
              y,
              clusterCol: colIdx,
            });
          });
        });

        return placedNodes;
      }

      // Default fallback
      return nodesToPlace.map((n, i) => {
        const angle = (i / Math.max(1, nodesToPlace.length)) * 2 * Math.PI;
        return {
          ...n,
          x: width / 2 + Math.cos(angle) * 200,
          y: height / 2 + Math.sin(angle) * 200,
        };
      });
    },
    [egoFocusNodeId]
  );

  // Simulation and Layout Setup Effect
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    let initialNodes: SimNode[] = [];

    if (layoutFormat === 'force') {
      initialNodes = effectiveNodes.map((n, i) => {
        const cached = prevNodesPosRef.current.get(n.id);
        if (cached && cached.x !== undefined && cached.y !== undefined) {
          return {
            ...n,
            x: cached.x,
            y: cached.y,
            vx: cached.vx,
            vy: cached.vy,
          };
        }
        const angle = (i / Math.max(1, effectiveNodes.length)) * 2 * Math.PI;
        const dist = 140 + Math.random() * 160;
        return {
          ...n,
          x: n.x ?? width / 2 + Math.cos(angle) * dist,
          y: n.y ?? height / 2 + Math.sin(angle) * dist,
        };
      });

      const nodeMap = new Map(initialNodes.map((n) => [n.id, n]));
      const initialLinks: SimLink[] = effectiveEdges
        .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
        .map((e) => ({
          source: nodeMap.get(e.source)!,
          target: nodeMap.get(e.target)!,
          id: e.id,
          type: e.type,
          label: e.label,
          verificationStatus: e.verificationStatus,
          isDirect: e.isDirect,
          confidenceScore: e.confidenceScore,
          originalEdge: e,
        }));

      const simulation = forceSimulation(initialNodes)
        .force(
          'link',
          forceLink<SimNode, SimLink>(initialLinks)
            .id((d) => d.id)
            .distance(150)
        )
        .force('charge', forceManyBody().strength(-450))
        .force('center', forceCenter(width / 2, height / 2))
        .force('collision', forceCollide().radius(52));

      simulation.on('tick', () => {
        initialNodes.forEach((node) => {
          if (node.x !== undefined && node.y !== undefined) {
            prevNodesPosRef.current.set(node.id, {
              x: node.x,
              y: node.y,
              vx: node.vx,
              vy: node.vy,
            });
          }
        });
        setSimNodes([...initialNodes]);
        setSimLinks([...initialLinks]);
      });

      for (let i = 0; i < 45; ++i) simulation.tick();
      initialNodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          prevNodesPosRef.current.set(node.id, {
            x: node.x,
            y: node.y,
            vx: node.vx,
            vy: node.vy,
          });
        }
      });
      setSimNodes([...initialNodes]);
      setSimLinks([...initialLinks]);

      return () => {
        simulation.stop();
      };
    } else {
      // Deterministic layout (hierarchy, radial, or grid)
      initialNodes = computeStructuredLayout(effectiveNodes, layoutFormat, width, height);
      initialNodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          prevNodesPosRef.current.set(node.id, { x: node.x, y: node.y });
        }
      });

      const nodeMap = new Map(initialNodes.map((n) => [n.id, n]));
      const links: SimLink[] = effectiveEdges
        .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
        .map((e) => ({
          source: nodeMap.get(e.source)!,
          target: nodeMap.get(e.target)!,
          id: e.id,
          type: e.type,
          label: e.label,
          verificationStatus: e.verificationStatus,
          isDirect: e.isDirect,
          confidenceScore: e.confidenceScore,
          originalEdge: e,
        }));

      setSimNodes(initialNodes);
      setSimLinks(links);
    }
  }, [effectiveNodes, effectiveEdges, layoutFormat, computeStructuredLayout]);

  // Re-fit view automatically on layout format switch
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitView();
    }, 120);
    return () => clearTimeout(timer);
  }, [layoutFormat, handleFitView]);

  // Handle Manual Node Creation
  const handleCreateNode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNodeLabel.trim() || !onAddNode) return;
    const newId = `node-manual-${Date.now()}`;
    const newNode: GraphNode = {
      id: newId,
      label: newNodeLabel.trim(),
      primaryIdentifier: newNodeLabel.trim(),
      type: newNodeType,
      isSensitive: newNodeType === 'Phone' || newNodeType === 'FinancialAccount',
      maskedValue: newNodeType === 'Phone' ? `+91 ••••• ••${Math.floor(100 + Math.random() * 900)}` : newNodeLabel.trim(),
      unmaskedValue: newNodeLabel.trim(),
      attributes: { added: 'manual', timestamp: new Date().toISOString() },
      verificationStatus: newNodeStatus,
      confidenceScore: newNodeConfidence,
      caseIds: ['active-case'],
      sourceDocumentId: 'doc-manual-entry',
      extractionMethod: 'Manual Officer Entry',
      degreeCentrality: 0.5,
      betweennessCentrality: 0.25,
      communityId: Math.floor(1 + Math.random() * 4),
    };
    onAddNode(newNode);
    setNewNodeLabel('');
    setShowAddNodeModal(false);
  };

  // Quick Add Test Suspect / Entity
  const handleQuickAddTestNode = (type: EntityType = 'Person') => {
    if (!onAddNode) return;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const labelMap: Record<EntityType, string> = {
      Person: `Associate Suspect #${randomNum}`,
      Phone: `Burner SIM +91 98110 ${randomNum}`,
      Vehicle: `Swift Dzire DL-01-AB-${randomNum}`,
      Organisation: `Logistics Shell Co. #${randomNum}`,
      Location: `Sector-${randomNum % 50} Safehouse`,
      FinancialAccount: `Hawala Acc •••• ${randomNum}`,
    };
    const newId = `node-quick-${Date.now()}`;
    const entityLabel = labelMap[type] || `Entity #${randomNum}`;
    const newNode: GraphNode = {
      id: newId,
      label: entityLabel,
      primaryIdentifier: entityLabel,
      type,
      isSensitive: type === 'Phone' || type === 'FinancialAccount',
      maskedValue: type === 'Phone' ? `+91 ••••• ••${randomNum % 1000}` : entityLabel,
      unmaskedValue: entityLabel,
      attributes: { quickAdded: 'true', timestamp: new Date().toISOString() },
      verificationStatus: 'verified',
      confidenceScore: 0.88,
      caseIds: ['active-case'],
      sourceDocumentId: 'doc-quick-add',
      extractionMethod: 'Manual Officer Entry',
      degreeCentrality: 0.55,
      betweennessCentrality: 0.3,
      communityId: 2,
    };
    onAddNode(newNode);
  };

  // Calculate shortest path using BFS
  const handleFindPath = () => {
    if (!pathSourceId || !pathTargetId || pathSourceId === pathTargetId) {
      setHighlightedPathNodes([]);
      setHighlightedPathEdges([]);
      return;
    }

    const adj = new Map<string, { neighbor: string; edgeId: string }[]>();
    for (const n of effectiveNodes) adj.set(n.id, []);
    for (const e of effectiveEdges) {
      adj.get(e.source)?.push({ neighbor: e.target, edgeId: e.id });
      adj.get(e.target)?.push({ neighbor: e.source, edgeId: e.id });
    }

    const queue: { node: string; path: string[]; edgePath: string[] }[] = [
      { node: pathSourceId, path: [pathSourceId], edgePath: [] },
    ];
    const visited = new Set<string>([pathSourceId]);
    let foundPath: { path: string[]; edgePath: string[] } | null = null;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.node === pathTargetId) {
        foundPath = current;
        break;
      }
      for (const edge of adj.get(current.node) || []) {
        if (!visited.has(edge.neighbor)) {
          visited.add(edge.neighbor);
          queue.push({
            node: edge.neighbor,
            path: [...current.path, edge.neighbor],
            edgePath: [...current.edgePath, edge.edgeId],
          });
        }
      }
    }

    if (foundPath) {
      setHighlightedPathNodes(foundPath.path);
      setHighlightedPathEdges(foundPath.edgePath);
      setPathNotification(`Identified connection chain: ${foundPath.path.length} hops found.`);
      setTimeout(() => setPathNotification(null), 4000);
    } else {
      setHighlightedPathNodes([]);
      setHighlightedPathEdges([]);
      setPathNotification('No direct evidentiary link found between selected entities.');
      setTimeout(() => setPathNotification(null), 4000);
    }
  };

  const handleClearPath = () => {
    setPathSourceId('');
    setPathTargetId('');
    setHighlightedPathNodes([]);
    setHighlightedPathEdges([]);
    setPathNotification(null);
  };

  // Node visual attributes based on type and centrality
  const getNodeColor = (node: SimNode) => {
    if (centralityMode === 'louvain') {
      const colors = ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#f43f5e', '#22d3ee'];
      return colors[(node.communityId || 1) % colors.length];
    }
    if (centralityMode === 'degree') {
      const deg = node.degreeCentrality ?? 0.5;
      return deg > 0.8 ? '#ef4444' : deg > 0.6 ? '#f97316' : '#38bdf8';
    }
    if (centralityMode === 'betweenness') {
      const b = node.betweennessCentrality ?? 0.3;
      return b > 0.7 ? '#a855f7' : b > 0.4 ? '#6366f1' : '#64748b';
    }

    switch (node.type) {
      case 'Person':
        return '#38bdf8'; // Sky Blue
      case 'Phone':
        return '#34d399'; // Emerald Green
      case 'Vehicle':
        return '#fbbf24'; // Amber Yellow
      case 'Organisation':
        return '#a78bfa'; // Purple
      case 'Location':
        return '#fb7185'; // Rose Red
      case 'FinancialAccount':
        return '#22d3ee'; // Cyan
      default:
        return '#94a3b8';
    }
  };

  const getNodeBorderClass = (node: SimNode) => {
    const color = getNodeColor(node);
    switch (color) {
      case '#38bdf8':
        return 'border-l-sky-400';
      case '#34d399':
        return 'border-l-emerald-400';
      case '#fbbf24':
        return 'border-l-amber-400';
      case '#a78bfa':
      case '#a855f7':
        return 'border-l-purple-400';
      case '#fb7185':
      case '#f43f5e':
      case '#ef4444':
        return 'border-l-rose-400';
      case '#22d3ee':
        return 'border-l-cyan-400';
      case '#f97316':
        return 'border-l-orange-400';
      default:
        return 'border-l-emerald-400';
    }
  };

  const getNodeBgClass = (node: SimNode) => {
    const color = getNodeColor(node);
    switch (color) {
      case '#38bdf8':
        return 'bg-sky-400 text-slate-950';
      case '#34d399':
        return 'bg-emerald-400 text-slate-950';
      case '#fbbf24':
        return 'bg-amber-400 text-slate-950';
      case '#a78bfa':
      case '#a855f7':
        return 'bg-purple-400 text-slate-950';
      case '#fb7185':
      case '#f43f5e':
      case '#ef4444':
        return 'bg-rose-400 text-slate-950';
      case '#22d3ee':
        return 'bg-cyan-400 text-slate-950';
      case '#f97316':
        return 'bg-orange-400 text-slate-950';
      default:
        return 'bg-emerald-400 text-slate-950';
    }
  };

  const getNodeRadius = (node: SimNode) => {
    let base = 25;
    if (centralityMode === 'degree') {
      base = 20 + (node.degreeCentrality ?? 0.5) * 24;
    } else if (centralityMode === 'betweenness') {
      base = 20 + (node.betweennessCentrality ?? 0.3) * 26;
    }
    if (selectedNode?.id === node.id) base += 5;
    return base;
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'Person':
        return User;
      case 'Phone':
        return Smartphone;
      case 'Vehicle':
        return Car;
      case 'Organisation':
        return Building2;
      case 'Location':
        return MapPin;
      case 'FinancialAccount':
        return CreditCard;
      default:
        return Shield;
    }
  };

  // Native Wheel Zoom attached to container to zoom precisely into cursor location
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (viewMode !== 'canvas') return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? 1.15 : 0.87;

      setZoom((currZoom) => {
        const nextZoom = Math.min(3.5, Math.max(0.2, currZoom * factor));
        setPan((currPan) => {
          const worldX = (mouseX - currPan.x) / currZoom;
          const worldY = (mouseY - currPan.y) / currZoom;
          return {
            x: mouseX - worldX * nextZoom,
            y: mouseY - worldY * nextZoom,
          };
        });
        return nextZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [viewMode]);

  // Window drag handlers so canvas pan and node dragging never freeze or slip
  useEffect(() => {
    if (!isDraggingCanvas && !draggedNodeId) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (draggedNodeId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;

        setSimNodes((prev) =>
          prev.map((n) => {
            if (n.id === draggedNodeId) {
              prevNodesPosRef.current.set(n.id, { x: mouseX, y: mouseY });
              return { ...n, x: mouseX, y: mouseY, fx: mouseX, fy: mouseY };
            }
            return n;
          })
        );
      } else if (isDraggingCanvas) {
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
    };

    const handleWindowMouseUp = () => {
      setIsDraggingCanvas(false);
      setDraggedNodeId(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDraggingCanvas, draggedNodeId, pan, zoom, dragStart]);

  // Center-anchored zoom controls for buttons and presets
  const zoomToCenter = useCallback((factor: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;
    const centerX = width / 2;
    const centerY = height / 2;

    setZoom((currZoom) => {
      const nextZoom = Math.min(3.5, Math.max(0.2, currZoom * factor));
      setPan((currPan) => {
        const worldX = (centerX - currPan.x) / currZoom;
        const worldY = (centerY - currPan.y) / currZoom;
        return {
          x: centerX - worldX * nextZoom,
          y: centerY - worldY * nextZoom,
        };
      });
      return nextZoom;
    });
  }, []);

  const handleZoomIn = () => zoomToCenter(1.25);
  const handleZoomOut = () => zoomToCenter(0.8);

  const handleSetExactZoom = useCallback((targetZoom: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;
    const centerX = width / 2;
    const centerY = height / 2;

    setZoom((currZoom) => {
      const nextZoom = Math.min(3.5, Math.max(0.2, targetZoom));
      setPan((currPan) => {
        const worldX = (centerX - currPan.x) / currZoom;
        const worldY = (centerY - currPan.y) / currZoom;
        return {
          x: centerX - worldX * nextZoom,
          y: centerY - worldY * nextZoom,
        };
      });
      return nextZoom;
    });
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | SVGElement;
    if (
      target.closest('.graph-interactive-node') ||
      target.closest('.graph-interactive-edge') ||
      target.closest('button')
    ) {
      return;
    }
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleResetZoom = () => {
    handleFitView();
    setEgoFocusNodeId(null);
    handleClearPath();
  };

  const toggleEntityType = (type: EntityType) => {
    setSelectedEntityTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div
      className={`relative w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col select-none shadow-xl transition-all duration-300 ${
        isExpanded ? 'h-[860px]' : 'h-[700px]'
      }`}
    >
      {/* Top Header Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-20 backdrop-blur-md shadow-xs">
        {/* Left: View Mode Toggle & Layout Formatting */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main View Mode Selector (Canvas vs Cards vs Matrix) */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="2D Visual Network Canvas"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Structured Entity Relational Cards"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Entity Cards</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Adjacency Cross-Reference Matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
          </div>

          {/* If Canvas Mode: Layout Format Selector */}
          {viewMode === 'canvas' && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <span className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Format:
              </span>
              <button
                onClick={() => setLayoutFormat('force')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  layoutFormat === 'force'
                    ? 'bg-slate-800 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Organic physics layout with repulsive force"
              >
                Physics
              </button>
              <button
                onClick={() => setLayoutFormat('hierarchy')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutFormat === 'hierarchy'
                    ? 'bg-slate-800 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Command & Syndicate Strata (Kingpins -> Operatives -> Assets)"
              >
                <GitBranch className="w-3 h-3" />
                <span>Hierarchy</span>
              </button>
              <button
                onClick={() => setLayoutFormat('radial')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutFormat === 'radial'
                    ? 'bg-slate-800 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Concentric Radar Rings around central target"
              >
                <Compass className="w-3 h-3" />
                <span>Concentric</span>
              </button>
              <button
                onClick={() => setLayoutFormat('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutFormat === 'grid'
                    ? 'bg-slate-800 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Categorical Columns by Entity Type"
              >
                <Layers className="w-3 h-3" />
                <span>Columns</span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Search Field */}
        <div className="flex-1 max-w-xs relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suspect, SIM, car..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Actions, Path, Fit Screen & Fullscreen */}
        <div className="flex items-center gap-2">
          {onAddNode && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAddNodeModal(true)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Add new suspect or entity node to graph"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Node</span>
              </button>
              <button
                onClick={() => handleQuickAddTestNode('Person')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer hidden sm:flex"
                title="Quick-add a test suspect node to preview entry animation"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Suspect</span>
              </button>
            </div>
          )}

          {selectedNode && onRemoveNode && (
            <button
              onClick={() => {
                onRemoveNode(selectedNode.id);
                onSelectNode(null);
              }}
              className="px-2.5 py-1.5 bg-rose-950/90 border border-rose-600/80 text-rose-300 hover:bg-rose-900 rounded-lg text-xs flex items-center gap-1.5 font-bold transition-all shadow-xs cursor-pointer"
              title={`Remove ${selectedNode.label} from graph`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Remove</span>
            </button>
          )}

          {viewMode === 'canvas' && (
            <>
              <button
                onClick={() => setShowPathFinder(!showPathFinder)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs cursor-pointer ${
                  showPathFinder || highlightedPathNodes.length > 0
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Shortest evidentiary link path finder (BFS)"
              >
                <Route className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trace</span>
              </button>

              <button
                onClick={handleFitView}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Fit and Center entire graph into visible screen"
              >
                <Focus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fit</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Canvas' : 'Expand to Full Height'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Path Notification Banner */}
      <AnimatePresence>
        {pathNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-emerald-950/95 border border-emerald-500 text-emerald-200 text-xs font-semibold shadow-xl flex items-center gap-2 backdrop-blur-md"
          >
            <Route className="w-3.5 h-3.5 text-emerald-400" />
            <span>{pathNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortest Path Finder Drawer */}
      <AnimatePresence>
        {showPathFinder && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs overflow-hidden z-20 shadow-md"
          >
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5" />
              Path Finder:
            </span>
            <div className="flex items-center gap-2">
              <select
                value={pathSourceId}
                onChange={(e) => setPathSourceId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Origin Entity...</option>
                {effectiveNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    [{n.type}] {n.label}
                  </option>
                ))}
              </select>

              <span className="text-slate-500">→</span>

              <select
                value={pathTargetId}
                onChange={(e) => setPathTargetId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Destination Entity...</option>
                {effectiveNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    [{n.type}] {n.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleFindPath}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded cursor-pointer transition-colors shadow-xs"
            >
              Trace Chain
            </button>
            {highlightedPathNodes.length > 0 && (
              <button
                onClick={handleClearPath}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
            {highlightedPathNodes.length > 0 && (
              <span className="text-emerald-400 font-semibold font-mono text-[11px]">
                {highlightedPathNodes.length} nodes connected in chain
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Presentation View Container */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* VIEW 1: INTERACTIVE 2D GRAPH CANVAS */}
        {viewMode === 'canvas' && (
          <div
            ref={containerRef}
            onMouseDown={handleCanvasMouseDown}
            className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden bg-black"
          >
            {/* SVG Diagram Layer */}
            <svg ref={svgRef} className="w-full h-full block">
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#18181b" strokeWidth="0.8" />
                </pattern>
                {/* Arrow Markers */}
                <marker
                  id="arrow-verified"
                  viewBox="0 0 10 10"
                  refX="32"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker
                  id="arrow-suggested"
                  viewBox="0 0 10 10"
                  refX="32"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
                <marker
                  id="arrow-path"
                  viewBox="0 0 10 10"
                  refX="32"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker
                  id="arrow-hovered"
                  viewBox="0 0 10 10"
                  refX="32"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Background Rect for Drag/Pan Handling */}
              <rect id="graph-bg-rect" width="100%" height="100%" fill="url(#graph-grid)" />

              {/* Inner Transformed Scene (All zoom and pan applied here) */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. EDGES */}
                <g>
                  <AnimatePresence>
                    {simLinks.map((link) => {
                      const src = link.source as SimNode;
                      const tgt = link.target as SimNode;
                      if (src.x === undefined || src.y === undefined || tgt.x === undefined || tgt.y === undefined)
                        return null;

                      const isPathHighlighted = highlightedPathEdges.includes(link.id);
                      const isSelected = selectedEdge?.id === link.id;
                      const isPending = link.verificationStatus === 'ai_suggested';

                      // Link connectivity with hovered node
                      const isConnectedToHovered =
                        hoveredNodeId !== null && (src.id === hoveredNodeId || tgt.id === hoveredNodeId);
                      const isDimmed = hoveredNodeId !== null && !isConnectedToHovered;

                      const strokeColor = isPathHighlighted
                        ? '#10b981'
                        : isSelected
                        ? '#34d399'
                        : isConnectedToHovered
                        ? '#38bdf8'
                        : isPending
                        ? '#f59e0b'
                        : '#475569';
                      const strokeWidth = isPathHighlighted
                        ? 3.5
                        : isSelected || isConnectedToHovered
                        ? 3
                        : isPending
                        ? 2
                        : 1.6;

                      const midX = (src.x + tgt.x) / 2;
                      const midY = (src.y + tgt.y) / 2;
                      const labelWidth = Math.min(140, Math.max(50, link.label.length * 6.8));

                      return (
                        <motion.g
                          key={link.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isDimmed ? 0.12 : 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="cursor-pointer graph-interactive-edge"
                          onClick={() => onSelectEdge(link.originalEdge)}
                        >
                          {/* Connection Line */}
                          {layoutFormat === 'grid' ? (
                            <path
                              d={`M ${src.x} ${src.y} C ${(src.x + tgt.x) / 2} ${src.y}, ${(src.x + tgt.x) / 2} ${tgt.y}, ${tgt.x} ${tgt.y}`}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              strokeDasharray={isPending ? '6,4' : undefined}
                              markerEnd={
                                isPathHighlighted
                                  ? 'url(#arrow-path)'
                                  : isConnectedToHovered
                                  ? 'url(#arrow-hovered)'
                                  : isPending
                                  ? 'url(#arrow-suggested)'
                                  : 'url(#arrow-verified)'
                              }
                              className="transition-colors"
                            />
                          ) : (
                            <line
                              x1={src.x}
                              y1={src.y}
                              x2={tgt.x}
                              y2={tgt.y}
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              strokeDasharray={isPending ? '6,4' : undefined}
                              markerEnd={
                                isPathHighlighted
                                  ? 'url(#arrow-path)'
                                  : isConnectedToHovered
                                  ? 'url(#arrow-hovered)'
                                  : isPending
                                  ? 'url(#arrow-suggested)'
                                  : 'url(#arrow-verified)'
                              }
                              className="transition-colors"
                            />
                          )}

                          {/* Edge Label Pill Backdrop & Text */}
                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect
                              x={-labelWidth / 2}
                              y={-9}
                              width={labelWidth}
                              height="18"
                              rx="4"
                              fill="#090d16"
                              stroke={
                                isPathHighlighted
                                  ? '#10b981'
                                  : isSelected
                                  ? '#34d399'
                                  : isConnectedToHovered
                                  ? '#38bdf8'
                                  : '#334155'
                              }
                              strokeWidth="1"
                              opacity={0.96}
                            />
                            <text
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={
                                isPathHighlighted
                                  ? '#34d399'
                                  : isConnectedToHovered
                                  ? '#38bdf8'
                                  : isPending
                                  ? '#fbbf24'
                                  : '#cbd5e1'
                              }
                              fontSize="9.5"
                              fontWeight="600"
                              fontFamily="monospace"
                              className="select-none pointer-events-none"
                            >
                              {link.label.length > 20 ? `${link.label.substring(0, 18)}..` : link.label}
                            </text>
                          </g>
                        </motion.g>
                      );
                    })}
                  </AnimatePresence>
                </g>

                {/* 2. NODES */}
                <g>
                  <AnimatePresence>
                    {simNodes.map((node) => {
                      if (node.x === undefined || node.y === undefined) return null;
                      const isSelected = selectedNode?.id === node.id;
                      const isHovered = hoveredNodeId === node.id;
                      const isPathHighlighted = highlightedPathNodes.includes(node.id);
                      const isSearchMatched = matchedNodeIds.has(node.id);
                      const isPending = node.verificationStatus === 'ai_suggested';

                      // Dimming logic when hovering an entity
                      const isConnectedToHovered =
                        connectedNodeIdsToHovered === null || connectedNodeIdsToHovered.has(node.id);
                      const isDimmed = !isConnectedToHovered;

                      const radius = getNodeRadius(node);
                      const fillColor = getNodeColor(node);
                      const IconComp = getEntityIcon(node.type);

                      // Direct connections count
                      const directDegree = effectiveEdges.filter(
                        (e) => e.source === node.id || e.target === node.id
                      ).length;

                      // Primary Label
                      const labelText =
                        node.label.length > 24 ? `${node.label.substring(0, 22)}...` : node.label;
                      const labelWidth = Math.max(76, Math.min(190, labelText.length * 7.2 + 18));

                      // Secondary Role or Identifier tag
                      const roleText =
                        (node.attributes?.roleInNetwork as string) ||
                        (node.type === 'Phone'
                          ? node.maskedValue || 'Burner Phone'
                          : node.type === 'Vehicle'
                          ? node.maskedValue || 'Transit Car'
                          : node.type.toUpperCase());
                      const subLabelText = roleText.length > 22 ? `${roleText.substring(0, 20)}..` : roleText;
                      const subLabelWidth = Math.max(64, Math.min(160, subLabelText.length * 6.2 + 14));

                      return (
                        <motion.g
                          key={node.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: isDimmed ? 0.22 : 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <g
                            transform={`translate(${node.x}, ${node.y})`}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDraggedNodeId(node.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectNode(node);
                            }}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEgoFocusNodeId(node.id === egoFocusNodeId ? null : node.id);
                            }}
                            className="cursor-pointer graph-interactive-node"
                          >
                            {/* Glow / Halo for Selection, Hover, Path, or Search Match */}
                            {(isSelected || isHovered || isPathHighlighted || isSearchMatched) && (
                              <circle
                                r={radius + 8}
                                fill="none"
                                stroke={
                                  isPathHighlighted
                                    ? '#10b981'
                                    : isSearchMatched
                                    ? '#38bdf8'
                                    : isSelected
                                    ? '#34d399'
                                    : fillColor
                                }
                                strokeWidth={isHovered ? 2 : 2.8}
                                strokeDasharray={isSelected || isSearchMatched ? '4,3' : undefined}
                                className={isSelected || isSearchMatched ? 'animate-spin' : ''}
                                style={{
                                  animationDuration: '8s',
                                  filter: `drop-shadow(0 0 8px ${fillColor}99)`,
                                }}
                              />
                            )}

                            {/* Outer Accent Ring */}
                            <circle
                              r={radius + 2}
                              fill="none"
                              stroke={fillColor}
                              strokeWidth="1"
                              strokeOpacity={0.4}
                            />

                            {/* Central High-Contrast Entity Circle */}
                            <circle
                              r={radius}
                              fill="#090e1a"
                              stroke={isSelected ? '#34d399' : isHovered ? '#ffffff' : fillColor}
                              strokeWidth={isSelected ? 3.5 : isHovered ? 3 : 2.5}
                              strokeDasharray={isPending ? '4,2.5' : undefined}
                              style={{
                                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
                              }}
                            />

                            {/* Inner Color Tint */}
                            <circle
                              r={radius - 3}
                              fill={fillColor}
                              fillOpacity={0.14}
                            />

                            {/* Pure SVG Lucide Icon */}
                            <g transform="translate(-11, -11)">
                              <IconComp
                                size={22}
                                color={isHovered ? '#ffffff' : fillColor}
                                strokeWidth={2.4}
                                className="pointer-events-none select-none"
                              />
                            </g>

                            {/* Top-Right Verification Status Indicator */}
                            <g transform={`translate(${radius * 0.72}, ${-radius * 0.72})`}>
                              {isPending ? (
                                <g>
                                  <circle r="6" fill="#f59e0b" stroke="#090e1a" strokeWidth="1.5" />
                                  <circle r="2" fill="#090e1a" />
                                </g>
                              ) : (
                                <g>
                                  <circle r="6" fill="#10b981" stroke="#090e1a" strokeWidth="1.5" />
                                  <path
                                    d="M -2.5 0 L -0.5 2 L 2.5 -1.5"
                                    fill="none"
                                    stroke="#090e1a"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </g>
                              )}
                            </g>

                            {/* Top-Left Connection Count Badge */}
                            {directDegree > 0 && (
                              <g transform={`translate(${-radius * 0.72}, ${-radius * 0.72})`}>
                                <circle r="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                                <text
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill="#cbd5e1"
                                  fontSize="7.5"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  className="select-none pointer-events-none"
                                >
                                  {directDegree}
                                </text>
                              </g>
                            )}

                            {/* Primary High-Contrast Name Label Pill */}
                            <g transform={`translate(0, ${radius + 14})`}>
                              <rect
                                x={-labelWidth / 2}
                                y={-10}
                                width={labelWidth}
                                height="21"
                                rx="5"
                                fill="#090d16"
                                stroke={
                                  isSelected
                                    ? '#34d399'
                                    : isHovered
                                    ? '#ffffff'
                                    : isSearchMatched
                                    ? '#38bdf8'
                                    : fillColor
                                }
                                strokeWidth={isSelected || isHovered || isSearchMatched ? '1.6' : '1'}
                                opacity={0.98}
                                style={{
                                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                                }}
                              />
                              <text
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={isSelected ? '#34d399' : isHovered ? '#ffffff' : '#f8fafc'}
                                fontSize="10.5"
                                fontWeight="700"
                                fontFamily="sans-serif"
                                className="select-none pointer-events-none"
                              >
                                {labelText}
                              </text>
                            </g>

                            {/* Secondary Operational Role / Identifier Tag */}
                            {labelDetail === 'full' && (
                              <g transform={`translate(0, ${radius + 34})`}>
                                <rect
                                  x={-subLabelWidth / 2}
                                  y={-8}
                                  width={subLabelWidth}
                                  height="16"
                                  rx="4"
                                  fill="#0f172a"
                                  stroke="#334155"
                                  strokeWidth="0.8"
                                  opacity={0.94}
                                />
                                <text
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill={fillColor}
                                  fontSize="8.5"
                                  fontWeight="600"
                                  className="select-none pointer-events-none"
                                >
                                  {subLabelText}
                                </text>
                              </g>
                            )}
                          </g>
                        </motion.g>
                      );
                    })}
                  </AnimatePresence>
                </g>
              </g>
            </svg>

            {/* Top-Right Floating Dossier / Fast Inspection HUD Card */}
            {hoveredNode ? (
              <div className={`cluventa-node-tooltip animate-in fade-in zoom-in-95 ${getNodeBorderClass(hoveredNode)}`}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {hoveredNode.type}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${hoveredNode.verificationStatus === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'}`}>
                    {hoveredNode.verificationStatus === 'verified' ? 'Verified' : 'Pending AI'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-0.5 truncate">
                  {hoveredNode.label}
                </h4>
                {hoveredNode.attributes?.roleInNetwork && (
                  <p className="text-xs text-emerald-400 font-medium mb-1">
                    Role: {String(hoveredNode.attributes.roleInNetwork)}
                  </p>
                )}
                {hoveredNode.maskedValue && (
                  <p className="text-[11px] text-slate-400 font-mono mb-1.5 truncate">
                    ID: {hoveredNode.maskedValue}
                  </p>
                )}
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Connections: {effectiveEdges.filter((e) => e.source === hoveredNode.id || e.target === hoveredNode.id).length}</span>
                  <span className="text-slate-500">Click to select</span>
                </div>
              </div>
            ) : (
              <div className="absolute top-4 right-4 bg-slate-900/80 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[10px] text-slate-400 font-mono shadow-md backdrop-blur-xs z-10 pointer-events-none hidden sm:block">
                Zoom: {Math.round(zoom * 100)}% • Wheel to zoom • Drag canvas to pan
              </div>
            )}

            {/* Bottom-Right Zoom & View Controls */}
            <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-xl p-2 flex flex-col items-center gap-1.5 shadow-2xl backdrop-blur-md z-10">
              {/* Zoom Buttons & Percentage Indicator */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In (+ or wheel up)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSetExactZoom(1)}
                  className="px-2 py-1 text-[11px] font-mono font-bold text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  title="Click to reset to 100% Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out (- or wheel down)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full h-px bg-slate-800 my-0.5" />

              {/* Quick Presets */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSetExactZoom(0.5)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                    Math.abs(zoom - 0.5) < 0.08
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                  title="50% View"
                >
                  50%
                </button>
                <button
                  onClick={() => handleSetExactZoom(1.0)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                    Math.abs(zoom - 1.0) < 0.08
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                  title="100% View"
                >
                  100%
                </button>
                <button
                  onClick={() => handleSetExactZoom(1.5)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                    Math.abs(zoom - 1.5) < 0.08
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                  title="150% View"
                >
                  150%
                </button>
                <button
                  onClick={handleFitView}
                  className="px-2 py-0.5 text-[10px] font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 border border-emerald-500/50 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  title="Fit and center all nodes"
                >
                  <Focus className="w-3 h-3 text-emerald-400" />
                  <span>Fit</span>
                </button>
              </div>

              <div className="w-full h-px bg-slate-800 my-0.5" />

              {/* Label Detail Toggle */}
              <button
                onClick={() => setLabelDetail((prev) => (prev === 'full' ? 'compact' : 'full'))}
                className="w-full py-1 px-1.5 text-[10px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded flex items-center justify-between gap-1 transition-colors cursor-pointer"
                title="Toggle Node Role / Subtitle Labels"
              >
                <span>Labels:</span>
                <span className="text-emerald-400 font-bold uppercase">{labelDetail}</span>
              </button>
            </div>

            {/* Bottom-Left Interactive Legend & Category Filter */}
            <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md max-w-xs z-10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Filter className="w-3.5 h-3.5" />
                  Entity Filter
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {simNodes.length} nodes • {simLinks.length} links
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { type: 'Person', color: 'bg-sky-400' },
                  { type: 'Phone', color: 'bg-emerald-400' },
                  { type: 'Vehicle', color: 'bg-amber-400' },
                  { type: 'FinancialAccount', color: 'bg-cyan-400' },
                  { type: 'Location', color: 'bg-rose-400' },
                  { type: 'Organisation', color: 'bg-purple-400' },
                ].map(({ type, color }) => {
                  const isActive = selectedEntityTypes.includes(type as EntityType);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleEntityType(type as EntityType)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors text-left cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-slate-200 font-medium'
                          : 'opacity-40 text-slate-500 line-through'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="truncate">{type}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-slate-400 inline-block" /> Verified
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" /> Pending AI
                </span>
              </div>
            </div>

            {/* Ego Focus Active Badge */}
            {egoFocusNodeId && (
              <div className="absolute top-4 left-4 bg-emerald-950/90 border border-emerald-500/80 rounded-lg px-3 py-1.5 text-xs text-emerald-200 flex items-center gap-2 shadow-lg backdrop-blur-sm z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold">Ego Network Focused</span>
                <button
                  onClick={() => setEgoFocusNodeId(null)}
                  className="ml-2 text-emerald-400 hover:text-white underline text-[11px] cursor-pointer"
                >
                  Show All
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: STRUCTURED ENTITY CARDS EXPLORER (Alternative High-Legibility Representation) */}
        {viewMode === 'cards' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TableProperties className="w-4 h-4 text-emerald-400" />
                  Structured Entity Network Dossier
                </h2>
                <p className="text-xs text-slate-400">
                  Tabular and card view showing direct connections, phone numbers, and operational roles
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Showing {effectiveNodes.length} entities • {effectiveEdges.length} connections
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {effectiveNodes.map((node) => {
                const IconComp = getEntityIcon(node.type);
                const connectedEdges = effectiveEdges.filter(
                  (e) => e.source === node.id || e.target === node.id
                );
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectNode(node)}
                    className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer space-y-3 relative group hover:border-emerald-500/60 ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-slate-950"
                          style={{ backgroundColor: getNodeColor(node as any) }}
                        >
                          <IconComp className="w-5 h-5 text-slate-950" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                            {node.label}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {node.type}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                node.verificationStatus === 'verified'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {node.verificationStatus === 'verified' ? 'Verified' : 'Pending AI'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Confidence Score Pill */}
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {Math.round((node.confidenceScore ?? 0.8) * 100)}% Conf
                      </span>
                    </div>

                    {/* Role / Attribute Information */}
                    {node.attributes && (
                      <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                        {node.attributes.roleInNetwork && (
                          <p className="text-[11px]">
                            <span className="text-slate-400 font-medium">Role: </span>
                            <span className="text-emerald-300 font-semibold">
                              {String(node.attributes.roleInNetwork)}
                            </span>
                          </p>
                        )}
                        {node.primaryIdentifier && (
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            <span className="text-slate-400 font-medium">ID: </span>
                            {node.primaryIdentifier}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Connected Links Breakdown */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Direct Links ({connectedEdges.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {connectedEdges.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">No connected edges</span>
                        ) : (
                          connectedEdges.map((edge) => {
                            const otherId = edge.source === node.id ? edge.target : edge.source;
                            const otherNode = nodes.find((n) => n.id === otherId);
                            return (
                              <span
                                key={edge.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectEdge(edge);
                                }}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 border border-slate-700/60 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span className="text-emerald-400 font-bold">•</span>
                                <span className="font-semibold">{edge.label}:</span>
                                <span className="text-slate-400 truncate max-w-[100px]">
                                  {otherNode?.label || otherId}
                                </span>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEgoFocusNodeId(node.id);
                          setViewMode('canvas');
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Network className="w-3 h-3" />
                        <span>Focus in Graph</span>
                      </button>

                      {onRemoveNode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveNode(node.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: ADJACENCY CROSS-REFERENCE MATRIX */}
        {viewMode === 'matrix' && (
          <div className="flex-1 p-6 overflow-auto bg-slate-950 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-emerald-400" />
                  Network Adjacency & Inter-Entity Matrix
                </h2>
                <p className="text-xs text-slate-400">
                  Row-by-column cross tabulation of verified interactions, calls, and financial flows
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                    <th className="p-3 font-bold sticky left-0 bg-slate-900 z-10 min-w-[180px]">
                      Entity
                    </th>
                    {effectiveNodes.map((n) => (
                      <th
                        key={n.id}
                        className="p-3 font-semibold text-[11px] text-center min-w-[120px] max-w-[150px] truncate"
                        title={n.label}
                      >
                        {n.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {effectiveNodes.map((rowNode, rIdx) => (
                    <tr
                      key={rowNode.id}
                      className={`border-b border-slate-800/80 hover:bg-slate-900/50 ${
                        rIdx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/20'
                      }`}
                    >
                      <td className="p-3 font-semibold text-white sticky left-0 bg-slate-900 z-10 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: getNodeColor(rowNode as any) }}
                        />
                        <span className="truncate max-w-[160px]">{rowNode.label}</span>
                      </td>

                      {effectiveNodes.map((colNode) => {
                        if (rowNode.id === colNode.id) {
                          return (
                            <td key={colNode.id} className="p-2 text-center bg-slate-900/30 text-slate-600">
                              —
                            </td>
                          );
                        }

                        const directEdge = effectiveEdges.find(
                          (e) =>
                            (e.source === rowNode.id && e.target === colNode.id) ||
                            (e.source === colNode.id && e.target === rowNode.id)
                        );

                        if (!directEdge) {
                          return (
                            <td key={colNode.id} className="p-2 text-center text-slate-700">
                              ·
                            </td>
                          );
                        }

                        return (
                          <td
                            key={colNode.id}
                            onClick={() => onSelectEdge(directEdge)}
                            className="p-2 text-center cursor-pointer hover:bg-emerald-950/60 transition-colors"
                          >
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/70 truncate max-w-[110px]">
                              {directEdge.label}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Entity Node Modal */}
        <AnimatePresence>
          {showAddNodeModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowAddNodeModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Add Intelligence Entity</h3>
                      <p className="text-xs text-slate-400">Spawns an interactive node with entry animation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddNodeModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateNode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Entity Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Person', 'Phone', 'Vehicle', 'Organisation', 'Location', 'FinancialAccount'] as EntityType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewNodeType(type)}
                          className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            newNodeType === type
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Identifier / Label
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Rao, +91 98110 54321, Swift Dzire"
                      value={newNodeLabel}
                      onChange={(e) => setNewNodeLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Verification Status
                      </label>
                      <select
                        value={newNodeStatus}
                        onChange={(e) => setNewNodeStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="verified">Verified (Official)</option>
                        <option value="ai_suggested">Pending AI Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confidence: {Math.round(newNodeConfidence * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.05"
                        value={newNodeConfidence}
                        onChange={(e) => setNewNodeConfidence(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 mt-2"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800 gap-3">
                    <div className="text-[11px] text-slate-400">
                      Or quick-add:
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickAddTestNode('Person');
                          setShowAddNodeModal(false);
                        }}
                        className="ml-1.5 text-emerald-400 hover:underline font-semibold cursor-pointer"
                      >
                        + Suspect
                      </button>
                      <span className="mx-1">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickAddTestNode('Phone');
                          setShowAddNodeModal(false);
                        }}
                        className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                      >
                        + Phone
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddNodeModal(false)}
                        className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-md cursor-pointer"
                      >
                        Add to Graph
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
