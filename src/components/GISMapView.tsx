/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  GISLocationFeature,
  GISLocationCategory,
  GraphNode,
  GraphEdge,
  CaseDocument,
  User,
} from '../types.ts';
import {
  MapPin,
  Layers,
  Compass,
  Navigation,
  Crosshair,
  Shield,
  Eye,
  Radio,
  Building2,
  Home,
  AlertTriangle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  Copy,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Share2,
  Maximize2,
  Info,
  Map as MapIcon,
  Plus,
  X,
  Sparkles,
  Route,
  ArrowUpDown,
  Car,
  Truck,
  Milestone,
  RotateCcw,
  Waypoints,
  Target,
  Users,
  Link2,
  GitMerge,
  ArrowRight,
} from 'lucide-react';

interface GISMapViewProps {
  locations: GISLocationFeature[];
  nodes: GraphNode[];
  edges?: GraphEdge[];
  documents: CaseDocument[];
  currentUser: User;
  caseId: string;
  onSelectNode?: (node: GraphNode | null) => void;
  onSelectDocument?: (docId: string) => void;
  onAddLocation?: (locationData: Partial<GISLocationFeature>) => Promise<void>;
}

// Tactical color palette for identifying distinct criminals & suspects on GIS overlays
export const CRIMINAL_PALETTE = [
  '#f43f5e', // Rose / Red (Kingpin / Lead)
  '#f59e0b', // Amber / Orange (Logistics / Courier)
  '#a855f7', // Purple (Finance / Hawala)
  '#06b6d4', // Cyan (Auto / Hardware)
  '#10b981', // Emerald (Front / Clearing)
  '#ec4899', // Pink (Accounting)
  '#3b82f6', // Blue
  '#eab308', // Yellow
];

export interface CriminalProfile {
  id: string;
  name: string;
  role: string;
  aliases: string[];
  color: string;
  locations: GISLocationFeature[];
  primaryLocation?: GISLocationFeature;
}

export interface CriminalSyndicateLink {
  id: string;
  criminalA: CriminalProfile;
  criminalB: CriminalProfile;
  locationA: GISLocationFeature;
  locationB: GISLocationFeature;
  relationshipLabel: string;
  evidenceSnippet: string;
  highwayHint: string;
}

// Category visual styling configuration
const CATEGORY_CONFIG: Record<
  GISLocationCategory,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    hexColor: string;
    icon: React.ElementType;
    badgeName: string;
  }
> = {
  vault: {
    label: 'Hawala Vault / Stash',
    bgClass: 'bg-amber-950/80',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-600/70',
    hexColor: '#f59e0b',
    icon: Shield,
    badgeName: 'Vault',
  },
  interception: {
    label: 'Raid / Seizure Point',
    bgClass: 'bg-rose-950/80',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-600/70',
    hexColor: '#f43f5e',
    icon: Crosshair,
    badgeName: 'Seizure',
  },
  sighting: {
    label: 'CCTV / Physical Sighting',
    bgClass: 'bg-cyan-950/80',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-600/70',
    hexColor: '#06b6d4',
    icon: Eye,
    badgeName: 'Sighting',
  },
  toll_plaza: {
    label: 'ANPR Toll Camera',
    bgClass: 'bg-orange-950/80',
    textClass: 'text-orange-300',
    borderClass: 'border-orange-600/70',
    hexColor: '#f97316',
    icon: Navigation,
    badgeName: 'ANPR Toll',
  },
  cell_tower: {
    label: 'CDR Cellular Tower',
    bgClass: 'bg-purple-950/80',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-600/70',
    hexColor: '#a855f7',
    icon: Radio,
    badgeName: 'Cell Tower',
  },
  residence: {
    label: 'Suspect Residence',
    bgClass: 'bg-blue-950/80',
    textClass: 'text-blue-300',
    borderClass: 'border-blue-600/70',
    hexColor: '#3b82f6',
    icon: Home,
    badgeName: 'Residence',
  },
  office: {
    label: 'Commercial / Front Office',
    bgClass: 'bg-indigo-950/80',
    textClass: 'text-indigo-300',
    borderClass: 'border-indigo-600/70',
    hexColor: '#6366f1',
    icon: Building2,
    badgeName: 'Front Office',
  },
  crime_scene: {
    label: 'Crime Scene / Command Post',
    bgClass: 'bg-emerald-950/80',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-600/70',
    hexColor: '#10b981',
    icon: MapPin,
    badgeName: 'Command Post',
  },
};

// Map Basemap Tile Providers - 100% Free, Zero API Key Required
type TileTheme = 'dark' | 'satellite' | 'street';

interface TileLayerConfig {
  base: string;
  labels?: string;
  attribution: string;
  maxZoom: number;
}

const TILE_LAYERS: Record<TileTheme, TileLayerConfig> = {
  dark: {
    // Esri World Dark Gray Canvas Base: Zero API key, fast global CDN, crisp dark slate aesthetic
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    // Esri World Dark Gray Reference: Clean English place names, highways, and national borders
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  },
  street: {
    // OpenStreetMap Standard: Zero API key, 100% open community mapping
    base: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    // Esri World Imagery: Zero API key, high-resolution satellite imagery across India
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP',
    maxZoom: 18,
  },
};

// Helper: Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate perpendicular distance from point P to line segment AB in meters
function distanceToSegmentMeters(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const cosLat = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  const degToMeters = 111320;

  const bx = (bLng - aLng) * cosLat * degToMeters;
  const by = (bLat - aLat) * degToMeters;
  const px = (pLng - aLng) * cosLat * degToMeters;
  const py = (pLat - aLat) * degToMeters;

  const segLengthSq = bx * bx + by * by;
  if (segLengthSq === 0) {
    return calculateDistanceMeters(pLat, pLng, aLat, aLng);
  }

  // Clamped projection factor t in [0, 1]
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / segLengthSq));
  const projX = t * bx;
  const projY = t * by;

  const distSq = (px - projX) * (px - projX) + (py - projY) * (py - projY);
  return Math.sqrt(distSq);
}

// Calculate minimum perpendicular distance from point P to an entire polyline in meters
function distanceToPolylineMeters(
  pLat: number,
  pLng: number,
  polyline: [number, number][]
): number {
  if (polyline.length < 2) return Infinity;
  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const [aLat, aLng] = polyline[i];
    const [bLat, bLng] = polyline[i + 1];
    const dist = distanceToSegmentMeters(pLat, pLng, aLat, aLng, bLat, bLng);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return minDistance;
}

// Generate smooth multi-segment geodesic / curved path between two coordinates
function generateGeodesicPath(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  numPoints: number = 32
): [number, number][] {
  const path: [number, number][] = [];
  const deltaLat = destination.lat - origin.lat;
  const deltaLng = destination.lng - origin.lng;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = origin.lat + t * deltaLat;
    const lng = origin.lng + t * deltaLng;
    // Slight natural highway arc
    const arc = Math.sin(t * Math.PI) * 0.012 * (deltaLng >= 0 ? 1 : -1);
    path.push([lat + arc * 0.3, lng + arc]);
  }
  return path;
}

// Helper: Format duration into human readable string
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

// Inter-State Transit Corridor Presets
interface CorridorPreset {
  id: string;
  name: string;
  corridor: string;
  description: string;
  matchOrigin: string;
  matchDest: string;
  icon: string;
}

const CORRIDOR_PRESETS: CorridorPreset[] = [
  {
    id: 'p1',
    name: 'Western Bullion Pipeline',
    corridor: 'NH 48 / Western Corridor',
    description: 'Gold settlement conduit linking Chandni Chowk & Zaveri Bazaar via Surat diamond bourse.',
    matchOrigin: 'Kucha Mahajani',
    matchDest: 'Zaveri Bazaar',
    icon: '🚚',
  },
  {
    id: 'p2',
    name: 'Northern Narcotics & Arms Pipeline',
    corridor: 'Grand Trunk Road / NH 44',
    description: 'Cross-border contraband route from Attari ICP through Punjab and Haryana into Delhi wholesale hubs.',
    matchOrigin: 'Attari Border',
    matchDest: 'Chandni Chowk',
    icon: '🚨',
  },
  {
    id: 'p3',
    name: 'Coastal Customs Freight Belt',
    corridor: 'Western Dedicated Freight Belt',
    description: 'Container consignment route between JNPT Nhava Sheva maritime customs and Surat bourses.',
    matchOrigin: 'JNPT Port',
    matchDest: 'Surat Diamond',
    icon: '🚢',
  },
  {
    id: 'p4',
    name: 'Interstate Stolen Vehicle Conduit',
    corridor: 'Delhi-Jaipur Expressway',
    description: 'Luxury vehicle chop-shop transit moving stolen vehicles from Delhi NCR to Rajasthan garages.',
    matchOrigin: 'Ring Road',
    matchDest: 'Jaipur',
    icon: '🚗',
  },
  {
    id: 'p5',
    name: 'Deccan Cyber Extortion Axis',
    corridor: 'NH 44 Deccan Tech Corridor',
    description: 'VoIP digital arrest server routing axis between Bengaluru gateway and Hyderabad mule centers.',
    matchOrigin: 'Bengaluru',
    matchDest: 'Hyderabad',
    icon: '💻',
  },
  {
    id: 'p6',
    name: 'Eastern Hawala Transit Conduit',
    corridor: 'NH 19 Eastern Freight Corridor',
    description: 'Cross-country cash and bullion transit connecting Burrabazar Kolkata to Delhi Kucha Mahajani.',
    matchOrigin: 'Burrabazar',
    matchDest: 'Kucha Mahajani',
    icon: '🏦',
  },
];

// Fetch road route from public OSRM API with seamless offline/rate-limit fallback
async function fetchRouteFromOSRM(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'driving' | 'direct'
): Promise<{
  path: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  isRealRoad: boolean;
  highways: string[];
}> {
  const directDist = calculateDistanceMeters(origin.lat, origin.lng, destination.lat, destination.lng);

  if (mode === 'direct') {
    const path = generateGeodesicPath(origin, destination, 30);
    return {
      path,
      distanceMeters: Math.round(directDist),
      durationSeconds: Math.round((directDist / 1000 / 95) * 3600), // ~95 km/h air vector
      isRealRoad: false,
      highways: ['Direct Aerial / Geodesic Vector'],
    };
  }

  // Attempt real driving road routing via public OSRM
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const path: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [
          coord[1],
          coord[0],
        ]);

        const highwaySet = new Set<string>();
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          route.legs[0].steps.forEach((s: any) => {
            if (s.name && typeof s.name === 'string' && s.name.trim().length > 0 && !s.name.includes('{')) {
              highwaySet.add(s.name.trim());
            }
            if (s.ref && typeof s.ref === 'string' && s.ref.trim().length > 0) {
              highwaySet.add(s.ref.trim());
            }
          });
        }

        return {
          path,
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(route.duration),
          isRealRoad: true,
          highways: Array.from(highwaySet).slice(0, 5),
        };
      }
    }
  } catch (err) {
    console.warn('OSRM routing request timed out or unavailable, falling back to simulated highway path', err);
  }

  // Fallback: Realistic highway model with ~1.22 circuity index
  const path = generateGeodesicPath(origin, destination, 35);
  const roadDist = Math.round(directDist * 1.22);
  const roadDuration = Math.round((roadDist / 1000 / 65) * 3600); // 65 km/h commercial transit speed

  return {
    path,
    distanceMeters: roadDist,
    durationSeconds: roadDuration,
    isRealRoad: false,
    highways: ['Interstate Highway Conduit (Simulated Transit)'],
  };
}

export const GISMapView: React.FC<GISMapViewProps> = ({
  locations,
  nodes,
  edges = [],
  documents,
  currentUser,
  caseId,
  onSelectNode,
  onSelectDocument,
  onAddLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const trajectoryLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeCorridorLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const criminalRoutesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // States
  const [selectedLocation, setSelectedLocation] = useState<GISLocationFeature | null>(locations[0] || null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTileTheme, setCurrentTileTheme] = useState<TileTheme>('dark');
  
  // Layer Toggles
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true);
  const [showCellRadius, setShowCellRadius] = useState<boolean>(true);
  const [showCriminalRoutes, setShowCriminalRoutes] = useState<boolean>(true);
  const [activeCriminalFilter, setActiveCriminalFilter] = useState<string>('all_syndicate');
  const [geofenceActive, setGeofenceActive] = useState<boolean>(false);
  const [geofenceCenter, setGeofenceCenter] = useState<{ lat: number; lng: number } | null>({
    lat: 28.6562,
    lng: 77.2315, // Default to Kucha Mahajani
  });
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState<number>(3000);

  // Route Corridor Plotter State
  const [showRouteTool, setShowRouteTool] = useState<boolean>(false);
  const [routeSelectionMode, setRouteSelectionMode] = useState<'criminal' | 'waypoint'>('criminal');
  const [routeOriginId, setRouteOriginId] = useState<string>('');
  const [routeDestId, setRouteDestId] = useState<string>('');
  const [selectedCriminalOriginId, setSelectedCriminalOriginId] = useState<string>('');
  const [selectedCriminalDestId, setSelectedCriminalDestId] = useState<string>('');
  const [routeMode, setRouteMode] = useState<'driving' | 'direct'>('driving');
  const [corridorBufferKm, setCorridorBufferKm] = useState<number>(15);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [pickingTarget, setPickingTarget] = useState<'none' | 'origin' | 'destination'>('none');
  const pickingTargetRef = useRef<'none' | 'origin' | 'destination'>('none');
  pickingTargetRef.current = pickingTarget;

  const geofenceActiveRef = useRef<boolean>(geofenceActive);
  geofenceActiveRef.current = geofenceActive;

  const [routeResult, setRouteResult] = useState<{
    origin: GISLocationFeature;
    destination: GISLocationFeature;
    path: [number, number][];
    distanceMeters: number;
    durationSeconds: number;
    isRealRoad: boolean;
    highways: string[];
    interceptedLocations: {
      location: GISLocationFeature;
      distanceMeters: number;
    }[];
  } | null>(null);

  // Trajectory Playback
  const [isPlayingTrajectory, setIsPlayingTrajectory] = useState<boolean>(false);
  const [currentTrajectoryStep, setCurrentTrajectoryStep] = useState<number>(0);

  // Derive Criminal Profiles and their associated geospatial locations
  const criminalProfiles = useMemo<CriminalProfile[]>(() => {
    const personNodes = (nodes || []).filter((n) => n.type === 'Person');
    const profiles: CriminalProfile[] = [];

    personNodes.forEach((node, idx) => {
      const nodeLabelLower = node.label.toLowerCase();
      const cleanName = node.label.replace(/\s*\(.*?\)\s*/g, '').replace(/["']/g, '').trim();
      const aliases = (node.aliases || []).map((a) => a.toLowerCase().replace(/["']/g, '').trim());

      // Match locations associated with this person node
      const matchedLocs = locations.filter((loc) => {
        if (loc.associatedNodes && loc.associatedNodes.includes(node.id)) return true;
        return loc.associatedEntities.some((entity) => {
          const entClean = entity.toLowerCase().replace(/["']/g, '').trim();
          if (entClean.includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(entClean)) return true;
          if (nodeLabelLower.includes(entClean) || entClean.includes(nodeLabelLower)) return true;
          return aliases.some((a) => entClean.includes(a) || a.includes(entClean));
        });
      });

      // Sort locations chronologically
      matchedLocs.sort((a, b) => {
        if (typeof a.trajectoryOrder === 'number' && typeof b.trajectoryOrder === 'number') {
          return a.trajectoryOrder - b.trajectoryOrder;
        }
        if (a.timestamp && b.timestamp) {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        return 0;
      });

      profiles.push({
        id: node.id,
        name: node.label,
        role:
          (node.attributes?.roleInNetwork as string) ||
          (node.attributes?.role as string) ||
          'Person of Interest / Suspect',
        aliases: node.aliases || [],
        color: CRIMINAL_PALETTE[idx % CRIMINAL_PALETTE.length],
        locations: matchedLocs,
        primaryLocation: matchedLocs[0] || undefined,
      });
    });

    // Also include suspects mentioned in associatedEntities who may not have a formal person node
    locations.forEach((loc) => {
      loc.associatedEntities.forEach((entity) => {
        if (
          entity.includes('Mahindra') ||
          entity.includes('Toyota') ||
          entity.includes('M/s') ||
          entity.includes('Inspector') ||
          entity.includes('ACP') ||
          entity.includes('+91')
        ) {
          return;
        }
        const clean = entity.replace(/\s*\(.*?\)\s*/g, '').replace(/["']/g, '').trim();
        const existing = profiles.find(
          (p) =>
            p.name.toLowerCase().includes(clean.toLowerCase()) ||
            clean.toLowerCase().includes(p.name.toLowerCase())
        );
        if (!existing && clean.length > 2) {
          profiles.push({
            id: `ENT-${clean.replace(/\s+/g, '-').toUpperCase()}`,
            name: entity,
            role: 'Associated Syndicate Operative',
            aliases: [],
            color: CRIMINAL_PALETTE[profiles.length % CRIMINAL_PALETTE.length],
            locations: [loc],
            primaryLocation: loc,
          });
        }
      });
    });

    return profiles;
  }, [nodes, locations]);

  // Derive Inter-Criminal Syndicate Link Routes
  const syndicateLinks = useMemo<CriminalSyndicateLink[]>(() => {
    const links: CriminalSyndicateLink[] = [];
    const addedPairs = new Set<string>();

    const getProfile = (nameOrId: string) => {
      return criminalProfiles.find(
        (c) =>
          c.id === nameOrId ||
          c.name.toLowerCase().includes(nameOrId.toLowerCase()) ||
          nameOrId.toLowerCase().includes(c.name.toLowerCase())
      );
    };

    // Pre-mapped primary intelligence conduits for Operation Golden Falcon & vehicle syndicates
    const defaultCorridors: {
      pA: string;
      pB: string;
      label: string;
      evidence: string;
      highway: string;
    }[] = [
      {
        pA: 'Rafiq',
        pB: 'Aslam',
        label: 'Hawala Gold Transport & Delivery Directives',
        evidence:
          'Interrogation confirmed Rafiq issued directives via burner MSISDN +91 98765 43210 instructing Aslam to collect gold packets and deliver to Kucha Mahajani vault.',
        highway: 'NH 48 / Ring Road Corridor',
      },
      {
        pA: 'Aslam',
        pB: 'Sunita',
        label: 'Airport Cargo Customs Handoff & Airside Clearance',
        evidence:
          'Aslam met CHA Sunita Rao near Cargo Terminal Gate 4 to receive undeclared foreign-origin gold bullion consignments.',
        highway: 'IGI Airport Northern Access / NH 48',
      },
      {
        pA: 'Rafiq',
        pB: 'Malhotra',
        label: 'Syndicate Command Axis & Bullion Settlement',
        evidence:
          'Mohd. Rafiq coordinates overseas inflows with Vikram Malhotra via M/s Shree Ganesh Bullion Trading accounts.',
        highway: 'Shyama Prasad Mukherjee Marg / Civil Lines Corridor',
      },
      {
        pA: 'Aslam',
        pB: 'Gopi',
        label: 'Highway Stolen SUV Escort & Counterfeit RC Axis',
        evidence:
          'Scorpio DL-01-AB-1234 driven by Aslam was intercepted escorting stolen Fortuner driven by Gopi across DND flyway.',
        highway: 'Ring Road / DND Expressway Conduit',
      },
      {
        pA: 'Malhotra',
        pB: 'Nambiar',
        label: 'Bogus Invoicing & Hawala Financial Trail',
        evidence:
          'Office of CA Meera Nambiar on Barakhamba Road authored bogus e-way bills and circular trading invoices for Vikram Malhotra.',
        highway: 'Connaught Place Radial Arterials',
      },
    ];

    defaultCorridors.forEach((def, i) => {
      const cA = getProfile(def.pA);
      const cB = getProfile(def.pB);
      if (cA && cB && cA.id !== cB.id && cA.locations.length > 0 && cB.locations.length > 0) {
        const pairKey = [cA.id, cB.id].sort().join('::');
        if (!addedPairs.has(pairKey)) {
          addedPairs.add(pairKey);
          links.push({
            id: `LINK-DEF-${i}`,
            criminalA: cA,
            criminalB: cB,
            locationA: cA.primaryLocation || cA.locations[0],
            locationB: cB.primaryLocation || cB.locations[0],
            relationshipLabel: def.label,
            evidenceSnippet: def.evidence,
            highwayHint: def.highway,
          });
        }
      }
    });

    // Also check graph edges for explicit relationships between person nodes
    if (edges && edges.length > 0) {
      edges.forEach((edge, idx) => {
        const cA = criminalProfiles.find((c) => c.id === edge.source);
        const cB = criminalProfiles.find((c) => c.id === edge.target);
        if (cA && cB && cA.id !== cB.id && cA.locations.length > 0 && cB.locations.length > 0) {
          const pairKey = [cA.id, cB.id].sort().join('::');
          if (!addedPairs.has(pairKey)) {
            addedPairs.add(pairKey);
            links.push({
              id: `LINK-EDGE-${idx}`,
              criminalA: cA,
              criminalB: cB,
              locationA: cA.primaryLocation || cA.locations[0],
              locationB: cB.primaryLocation || cB.locations[0],
              relationshipLabel: edge.label || edge.type || 'Syndicate Association',
              evidenceSnippet:
                edge.evidenceSentence || `Verified investigative link connecting ${cA.name} and ${cB.name}.`,
              highwayHint: 'Inter-Locus Tactical Transit Route',
            });
          }
        }
      });
    }

    return links;
  }, [criminalProfiles, edges]);

  // Find which criminal is at origin/destination
  const originCriminal = useMemo(() => {
    if (!routeOriginId) return null;
    return criminalProfiles.find((c) => c.locations.some((l) => l.id === routeOriginId)) || null;
  }, [routeOriginId, criminalProfiles]);

  const destCriminal = useMemo(() => {
    if (!routeDestId) return null;
    return criminalProfiles.find((c) => c.locations.some((l) => l.id === routeDestId)) || null;
  }, [routeDestId, criminalProfiles]);

  // Detected syndicate link between origin and destination
  const activeSyndicateLink = useMemo(() => {
    if (!routeOriginId || !routeDestId) return null;
    return (
      syndicateLinks.find(
        (link) =>
          (link.locationA.id === routeOriginId && link.locationB.id === routeDestId) ||
          (link.locationA.id === routeDestId && link.locationB.id === routeOriginId)
      ) ||
      (originCriminal &&
        destCriminal &&
        syndicateLinks.find(
          (link) =>
            (link.criminalA.id === originCriminal.id && link.criminalB.id === destCriminal.id) ||
            (link.criminalA.id === destCriminal.id && link.criminalB.id === originCriminal.id)
        )) ||
      null
    );
  }, [routeOriginId, routeDestId, syndicateLinks, originCriminal, destCriminal]);

  // Auto-initialize criminal selection for corridor plotter
  useEffect(() => {
    if (criminalProfiles.length >= 2) {
      if (!selectedCriminalOriginId && criminalProfiles[0]?.locations.length > 0) {
        setSelectedCriminalOriginId(criminalProfiles[0].id);
        if (!routeOriginId && criminalProfiles[0].primaryLocation) {
          setRouteOriginId(criminalProfiles[0].primaryLocation.id);
        }
      }
      const secondWithLocs = criminalProfiles.slice(1).find((c) => c.locations.length > 0);
      if (!selectedCriminalDestId && secondWithLocs) {
        setSelectedCriminalDestId(secondWithLocs.id);
        if (!routeDestId && secondWithLocs.primaryLocation) {
          setRouteDestId(secondWithLocs.primaryLocation.id);
        }
      }
    }
  }, [criminalProfiles]);

  const handleSelectCriminalOrigin = (crimId: string) => {
    setSelectedCriminalOriginId(crimId);
    const crim = criminalProfiles.find((c) => c.id === crimId);
    if (crim && crim.primaryLocation) {
      setRouteOriginId(crim.primaryLocation.id);
      triggerToast(`Set Origin to ${crim.name}'s locus: "${crim.primaryLocation.name}"`);
    }
  };

  const handleSelectCriminalDest = (crimId: string) => {
    setSelectedCriminalDestId(crimId);
    const crim = criminalProfiles.find((c) => c.id === crimId);
    if (crim && crim.primaryLocation) {
      setRouteDestId(crim.primaryLocation.id);
      triggerToast(`Set Destination to ${crim.name}'s locus: "${crim.primaryLocation.name}"`);
    }
  };

  const handleApplySyndicateLink = (link: CriminalSyndicateLink) => {
    setSelectedCriminalOriginId(link.criminalA.id);
    setSelectedCriminalDestId(link.criminalB.id);
    setRouteOriginId(link.locationA.id);
    setRouteDestId(link.locationB.id);
    setShowRouteTool(true);
    triggerToast(`Plotting Corridor linking "${link.criminalA.name}" ⇄ "${link.criminalB.name}"`);
  };

  // Copy feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add waypoint modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newPointName, setNewPointName] = useState<string>('');
  const [newPointCategory, setNewPointCategory] = useState<GISLocationCategory>('sighting');
  const [newPointLat, setNewPointLat] = useState<string>('28.6139');
  const [newPointLng, setNewPointLng] = useState<string>('77.2090');
  const [newPointAddress, setNewPointAddress] = useState<string>('');
  const [newPointSnippet, setNewPointSnippet] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchCat = activeCategoryFilter === 'all' || loc.category === activeCategoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        loc.associatedEntities.some((e) => e.toLowerCase().includes(q)) ||
        (loc.evidenceSnippet && loc.evidenceSnippet.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [locations, activeCategoryFilter, searchQuery]);

  // Ordered trajectory waypoints
  const trajectoryPoints = useMemo(() => {
    return locations
      .filter((loc) => typeof loc.trajectoryOrder === 'number')
      .sort((a, b) => (a.trajectoryOrder || 0) - (b.trajectoryOrder || 0));
  }, [locations]);

  // Entities inside active Geofence
  const entitiesInGeofence = useMemo(() => {
    if (!geofenceActive || !geofenceCenter) return [];
    return locations
      .map((loc) => {
        const dist = calculateDistanceMeters(
          geofenceCenter.lat,
          geofenceCenter.lng,
          loc.lat,
          loc.lng
        );
        return {
          ...loc,
          distanceMeters: Math.round(dist),
          isInside: dist <= geofenceRadiusMeters,
        };
      })
      .filter((item) => item.isInside)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [geofenceActive, geofenceCenter, geofenceRadiusMeters, locations]);

  const handleMapPickCoord = (lat: number, lng: number, target: 'origin' | 'destination') => {
    let nearestLoc: GISLocationFeature | null = null;
    let minD = Infinity;

    for (const l of locations) {
      const d = calculateDistanceMeters(lat, lng, l.lat, l.lng);
      if (d < minD) {
        minD = d;
        nearestLoc = l;
      }
    }

    if (nearestLoc && minD < 40000) {
      if (target === 'origin') {
        setRouteOriginId(nearestLoc.id);
        triggerToast(`Assigned nearest node "${nearestLoc.name}" as Route Origin (A)`);
      } else {
        setRouteDestId(nearestLoc.id);
        triggerToast(`Assigned nearest node "${nearestLoc.name}" as Route Destination (B)`);
      }
    } else {
      triggerToast('Click an existing tactical pin or select from the corridor menu.');
    }
    setPickingTarget('none');
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center on India [22.5937, 78.9629] or selected location
    const initialLat = selectedLocation ? selectedLocation.lat : 22.5937;
    const initialLng = selectedLocation ? selectedLocation.lng : 78.9629;
    const initialZoom = selectedLocation ? 11 : 5;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial base and labels tile layer (Zero API key required)
    const tileConfig = TILE_LAYERS[currentTileTheme];
    const baseLayer = L.tileLayer(tileConfig.base, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
    }).addTo(map);
    tileLayerRef.current = baseLayer;

    if (tileConfig.labels) {
      const labelsLayer = L.tileLayer(tileConfig.labels, {
        maxZoom: tileConfig.maxZoom,
        opacity: 0.95,
      }).addTo(map);
      labelsLayerRef.current = labelsLayer;
    }

    mapInstanceRef.current = map;

    // Layer groups
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    trajectoryLayerGroupRef.current = L.layerGroup().addTo(map);
    geofenceLayerGroupRef.current = L.layerGroup().addTo(map);
    routeCorridorLayerGroupRef.current = L.layerGroup().addTo(map);
    criminalRoutesLayerGroupRef.current = L.layerGroup().addTo(map);

    // If multiple locations, fit bounds automatically
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    // Handle map click for Geofence or route waypoint picking
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (pickingTargetRef.current === 'origin') {
        handleMapPickCoord(e.latlng.lat, e.latlng.lng, 'origin');
      } else if (pickingTargetRef.current === 'destination') {
        handleMapPickCoord(e.latlng.lat, e.latlng.lng, 'destination');
      } else if (geofenceActiveRef.current) {
        setGeofenceCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    // Resize observer to prevent Map Height Collapse
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when tile theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    const tileConfig = TILE_LAYERS[currentTileTheme];
    const newBase = L.tileLayer(tileConfig.base, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
    }).addTo(map);
    tileLayerRef.current = newBase;

    if (tileConfig.labels) {
      const newLabels = L.tileLayer(tileConfig.labels, {
        maxZoom: tileConfig.maxZoom,
        opacity: 0.95,
      }).addTo(map);
      labelsLayerRef.current = newLabels;
    }
  }, [currentTileTheme]);

  // Render Markers and Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredLocations.forEach((loc) => {
      const config = CATEGORY_CONFIG[loc.category] || CATEGORY_CONFIG.sighting;
      const isSelected = selectedLocation?.id === loc.id;

      // Custom Tactical SVG HTML Marker
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-20'
        }" style="width: 38px; height: 38px;">
          ${
            isSelected
              ? `<div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${config.hexColor};"></div>`
              : ''
          }
          <div class="w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2" 
               style="background-color: #090d16; border-color: ${isSelected ? '#ffffff' : config.hexColor}; color: ${config.hexColor};">
            ${
              loc.trajectoryOrder
                ? `<span class="font-mono text-xs font-bold text-white">${loc.trajectoryOrder}</span>`
                : `<div class="w-3.5 h-3.5 rounded-full" style="background-color: ${config.hexColor};"></div>`
            }
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rotate-45" style="background-color: ${config.hexColor};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-tactical-pin',
        html: iconHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });

      // Click handler
      marker.on('click', () => {
        if (pickingTargetRef.current === 'origin') {
          setRouteOriginId(loc.id);
          setPickingTarget('none');
          triggerToast(`Set "${loc.name}" as Route Origin (Point A)`);
          return;
        }
        if (pickingTargetRef.current === 'destination') {
          setRouteDestId(loc.id);
          setPickingTarget('none');
          triggerToast(`Set "${loc.name}" as Route Destination (Point B)`);
          return;
        }
        setSelectedLocation(loc);
        map.panTo([loc.lat, loc.lng], { animate: true, duration: 0.8 });
      });

      // Rich popup
      marker.bindPopup(`
        <div class="p-2 min-w-[200px] text-slate-100 font-sans">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full" style="background-color: ${config.hexColor};"></span>
            <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">${config.badgeName}</span>
          </div>
          <h4 class="text-xs font-bold text-white leading-tight mb-1">${loc.name}</h4>
          <p class="text-[11px] text-slate-300 mb-2">${loc.address}</p>
          <div class="flex items-center justify-between text-[10px] font-mono text-emerald-400 border-t border-slate-700/80 pt-1.5">
            <span>${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E</span>
            <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">${Math.round(loc.confidenceScore * 100)}% Conf.</span>
          </div>
        </div>
      `);

      markersGroup.addLayer(marker);

      // Cell Tower RF Coverage Circles
      if (showCellRadius && loc.category === 'cell_tower' && loc.radiusMeters) {
        const circle = L.circle([loc.lat, loc.lng], {
          radius: loc.radiusMeters,
          color: config.hexColor,
          weight: 1.5,
          opacity: 0.8,
          fillColor: config.hexColor,
          fillOpacity: 0.12,
          dashArray: '4, 4',
        });
        markersGroup.addLayer(circle);
      }
    });
  }, [filteredLocations, selectedLocation, showCellRadius]);

  // Render Trajectory Path
  useEffect(() => {
    const trajectoryGroup = trajectoryLayerGroupRef.current;
    if (!trajectoryGroup) return;

    trajectoryGroup.clearLayers();

    if (!showTrajectory || trajectoryPoints.length < 2) return;

    const latLngs: [number, number][] = trajectoryPoints.map((p) => [p.lat, p.lng]);

    // Outer glow polyline
    const glowLine = L.polyline(latLngs, {
      color: '#10b981',
      weight: 6,
      opacity: 0.3,
    });

    // Core directional dashed line
    const coreLine = L.polyline(latLngs, {
      color: '#34d399',
      weight: 2.5,
      opacity: 0.95,
      dashArray: '6, 6',
    });

    trajectoryGroup.addLayer(glowLine);
    trajectoryGroup.addLayer(coreLine);
  }, [showTrajectory, trajectoryPoints]);

  // Render Geofence Circle
  useEffect(() => {
    const geofenceGroup = geofenceLayerGroupRef.current;
    if (!geofenceGroup) return;

    geofenceGroup.clearLayers();

    if (!geofenceActive || !geofenceCenter) return;

    const geofenceCircle = L.circle([geofenceCenter.lat, geofenceCenter.lng], {
      radius: geofenceRadiusMeters,
      color: '#06b6d4',
      weight: 2,
      opacity: 0.9,
      fillColor: '#06b6d4',
      fillOpacity: 0.1,
      dashArray: '5, 5',
    });

    const centerMarker = L.circleMarker([geofenceCenter.lat, geofenceCenter.lng], {
      radius: 6,
      color: '#06b6d4',
      fillColor: '#ffffff',
      fillOpacity: 1,
      weight: 2,
    });

    geofenceGroup.addLayer(geofenceCircle);
    geofenceGroup.addLayer(centerMarker);
  }, [geofenceActive, geofenceCenter, geofenceRadiusMeters]);

  // Calculate Route Corridor when Origin, Destination, Buffer, or Mode changes
  useEffect(() => {
    if (!routeOriginId || !routeDestId) {
      setRouteResult(null);
      return;
    }

    if (routeOriginId === routeDestId) {
      triggerToast('Origin and destination must be distinct points.');
      return;
    }

    const originLoc = locations.find((l) => l.id === routeOriginId);
    const destLoc = locations.find((l) => l.id === routeDestId);

    if (!originLoc || !destLoc) return;

    let isMounted = true;
    setIsCalculatingRoute(true);

    fetchRouteFromOSRM(originLoc, destLoc, routeMode).then((res) => {
      if (!isMounted) return;

      // Compute intercepted checkpoints within corridor buffer
      const intercepted = locations
        .filter((l) => l.id !== originLoc.id && l.id !== destLoc.id)
        .map((l) => ({
          location: l,
          distanceMeters: Math.round(distanceToPolylineMeters(l.lat, l.lng, res.path)),
        }))
        .filter((item) => item.distanceMeters <= corridorBufferKm * 1000)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);

      setRouteResult({
        origin: originLoc,
        destination: destLoc,
        path: res.path,
        distanceMeters: res.distanceMeters,
        durationSeconds: res.durationSeconds,
        isRealRoad: res.isRealRoad,
        highways: res.highways,
        interceptedLocations: intercepted,
      });

      setIsCalculatingRoute(false);

      // Auto-fit bounds on first calculation
      if (mapInstanceRef.current && res.path.length > 0) {
        const bounds = L.latLngBounds(res.path);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [routeOriginId, routeDestId, routeMode, corridorBufferKm, locations]);

  // Render Route Corridor on Map
  useEffect(() => {
    const routeGroup = routeCorridorLayerGroupRef.current;
    if (!routeGroup) return;

    routeGroup.clearLayers();

    if (!showRouteTool || !routeResult) return;

    const { path, origin, destination, interceptedLocations } = routeResult;
    if (path.length < 2) return;

    // 1. Translucent Corridor Surveillance Buffer
    const bufferPixelWeight = Math.max(16, Math.min(54, corridorBufferKm * 2));
    const bufferLayer = L.polyline(path, {
      color: '#0284c7',
      weight: bufferPixelWeight,
      opacity: 0.16,
      lineCap: 'round',
      lineJoin: 'round',
    });
    routeGroup.addLayer(bufferLayer);

    // 2. Outer Transit Glow Line
    const glowLine = L.polyline(path, {
      color: '#0ea5e9',
      weight: 8,
      opacity: 0.45,
    });
    routeGroup.addLayer(glowLine);

    // 3. Core Directional High-Contrast Line
    const coreLine = L.polyline(path, {
      color: '#38bdf8',
      weight: 3.5,
      opacity: 0.95,
      dashArray: routeMode === 'direct' ? '5, 8' : '10, 6',
    });
    routeGroup.addLayer(coreLine);

    // 4. Origin Marker (A)
    const originLabel = originCriminal
      ? `👤 ${originCriminal.name.replace(/\s*\(.*?\)\s*/g, '').split(' ')[0]} (A)`
      : 'ORIGIN (A)';

    const originIcon = L.divIcon({
      className: 'route-origin-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 36px; height: 36px;">
          <div class="absolute -inset-1.5 rounded-full animate-ping opacity-75 bg-emerald-400"></div>
          <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center font-bold text-xs shadow-xl">
            A
          </div>
          <div class="absolute -top-6 px-1.5 py-0.5 rounded bg-emerald-950/95 border border-emerald-600 text-emerald-300 text-[9px] font-mono font-bold whitespace-nowrap shadow-md">
            ${originLabel}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    const originMarker = L.marker([origin.lat, origin.lng], { icon: originIcon, zIndexOffset: 1200 });
    originMarker.bindPopup(`
      <div class="p-2 text-slate-100 font-sans">
        <div class="text-[10px] font-mono uppercase text-emerald-400 font-bold mb-0.5">Route Origin (Point A)</div>
        ${
          originCriminal
            ? `<div class="text-[11px] font-mono text-emerald-300 font-bold mb-1">👤 Linked Suspect: ${originCriminal.name} (${originCriminal.role})</div>`
            : ''
        }
        <h4 class="text-xs font-bold text-white mb-1">${origin.name}</h4>
        <p class="text-[11px] text-slate-300">${origin.address}</p>
        <div class="text-[10px] font-mono text-emerald-400 mt-1">${origin.lat.toFixed(4)}°N, ${origin.lng.toFixed(4)}°E</div>
      </div>
    `);
    routeGroup.addLayer(originMarker);

    // 5. Destination Marker (B)
    const destLabel = destCriminal
      ? `👤 ${destCriminal.name.replace(/\s*\(.*?\)\s*/g, '').split(' ')[0]} (B)`
      : 'DESTINATION (B)';

    const destIcon = L.divIcon({
      className: 'route-dest-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 36px; height: 36px;">
          <div class="absolute -inset-1.5 rounded-full animate-ping opacity-75 bg-rose-400"></div>
          <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-rose-400 text-rose-300 flex items-center justify-center font-bold text-xs shadow-xl">
            B
          </div>
          <div class="absolute -top-6 px-1.5 py-0.5 rounded bg-rose-950/95 border border-rose-600 text-rose-300 text-[9px] font-mono font-bold whitespace-nowrap shadow-md">
            ${destLabel}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    const destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon, zIndexOffset: 1200 });
    destMarker.bindPopup(`
      <div class="p-2 text-slate-100 font-sans">
        <div class="text-[10px] font-mono uppercase text-rose-400 font-bold mb-0.5">Route Destination (Point B)</div>
        ${
          destCriminal
            ? `<div class="text-[11px] font-mono text-rose-300 font-bold mb-1">👤 Linked Suspect: ${destCriminal.name} (${destCriminal.role})</div>`
            : ''
        }
        <h4 class="text-xs font-bold text-white mb-1">${destination.name}</h4>
        <p class="text-[11px] text-slate-300">${destination.address}</p>
        <div class="text-[10px] font-mono text-rose-400 mt-1">${destination.lat.toFixed(4)}°N, ${destination.lng.toFixed(4)}°E</div>
      </div>
    `);
    routeGroup.addLayer(destMarker);

    // 6. Intercepted Checkpoints along the corridor
    interceptedLocations.forEach(({ location: loc, distanceMeters }) => {
      const distKm = (distanceMeters / 1000).toFixed(1);
      const conf = CATEGORY_CONFIG[loc.category] || CATEGORY_CONFIG.sighting;
      const interceptIcon = L.divIcon({
        className: 'route-intercept-pin',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 24px; height: 24px;">
            <div class="absolute inset-0 rounded-full animate-ping opacity-50 bg-amber-400"></div>
            <div class="w-5 h-5 rounded-full bg-amber-950 border border-amber-400 text-amber-300 flex items-center justify-center text-[10px] font-bold shadow-lg">
              !
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([loc.lat, loc.lng], { icon: interceptIcon, zIndexOffset: 900 });
      marker.bindPopup(`
        <div class="p-2 text-slate-100 font-sans">
          <div class="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-amber-400 font-bold">
            <span>⚠️ Intercepted Node (${distKm} km from route)</span>
          </div>
          <h4 class="text-xs font-bold text-white mb-1">${loc.name}</h4>
          <p class="text-[11px] text-slate-300 mb-1">${loc.address}</p>
          <div class="text-[10px] font-mono text-slate-400">Category: ${conf.badgeName}</div>
        </div>
      `);
      marker.on('click', () => {
        setSelectedLocation(loc);
      });
      routeGroup.addLayer(marker);
    });
  }, [showRouteTool, routeResult, corridorBufferKm, routeMode, originCriminal, destCriminal]);

  // Render Criminal Routes & Syndicate Conduits on Map
  useEffect(() => {
    const criminalRoutesGroup = criminalRoutesLayerGroupRef.current;
    if (!criminalRoutesGroup) return;

    criminalRoutesGroup.clearLayers();

    if (!showCriminalRoutes) return;

    if (activeCriminalFilter === 'all_syndicate') {
      // Draw all Syndicate Links between criminals
      syndicateLinks.forEach((link) => {
        const { locationA, locationB, criminalA, criminalB, relationshipLabel, evidenceSnippet } = link;
        if (!locationA || !locationB) return;

        // Generate smooth curved transit line between the two criminals' loci
        const path = generateGeodesicPath(locationA, locationB, 25);

        // 1. Ambient glow line
        const glowLine = L.polyline(path, {
          color: criminalA.color || '#f43f5e',
          weight: 6,
          opacity: 0.35,
        });

        // 2. Core animated / dashed syndicate conduit
        const coreLine = L.polyline(path, {
          color: '#fb7185',
          weight: 3,
          opacity: 0.95,
          dashArray: '6, 8',
        });

        // Popup content on click
        const popupContent = `
          <div class="p-2 min-w-[220px] text-slate-100 font-sans">
            <div class="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-rose-400 font-bold uppercase">
              <span>⚡ Syndicate Link Conduit</span>
            </div>
            <h4 class="text-xs font-bold text-white mb-1">
              ${criminalA.name.replace(/\\s*\\(.*?\\)\\s*/g, '')} ⇄ ${criminalB.name.replace(/\\s*\\(.*?\\)\\s*/g, '')}
            </h4>
            <div class="text-[11px] text-amber-300 font-semibold mb-1.5">
              ${relationshipLabel}
            </div>
            <p class="text-[11px] text-slate-300 mb-2 leading-relaxed italic">
              "${evidenceSnippet}"
            </p>
            <div class="text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1 mb-2">
              <div>Locus A: ${locationA.name}</div>
              <div>Locus B: ${locationB.name}</div>
            </div>
            <div class="text-[10px] text-sky-400 font-bold">
              👉 Click badge or use "Transit Corridor Plotter" above to model driving corridor
            </div>
          </div>
        `;

        coreLine.bindPopup(popupContent);
        glowLine.bindPopup(popupContent);

        // 3. Midpoint Interactive Badge
        const midIdx = Math.floor(path.length / 2);
        const midPoint = path[midIdx];
        if (midPoint) {
          const midIcon = L.divIcon({
            className: 'syndicate-midpoint-badge',
            html: `
              <div class="px-2 py-0.5 rounded-full bg-slate-950 border border-rose-500/80 text-rose-300 text-[9px] font-mono font-bold shadow-xl flex items-center gap-1 cursor-pointer hover:scale-110 hover:border-rose-400 transition-transform whitespace-nowrap -translate-x-1/2 -translate-y-1/2">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                <span>${criminalA.name.replace(/\\s*\\(.*?\\)\\s*/g, '').split(' ')[0]} ⇄ ${criminalB.name.replace(/\\s*\\(.*?\\)\\s*/g, '').split(' ')[0]}</span>
              </div>
            `,
            iconSize: [80, 20],
            iconAnchor: [40, 10],
          });
          const midMarker = L.marker(midPoint, { icon: midIcon, zIndexOffset: 800 });
          midMarker.bindPopup(popupContent);
          midMarker.on('click', () => {
            setRouteOriginId(locationA.id);
            setRouteDestId(locationB.id);
            setSelectedCriminalOriginId(criminalA.id);
            setSelectedCriminalDestId(criminalB.id);
            setShowRouteTool(true);
            triggerToast(`Loaded "${criminalA.name} ⇄ ${criminalB.name}" corridor into Plotter.`);
          });
          criminalRoutesGroup.addLayer(midMarker);
        }

        criminalRoutesGroup.addLayer(glowLine);
        criminalRoutesGroup.addLayer(coreLine);
      });
    } else {
      // Filter for a specific criminal profile
      const targetCriminal = criminalProfiles.find((c) => c.id === activeCriminalFilter);
      if (targetCriminal && targetCriminal.locations.length > 0) {
        const cLocs = targetCriminal.locations;

        if (cLocs.length >= 2) {
          const path: [number, number][] = cLocs.map((l) => [l.lat, l.lng]);

          // Glow line
          const glowLine = L.polyline(path, {
            color: targetCriminal.color,
            weight: 8,
            opacity: 0.35,
          });

          // Core directional dashed line
          const coreLine = L.polyline(path, {
            color: targetCriminal.color,
            weight: 3.5,
            opacity: 0.95,
            dashArray: '8, 6',
          });

          criminalRoutesGroup.addLayer(glowLine);
          criminalRoutesGroup.addLayer(coreLine);

          // Numbered stop markers
          cLocs.forEach((l, idx) => {
            const stopIcon = L.divIcon({
              className: 'criminal-stop-marker',
              html: `
                <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 32px; height: 32px;">
                  <div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ${targetCriminal.color};"></div>
                  <div class="w-7 h-7 rounded-full bg-slate-950 border-2 flex items-center justify-center font-mono text-xs font-bold shadow-xl"
                       style="border-color: ${targetCriminal.color}; color: #ffffff;">
                    ${idx + 1}
                  </div>
                  <div class="absolute -top-5 px-1 rounded text-[9px] font-mono font-bold bg-slate-950/90 border text-white whitespace-nowrap shadow-sm"
                       style="border-color: ${targetCriminal.color};">
                    Stop ${idx + 1}
                  </div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            const stopMarker = L.marker([l.lat, l.lng], { icon: stopIcon, zIndexOffset: 1100 });
            stopMarker.bindPopup(`
              <div class="p-2 text-slate-100 font-sans">
                <div class="text-[10px] font-mono uppercase font-bold" style="color: ${targetCriminal.color};">
                  ${targetCriminal.name} - Sighting #${idx + 1}
                </div>
                <h4 class="text-xs font-bold text-white mb-1">${l.name}</h4>
                <p class="text-[11px] text-slate-300 mb-1">${l.address}</p>
                <div class="text-[10px] font-mono text-slate-400">Time: ${l.timestamp || 'Recorded Intel'}</div>
              </div>
            `);
            stopMarker.on('click', () => {
              setSelectedLocation(l);
            });
            criminalRoutesGroup.addLayer(stopMarker);
          });

          // Zoom to criminal path
          if (mapInstanceRef.current && path.length > 0) {
            const bounds = L.latLngBounds(path);
            mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
          }
        } else {
          // Single location for this criminal
          const sole = cLocs[0];
          const rippleCircle = L.circle([sole.lat, sole.lng], {
            radius: 1200,
            color: targetCriminal.color,
            weight: 2,
            opacity: 0.9,
            fillColor: targetCriminal.color,
            fillOpacity: 0.15,
            dashArray: '4, 4',
          });
          criminalRoutesGroup.addLayer(rippleCircle);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([sole.lat, sole.lng], { animate: true });
          }
        }
      }
    }
  }, [showCriminalRoutes, activeCriminalFilter, syndicateLinks, criminalProfiles]);

  // Route Corridor Action Handlers
  const handleFitRouteBounds = () => {
    if (!mapInstanceRef.current || !routeResult || routeResult.path.length === 0) return;
    const bounds = L.latLngBounds(routeResult.path);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  };

  const handleSwapRoutePoints = () => {
    if (!routeOriginId && !routeDestId) return;
    const temp = routeOriginId;
    setRouteOriginId(routeDestId);
    setRouteDestId(temp);
    triggerToast('Reversed corridor direction (Origin ⇄ Destination).');
  };

  const handleClearRoute = () => {
    setRouteOriginId('');
    setRouteDestId('');
    setRouteResult(null);
    setPickingTarget('none');
    routeCorridorLayerGroupRef.current?.clearLayers();
    triggerToast('Route corridor cleared.');
  };

  const handleApplyCorridorPreset = (preset: CorridorPreset) => {
    const origin = locations.find(
      (l) =>
        l.name.toLowerCase().includes(preset.matchOrigin.toLowerCase()) ||
        l.address.toLowerCase().includes(preset.matchOrigin.toLowerCase())
    );
    const dest = locations.find(
      (l) =>
        l.name.toLowerCase().includes(preset.matchDest.toLowerCase()) ||
        l.address.toLowerCase().includes(preset.matchDest.toLowerCase())
    );

    if (origin && dest) {
      setRouteOriginId(origin.id);
      setRouteDestId(dest.id);
      setShowRouteTool(true);
      triggerToast(`Loaded corridor: ${preset.name}`);
    } else {
      triggerToast(`Locations for "${preset.name}" are not in the current registry.`);
    }
  };

  const handleCopyCorridorDossier = () => {
    if (!routeResult) return;
    const directKm =
      calculateDistanceMeters(
        routeResult.origin.lat,
        routeResult.origin.lng,
        routeResult.destination.lat,
        routeResult.destination.lng
      ) / 1000;
    const roadKm = routeResult.distanceMeters / 1000;
    const circuity = (roadKm / Math.max(1, directKm)).toFixed(2);

    const dossierText = [
      '========================================================================',
      '             TRANSIT CORRIDOR INVESTIGATIVE DOSSIER',
      '========================================================================',
      `CASE ID:         ${caseId}`,
      `ANALYZED BY:     ${currentUser.name} (${currentUser.role.toUpperCase()})`,
      `TIMESTAMP:       ${new Date().toISOString()}`,
      `CORRIDOR MODE:   ${routeMode === 'driving' ? 'Highway Driving Route' : 'Direct Geodesic Flight Vector'}`,
      `SURVEILLANCE:    ${corridorBufferKm} km Buffer Belt`,
      '',
      '[POINT A - ORIGIN]',
      `  Name:          ${routeResult.origin.name}`,
      `  Address:       ${routeResult.origin.address}`,
      `  Category:      ${routeResult.origin.category.toUpperCase()}`,
      `  Coordinates:   ${routeResult.origin.lat.toFixed(5)}°N, ${routeResult.origin.lng.toFixed(5)}°E`,
      '',
      '[POINT B - DESTINATION]',
      `  Name:          ${routeResult.destination.name}`,
      `  Address:       ${routeResult.destination.address}`,
      `  Category:      ${routeResult.destination.category.toUpperCase()}`,
      `  Coordinates:   ${routeResult.destination.lat.toFixed(5)}°N, ${routeResult.destination.lng.toFixed(5)}°E`,
      '',
      '[TRANSIT CORRIDOR METRICS]',
      `  Highway Distance:     ${roadKm.toFixed(1)} km (${(roadKm * 0.621371).toFixed(1)} miles)`,
      `  Direct Displacement:  ${directKm.toFixed(1)} km`,
      `  Circuity Ratio:       ${circuity}x`,
      `  Est. Transit Time:    ${formatDuration(routeResult.durationSeconds)} (Heavy Freight: ~${formatDuration(Math.round(routeResult.durationSeconds * 1.25))})`,
      `  Highways Identified:  ${routeResult.highways.join(', ') || 'Interstate Highway Conduits'}`,
      '',
      `[INTERCEPTED INTELLIGENCE NODES WITHIN ${corridorBufferKm} KM BUFFER (${routeResult.interceptedLocations.length})]`,
      ...(routeResult.interceptedLocations.length > 0
        ? routeResult.interceptedLocations.map(
            (item, idx) =>
              `  ${idx + 1}. [${item.location.category.toUpperCase()}] ${item.location.name}\n` +
              `     Buffer Offset:  ${(item.distanceMeters / 1000).toFixed(1)} km from transit path\n` +
              `     Coordinates:    ${item.location.lat.toFixed(5)}°N, ${item.location.lng.toFixed(5)}°E\n` +
              `     Address:        ${item.location.address}\n` +
              `     Linked Suspects: ${item.location.associatedEntities.join(', ') || 'None'}\n` +
              `     Evidence Note:  ${item.location.evidenceSnippet || 'N/A'}`
          )
        : ['  No secondary intelligence nodes detected within buffer parameter.']),
      '========================================================================',
    ].join('\n');

    navigator.clipboard.writeText(dossierText);
    triggerToast('Transit corridor dossier copied to clipboard.');
  };

  const handleExportCorridorGeoJSON = () => {
    if (!routeResult) return;
    const geojson = {
      type: 'FeatureCollection',
      name: `transit-corridor-${routeResult.origin.id}-${routeResult.destination.id}`,
      caseId,
      timestamp: new Date().toISOString(),
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [routeResult.origin.lng, routeResult.origin.lat],
          },
          properties: {
            role: 'ORIGIN_POINT_A',
            name: routeResult.origin.name,
            address: routeResult.origin.address,
            category: routeResult.origin.category,
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [routeResult.destination.lng, routeResult.destination.lat],
          },
          properties: {
            role: 'DESTINATION_POINT_B',
            name: routeResult.destination.name,
            address: routeResult.destination.address,
            category: routeResult.destination.category,
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: routeResult.path.map(([lat, lng]) => [lng, lat]),
          },
          properties: {
            role: 'TRANSIT_CORRIDOR_PATH',
            distanceMeters: routeResult.distanceMeters,
            durationSeconds: routeResult.durationSeconds,
            routeMode,
            corridorBufferKm,
            highways: routeResult.highways,
          },
        },
        ...routeResult.interceptedLocations.map((item) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [item.location.lng, item.location.lat],
          },
          properties: {
            role: 'INTERCEPTED_CORRIDOR_NODE',
            name: item.location.name,
            category: item.location.category,
            distanceFromCorridorMeters: item.distanceMeters,
          },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transit-corridor-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Exported corridor GeoJSON FeatureCollection');
  };

  // Trajectory Playback timer
  useEffect(() => {
    let timer: any = null;
    if (isPlayingTrajectory && trajectoryPoints.length > 0) {
      timer = setInterval(() => {
        setCurrentTrajectoryStep((prev) => {
          const next = (prev + 1) % trajectoryPoints.length;
          const target = trajectoryPoints[next];
          if (target && mapInstanceRef.current) {
            setSelectedLocation(target);
            mapInstanceRef.current.panTo([target.lat, target.lng], { animate: true, duration: 1 });
          }
          return next;
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isPlayingTrajectory, trajectoryPoints]);

  // Step through trajectory manually
  const handleStepTrajectory = (direction: 'next' | 'prev') => {
    if (trajectoryPoints.length === 0) return;
    const count = trajectoryPoints.length;
    const nextIdx = direction === 'next' ? (currentTrajectoryStep + 1) % count : (currentTrajectoryStep - 1 + count) % count;
    setCurrentTrajectoryStep(nextIdx);
    const target = trajectoryPoints[nextIdx];
    if (target && mapInstanceRef.current) {
      setSelectedLocation(target);
      mapInstanceRef.current.panTo([target.lat, target.lng], { animate: true, duration: 0.8 });
    }
  };

  // Fit all points in view
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || filteredLocations.length === 0) return;
    const bounds = L.latLngBounds(filteredLocations.map((l) => [l.lat, l.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  const handleZoomIndia = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([22.5937, 78.9629], 5, { duration: 1.2 });
  };

  const handleZoomDelhi = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([28.6139, 77.2090], 11, { duration: 1.2 });
  };

  const handleZoomMumbai = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([18.9515, 72.8310], 11, { duration: 1.2 });
  };

  // Export GeoJSON FeatureCollection
  const handleExportGeoJSON = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      caseId,
      exportedAt: new Date().toISOString(),
      features: filteredLocations.map((loc) => ({
        type: 'Feature',
        id: loc.id,
        geometry: {
          type: 'Point',
          coordinates: [loc.lng, loc.lat],
        },
        properties: {
          name: loc.name,
          category: loc.category,
          address: loc.address,
          timestamp: loc.timestamp,
          confidenceScore: loc.confidenceScore,
          verificationStatus: loc.verificationStatus,
          associatedEntities: loc.associatedEntities,
          evidenceSnippet: loc.evidenceSnippet,
          sourceDocumentId: loc.sourceDocumentId,
          sourceDocumentTitle: loc.sourceDocumentTitle,
          trajectoryOrder: loc.trajectoryOrder,
          dmsCoordinates: loc.dmsCoordinates,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseId}-geospatial-intelligence.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('GeoJSON FeatureCollection downloaded');
  };

  // Copy GPS Dispatch List
  const handleCopyDispatchList = () => {
    const text = filteredLocations
      .map(
        (l, i) =>
          `[${i + 1}] ${l.name}\n    Coords: ${l.lat.toFixed(5)}°N, ${l.lng.toFixed(5)}°E (${l.dmsCoordinates || 'N/A'})\n    Category: ${l.category.toUpperCase()}\n    Address: ${l.address}\n    Entities: ${l.associatedEntities.join(', ') || 'N/A'}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text);
    triggerToast('Dispatch coordinates copied to clipboard');
  };

  // Submit new waypoint
  const handleCreateWaypoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPointName.trim() || isNaN(Number(newPointLat)) || isNaN(Number(newPointLng))) return;

    if (onAddLocation) {
      await onAddLocation({
        name: newPointName,
        category: newPointCategory,
        lat: Number(newPointLat),
        lng: Number(newPointLng),
        address: newPointAddress || 'Reported Field Intelligence Location',
        evidenceSnippet: newPointSnippet || 'Manually logged field intelligence report waypoint.',
        confidenceScore: 0.95,
        verificationStatus: 'verified',
        associatedEntities: [currentUser.name],
      });
      setShowAddModal(false);
      setNewPointName('');
      setNewPointAddress('');
      setNewPointSnippet('');
      triggerToast('Geospatial intelligence point recorded');
    }
  };

  const selectedConfig = selectedLocation
    ? CATEGORY_CONFIG[selectedLocation.category] || CATEGORY_CONFIG.sighting
    : null;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-xs border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top GIS Control & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Stats */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white">Geographic Information System (GIS) Workspace</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono text-[10px] font-bold">
                  Pan-India Tactical Grid
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300 font-mono text-[10px] font-bold">
                  Zero API Key Required
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Plotting {locations.length} georeferenced incident loci, ANPR sightings, CDR cell towers, and suspect vaults.
              </p>
            </div>
          </div>

          {/* Action Buttons & Regional Jump */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Map Pan Targets */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 px-1.5 uppercase font-bold">Pan:</span>
              <button
                onClick={handleZoomIndia}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Pan and zoom to entire India"
              >
                🇮🇳 All India
              </button>
              <button
                onClick={handleZoomDelhi}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Focus on Delhi NCR"
              >
                🏛️ Delhi NCR
              </button>
              <button
                onClick={handleZoomMumbai}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Focus on Mumbai Western Corridor"
              >
                🏢 Mumbai
              </button>
            </div>

            <button
              onClick={handleFitBounds}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700/80 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Fit map boundaries to all locations"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fit Bounds</span>
            </button>

            <button
              onClick={handleCopyDispatchList}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700/80 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Copy GPS coordinates list for field dispatch teams"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copy Dispatch</span>
            </button>

            <button
              onClick={handleExportGeoJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700/80 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Export RFC 7946 GeoJSON FeatureCollection"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export GeoJSON</span>
            </button>

            {onAddLocation && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log GPS Waypoint</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-emerald-400" />
              <span>Layers:</span>
            </span>

            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              All ({locations.length})
            </button>

            {(Object.keys(CATEGORY_CONFIG) as GISLocationCategory[]).map((cat) => {
              const conf = CATEGORY_CONFIG[cat];
              const count = locations.filter((l) => l.category === cat).length;
              if (count === 0) return null;
              const active = activeCategoryFilter === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? `${conf.bgClass} ${conf.textClass} border ${conf.borderClass} font-bold`
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.hexColor }}></span>
                  <span>{conf.badgeName} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locations, entities..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Feature Switches & Basemap Switcher */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Feature Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTrajectory(!showTrajectory)}
              className={`px-3 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showTrajectory
                  ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route Trajectory ({trajectoryPoints.length})</span>
            </button>

            <button
              onClick={() => setShowCellRadius(!showCellRadius)}
              className={`px-3 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showCellRadius
                  ? 'bg-purple-950/70 border-purple-600/70 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Cell Tower Sectors</span>
            </button>

            <button
              onClick={() => setGeofenceActive(!geofenceActive)}
              className={`px-3 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                geofenceActive
                  ? 'bg-cyan-950/70 border-cyan-600/70 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Geofence Buffer Analysis</span>
            </button>

            <button
              onClick={() => setShowRouteTool(!showRouteTool)}
              className={`px-3 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showRouteTool
                  ? 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-xs'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Route className="w-3.5 h-3.5 text-sky-400" />
              <span>Transit Corridor Plotter</span>
              {routeResult && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-sky-900/80 text-[10px] text-sky-200 font-mono">
                  {(routeResult.distanceMeters / 1000).toFixed(0)} km
                </span>
              )}
            </button>

            <button
              onClick={() => setShowCriminalRoutes(!showCriminalRoutes)}
              className={`px-3 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showCriminalRoutes
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-xs'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span>Criminal Routes & Links</span>
              <span className="ml-1 px-1.5 py-0.5 rounded bg-rose-900/80 text-[10px] text-rose-200 font-mono">
                {syndicateLinks.length} Conduits
              </span>
            </button>
          </div>

          {/* Basemap Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 px-2 uppercase">Tile Basemap:</span>
            <button
              onClick={() => setCurrentTileTheme('dark')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                currentTileTheme === 'dark' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tactical Dark
            </button>
            <button
              onClick={() => setCurrentTileTheme('satellite')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                currentTileTheme === 'satellite' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setCurrentTileTheme('street')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                currentTileTheme === 'street' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Streets
            </button>
          </div>
        </div>
      </div>

      {/* Criminal Routes & Network Conduits Toolbar */}
      {showCriminalRoutes && (
        <div className="bg-slate-900/95 border border-rose-900/60 rounded-xl p-3 shadow-md space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white">Criminal Movement & Syndicate Conduit Linking</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800 text-[10px] font-mono font-bold text-rose-300">
                {criminalProfiles.length} Suspects Mapped
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Select a suspect to display their movement route, or view all syndicate connection conduits.
            </div>
          </div>

          {/* Suspect / Conduit Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveCriminalFilter('all_syndicate')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeCriminalFilter === 'all_syndicate'
                  ? 'bg-rose-500 text-slate-950 shadow-xs'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <GitMerge className="w-3 h-3" />
              <span>All Syndicate Conduits ({syndicateLinks.length})</span>
            </button>

            {criminalProfiles.map((crim) => {
              const isSelected = activeCriminalFilter === crim.id;
              return (
                <button
                  key={crim.id}
                  onClick={() => setActiveCriminalFilter(crim.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'text-white border shadow-xs'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: isSelected ? crim.color : undefined,
                    borderColor: isSelected ? '#ffffff' : undefined,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: crim.color }}></span>
                  <span className="truncate max-w-[140px]">{crim.name.replace(/\s*\(.*?\)\s*/g, '')}</span>
                  <span className="font-mono text-[10px] px-1 rounded bg-black/40 text-slate-200">
                    {crim.locations.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Information banner when a specific criminal or all conduits are active */}
          {activeCriminalFilter === 'all_syndicate' ? (
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono text-[11px] font-bold">⚡ ACTIVE CONDUITS:</span>
                <span className="text-slate-300 text-[11px]">
                  Visualizing transit corridors linking co-conspirators. Click any link on the map or select a conduit below:
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {syndicateLinks.slice(0, 5).map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleApplySyndicateLink(link)}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-rose-800/80 hover:border-rose-400 text-rose-300 hover:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>{link.criminalA.name.replace(/\s*\(.*?\)\s*/g, '').split(' ')[0]}</span>
                    <span>⇄</span>
                    <span>{link.criminalB.name.replace(/\s*\(.*?\)\s*/g, '').split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            (() => {
              const activeCrim = criminalProfiles.find((c) => c.id === activeCriminalFilter);
              if (!activeCrim) return null;
              return (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeCrim.color }}></span>
                    <span className="font-bold text-white">{activeCrim.name}</span>
                    <span className="text-slate-400 text-[11px] font-mono">({activeCrim.role})</span>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      • {activeCrim.locations.length} Locations Mapped
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeCrim.locations.length >= 2 && (
                      <button
                        onClick={() => {
                          setRouteOriginId(activeCrim.locations[0].id);
                          setRouteDestId(activeCrim.locations[activeCrim.locations.length - 1].id);
                          setRouteSelectionMode('waypoint');
                          setShowRouteTool(true);
                          triggerToast(`Plotted highway route for ${activeCrim.name}`);
                        }}
                        className="px-2.5 py-1 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Route className="w-3 h-3" />
                        <span>Plot Highway Corridor for this Suspect</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCriminalOriginId(activeCrim.id);
                        if (activeCrim.primaryLocation) {
                          setRouteOriginId(activeCrim.primaryLocation.id);
                        }
                        setRouteSelectionMode('criminal');
                        setShowRouteTool(true);
                        triggerToast(`Selected ${activeCrim.name} as Origin in Route Corridor Plotter.`);
                      }}
                      className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Link2 className="w-3 h-3" />
                      <span>Link to Another Criminal...</span>
                    </button>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Route Corridor Plotter & Transit Analysis Panel */}
      {showRouteTool && (
        <div className="bg-slate-900 border border-sky-800/60 rounded-xl p-4 shadow-lg space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Route className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Transit Corridor Plotter & Inter-State Movement Analysis</h3>
                  <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono text-[10px] font-bold">
                    Tactical Corridor Engine
                  </span>
                  {isCalculatingRoute && (
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono text-[10px] font-bold animate-pulse">
                      Plotting Corridor...
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs">
                  Model road networks and potential transit corridors between two intelligence points or criminal entities. Detects intercepted nodes along the surveillance buffer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setRouteSelectionMode('criminal')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    routeSelectionMode === 'criminal'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Link Criminals</span>
                </button>
                <button
                  onClick={() => setRouteSelectionMode('waypoint')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    routeSelectionMode === 'waypoint'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Link Waypoints</span>
                </button>
              </div>

              <button
                onClick={handleClearRoute}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Clear plotted corridor"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
              <button
                onClick={() => setShowRouteTool(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-all"
                title="Close Corridor Tool"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Syndicate Conduits Bar */}
          <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-rose-950/80">
            <div className="text-[11px] font-mono text-rose-300 font-bold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GitMerge className="w-3 h-3 text-rose-400" />
                <span>Verified Inter-Criminal Syndicate Conduits:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Click to link road corridor</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {syndicateLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleApplySyndicateLink(link)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-rose-900/60 hover:border-rose-400 text-slate-200 hover:text-white shrink-0 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  title={`${link.relationshipLabel}: ${link.evidenceSnippet}`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="font-bold text-white">
                    {link.criminalA.name.replace(/\s*\(.*?\)\s*/g, '').split(' ')[0]}
                  </span>
                  <span className="text-rose-400 font-mono">⇄</span>
                  <span className="font-bold text-white">
                    {link.criminalB.name.replace(/\s*\(.*?\)\s*/g, '').split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]">
                    ({link.relationshipLabel.split(' ')[0]})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Point / Criminal Selection Row */}
          {routeSelectionMode === 'criminal' ? (
            /* Criminal-to-Criminal Linking Mode */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Origin Criminal (Point A) */}
              <div className="md:col-span-5 bg-slate-950 border border-emerald-900/60 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] flex items-center justify-center font-bold">
                      A
                    </div>
                    <span>ORIGIN SUSPECT (POINT A)</span>
                  </div>
                  {originCriminal && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                      {originCriminal.locations.length} Loci
                    </span>
                  )}
                </div>

                <select
                  value={selectedCriminalOriginId}
                  onChange={(e) => handleSelectCriminalOrigin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                >
                  <option value="">-- Select Suspect A --</option>
                  {criminalProfiles.map((crim) => (
                    <option key={crim.id} value={crim.id}>
                      {crim.name} [{crim.role}] ({crim.locations.length} locations)
                    </option>
                  ))}
                </select>

                {/* Sub-select specific location of Suspect A if they have multiple */}
                {originCriminal && originCriminal.locations.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-900">
                    <label className="text-[10px] font-mono text-slate-400">Select Specific Locus for this Suspect:</label>
                    <select
                      value={routeOriginId}
                      onChange={(e) => setRouteOriginId(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-md px-2 py-1 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {originCriminal.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.category.toUpperCase()}) - {loc.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <div className="md:col-span-2 flex flex-col items-center justify-center gap-1">
                <button
                  onClick={handleSwapRoutePoints}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer transition-all shadow-md hover:scale-105"
                  title="Swap Origin and Destination"
                >
                  <ArrowUpDown className="w-4 h-4 text-rose-400" />
                </button>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Reverse</span>
              </div>

              {/* Destination Criminal (Point B) */}
              <div className="md:col-span-5 bg-slate-950 border border-rose-900/60 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <div className="w-4 h-4 rounded-full bg-rose-500 text-slate-950 font-mono text-[10px] flex items-center justify-center font-bold">
                      B
                    </div>
                    <span>DESTINATION SUSPECT (POINT B)</span>
                  </div>
                  {destCriminal && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800 text-rose-300">
                      {destCriminal.locations.length} Loci
                    </span>
                  )}
                </div>

                <select
                  value={selectedCriminalDestId}
                  onChange={(e) => handleSelectCriminalDest(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer font-medium"
                >
                  <option value="">-- Select Suspect B --</option>
                  {criminalProfiles.map((crim) => (
                    <option key={crim.id} value={crim.id}>
                      {crim.name} [{crim.role}] ({crim.locations.length} locations)
                    </option>
                  ))}
                </select>

                {/* Sub-select specific location of Suspect B if they have multiple */}
                {destCriminal && destCriminal.locations.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-900">
                    <label className="text-[10px] font-mono text-slate-400">Select Specific Locus for this Suspect:</label>
                    <select
                      value={routeDestId}
                      onChange={(e) => setRouteDestId(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-md px-2 py-1 text-xs text-rose-300 focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      {destCriminal.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.category.toUpperCase()}) - {loc.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Standard Waypoint-to-Waypoint Linking Mode */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Origin (Point A) */}
              <div className="md:col-span-5 bg-slate-950 border border-emerald-900/60 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] flex items-center justify-center font-bold">
                      A
                    </div>
                    <span>ORIGIN (POINT A)</span>
                  </div>
                  <button
                    onClick={() => setPickingTarget(pickingTarget === 'origin' ? 'none' : 'origin')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      pickingTarget === 'origin'
                        ? 'bg-emerald-500 text-slate-950 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/60'
                    }`}
                    title="Click to activate map-click selection mode"
                  >
                    <Target className="w-3 h-3" />
                    <span>{pickingTarget === 'origin' ? 'Click Pin on Map...' : 'Pick on Map'}</span>
                  </button>
                </div>

                <select
                  value={routeOriginId}
                  onChange={(e) => setRouteOriginId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Select Point A (Origin) --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      [{loc.category.toUpperCase()}] {loc.name} - {loc.address}
                    </option>
                  ))}
                </select>

                {routeOriginId && (
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Coords: {locations.find((l) => l.id === routeOriginId)?.lat.toFixed(4)}°N,{' '}
                    {locations.find((l) => l.id === routeOriginId)?.lng.toFixed(4)}°E
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <div className="md:col-span-2 flex flex-col items-center justify-center gap-1">
                <button
                  onClick={handleSwapRoutePoints}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer transition-all shadow-md hover:scale-105"
                  title="Swap Origin and Destination"
                >
                  <ArrowUpDown className="w-4 h-4 text-sky-400" />
                </button>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Reverse</span>
              </div>

              {/* Destination (Point B) */}
              <div className="md:col-span-5 bg-slate-950 border border-rose-900/60 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <div className="w-4 h-4 rounded-full bg-rose-500 text-slate-950 font-mono text-[10px] flex items-center justify-center font-bold">
                      B
                    </div>
                    <span>DESTINATION (POINT B)</span>
                  </div>
                  <button
                    onClick={() => setPickingTarget(pickingTarget === 'destination' ? 'none' : 'destination')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      pickingTarget === 'destination'
                        ? 'bg-rose-500 text-slate-950 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-800/60'
                    }`}
                    title="Click to activate map-click selection mode"
                  >
                    <Target className="w-3 h-3" />
                    <span>{pickingTarget === 'destination' ? 'Click Pin on Map...' : 'Pick on Map'}</span>
                  </button>
                </div>

                <select
                  value={routeDestId}
                  onChange={(e) => setRouteDestId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="">-- Select Point B (Destination) --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      [{loc.category.toUpperCase()}] {loc.name} - {loc.address}
                    </option>
                  ))}
                </select>

                {routeDestId && (
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Coords: {locations.find((l) => l.id === routeDestId)?.lat.toFixed(4)}°N,{' '}
                    {locations.find((l) => l.id === routeDestId)?.lng.toFixed(4)}°E
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode & Buffer Parameters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs">
            {/* Mode Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-xs">Corridor Geometry:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                <button
                  onClick={() => setRouteMode('driving')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    routeMode === 'driving'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>National Highway / Road</span>
                </button>
                <button
                  onClick={() => setRouteMode('direct')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    routeMode === 'direct'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Direct Geodesic Flight Vector</span>
                </button>
              </div>
            </div>

            {/* Buffer Width Slider */}
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs font-medium">Corridor Surveillance Buffer:</span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={corridorBufferKm}
                onChange={(e) => setCorridorBufferKm(Number(e.target.value))}
                className="w-24 accent-sky-400 cursor-pointer"
              />
              <span className="font-mono font-bold text-sky-300 text-xs">{corridorBufferKm} km</span>
            </div>
          </div>

          {/* Quick Strategic Highway Corridors Presets */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Milestone className="w-3 h-3 text-sky-400" />
              <span>Known Interstate Highway Transit Corridors:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {CORRIDOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyCorridorPreset(preset)}
                  className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-sky-500/60 text-slate-300 hover:text-white shrink-0 flex items-center gap-1.5 cursor-pointer transition-all"
                  title={preset.description}
                >
                  <span>{preset.icon}</span>
                  <span className="font-semibold">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Route Plotted Metrics & Intelligence Findings */}
          {routeResult && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              {/* Inter-Criminal Syndicate Conduit Card (when route links 2 criminals) */}
              {(originCriminal || destCriminal || activeSyndicateLink) && (
                <div className="bg-rose-950/40 border border-rose-800/80 rounded-lg p-3 space-y-2.5 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-900/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                      <span className="text-xs font-mono uppercase font-bold text-rose-300">
                        INTER-CRIMINAL SYNDICATE TRANSIT CONDUIT ACTIVE
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-700 font-semibold">
                      {activeSyndicateLink?.relationshipLabel || 'Investigative Network Link'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/90 p-2.5 rounded border border-emerald-900/60">
                      <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                        ORIGIN SUSPECT (POINT A):
                      </div>
                      <div className="font-bold text-white text-xs mt-0.5 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: originCriminal?.color || '#10b981' }}
                        ></span>
                        <span>{originCriminal?.name || 'Tactical Pin'}</span>
                      </div>
                      {originCriminal && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{originCriminal.role}</div>
                      )}
                      <div className="text-[11px] text-emerald-300/80 font-medium mt-1 truncate">
                        📍 {routeResult.origin.name}
                      </div>
                    </div>

                    <div className="bg-slate-950/90 p-2.5 rounded border border-rose-900/60">
                      <div className="text-[10px] text-rose-400 font-mono font-bold uppercase">
                        DESTINATION SUSPECT (POINT B):
                      </div>
                      <div className="font-bold text-white text-xs mt-0.5 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: destCriminal?.color || '#f43f5e' }}
                        ></span>
                        <span>{destCriminal?.name || 'Tactical Pin'}</span>
                      </div>
                      {destCriminal && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{destCriminal.role}</div>
                      )}
                      <div className="text-[11px] text-rose-300/80 font-medium mt-1 truncate">
                        📍 {routeResult.destination.name}
                      </div>
                    </div>
                  </div>

                  {activeSyndicateLink && (
                    <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 text-xs">
                      <div className="text-[10px] font-mono text-amber-400 font-bold uppercase mb-1">
                        Corroborating Intelligence / Intercept Evidence:
                      </div>
                      <p className="text-[11px] text-slate-300 italic leading-relaxed">
                        "{activeSyndicateLink.evidenceSnippet}"
                      </p>
                    </div>
                  )}
                </div>
              )}
              {/* Telemetry Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Highway Distance</div>
                  <div className="text-sm font-bold text-sky-300 font-mono mt-0.5">
                    {(routeResult.distanceMeters / 1000).toFixed(1)} km
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {((routeResult.distanceMeters / 1000) * 0.621371).toFixed(1)} miles
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Commercial Freight ETA</div>
                  <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                    ~{formatDuration(Math.round(routeResult.durationSeconds * 1.25))}
                  </div>
                  <div className="text-[10px] text-slate-500">Avg 55-65 km/h logistics</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Tactical Interceptor ETA</div>
                  <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                    ~{formatDuration(routeResult.durationSeconds)}
                  </div>
                  <div className="text-[10px] text-slate-500">Expressway escort speed</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Buffer Interceptions</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5 flex items-center gap-1.5">
                    <span>{routeResult.interceptedLocations.length} nodes</span>
                    {routeResult.interceptedLocations.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">Within {corridorBufferKm} km corridor belt</div>
                </div>
              </div>

              {/* Identified Highway Conduits */}
              {routeResult.highways.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-400 text-[11px] font-mono uppercase font-bold">Conduits:</span>
                  {routeResult.highways.map((hw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-200 font-mono text-[10px] font-semibold"
                    >
                      {hw}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px]">
                    Direct Vector: {(calculateDistanceMeters(routeResult.origin.lat, routeResult.origin.lng, routeResult.destination.lat, routeResult.destination.lng) / 1000).toFixed(1)} km
                  </span>
                </div>
              )}

              {/* Intercepted Nodes Carousel */}
              {routeResult.interceptedLocations.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Intercepted Checkpoints along Corridor ({routeResult.interceptedLocations.length}):</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    {routeResult.interceptedLocations.map(({ location: item, distanceMeters }) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedLocation(item);
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.panTo([item.lat, item.lng], { animate: true });
                          }
                        }}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/70 text-slate-200 shrink-0 cursor-pointer transition-all space-y-1 min-w-[200px]"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase">
                            {item.category}
                          </span>
                          <span className="text-amber-400 font-bold">
                            {(distanceMeters / 1000).toFixed(1)} km from path
                          </span>
                        </div>
                        <div className="font-bold text-white truncate text-xs">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.address}</div>
                        {item.associatedEntities && item.associatedEntities.length > 0 && (
                          <div className="text-[10px] font-mono text-rose-300/90 pt-0.5 border-t border-slate-900 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>{item.associatedEntities.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>No other registered case nodes detected within the current {corridorBufferKm} km surveillance corridor. Adjust buffer width or log additional waypoints.</span>
                </div>
              )}

              {/* Action Buttons for Plotted Route */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  onClick={handleFitRouteBounds}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Fit Map to Corridor</span>
                </button>

                <button
                  onClick={handleCopyCorridorDossier}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Copy Corridor Dossier</span>
                </button>

                <button
                  onClick={handleExportCorridorGeoJSON}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Export Corridor GeoJSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Map Stage + Detail Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Stage Container (Spans 2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {/* The Leaflet Container with Explicit Height */}
          <div className="relative w-full h-[540px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
            <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '540px' }} />

            {/* Map Picking Active Floating Banner */}
            {pickingTarget !== 'none' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-sky-950/95 border border-sky-400 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md animate-pulse">
                <Target className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold">
                  Click any map pin to set as{' '}
                  <strong className="text-sky-300">
                    {pickingTarget === 'origin' ? 'Route Origin (Point A)' : 'Route Destination (Point B)'}
                  </strong>
                </span>
                <button
                  onClick={() => setPickingTarget('none')}
                  className="ml-2 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 shadow-xl text-[10px] space-y-1.5 max-w-[210px]">
              <div className="font-mono uppercase font-bold text-slate-400 text-[9px] tracking-wider border-b border-slate-800 pb-1">
                Tactical Legend
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-300">Vault / Stash</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-300">Seizure / Raid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                  <span className="text-slate-300">Sighting / CCTV</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span className="text-slate-300">ANPR Toll</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span className="text-slate-300">Cell Tower</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300">Command Post</span>
                </div>
              </div>
            </div>

            {/* Map Info Bar / Hint */}
            <div className="absolute top-3 left-3 z-20 bg-slate-950/80 backdrop-blur-xs border border-slate-800 rounded-md px-2.5 py-1 text-[10px] font-mono text-slate-400">
              <span>{filteredLocations.length} locations rendered</span>
              {geofenceActive && <span className="text-cyan-400 ml-2">• Geofence Active (Click map to relocate)</span>}
            </div>
          </div>

          {/* Trajectory Playback Scrubber Bar (Shows if route trajectory is active) */}
          {showTrajectory && trajectoryPoints.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Transit Trajectory Reconstruction</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Stage {currentTrajectoryStep + 1} of {trajectoryPoints.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStepTrajectory('prev')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    title="Previous Waypoint"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsPlayingTrajectory(!isPlayingTrajectory)}
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      isPlayingTrajectory ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {isPlayingTrajectory ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isPlayingTrajectory ? 'Pause' : 'Play Route'}</span>
                  </button>
                  <button
                    onClick={() => handleStepTrajectory('next')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    title="Next Waypoint"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Waypoint step tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                {trajectoryPoints.map((pt, idx) => {
                  const isActive = currentTrajectoryStep === idx || selectedLocation?.id === pt.id;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => {
                        setCurrentTrajectoryStep(idx);
                        setSelectedLocation(pt);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.panTo([pt.lat, pt.lng], { animate: true });
                        }
                      }}
                      className={`p-2 rounded-lg text-left transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-emerald-400">#{pt.trajectoryOrder}</span>
                        <span className="text-slate-500">{pt.timestamp?.split(' ')[1] || ''}</span>
                      </div>
                      <div className="text-[11px] font-semibold truncate mt-0.5">{pt.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Geofence Analysis Controls & Result Counter */}
          {geofenceActive && geofenceCenter && (
            <div className="bg-slate-900 border border-cyan-800/60 rounded-xl p-3 shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">Spatial Proximity & Geofence Filter</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {entitiesInGeofence.length} points within perimeter
                  </span>
                </div>

                {/* Radius Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">Perimeter Radius:</span>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={geofenceRadiusMeters}
                    onChange={(e) => setGeofenceRadiusMeters(Number(e.target.value))}
                    className="w-28 accent-cyan-400 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-cyan-300 text-xs">
                    {(geofenceRadiusMeters / 1000).toFixed(1)} km
                  </span>
                </div>
              </div>

              {/* List of points inside Geofence */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {entitiesInGeofence.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedLocation(item);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo([item.lat, item.lng], { animate: true });
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-slate-200 flex items-center gap-2 shrink-0 cursor-pointer text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span className="font-bold truncate max-w-[140px]">{item.name}</span>
                    <span className="font-mono text-[10px] text-cyan-300">
                      {item.distanceMeters < 1000 ? `${item.distanceMeters}m` : `${(item.distanceMeters / 1000).toFixed(1)}km`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Location Inspector & Entity Cross-Reference */}
        <div className="space-y-4">
          {selectedLocation && selectedConfig ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
              {/* Header Badge & Verification */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md font-bold border flex items-center gap-1.5 ${selectedConfig.bgClass} ${selectedConfig.textClass} ${selectedConfig.borderClass}`}
                >
                  <selectedConfig.icon className="w-3.5 h-3.5" />
                  <span>{selectedConfig.label}</span>
                </span>

                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Entity</span>
                </span>
              </div>

              {/* Title & Coordinates */}
              <div>
                <h3 className="text-base font-bold text-white leading-snug">{selectedLocation.name}</h3>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">{selectedLocation.address}</p>
              </div>

              {/* Precise Coordinate Telemetry Card */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">GPS Decimal Coordinates:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {selectedLocation.lat.toFixed(5)}° N, {selectedLocation.lng.toFixed(5)}° E
                  </span>
                </div>

                {selectedLocation.dmsCoordinates && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">DMS Format:</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {selectedLocation.dmsCoordinates}
                    </span>
                  </div>
                )}

                {selectedLocation.timestamp && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Timestamp:</span>
                    <span className="font-mono text-slate-300 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {selectedLocation.timestamp}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Intelligence Confidence:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.round(selectedLocation.confidenceScore * 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-emerald-400 text-[11px] font-bold">
                      {Math.round(selectedLocation.confidenceScore * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Associated Persons & Targets */}
              {selectedLocation.associatedEntities && selectedLocation.associatedEntities.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-slate-400 text-xs font-semibold">Linked Targets & Vehicles:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLocation.associatedEntities.map((ent, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-200 text-xs font-medium flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>{ent}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Corroborated Evidence Excerpt */}
              {selectedLocation.evidenceSnippet && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Evidence Narrative Trace:</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed italic">
                    "{selectedLocation.evidenceSnippet}"
                  </p>
                  {selectedLocation.sourceDocumentTitle && (
                    <div className="pt-1.5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span className="truncate">{selectedLocation.sourceDocumentTitle}</span>
                      {selectedLocation.sourceDocumentId && onSelectDocument && (
                        <button
                          onClick={() => onSelectDocument(selectedLocation.sourceDocumentId!)}
                          className="text-emerald-400 hover:underline ml-2 shrink-0 cursor-pointer font-bold"
                        >
                          View Doc
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                {/* Route Corridor Assignment Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setRouteOriginId(selectedLocation.id);
                      setShowRouteTool(true);
                      triggerToast(`Set "${selectedLocation.name}" as Route Origin (Point A)`);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/80 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] flex items-center justify-center font-bold">
                      A
                    </div>
                    <span>Set as Origin</span>
                  </button>
                  <button
                    onClick={() => {
                      setRouteDestId(selectedLocation.id);
                      setShowRouteTool(true);
                      triggerToast(`Set "${selectedLocation.name}" as Route Destination (Point B)`);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-300 hover:bg-rose-900/80 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <div className="w-4 h-4 rounded-full bg-rose-500 text-slate-950 font-mono text-[10px] flex items-center justify-center font-bold">
                      B
                    </div>
                    <span>Set as Destination</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
                    );
                    triggerToast('Coordinates copied to clipboard');
                  }}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy Coordinates ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})</span>
                </button>

                <a
                  href={`https://www.openstreetmap.org/?mlat=${selectedLocation.lat}&mlon=${selectedLocation.lng}#map=16/${selectedLocation.lat}/${selectedLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspect on OpenStreetMap (Zero-API)</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>Select any tactical pin on the map to inspect coordinates, linked suspects, and evidence.</p>
            </div>
          )}

          {/* Quick Waypoint List Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Geospatial Ledger ({filteredLocations.length})</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">Sorted by proximity</span>
            </div>

            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {filteredLocations.map((loc) => {
                const conf = CATEGORY_CONFIG[loc.category] || CATEGORY_CONFIG.sighting;
                const isSelected = selectedLocation?.id === loc.id;

                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo([loc.lat, loc.lng], { animate: true });
                      }
                    }}
                    className={`w-full p-2 rounded-lg text-left transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500/70 text-white'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: conf.hexColor }}></span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate leading-tight">{loc.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {loc.lat.toFixed(4)}°, {loc.lng.toFixed(4)}°
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                      {conf.badgeName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Manual GPS Waypoint */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Log Field Intelligence Waypoint</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWaypoint} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Waypoint Name / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ring Road Handoff Junction"
                  value={newPointName}
                  onChange={(e) => setNewPointName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Intelligence Category</label>
                <select
                  value={newPointCategory}
                  onChange={(e) => setNewPointCategory(e.target.value as GISLocationCategory)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="sighting">CCTV / Physical Sighting</option>
                  <option value="vault">Hawala Vault / Stash House</option>
                  <option value="interception">Raid / Seizure Point</option>
                  <option value="toll_plaza">ANPR Highway Toll</option>
                  <option value="cell_tower">CDR Cell Tower Ping</option>
                  <option value="residence">Suspect Residence</option>
                  <option value="office">Commercial Office</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newPointLat}
                    onChange={(e) => setNewPointLat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newPointLng}
                    onChange={(e) => setNewPointLng(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Postal Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Outer Ring Road Flyover, Pitampura"
                  value={newPointAddress}
                  onChange={(e) => setNewPointAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Source / Field Intelligence Report</label>
                <textarea
                  rows={2}
                  placeholder="Details of surveillance, informer tip-off, or intercepted chatter..."
                  value={newPointSnippet}
                  onChange={(e) => setNewPointSnippet(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer shadow-md shadow-emerald-950"
                >
                  Save Waypoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
