import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Users, Calendar, Trophy, Megaphone,
  Star, AlertTriangle, Plus, X, ChevronRight, ChevronUp, ChevronDown,
  Activity, Shield, Mic, Radio, Heart, Zap, RefreshCw, Home,
  UserPlus, UserMinus, Award, Flame, Clock, MapPin, Ticket, Loader2, Check,
  Crown, Globe, Truck, Coffee, ShoppingBag, Swords, Wrench, Tv, Building2, Palette, Newspaper, Briefcase, UserCircle, Mail, Bug
} from 'lucide-react';

/* ============================================================
   SAVE VERSIONING
   Bump SAVE_VERSION whenever the game-state shape changes in a
   way future saves need to know about. normalizeGame() is the
   single migration point — every load passes through it, and
   every field it backfills should be listed in the changelog
   below so we know why it's there. Stored at the top level as
   game.saveVersion (describes the whole persisted shape, not
   just the company sub-object).

   v1 (current) — baseline. All backward-compat fields already
   present in normalizeGame's fixWrestler/fixStaff/company block
   (gender, confidence, wellness, hometown/weight, contractPromise,
   referees/writers/roadAgents staff groups, relationships, inbox,
   weekDay/ringCondition/supplies, journalists, mediaInterviewMilestones)
   are folded into v1 — this file has no pre-v1 saves in the wild.
   ============================================================ */
const SAVE_VERSION = 1;

/* ============================================================
   DESIGN TOKENS — "Territory Office" aesthetic: promoter's
   ledger meets vintage wrestling poster. Warm canvas paper,
   near-black panels, rope red + championship gold accents.
   ============================================================ */
const C = {
  canvas: '#EAE2CC',
  canvasAlt: '#DED2AE',
  ink: '#1B1712',
  inkSoft: '#26201A',
  inkFaint: '#3B332A',
  rope: 'var(--wgm-rope, #AC3A2C)',
  ropeDark: 'var(--wgm-rope-dark, #832A20)',
  gold: 'var(--wgm-gold, #C4922E)',
  goldSoft: 'var(--wgm-gold-soft, #E2C377)',
  cream: '#F6F0E1',
  steel: '#4A5A5C',
  good: '#5C7A48',
  bad: '#AC3A2C',
  line: 'rgba(27,23,18,0.14)',
};

/* ---------- Theming ---------- */
const THEME_PRESETS = [
  { id: 'classic', name: 'Classic Gold', gold: '#C4922E', goldSoft: '#E2C377', rope: '#AC3A2C', ropeDark: '#832A20' },
  { id: 'crimson', name: 'Crimson Steel', gold: '#8C96A0', goldSoft: '#B7BFC7', rope: '#8C1620', ropeDark: '#5E0F16' },
  { id: 'cobalt', name: 'Cobalt Chrome', gold: '#4FA8D8', goldSoft: '#8FCBEA', rope: '#1C3D6B', ropeDark: '#14294A' },
  { id: 'emerald', name: 'Emerald Reign', gold: '#4F9B5C', goldSoft: '#8CC998', rope: '#1F5C34', ropeDark: '#153F24' },
  { id: 'violet', name: 'Royal Violet', gold: '#8E6BC4', goldSoft: '#B8A0DE', rope: '#4B2E7A', ropeDark: '#33205A' },
  { id: 'inferno', name: 'Inferno Orange', gold: '#E08A2E', goldSoft: '#F0B268', rope: '#B33A1E', ropeDark: '#832910' },
];
const DEFAULT_THEME = { presetId: 'classic', ...THEME_PRESETS[0] };
function hexToRgbTriplet(hex) {
  const h = (hex || '#C4922E').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `${r} ${g} ${b}`;
}
function shadeHex(hex, amt) {
  const h = (hex || '#000000').replace('#', '');
  const clampByte = (v) => Math.max(0, Math.min(255, v));
  const r = clampByte(parseInt(h.substring(0, 2), 16) + amt);
  const g = clampByte(parseInt(h.substring(2, 4), 16) + amt);
  const b = clampByte(parseInt(h.substring(4, 6), 16) + amt);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
function themeCssVars(theme) {
  const t = theme || DEFAULT_THEME;
  return `:root{--wgm-gold:${t.gold};--wgm-gold-soft:${t.goldSoft};--wgm-rope:${t.rope};--wgm-rope-dark:${t.ropeDark};--wgm-gold-rgb:${hexToRgbTriplet(t.gold)};--wgm-rope-rgb:${hexToRgbTriplet(t.rope)};}`;
}

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
.wgm-root { font-family: 'Inter', system-ui, sans-serif; }
.wgm-display { font-family: 'Anton', sans-serif; letter-spacing: 0.02em; }
.wgm-mono { font-family: 'IBM Plex Mono', monospace; }
.wgm-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.wgm-scrollbar::-webkit-scrollbar-thumb { background: rgba(27,23,18,0.25); border-radius: 4px; }
.wgm-ticket { position: relative; }
.wgm-ticket::before {
  content: ''; position: absolute; top: -1px; left: 0; right: 0; height: 8px;
  background-image: radial-gradient(circle, ${C.canvas} 3px, transparent 3.5px);
  background-size: 14px 14px; background-position: -3px -6px;
}
@keyframes wgmPop { 0% { transform: scale(0.96); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.wgm-pop { animation: wgmPop 0.18s ease-out; }

/* Dashboard: desk / office */
.wgm-desk { background-image: repeating-linear-gradient(135deg, rgba(27,23,18,0.02) 0px, rgba(27,23,18,0.02) 1px, transparent 1px, transparent 11px); }
.wgm-nameplate {
  background: linear-gradient(180deg, var(--wgm-gold-soft, #E2C377) 0%, var(--wgm-gold, #C4922E) 60%, rgb(var(--wgm-gold-rgb, 196 146 46) / 0.75) 100%);
  border: 1px solid rgba(0,0,0,0.3);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -3px 5px rgba(0,0,0,0.2), 0 2px 5px rgba(0,0,0,0.25);
}
.wgm-screw { width: 5px; height: 5px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff6de, #5f4f28); box-shadow: 0 0.5px 1px rgba(0,0,0,0.5); }
.wgm-memo { box-shadow: 0 2px 4px rgba(27,23,18,0.12); }
.wgm-memo:nth-child(odd) { transform: rotate(-0.5deg); }
.wgm-memo:nth-child(even) { transform: rotate(0.4deg); }
.wgm-pin { width: 7px; height: 7px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #e8897a, #a13324); box-shadow: 0 1px 2px rgba(0,0,0,0.4); }

/* Roster: notebook / contacts */
.wgm-spiral { height: 13px; background-image: radial-gradient(circle, rgba(27,23,18,0.32) 2.6px, transparent 3px); background-size: 20px 13px; background-position: 8px center; }
.wgm-index-card { border-left-width: 5px; border-left-style: solid; }

/* Book Show: event poster */
.wgm-poster {
  background-image: repeating-linear-gradient(180deg, transparent 0px, transparent 2px, rgba(27,23,18,0.018) 2px, rgba(27,23,18,0.018) 3px);
  border: 2px solid var(--wgm-gold, #C4922E);
  box-shadow: inset 0 0 0 3px ${C.canvas}, inset 0 0 0 4px var(--wgm-gold, #C4922E);
}
.wgm-poster-corner { position: absolute; width: 14px; height: 14px; border: 2px solid var(--wgm-gold, #C4922E); }
.wgm-rope-frame {
  border: 9px solid;
  border-image-slice: 1;
  border-image-source: repeating-linear-gradient(135deg, var(--wgm-gold, #C4922E) 0px, var(--wgm-gold, #C4922E) 4px, ${C.ink} 4px, ${C.ink} 8px);
}
.wgm-bout-divider { border-top: 1px solid rgba(27,23,18,0.25); }

/* History: ledger / records */
.wgm-ledger { background-image: repeating-linear-gradient(180deg, transparent, transparent 30px, rgba(27,23,18,0.075) 30px, rgba(27,23,18,0.075) 31px); }
.wgm-ledger-spine { background: linear-gradient(90deg, ${C.inkSoft}, ${C.ink}); }

/* Shop: storefront / catalog */
.wgm-awning {
  background: repeating-linear-gradient(115deg, var(--wgm-gold, #C4922E) 0px, var(--wgm-gold, #C4922E) 16px, ${C.cream} 16px, ${C.cream} 32px);
  border-bottom: 3px solid rgba(0,0,0,0.25);
}
.wgm-price-tag { position: relative; }
.wgm-price-tag::before {
  content: ''; position: absolute; left: -5px; top: 50%; margin-top: -3px;
  width: 6px; height: 6px; border-radius: 50%; background: ${C.canvas}; border: 1px solid rgba(0,0,0,0.25);
}
`;

/* ============================================================
   DATA TABLES
   ============================================================ */
const FIRST_NAMES_MALE = ['Marcus','Dante','Jax','Silas','Rocco','Diesel','Cole','Bishop','Axel','Gideon','Tanner','Wade','Bram','Kade','Orion','Rafe','Sully','Griff','Ezra','Duke','Vance','Cruz','Ronan','Slate','Hutch','Beau','Cash','Mace','Reyes','Talon'];
const FIRST_NAMES_FEMALE = ['Vivica','Serena','Roxie','Nadia','Harlow','Piper','Zara','Athena','Ivy','Raven','Cleo','Skye','Delilah','Selene','Priya','Faye','Georgia','Blair','Marisol','Tempest'];
const FIRST_NAMES = [...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE];
const LAST_NAMES = ['Steele','Cross','Kane','Voss','Sterling','Rourke','Blackwood','Cade','Draven','Marek','Storm','Reilly','Hendrix','Castillo','Frost','Griffin','Solomon','Kessler','Vargas','Wolfe','Sharpe','Callahan','Duarte','Nash','Okafor','Petrov','Diallo','Yamada','Alvarez','Bishop'];
const GIMMICK_ADJ = ['Iron','Savage','Golden','Wild','Silent','Crimson','Atomic','Midnight','Thunder','Vicious','Righteous','Ruthless','Untamed','Notorious','Merciless','Electric','Rogue','Fearless'];
const GIMMICK_NOUN = ['Wolf','Hammer','Reaper','Machine','Saint','Outlaw','Phantom','Titan','Viper','Renegade','Bull','Storm','Ghost','Predator','Warden','Comet','Maverick','Executioner'];

const TIER_CONFIG = {
  Jobber: { statRange: [12, 32], popRange: [1, 8], salaryRange: [50, 130], ageRange: [19, 42], confRange: [15, 35] },
  Rookie: { statRange: [28, 52], popRange: [3, 18], salaryRange: [120, 280], ageRange: [20, 26], confRange: [35, 55] },
  'Mid-Card': { statRange: [42, 68], popRange: [16, 42], salaryRange: [280, 650], ageRange: [24, 34], confRange: [50, 72] },
  Star: { statRange: [62, 86], popRange: [40, 72], salaryRange: [650, 1600], ageRange: [27, 38], confRange: [65, 85] },
  Legend: { statRange: [80, 97], popRange: [70, 97], salaryRange: [1600, 3800], ageRange: [35, 48], confRange: [75, 95] },
  Celebrity: { statRange: [18, 42], popRange: [55, 90], salaryRange: [900, 2200], ageRange: [24, 50], confRange: [55, 85], charismaFloor: 70 },
};

const VENUE_TIERS = [
  { id: 'gym', name: 'High School Gym', capacity: 150, rent: 250, minRep: 0 },
  { id: 'legion', name: 'Legion Hall', capacity: 350, rent: 600, minRep: 8 },
  { id: 'armory', name: 'National Guard Armory', capacity: 800, rent: 1600, minRep: 20 },
  { id: 'community', name: 'Community Arena', capacity: 1800, rent: 4200, minRep: 35 },
  { id: 'midsize', name: 'Mid-Size Arena', capacity: 5000, rent: 12000, minRep: 55 },
  { id: 'sports', name: 'Sports Arena', capacity: 12000, rent: 30000, minRep: 75 },
  { id: 'stadium', name: 'Stadium', capacity: 35000, rent: 90000, minRep: 92 },
];
const ALL_VENUES = [
  { id: 'gym', tierId: 'gym', name: 'High School Gym', capacity: 150, rent: 250, minRep: 0, crowdLean: null },
  { id: 'gym_deathmatch', tierId: 'gym', name: 'Rusty Machine Shop', capacity: 150, rent: 213, minRep: 0, crowdLean: 'deathmatch' },
  { id: 'gym_lucha', tierId: 'gym', name: 'Parish Community Hall', capacity: 150, rent: 250, minRep: 0, crowdLean: 'lucha' },
  { id: 'legion', tierId: 'legion', name: 'Legion Hall', capacity: 350, rent: 600, minRep: 8, crowdLean: null },
  { id: 'legion_strong_style', tierId: 'legion', name: 'Dojo Fight Center', capacity: 350, rent: 600, minRep: 8, crowdLean: 'strong_style' },
  { id: 'legion_sports_entertainment', tierId: 'legion', name: 'Downtown Rec Center', capacity: 350, rent: 660, minRep: 8, crowdLean: 'sports_entertainment' },
  { id: 'armory', tierId: 'armory', name: 'National Guard Armory', capacity: 800, rent: 1600, minRep: 20, crowdLean: null },
  { id: 'armory_british', tierId: 'armory', name: "Working Men's Club", capacity: 800, rent: 1440, minRep: 20, crowdLean: 'british' },
  { id: 'armory_deathmatch', tierId: 'armory', name: 'The Underground', capacity: 800, rent: 1280, minRep: 20, crowdLean: 'deathmatch' },
  { id: 'community', tierId: 'community', name: 'Community Arena', capacity: 1800, rent: 4200, minRep: 35, crowdLean: null },
  { id: 'community_lucha', tierId: 'community', name: 'Fiesta Arena', capacity: 1800, rent: 4200, minRep: 35, crowdLean: 'lucha' },
  { id: 'community_strong_style', tierId: 'community', name: 'Budo Hall', capacity: 1800, rent: 4200, minRep: 35, crowdLean: 'strong_style' },
  { id: 'midsize', tierId: 'midsize', name: 'Mid-Size Arena', capacity: 5000, rent: 12000, minRep: 55, crowdLean: null },
  { id: 'midsize_sports_entertainment', tierId: 'midsize', name: 'Civic Spectacle Center', capacity: 5000, rent: 13800, minRep: 55, crowdLean: 'sports_entertainment' },
  { id: 'midsize_deathmatch', tierId: 'midsize', name: 'Scrapyard Coliseum', capacity: 5000, rent: 10200, minRep: 55, crowdLean: 'deathmatch' },
  { id: 'sports', tierId: 'sports', name: 'Sports Arena', capacity: 12000, rent: 30000, minRep: 75, crowdLean: null },
  { id: 'sports_british', tierId: 'sports', name: "Grapplers' Cathedral", capacity: 12000, rent: 33000, minRep: 75, crowdLean: 'british' },
  { id: 'sports_lucha', tierId: 'sports', name: 'Templo de Lucha', capacity: 12000, rent: 31500, minRep: 75, crowdLean: 'lucha' },
  { id: 'stadium', tierId: 'stadium', name: 'Stadium', capacity: 35000, rent: 90000, minRep: 92, crowdLean: null },
  { id: 'stadium_strong_style', tierId: 'stadium', name: 'National Budokan', capacity: 35000, rent: 99000, minRep: 92, crowdLean: 'strong_style' },
  { id: 'stadium_sports_entertainment', tierId: 'stadium', name: 'Mega Dome', capacity: 35000, rent: 108000, minRep: 92, crowdLean: 'sports_entertainment' },
];
function regionalCompanyCount(company, rivals) {
  return 1 + (rivals || []).filter((r) => r.region === company.region).length;
}
function venueVariantSlotsFor(company, rivals) {
  const n = regionalCompanyCount(company, rivals);
  if (n >= 8) return 3;
  if (n >= 4) return 2;
  return 1;
}
function unlockedVenuesFor(company, rivals) {
  const slots = venueVariantSlotsFor(company, rivals);
  const repUnlocked = ALL_VENUES.filter((v) => v.minRep <= company.reputation);
  const byTier = {};
  repUnlocked.forEach((v) => {
    if (!byTier[v.tierId]) byTier[v.tierId] = [];
    byTier[v.tierId].push(v);
  });
  const result = [];
  VENUE_TIERS.forEach((t) => {
    const list = byTier[t.id];
    if (!list) return;
    const neutral = list.find((v) => !v.crowdLean);
    const leans = list.filter((v) => v.crowdLean);
    if (neutral) result.push(neutral);
    result.push(...leans.slice(0, Math.max(0, slots - 1)));
  });
  return result;
}

const MATCH_TYPES = [
  { id: 'singles', label: 'Singles Match', minP: 2, maxP: 2, beatsRange: [6, 9], riskMult: 1.0, weight: { strike: 1, grapple: 1, aerial: 0.8, submission: 0.8, power: 0.8 } },
  { id: 'tag', label: 'Tag Team Match', minP: 4, maxP: 4, sides: true, beatsRange: [7, 10], riskMult: 1.0, weight: { strike: 1, grapple: 1, aerial: 1, submission: 0.6, power: 1 } },
  { id: 'triple', label: 'Triple Threat', minP: 3, maxP: 3, beatsRange: [7, 10], riskMult: 1.1, weight: { strike: 1.1, grapple: 0.8, aerial: 1, submission: 0.6, power: 1 } },
  { id: 'fatal4way', label: 'Fatal Four-Way', minP: 4, maxP: 4, beatsRange: [8, 11], riskMult: 1.15, weight: { strike: 1.1, grapple: 0.7, aerial: 1.1, submission: 0.5, power: 1.1 } },
  { id: 'ladder', label: 'Ladder Match', minP: 2, maxP: 4, beatsRange: [8, 12], riskMult: 1.6, weight: { strike: 0.6, grapple: 0.4, aerial: 1.6, submission: 0.1, power: 1.3 } },
  { id: 'cage', label: 'Steel Cage Match', minP: 2, maxP: 2, beatsRange: [7, 10], riskMult: 1.4, weight: { strike: 1.3, grapple: 1, aerial: 0.6, submission: 0.7, power: 1.2 } },
  { id: 'submission', label: 'Submission Match', minP: 2, maxP: 2, beatsRange: [6, 9], riskMult: 0.9, weight: { strike: 0.5, grapple: 1, aerial: 0.3, submission: 1.8, power: 0.6 } },
  { id: 'hardcore', label: 'Hardcore / No DQ', minP: 2, maxP: 3, beatsRange: [7, 11], riskMult: 1.5, weight: { strike: 1.5, grapple: 0.8, aerial: 1, submission: 0.4, power: 1.4 } },
];

/* ---------- Researchable match types (R&D) ---------- */
const RESEARCHABLE_MATCH_TYPES = [
  { id: 'sixman', label: 'Six-Man Tag Team Match', minP: 6, maxP: 6, sides: true, sideSize: 3, beatsRange: [9, 13], riskMult: 1.05, weight: { strike: 1, grapple: 0.9, aerial: 1.1, submission: 0.5, power: 1 }, researchCost: 6000, researchWeeks: 3, minRep: 15, desc: '3-on-3 tag warfare. More chaos, more chemistry to manage.' },
  { id: 'laststanding', label: 'Last Man Standing', minP: 2, maxP: 2, beatsRange: [8, 12], riskMult: 1.3, weight: { strike: 1.4, grapple: 0.9, aerial: 0.7, submission: 0.3, power: 1.3 }, researchCost: 4000, researchWeeks: 2, minRep: 20, desc: 'No pin, no submission — just survive the count.' },
  { id: 'ironman', label: 'Iron Man Match', minP: 2, maxP: 2, beatsRange: [14, 20], riskMult: 1.15, weight: { strike: 1, grapple: 1.2, aerial: 0.9, submission: 1, power: 0.9 }, researchCost: 7000, researchWeeks: 3, minRep: 30, desc: 'An extended battle of attrition — the longest match on the card.' },
  { id: 'tlc', label: 'TLC Match', minP: 2, maxP: 4, beatsRange: [9, 13], riskMult: 1.7, weight: { strike: 0.6, grapple: 0.3, aerial: 1.5, submission: 0.1, power: 1.4 }, researchCost: 9000, researchWeeks: 4, minRep: 35, requiresWeapons: ['ladders', 'tables'], desc: 'Tables, Ladders, and Chairs — the ultimate spectacle. Requires ladders and tables in your weapons stash.' },
  { id: 'rumble', label: 'Royal Rumble', minP: 6, maxP: 10, beatsRange: [12, 18], riskMult: 1.1, weight: { strike: 1, grapple: 0.6, aerial: 0.9, submission: 0.3, power: 1.2 }, researchCost: 12000, researchWeeks: 5, minRep: 45, desc: 'A chaotic multi-man spectacle fans love once a year.' },
];
const ALL_MATCH_TYPES = [...MATCH_TYPES, ...RESEARCHABLE_MATCH_TYPES];

const FINISH_TYPES = [
  { id: 'clean', label: 'Clean Finish', qualityMod: 0.3 },
  { id: 'dq', label: 'Disqualification', qualityMod: -0.4 },
  { id: 'countout', label: 'Count-Out', qualityMod: -0.5 },
  { id: 'screwjob', label: 'Screwjob / Interference', qualityMod: -0.1 },
];

const PROMO_PURPOSES = ['Call-Out', 'Contract Signing', 'Confrontation', 'Celebration', 'Backstage Interview'];

const SPOT_TYPES = [
  { id: 'strike', label: 'strike exchange', statWeight: { strength: 0.6, technical: 0.2, charisma: 0.2 }, riskBase: 0.03 },
  { id: 'grapple', label: 'grapple sequence', statWeight: { technical: 0.6, strength: 0.3, charisma: 0.1 }, riskBase: 0.02 },
  { id: 'aerial', label: 'high-flying spot', statWeight: { aerial: 0.7, charisma: 0.3 }, riskBase: 0.09 },
  { id: 'submission', label: 'submission attempt', statWeight: { technical: 0.5, strength: 0.2, stamina: 0.3 }, riskBase: 0.02 },
  { id: 'power', label: 'power move', statWeight: { strength: 0.7, stamina: 0.3 }, riskBase: 0.05 },
];

const INJURY_TABLE = [
  { label: 'Bumps and Bruises', weeks: 1, weight: 50 },
  { label: 'Minor Sprain', weeks: 2, weight: 25 },
  { label: 'Pulled Muscle', weeks: 4, weight: 15 },
  { label: 'Serious Injury', weeks: 8, weight: 8 },
  { label: 'Major Injury', weeks: 14, weight: 2 },
];

const REP_TIERS = [
  { min: 0, label: 'Backyard Buzz' },
  { min: 15, label: 'Local Indie' },
  { min: 35, label: 'Regional Territory' },
  { min: 55, label: 'National Promotion' },
  { min: 75, label: 'Major League' },
  { min: 90, label: 'Global Powerhouse' },
];

/* ---------- Region & Style (starter setup) ---------- */
const REGION_LIST = [
  { id: 'usa', label: 'United States', blurb: 'Wide-open markets, the classic territory system.' },
  { id: 'mexico', label: 'Mexico', blurb: 'Lucha libre heartland, passionate weekly crowds.' },
  { id: 'japan', label: 'Japan', blurb: 'Reverence for the sport, disciplined dojo culture.' },
  { id: 'uk', label: 'United Kingdom', blurb: "Working men's clubs to sold-out arenas." },
  { id: 'australia', label: 'Australia', blurb: 'A hungry, underserved scene ready to grow.' },
  { id: 'germany', label: 'Germany', blurb: 'Old-school European catch wrestling roots.' },
];

const REGION_NAMES = {
  usa: { first: { male: FIRST_NAMES_MALE, female: FIRST_NAMES_FEMALE }, last: LAST_NAMES },
  mexico: { first: { male: ['Alejandro', 'Diego', 'Emiliano', 'Javier', 'Rodrigo', 'Salvador', 'Mateo', 'Andres', 'Ricardo', 'Fernando'], female: ['Luz', 'Ximena', 'Camila', 'Valentina', 'Guadalupe', 'Renata'] }, last: ['Hernandez', 'Garcia', 'Morales', 'Reyes', 'Jimenez', 'Flores', 'Cruz', 'Guerrero', 'Rivas', 'Salazar', 'Aguilar', 'Mendoza'] },
  japan: { first: { male: ['Kenji', 'Hiroshi', 'Takashi', 'Ryota', 'Shinji', 'Daisuke', 'Kazuki', 'Naoki', 'Yuto', 'Sora'], female: ['Aiko', 'Emi', 'Sakura', 'Yui', 'Haruka', 'Nozomi'] }, last: ['Tanaka', 'Yamamoto', 'Sato', 'Suzuki', 'Watanabe', 'Kobayashi', 'Nakamura', 'Ito', 'Kimura', 'Saito', 'Hasegawa', 'Fujita'] },
  uk: { first: { male: ['Oliver', 'Jack', 'Harry', 'George', 'Charlie', 'Alfie', 'Freddie', 'Archie', 'Reggie', 'Stanley'], female: ['Poppy', 'Amelia', 'Isla', 'Freya', 'Daisy', 'Ruby'] }, last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Thomas', 'Roberts', 'Walker', 'Wright', 'Baker', 'Hughes'] },
  australia: { first: { male: ['Jack', 'Cooper', 'Levi', 'Hunter', 'Mason', 'Riley', 'Tyson', 'Bailey', 'Zac', 'Dusty'], female: ['Chloe', 'Matilda', 'Sienna', 'Mackenzie', 'Charlotte', 'Grace'] }, last: ['Anderson', 'Mitchell', 'Clarke', 'Kelly', 'White', 'Hall', 'Turner', 'Cooper', 'Ward', 'Fraser', 'Bishop', 'Marsh'] },
  germany: { first: { male: ['Lukas', 'Felix', 'Jonas', 'Maximilian', 'Sebastian', 'Florian', 'Niklas', 'Dominik', 'Matthias', 'Stefan'], female: ['Greta', 'Hanna', 'Lena', 'Frieda', 'Ilse', 'Katrin'] }, last: ['Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter', 'Klein'] },
};
const REGION_HOMETOWNS = {
  usa: ['New York, NY', 'Chicago, IL', 'Houston, TX', 'Memphis, TN', 'Charlotte, NC', 'Kansas City, MO', 'Pittsburgh, PA', 'Portland, OR', 'Atlanta, GA', 'Phoenix, AZ', 'Detroit, MI', 'Nashville, TN'],
  mexico: ['Mexico City', 'Guadalajara', 'Monterrey', 'Tijuana', 'Puebla', 'Cancun', 'Veracruz', 'Leon'],
  japan: ['Tokyo', 'Osaka', 'Nagoya', 'Yokohama', 'Fukuoka', 'Sapporo', 'Kobe', 'Kyoto'],
  uk: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Glasgow', 'Leeds', 'Newcastle', 'Cardiff'],
  australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle'],
  germany: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dortmund'],
};

const STYLE_CONFIG = {
  sports_entertainment: { label: 'Sports Entertainment', blurb: 'Larger-than-life characters, big-match storytelling.', statBias: { charisma: 8 }, preferredTypes: ['singles', 'tag', 'ladder', 'hardcore'], adj: GIMMICK_ADJ, noun: GIMMICK_NOUN, prefix: 'The' },
  lucha: { label: 'Lucha Libre', blurb: 'Masked high-flyers, trios warfare, honor on the line.', statBias: { aerial: 10, charisma: 4 }, preferredTypes: ['triple', 'tag', 'singles'], adj: ['Rojo', 'Dorado', 'Fantasma', 'Sagrado', 'Diablo', 'Angel', 'Furia', 'Relampago'], noun: ['Aguila', 'Tigre', 'Lobo', 'Serpiente', 'Demonio', 'Jaguar', 'Fenix', 'Sombra'], prefix: { male: 'El', female: 'La' } },
  strong_style: { label: 'Japanese Strong Style', blurb: 'Stiff strikes and fighting spirit, mat-based intensity.', statBias: { strength: 6, technical: 8 }, preferredTypes: ['singles', 'submission', 'cage'], adj: ['Crimson', 'Iron', 'Silent', 'Steel', 'Burning', 'Dark'], noun: ['Dragon', 'Emperor', 'Samurai', 'Oni', 'Ronin', 'Kaiju'], prefix: 'The' },
  british: { label: 'British Strong Style', blurb: 'Technical grappling and hard-hitting scientific wrestling.', statBias: { technical: 10 }, preferredTypes: ['singles', 'submission', 'tag'], adj: ['Iron', 'Royal', 'Grim', 'Relentless', 'Steel', 'Working-Class'], noun: ['Lion', 'Bulldog', 'Gentleman', 'Brawler', 'Grappler', 'Guv\u2019nor'], prefix: 'The' },
  deathmatch: { label: 'Deathmatch / Hardcore', blurb: 'Weapons, blood, and no rules.', statBias: { strength: 6, stamina: 6 }, preferredTypes: ['hardcore', 'ladder', 'cage'], adj: ['Bloody', 'Barbed', 'Savage', 'Feral', 'Rotten', 'Unhinged'], noun: ['Butcher', 'Maniac', 'Reaper', 'Psycho', 'Junkyard', 'Wretch'], prefix: 'The' },
};
const STYLE_LIST = Object.keys(STYLE_CONFIG).map((id) => ({ id, ...STYLE_CONFIG[id] }));

/* ---------- Premade companies ---------- */
const PRESET_COMPANIES = [
  { id: 'ironbelt', name: 'Ironbelt Wrestling', region: 'usa', style: 'sports_entertainment', blurb: 'A scrappy East Coast promotion looking to make noise.' },
  { id: 'luchamundo', name: 'Lucha Mundo', region: 'mexico', style: 'lucha', blurb: 'High-flying trios action straight out of Mexico City.' },
  { id: 'kabukikai', name: 'Kabuki-Kai Puroresu', region: 'japan', style: 'strong_style', blurb: 'Discipline and stiff strikes from the Tokyo dojo scene.' },
  { id: 'ravensworth', name: 'Ravensworth Grappling', region: 'uk', style: 'british', blurb: "Working men's clubs, technical wrestling, no frills." },
  { id: 'deadendcombat', name: 'Dead End Combat', region: 'usa', style: 'deathmatch', blurb: 'Blood, thumbtacks, and a devoted cult following.', fundsTierId: 'shoestring' },
  { id: 'outbackxtreme', name: 'Outback Xtreme', region: 'australia', style: 'sports_entertainment', blurb: 'An underserved market with room to grow fast.', fundsTierId: 'wellfunded' },
];

/* ---------- World builder ---------- */
const RIVAL_COUNT_OPTIONS = [3, 5, 8, 12];
const FUNDS_TIERS = [
  { id: 'shoestring', label: 'Shoestring', funds: 8000, blurb: 'A tight budget. Every dollar matters.' },
  { id: 'standard', label: 'Standard', funds: 15000, blurb: 'A fair starting point.' },
  { id: 'wellfunded', label: 'Well-Funded', funds: 30000, blurb: 'Room to invest early.' },
  { id: 'rich', label: 'Rich', funds: 60000, blurb: 'Deep pockets from day one.' },
];
const BOSS_BACKGROUNDS = [
  { id: 'wrestler', label: 'Former Wrestler', blurb: 'You bled for this business for years. The boys respect that — but your pockets are lighter for it.', fundsMod: -2000, repMod: 5, bossRepMod: 5 },
  { id: 'investor', label: 'Outside Investor', blurb: "You've never taken a bump in your life, but you've got the capital to make things happen.", fundsMod: 5000, repMod: -5, bossRepMod: 0 },
  { id: 'family', label: 'Family Business', blurb: 'You inherited this promotion. The roster already knows your name — for better or worse.', fundsMod: 0, repMod: 0, bossRepMod: 8 },
];
const PARTNER_ARCHETYPES = [
  { id: 'believer', label: 'The True Believer', dream: 'Wants to build something that outlasts both of you — a real territory, not a hustle.', bias: 'ambitious' },
  { id: 'operator', label: 'The Operator', dream: "Wants a tightly run business first and a wrestling promotion second. Doesn't want to see money wasted.", bias: 'frugal' },
  { id: 'promoter', label: 'The Old-School Promoter', dream: 'Wants to prove the territory system still works, the way it used to be done.', bias: 'traditional' },
];
function generatePartner(regionId) {
  const archetype = pick(PARTNER_ARCHETYPES);
  return { name: generateAdvisorName(regionId), archetypeId: archetype.id, label: archetype.label, dream: archetype.dream, bias: archetype.bias };
}
function computePartnerAlignment(archetypeId, choices) {
  const picks = PARTNER_DELEGATE_PICK[archetypeId] || {};
  let matches = 0;
  if (choices.ring === picks.ring) matches++;
  if (choices.venue === picks.venue) matches++;
  if (choices.recruiting === picks.recruiting) matches++;
  return matches;
}
function initPartnerRelationship(archetypeId, choices) {
  const alignment = computePartnerAlignment(archetypeId, choices);
  const delegateCount = [choices.ringDelegated, choices.venueDelegated, choices.recruitingDelegated].filter(Boolean).length;
  return {
    trust: clamp(50 + delegateCount * 8, 20, 90),
    respect: clamp(50 + alignment * 5, 20, 90),
    affection: clamp(55 + delegateCount * 3, 20, 90),
    compatibility: clamp(45 + alignment * 12, 20, 95),
    sharedVision: clamp(45 + alignment * 10, 20, 90),
    history: [],
  };
}
function nudgePartnerRelationship(relationship, deltas, reasonText, week, year) {
  const next = {
    trust: clamp(relationship.trust + (deltas.trust || 0), 0, 100),
    respect: clamp(relationship.respect + (deltas.respect || 0), 0, 100),
    affection: clamp(relationship.affection + (deltas.affection || 0), 0, 100),
    compatibility: relationship.compatibility,
    sharedVision: clamp(relationship.sharedVision + (deltas.sharedVision || 0), 0, 100),
    history: relationship.history,
  };
  if (reasonText) next.history = [...relationship.history, { week, year, text: reasonText }].slice(-20);
  return next;
}
function partnerShowDeltas(archetypeId, avgStars, netProfit) {
  const deltas = {};
  if (archetypeId === 'believer') {
    if (avgStars >= 3.5) { deltas.sharedVision = 2; deltas.respect = 1; }
    else if (avgStars < 2) { deltas.sharedVision = -2; }
  } else if (archetypeId === 'operator') {
    if (netProfit > 0) { deltas.trust = 1; deltas.respect = 1; }
    else if (netProfit < -1000) { deltas.trust = -2; deltas.respect = -1; }
  } else if (archetypeId === 'promoter') {
    if (avgStars >= 3.25) { deltas.respect = 1; deltas.affection = 1; }
    else if (avgStars < 2) { deltas.respect = -1; }
  }
  return deltas;
}
function partnerRelationshipReadout(relationship) {
  if (!relationship) return '';
  const { trust, respect, affection, sharedVision } = relationship;
  const notes = [];
  if (trust >= 70) notes.push('trusts your judgment');
  else if (trust <= 35) notes.push("doesn't fully trust the direction things are going");
  if (respect >= 70) notes.push('genuinely respects how you run this business');
  else if (respect <= 35) notes.push('has real doubts about your decisions');
  if (affection >= 70) notes.push('cares about you beyond just the business');
  else if (affection <= 35) notes.push('the warmth between you has cooled');
  if (sharedVision >= 70) notes.push("is fully bought in on where this is headed");
  else if (sharedVision <= 35) notes.push("is starting to wonder if you both still want the same thing");
  if (!notes.length) return 'Feels steady about where things stand between you two.';
  const chosen = notes.slice(0, 2);
  const capped = chosen[0].charAt(0).toUpperCase() + chosen[0].slice(1);
  return chosen.length > 1 ? `${capped}, but ${chosen[1]}.` : `${capped}.`;
}
function partnerReaction(archetypeId, category, choiceId, delegated) {
  const lines = {
    believer: {
      venue: { backyard: "This is beneath us, but I get it — everyone starts somewhere.", gym_rental: "A real room. Good. People need to see we're serious.", warehouse_lease: "Now we're talking. This is the kind of move that builds something real." },
      ring: { found: "It's ugly, but it'll do for now. We won't be here long.", used: "Solid. Not flashy, but it holds up.", new: "This is an investment in the future, not just tonight." },
      recruiting: { magazine_ad: "Old-fashioned, but it works — people still read those.", social_media: "Smart. Meet people where they already are.", in_person: "I like that you went and looked yourself. Shows commitment.", delegate: "I won't let you down. I know exactly who we need." },
    },
    operator: {
      venue: { backyard: "Free is free. We'll upgrade when the books say we can.", gym_rental: "Reasonable. Doesn't blow the budget.", warehouse_lease: "That's a lot of overhead for week one. I hope you know what you're doing." },
      ring: { found: "Zero cost. That's the right call before we've made a dime.", used: "Good value. No reason to overspend this early.", new: "That's real money for something we haven't even used yet." },
      recruiting: { magazine_ad: "Costs money for a maybe. I'd have gone cheaper.", social_media: "Cheap and it reaches people. Efficient.", in_person: "Costs nothing but your time. Can't argue with that.", delegate: "I'll find someone within budget. You have my word." },
    },
    promoter: {
      venue: { backyard: "This is how it used to be done. Nothing wrong with paying your dues.", gym_rental: "The gym circuit built half the legends in this business.", warehouse_lease: "A permanent building, huh. Big step. Territories were built on less." },
      ring: { found: "A found ring has more stories in it than a new one ever will.", used: "Somebody else's sweat is already in those ropes. That's tradition.", new: "Brand new. Never held. We'll break it in right." },
      recruiting: { magazine_ad: "Classic. That's how we all got found, back in the day.", social_media: "Not how I'd have done it, but the business changes.", in_person: "Word of mouth and a firm handshake. That's how you find real ones.", delegate: "Trust goes both ways in this business. I'll take care of it." },
    },
  };
  const set = lines[archetypeId] && lines[archetypeId][category];
  if (!set) return '';
  const base = set[choiceId] || '';
  return delegated ? `${base} (I made the call on this one, like you asked.)` : base;
}
const DIFFICULTY_CONFIG = {
  easy: { id: 'easy', label: 'Easy', expenseMult: 0.85, revenueMult: 1.1, blurb: 'Lower costs, friendlier crowds.' },
  normal: { id: 'normal', label: 'Normal', expenseMult: 1, revenueMult: 1, blurb: 'The standard experience.' },
  hard: { id: 'hard', label: 'Hard', expenseMult: 1.15, revenueMult: 0.9, blurb: 'Tighter margins, tougher crowds.' },
};

/* ---------- Titles ---------- */
const TITLE_CREATION_COST = 1000;
const TITLE_DIVISIONS = ['Heavyweight', 'Cruiserweight', "Women's", 'Tag Team', 'Trios', 'Hardcore'];

/* ---------- Business upgrades ---------- */
const UPGRADES = {
  ring: { label: 'Ring Quality', icon: Shield, desc: 'A safer, sharper ring means better matches and fewer injuries.',
    levels: [
      { name: 'Worn Ring', cost: 0, injuryMult: 1.15, qualityBonus: 0 },
      { name: 'Standard Ring', cost: 3000, injuryMult: 1.0, qualityBonus: 0.08 },
      { name: 'Pro Ring', cost: 8000, injuryMult: 0.85, qualityBonus: 0.16 },
      { name: 'Championship Ring', cost: 18000, injuryMult: 0.7, qualityBonus: 0.26 },
      { name: 'State-of-the-Art Ring', cost: 40000, injuryMult: 0.55, qualityBonus: 0.38 },
    ] },
  production: { label: 'Production Rig', icon: Zap, desc: 'Lighting, sound, and video that make shows feel bigger than they are.',
    levels: [
      { name: 'Bare Bones', cost: 0, fillBonus: 0 },
      { name: 'Basic Rig', cost: 4000, fillBonus: 0.03 },
      { name: 'Touring Rig', cost: 10000, fillBonus: 0.07 },
      { name: 'Arena Package', cost: 22000, fillBonus: 0.12 },
      { name: 'World-Class Production', cost: 50000, fillBonus: 0.18 },
    ] },
  medical: { label: 'Medical & Training', icon: Heart, desc: 'Trainers and medical staff who get your talent back faster.',
    levels: [
      { name: 'First Aid Kit', cost: 0, healMult: 1.0 },
      { name: 'Athletic Trainer', cost: 3500, healMult: 0.85 },
      { name: 'Sports Medicine Clinic', cost: 9000, healMult: 0.7 },
      { name: 'Full Medical Staff', cost: 20000, healMult: 0.55 },
      { name: 'Elite Recovery Center', cost: 45000, healMult: 0.4 },
    ] },
  transport: { label: 'Touring Logistics', icon: Truck, desc: 'Trucks and crew that cut down overhead on the road.',
    levels: [
      { name: 'Rental Van', cost: 0, rentDiscount: 0 },
      { name: 'Box Truck', cost: 3000, rentDiscount: 0.05 },
      { name: 'Tour Bus & Crew', cost: 8000, rentDiscount: 0.1 },
      { name: 'Full Fleet', cost: 18000, rentDiscount: 0.16 },
      { name: 'Private Logistics Co.', cost: 40000, rentDiscount: 0.24 },
    ] },
};
const DEFAULT_UPGRADES = { ring: 1, production: 1, medical: 1, transport: 1 };
const upgradeLevel = (company, key) => (company.upgrades && company.upgrades[key]) || 1;
const currentTier = (company, key) => UPGRADES[key].levels[upgradeLevel(company, key) - 1];

/* ---------- Ring shapes (cosmetic + style synergy) ---------- */
const RING_SHAPES = [
  { id: 'foursided', name: 'Four-Sided Ring', cost: 0, matchesStyles: ['sports_entertainment', 'british', 'strong_style'], desc: 'The classic squared circle. Familiar to every fan, everywhere.' },
  { id: 'sixsided', name: 'Six-Sided Ring', cost: 6000, matchesStyles: ['lucha'], desc: 'Extra angles for high-flying trios chaos and dive spots.' },
  { id: 'octagon', name: 'Octagon', cost: 9000, matchesStyles: ['deathmatch', 'strong_style'], desc: 'A combat-sports look built for stiff, chaotic fights.' },
];
const DEFAULT_RING_SHAPE = 'foursided';
const RING_ORIGINS = [
  { id: 'found', label: 'Found One', blurb: 'Scavenged from a closed-down bingo hall. It creaks, but it stands.', cost: 0, ringLevel: 1 },
  { id: 'used', label: 'Bought Used', blurb: 'A retired indie promotion sold you their old ring for cheap.', cost: 1200, ringLevel: 2 },
  { id: 'new', label: 'Bought New', blurb: 'Brand new, built to spec. Costs real money, but it shows.', cost: 3500, ringLevel: 3 },
];
const STARTUP_VENUE_PATHS = [
  { id: 'backyard', label: 'Backyard Shows', cost: 0, repBonus: 0, blurb: "Free, and nobody's watching yet. You build an audience one lawn chair at a time." },
  { id: 'gym_rental', label: 'Rent the School Gym', cost: 400, repBonus: 2, blurb: 'A real room with real folding chairs. Costs something, but people take you a little more seriously.' },
  { id: 'warehouse_lease', label: 'Lease a Warehouse', cost: 1800, repBonus: 5, blurb: "Your own space — four walls and a roof. Real overhead, but it's yours from day one." },
];
const STARTUP_RECRUITING_METHODS = [
  { id: 'magazine_ad', label: 'Wrestling Magazine Ad', cost: 150, statBias: null },
  { id: 'social_media', label: 'Social Media Post', cost: 50, statBias: 'charisma' },
  { id: 'in_person', label: 'Went Looking In Person', cost: 0, statBias: 'strength' },
  { id: 'delegate', label: 'Delegate to Partner', cost: 0, statBias: null, isDelegate: true },
];
const PARTNER_DELEGATE_PICK = {
  believer: { venue: 'warehouse_lease', ring: 'new', recruiting: 'social_media' },
  operator: { venue: 'backyard', ring: 'found', recruiting: 'in_person' },
  promoter: { venue: 'gym_rental', ring: 'found', recruiting: 'magazine_ad' },
};
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function ringConditionMult(condition) {
  return { injuryMult: clamp(1.4 - condition / 130, 0.85, 1.4), qualityBonus: clamp((condition - 60) / 400, -0.15, 0.1) };
}
function suppliesMult(supplies) {
  return clamp(0.55 + supplies / 155, 0.55, 1.15);
}

/* ---------- Concessions & merch catalogs (build your own menu) ---------- */
const CONCESSION_ITEMS_CATALOG = [
  { id: 'hotdogs', name: 'Hot Dogs', unlockCost: 500, baseCost: 1.5, suggestedPrice: 5, appeal: 1.0 },
  { id: 'popcorn', name: 'Popcorn', unlockCost: 300, baseCost: 0.8, suggestedPrice: 4, appeal: 0.9 },
  { id: 'soda', name: 'Soft Drinks', unlockCost: 400, baseCost: 0.6, suggestedPrice: 4, appeal: 1.1 },
  { id: 'beer', name: 'Beer', unlockCost: 2000, baseCost: 2, suggestedPrice: 8, appeal: 0.7 },
  { id: 'nachos', name: 'Nachos', unlockCost: 600, baseCost: 1.8, suggestedPrice: 6, appeal: 0.8 },
  { id: 'pretzels', name: 'Pretzels', unlockCost: 350, baseCost: 1, suggestedPrice: 4.5, appeal: 0.75 },
  { id: 'pizza', name: 'Pizza Slices', unlockCost: 800, baseCost: 2.2, suggestedPrice: 6.5, appeal: 0.85 },
  { id: 'candy', name: 'Candy', unlockCost: 250, baseCost: 0.7, suggestedPrice: 3, appeal: 0.6 },
];
const MERCH_ITEMS_CATALOG = [
  { id: 'tshirt', name: 'T-Shirts', unlockCost: 800, baseCost: 5, suggestedPrice: 20, appeal: 1.0 },
  { id: 'poster', name: 'Posters', unlockCost: 300, baseCost: 1, suggestedPrice: 8, appeal: 0.6 },
  { id: 'foamfinger', name: 'Foam Fingers', unlockCost: 250, baseCost: 1.5, suggestedPrice: 6, appeal: 0.5 },
  { id: 'hat', name: 'Hats', unlockCost: 500, baseCost: 4, suggestedPrice: 18, appeal: 0.55 },
  { id: 'replicabelt', name: 'Replica Championship Belts', unlockCost: 3000, baseCost: 25, suggestedPrice: 90, appeal: 0.25 },
  { id: 'actionfigure', name: 'Action Figures', unlockCost: 2000, baseCost: 8, suggestedPrice: 22, appeal: 0.4 },
  { id: 'tapes', name: 'Show Tapes & Downloads', unlockCost: 1500, baseCost: 2, suggestedPrice: 15, appeal: 0.3, isAwareness: true },
];
const MERCH_ROYALTY_RATE = 0.15;
const MERCH_MIN_POPULARITY = 25;

/* ---------- Weapons shopping list ---------- */
const WEAPON_ITEMS_CATALOG = [
  { id: 'trashcan', name: 'Trash Cans & Lids', cost: 250, qualityBonus: 0.04, injuryMult: 1.04 },
  { id: 'thumbtacks', name: 'Thumbtacks', cost: 300, qualityBonus: 0.05, injuryMult: 1.1 },
  { id: 'kendostick', name: 'Kendo Sticks', cost: 350, qualityBonus: 0.05, injuryMult: 1.06 },
  { id: 'chairs', name: 'Steel Chairs', cost: 400, qualityBonus: 0.06, injuryMult: 1.05 },
  { id: 'tables', name: 'Tables', cost: 600, qualityBonus: 0.08, injuryMult: 1.08 },
  { id: 'ladders', name: 'Ladders', cost: 900, qualityBonus: 0.12, injuryMult: 1.15 },
  { id: 'lighttubes', name: 'Light Tubes', cost: 1200, qualityBonus: 0.15, injuryMult: 1.25 },
  { id: 'barbedwire', name: 'Barbed Wire Board', cost: 1800, qualityBonus: 0.2, injuryMult: 1.35 },
];
const WEAPONS_MATCH_TYPES = ['hardcore', 'ladder', 'cage'];

function sellRateFor(item, price) {
  const p = Number(price) || item.suggestedPrice;
  const priceRatio = p / item.suggestedPrice;
  const elasticity = clamp(1.4 - priceRatio * 0.6, 0.25, 1.5);
  return clamp(item.appeal * 0.18 * elasticity, 0.01, 0.5);
}
function computeConcessionsRevenue(company, attendance) {
  let net = 0;
  const mult = suppliesMult(company.supplies !== undefined ? company.supplies : 100);
  (company.concessionsMenu || []).forEach((entry) => {
    const item = CONCESSION_ITEMS_CATALOG.find((i) => i.id === entry.itemId);
    if (!item) return;
    const qty = Math.round(attendance * sellRateFor(item, entry.price) * mult);
    net += qty * (Number(entry.price) - item.baseCost);
  });
  return Math.max(0, Math.round(net));
}
function computeMerchResult(company, roster, attendance) {
  let net = 0;
  const royalties = {};
  let tapesActive = false;
  const mult = suppliesMult(company.supplies !== undefined ? company.supplies : 100);
  (company.merchMenu || []).forEach((entry) => {
    const item = MERCH_ITEMS_CATALOG.find((i) => i.id === entry.itemId);
    if (!item) return;
    if (item.id === 'tapes') tapesActive = true;
    const ids = entry.wrestlerIds || (entry.wrestlerId ? [entry.wrestlerId] : []);
    const assigned = ids.map((id) => roster.find((r) => r.id === id)).filter((w) => w && w.popularity >= MERCH_MIN_POPULARITY);
    const avgPop = assigned.length ? average(assigned.map((w) => w.popularity)) : 0;
    const popMult = assigned.length ? 1 + avgPop / 150 : 1;
    const qty = Math.round(attendance * sellRateFor(item, entry.price) * popMult * mult);
    const grossProfit = qty * (Number(entry.price) - item.baseCost);
    let itemNet = grossProfit;
    if (assigned.length && grossProfit > 0) {
      const totalRoyalty = Math.round(grossProfit * MERCH_ROYALTY_RATE);
      itemNet -= totalRoyalty;
      const popSum = sum(assigned.map((w) => w.popularity));
      assigned.forEach((w) => {
        const share = popSum > 0 ? w.popularity / popSum : 1 / assigned.length;
        royalties[w.id] = (royalties[w.id] || 0) + Math.round(totalRoyalty * share);
      });
    }
    net += Math.max(0, itemNet);
  });
  return { net: Math.max(0, Math.round(net)), royalties, tapesActive };
}
function weaponsEffectFor(matchTypeId, weaponsOwned, supplies) {
  if (!WEAPONS_MATCH_TYPES.includes(matchTypeId) || !weaponsOwned || !weaponsOwned.length) return { qualityBonus: 0, injuryMult: 1 };
  const items = WEAPON_ITEMS_CATALOG.filter((w) => weaponsOwned.includes(w.id));
  const mult = suppliesMult(supplies !== undefined ? supplies : 100);
  const qualityBonus = clamp(sum(items.map((i) => i.qualityBonus)) * mult, 0, 0.6);
  const injuryMult = clamp(1 + sum(items.map((i) => i.injuryMult - 1)), 1, 1.8);
  return { qualityBonus, injuryMult };
}
function ringShapeBonusFor(company) {
  const shape = RING_SHAPES.find((s) => s.id === company.ringShape) || RING_SHAPES[0];
  return shape.matchesStyles.includes(company.style) ? 0.1 : 0;
}

/* ---------- Personality traits ---------- */
const POSITIVE_TRAITS = [
  { id: 'natural', label: 'Natural', polarity: 'positive', desc: 'Gains popularity faster from strong performances.' },
  { id: 'workhorse', label: 'Workhorse', polarity: 'positive', desc: 'Recovers condition faster and fatigues less.' },
  { id: 'iron_constitution', label: 'Iron Constitution', polarity: 'positive', desc: 'Injuries heal in less time.' },
  { id: 'fan_favorite', label: 'Fan Favorite', polarity: 'positive', desc: 'Pops the crowd harder in every match.' },
  { id: 'consummate_pro', label: 'Consummate Pro', polarity: 'positive', desc: 'Rarely botches or gets hurt in the ring.' },
  { id: 'locker_leader', label: 'Locker Room Leader', polarity: 'positive', desc: "Keeps the whole roster's morale up." },
  { id: 'company_man', label: 'Company Man', polarity: 'positive', desc: 'Cheaper and easier to re-sign.' },
  { id: 'chemistry_savant', label: 'Chemistry Savant', polarity: 'positive', desc: 'Builds tag team chemistry faster.' },
];
const NEGATIVE_TRAITS = [
  { id: 'injury_prone', label: 'Injury Prone', polarity: 'negative', desc: 'Gets hurt more easily.' },
  { id: 'fragile', label: 'Fragile', polarity: 'negative', desc: 'Wears down faster in matches.' },
  { id: 'loose_cannon', label: 'Loose Cannon', polarity: 'negative', desc: 'Botches spots more often.' },
  { id: 'prima_donna', label: 'Prima Donna', polarity: 'negative', desc: 'Morale craters after a bad night.' },
  { id: 'backstage_politician', label: 'Backstage Politician', polarity: 'negative', desc: "Drags down the whole roster's morale." },
  { id: 'difficult', label: 'Difficult', polarity: 'negative', desc: 'Demands more money to stay.' },
  { id: 'ring_rust', label: 'Ring Rust', polarity: 'negative', desc: 'Slower to build momentum in the ring.' },
  { id: 'lone_wolf', label: 'Lone Wolf', polarity: 'negative', desc: 'Struggles to build tag team chemistry.' },
];
const ALL_TRAITS = [...POSITIVE_TRAITS, ...NEGATIVE_TRAITS];
const traitInfo = (id) => ALL_TRAITS.find((t) => t.id === id);
const hasTrait = (wrestler, id) => !!(wrestler && wrestler.traits && wrestler.traits.includes(id));

function assignTraits() {
  const roll = Math.random();
  const count = roll < 0.12 ? 0 : roll < 0.68 ? 1 : 2;
  const chosen = [];
  for (let i = 0; i < count; i++) {
    const available = ALL_TRAITS.filter((t) => !chosen.includes(t.id));
    if (!available.length) break;
    chosen.push(pick(available).id);
  }
  return chosen;
}

const STAFF_TRAITS = [
  { id: 'golden_voice', label: 'Golden Voice', polarity: 'positive', mod: 12, roles: ['Announcer', 'Commentator'] },
  { id: 'showstopper', label: 'Showstopper', polarity: 'positive', mod: 8, roles: ['Announcer', 'Commentator'] },
  { id: 'camera_shy', label: 'Camera Shy', polarity: 'negative', mod: -10, roles: ['Announcer', 'Commentator'] },
  { id: 'sharp_eye', label: 'Sharp Eye', polarity: 'positive', mod: 10, roles: ['Referee'] },
  { id: 'quick_count', label: 'Quick Count', polarity: 'negative', mod: -8, roles: ['Referee'] },
  { id: 'natural_storyteller', label: 'Natural Storyteller', polarity: 'positive', mod: 12, roles: ['Writer'] },
  { id: 'writers_block', label: "Writer's Block", polarity: 'negative', mod: -10, roles: ['Writer'] },
  { id: 'motivator', label: 'Motivator', polarity: 'positive', mod: 10, roles: ['Road Agent'] },
  { id: 'phoned_in', label: 'Phoning It In', polarity: 'negative', mod: -8, roles: ['Road Agent'] },
  { id: 'burnt_out', label: 'Burnt Out', polarity: 'negative', mod: -8, roles: ['Announcer', 'Commentator', 'Referee', 'Writer', 'Road Agent'] },
];
const assignStaffTrait = (role) => {
  const pool = STAFF_TRAITS.filter((t) => t.roles.includes(role));
  return Math.random() < 0.4 && pool.length ? pick(pool).id : null;
};
function staffEffectiveQuality(s) {
  const t = STAFF_TRAITS.find((x) => x.id === s.trait);
  return clamp(s.quality + (t ? t.mod : 0), 1, 100);
}
function staffRoleKey(role) {
  if (role === 'Announcer') return 'announcers';
  if (role === 'Referee') return 'referees';
  if (role === 'Writer') return 'writers';
  if (role === 'Road Agent') return 'roadAgents';
  return 'commentators';
}
const WRITER_TAG_FEUD_QUALITY = 35;
const WRITER_STORY_BEAT_QUALITY = 65;
function writerTier(writers) {
  const list = writers || [];
  const best = list.length ? Math.max(...list.map((w) => staffEffectiveQuality(w))) : 0;
  if (best >= WRITER_STORY_BEAT_QUALITY) return 2;
  if (best >= WRITER_TAG_FEUD_QUALITY) return 1;
  return 0;
}
const STORY_BEATS = [
  { id: 'post_match_beatdown', label: 'Post-Match Beatdown', heatBonus: 12, desc: 'The feud spills out after the bell.' },
  { id: 'surprise_return', label: 'Surprise Return', heatBonus: 18, desc: 'Someone from the past shows up to change everything.' },
  { id: 'contract_signing', label: 'Contract Signing Gone Wrong', heatBonus: 10, desc: 'Words turn to blows before the ink dries.' },
  { id: 'betrayal', label: 'Betrayal', heatBonus: 15, desc: 'A trusted ally turns on them.' },
];

/* ---------- Trait evolution: traits can be earned or overcome over a career ---------- */
function evolveWrestlerTraits(w, ctx) {
  let traits = [...(w.traits || [])];
  const news = [];
  const has = (id) => traits.includes(id);
  const remove = (id, msg) => { if (has(id)) { traits = traits.filter((t) => t !== id); news.push(msg); } };
  const add = (id, msg) => { if (!has(id) && traits.length < 4) { traits = [...traits, id]; news.push(msg); } };
  const holdsTitle = ctx.nextTitles.some((t) => t.holderIds.includes(w.id));
  const team = ctx.nextTagTeams.find((t) => t.memberIds.includes(w.id));
  const chemistry = team ? team.chemistry : 0;
  const unhappyStreak = w.ambition.unhappyStreak || 0;
  const contentStreak = w.ambition.contentStreak || 0;

  /* --- Losses / overcoming traits --- */
  if (w.matchesWrestled >= 12) remove('ring_rust', `${w.name} has shaken off their ring rust after ${w.matchesWrestled} matches.`);
  if (w.matchesSinceInjury >= 15) remove('loose_cannon', `${w.name} has cleaned up their in-ring work and shed their Loose Cannon reputation.`);
  if (w.matchesSinceInjury >= 25) remove('injury_prone', `${w.name} has strung together a long healthy run and shed their Injury Prone label.`);
  if (contentStreak >= 15) remove('backstage_politician', `${w.name} has turned over a new leaf and left their Backstage Politician days behind.`);
  if (unhappyStreak >= 12) remove('company_man', `${w.name} has grown disillusioned and is no longer the Company Man they once were.`);
  if (w.morale <= 25) remove('locker_leader', `${w.name}'s own morale has cratered, and they've stopped being a Locker Room Leader.`);
  if (w.popularity <= 12) remove('fan_favorite', `${w.name} has fallen out of favor with the crowd.`);
  if (w.popularity <= 20) remove('difficult', `${w.name} has been humbled and is easier to deal with these days.`);
  if (holdsTitle) remove('prima_donna', `${w.name}'s championship win has settled their ego — no longer a Prima Donna.`);
  if (chemistry >= 50) remove('lone_wolf', `${w.name} has proven they can work with a partner, shedding their Lone Wolf label.`);

  /* --- Gains --- */
  if (w.careerInjuries >= 3) add('loose_cannon', `${w.name} has developed a reputation as a Loose Cannon after a string of injuries.`);
  if (w.careerInjuries >= 5) add('injury_prone', `${w.name} has developed a chronic Injury Prone reputation.`);
  if (unhappyStreak >= 12) add('backstage_politician', `${w.name} has grown bitter and started acting as a Backstage Politician.`);
  if (contentStreak >= 20) add('company_man', `${w.name} has become a true Company Man after years of loyalty.`);
  if (w.matchesWrestled >= 40 && w.morale >= 80) {
    const inclined = w.character && (w.character.values.includes('loyalty') || w.character.values.includes('service') || (w.character.dimensions && w.character.dimensions.sociability >= 65) || (w.character.dimensions && w.character.dimensions.empathy >= 65));
    if (inclined || w.matchesWrestled >= 55) add('locker_leader', `${w.name} has become a respected Locker Room Leader.`);
  }
  if (w.popularity >= 78) add('fan_favorite', `${w.name} has become a bona fide Fan Favorite.`);
  if (w.popularity >= 78) add('difficult', `${w.name}'s rising stardom has made them more Difficult to deal with.`);
  if (w.popularity >= 65 && !holdsTitle) add('prima_donna', `${w.name} is chasing gold and picking up a Prima Donna reputation in the meantime.`);
  if (w.age >= 40) add('fragile', `${w.name}'s body isn't what it used to be — they've grown Fragile.`);
  if (w.careerInjuries >= 2) add('iron_constitution', `${w.name} has toughened up coming back from injury — an Iron Constitution.`);
  if (w.matchesWrestled >= 30) add('workhorse', `${w.name} has become a reliable Workhorse after years in the ring.`);
  if (w.matchesSinceInjury >= 25) add('consummate_pro', `${w.name} has gone a long stretch without a hitch — a true Consummate Pro.`);
  if (chemistry >= 85) add('chemistry_savant', `${w.name} has proven to be a Chemistry Savant with their tag partner.`);
  if (w.popularity >= 75) add('natural', `${w.name} is showing Natural star power.`);

  return { traits, news };
}
function evolveStaffTrait(s) {
  let trait = s.trait;
  const news = [];
  const unhappyStreak = s.ambition.unhappyStreak || 0;
  const contentStreak = s.ambition.contentStreak || 0;
  const positivesForRole = STAFF_TRAITS.filter((t) => t.polarity === 'positive' && t.roles.includes(s.role));

  if (trait === 'camera_shy' && s.weeksEmployed >= 20) {
    trait = null;
    news.push(`${s.name} has grown comfortable on camera and overcome their nerves.`);
  }
  if (trait === 'quick_count' && s.weeksEmployed >= 20) {
    trait = null;
    news.push(`${s.name} has slowed down and sharpened their count.`);
  }
  if (trait === 'writers_block' && s.weeksEmployed >= 20) {
    trait = null;
    news.push(`${s.name} has found their voice again.`);
  }
  if (trait === 'phoned_in' && s.weeksEmployed >= 20) {
    trait = null;
    news.push(`${s.name} has rediscovered their edge on the road.`);
  }
  if (trait === 'burnt_out' && contentStreak >= 15) {
    trait = null;
    news.push(`${s.name} has recovered their passion for the job.`);
  }
  if (!trait) {
    if (unhappyStreak >= 12) {
      trait = 'burnt_out';
      news.push(`${s.name} is showing signs of burnout after a long stretch of frustration.`);
    } else if (s.weeksEmployed >= 25 && s.quality >= 55 && positivesForRole.length) {
      const gained = pick(positivesForRole);
      trait = gained.id;
      news.push(`${s.name} has sharpened their craft — ${gained.label}.`);
    }
  }
  return { trait, news };
}

/* ============================================================
   UTILITIES
   ============================================================ */
let _uidCounter = 0;
const uid = () => { _uidCounter += 1; return 'id_' + Date.now().toString(36) + '_' + _uidCounter; };
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const average = (arr) => (arr.length ? sum(arr) / arr.length : 0);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const weightedPick = (list, weightFn) => {
  const weights = list.map((item) => Math.max(0.0001, weightFn(item)));
  const total = sum(weights);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
};
const statScore = (wrestler, weights) => sum(Object.keys(weights).map((k) => wrestler.stats[k] * weights[k]));
const repTierLabel = (rep) => {
  let label = REP_TIERS[0].label;
  for (const t of REP_TIERS) if (rep >= t.min) label = t.label;
  return label;
};
const nextLockedVenue = (rep) => VENUE_TIERS.find((v) => v.minRep > rep);
function bossRepLabel(rep) {
  if (rep >= 80) return 'Beloved';
  if (rep >= 60) return 'Well-Regarded';
  if (rep >= 40) return 'Businesslike';
  if (rep >= 20) return 'Hard-Nosed';
  return 'Feared';
}

/* ============================================================
   WRESTLER / STAFF GENERATION
   ============================================================ */
/* ---------- Ambitions & aspirations ---------- */
const WRESTLER_AMBITIONS = [
  { type: 'win_title', label: 'Become a Champion' },
  { type: 'main_event', label: 'Headline a Major Show' },
  { type: 'beat_rival', label: 'Prove themselves against a rival' },
  { type: 'lead_stable', label: 'Lead Their Own Stable' },
  { type: 'tag_gold', label: 'Capture Tag Team Gold' },
  { type: 'merch_star', label: "Become the Company's Top Seller" },
  { type: 'iron_man', label: 'Wrestle 50 Matches for the Promotion' },
];
const STAFF_AMBITIONS = [
  { type: 'raise', label: 'Earn a Raise' },
  { type: 'marquee', label: 'Call a Show at a Marquee Venue' },
  { type: 'longevity', label: 'Become a Company Fixture' },
];
function assignAmbition(pool, roster, selfId) {
  const choice = pick(pool);
  let targetId = null, targetName = null;
  if (choice.type === 'beat_rival') {
    const candidates = (roster || []).filter((r) => r.id !== selfId);
    if (!candidates.length) return assignAmbition(pool.filter((p) => p.type !== 'beat_rival').length ? pool.filter((p) => p.type !== 'beat_rival') : [pool[0]], roster, selfId);
    const t = pick(candidates);
    targetId = t.id; targetName = t.name;
  }
  return { type: choice.type, label: choice.label, targetId, targetName, satisfaction: 65, status: 'content', pendingRequest: null, weeksSinceAssigned: 0, unhappyStreak: 0, contentStreak: 0 };
}
const assignWrestlerAmbition = () => assignAmbition(WRESTLER_AMBITIONS.filter((a) => a.type !== 'beat_rival'), null, null);
const assignStaffAmbition = () => assignAmbition(STAFF_AMBITIONS, null, null);

/* ============================================================
   CHARACTER CORE v1 — the minimum viable human model.
   Needs/Values/Dimensions/Background are deliberately a small,
   controlled vocabulary (not a personality test) and are compact
   to generate — every wrestler gets one, not just "important"
   characters, since the exit test requires five equally skilled
   rookies to feel different from each other.

   These numbers are intentionally never shown raw in the UI —
   characterReadout() turns them into the 1-2 human sentences that
   are actually surfaced. See WrestlerModal's "About" section.
   ============================================================ */
const CORE_NEEDS = ['purpose', 'belonging', 'recognition', 'security', 'freedom', 'mastery', 'adventure', 'legacy'];
const CORE_VALUES = ['family', 'money', 'loyalty', 'honor', 'fame', 'competition', 'creativity', 'service'];
const BEHAVIORAL_DIMENSIONS = ['patience', 'sociability', 'riskTolerance', 'emotionalOpenness', 'competitiveness', 'empathy'];
const CHILDHOOD_BACKGROUNDS = [
  'grew up in a tight-knit family that showed up for everything',
  'grew up mostly looking after themselves',
  'grew up moving from town to town',
  'grew up in a house that lived and breathed wrestling',
  'grew up with a parent who wanted nothing to do with this business',
  'grew up the odd one out, wrestling was the first thing that ever fit',
];
const FINANCIAL_BACKGROUNDS = [
  'grew up with money to spare',
  'grew up scraping by',
  'grew up comfortable, never rich',
  'grew up watching their family struggle to make rent',
];
const WRESTLING_PATHS = [
  'fell in love with it watching TV as a kid',
  'was pushed into it by a family member already in the business',
  'stumbled into it after a dare',
  'trained for years in a backyard before ever stepping in a real ring',
  'came over from another sport looking for something rawer',
  'walked into a local promotion on a whim and never left',
];
const DEFINING_MEMORIES = [
  'the first time they heard a crowd pop for them',
  'watching someone they looked up to get released without warning',
  'a locker room that took them in when they had nothing',
  'an injury that nearly ended things before they\u2019d started',
  'the night they finally earned their family\u2019s respect',
  'being told by someone who mattered that they\u2019d never make it',
];
function pickN(list, n) {
  const pool = [...list];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
  return out;
}
function generateCharacterCore() {
  const needs = pickN(CORE_NEEDS, 3);
  const values = pickN(CORE_VALUES, randInt(2, 3));
  const dimensions = {};
  BEHAVIORAL_DIMENSIONS.forEach((d) => { dimensions[d] = randInt(15, 90); });
  const background = {
    childhood: pick(CHILDHOOD_BACKGROUNDS),
    financial: pick(FINANCIAL_BACKGROUNDS),
    path: pick(WRESTLING_PATHS),
    memory: pick(DEFINING_MEMORIES),
  };
  const lifetimeDream = pick(LIFETIME_DREAMS);
  return { needs, values, dimensions, background, lifetimeDream };
}
const LIFETIME_DREAMS = [
  'To main event the biggest show this business has ever put on.',
  'To be remembered as the one who changed how this business is done.',
  'To build a life secure enough that their family never has to worry again.',
  'To prove everyone who doubted them wrong, once and for all.',
  'To pass on everything they know to the next generation before it\u2019s too late.',
  'To never have to depend on anyone else again.',
  'To belong to something bigger than themselves.',
];
const NEED_LABELS = { purpose: 'a sense of purpose', belonging: 'belonging somewhere', recognition: 'being recognized', security: 'security', freedom: 'freedom', mastery: 'mastering their craft', adventure: 'chasing the next thing', legacy: 'leaving something behind' };
const VALUE_LABELS = { family: 'family', money: 'money', loyalty: 'loyalty', honor: 'honor', fame: 'fame', competition: 'competition', creativity: 'creative freedom', service: 'being useful to others' };
function characterReadout(character) {
  if (!character) return '';
  const needLabel = NEED_LABELS;
  const valueLabel = VALUE_LABELS;
  const topNeed = character.needs[0];
  const topValue = character.values[0];
  const d = character.dimensions;
  const dimNotes = [];
  if (d.riskTolerance >= 70) dimNotes.push('takes chances most people wouldn\u2019t');
  else if (d.riskTolerance <= 30) dimNotes.push('plays it careful');
  if (d.sociability >= 70) dimNotes.push('is at ease in a crowded locker room');
  else if (d.sociability <= 30) dimNotes.push('keeps mostly to themselves');
  if (d.competitiveness >= 75) dimNotes.push('hates losing more than they love winning');
  if (d.empathy >= 75) dimNotes.push('genuinely looks out for the people around them');
  if (d.patience <= 25) dimNotes.push('wants results now, not eventually');
  const dimLine = dimNotes.length ? ` They ${pick(dimNotes)}.` : '';
  return `Driven mostly by a need for ${needLabel[topNeed] || topNeed}. Values ${valueLabel[topValue] || topValue} above almost everything else.${dimLine}`;
}
function backgroundSummary(character) {
  if (!character || !character.background) return '';
  const b = character.background;
  return `They ${b.childhood}, ${b.financial}, and ${b.path}. What stays with them most: ${b.memory}.`;
}
function negotiationFit(character, termId, offerQuality, reputation, contractWeeks) {
  if (!character) return 50;
  const needs = character.needs || [];
  const values = character.values || [];
  const d = character.dimensions || {};
  let score = 45;
  if (termId === 'standard') {
    if (needs.includes('security')) score += 25;
    if (values.includes('money')) score += 15;
    if (d.riskTolerance < 40) score += 10;
    if (needs.includes('freedom') || needs.includes('recognition')) score -= 10;
  } else if (termId === 'promise_title') {
    if (needs.includes('recognition')) score += 25;
    if (needs.includes('legacy')) score += 15;
    if (needs.includes('purpose')) score += 10;
    if (values.includes('fame') || values.includes('honor') || values.includes('competition')) score += 15;
    if (d.riskTolerance >= 60) score += 10;
    if (needs.includes('security')) score -= 20;
  } else if (termId === 'creative_control') {
    if (needs.includes('freedom')) score += 25;
    if (needs.includes('mastery')) score += 15;
    if (values.includes('creativity')) score += 20;
    if (values.includes('honor')) score += 10;
    if (d.patience < 40) score += 10;
    if (needs.includes('belonging') || needs.includes('security')) score -= 10;
  }
  if (offerQuality !== undefined) score += (offerQuality - 1) * 55;
  if (reputation !== undefined) {
    if (reputation >= 60) score += 8;
    else if (reputation <= 20) score -= 10;
  }
  if (contractWeeks !== undefined) {
    if (contractWeeks >= 30) {
      if (needs.includes('security')) score += 12;
      if (needs.includes('freedom')) score -= 15;
      if (d.patience < 40) score -= 8;
    } else if (contractWeeks <= 12) {
      if (needs.includes('freedom')) score += 10;
      if (needs.includes('security')) score -= 15;
    }
  }
  return clamp(score, 0, 100);
}
function negotiationFitHint(fit) {
  if (fit >= 70) return "They'd jump at this.";
  if (fit >= 45) return "They'd probably go for this.";
  if (fit >= 25) return "They're not sure about this.";
  return "This really doesn't sit right with them.";
}
function negotiationRejectionChance(fit) {
  return fit < 40 ? clamp((40 - fit) / 80, 0, 0.5) : 0;
}
function negotiationRejectionReason(w, termId) {
  const c = w.character;
  if (!c) return `${w.name} turns down the offer.`;
  if (termId === 'standard' && (c.needs.includes('freedom') || c.needs.includes('recognition'))) {
    return `${w.name} turns it down. A flat contract doesn't speak to someone driven by ${NEED_LABELS[c.needs[0]] || c.needs[0]}.`;
  }
  if (termId === 'promise_title' && c.needs.includes('security')) {
    return `${w.name} turns it down. A promise isn't security, and that's what they actually need right now.`;
  }
  if (termId === 'creative_control' && (c.needs.includes('belonging') || c.needs.includes('security'))) {
    return `${w.name} turns it down. Creative control means nothing to someone who just wants to feel like part of something.`;
  }
  return `${w.name} turns down the offer. It just doesn't sit right with who they are — they value ${VALUE_LABELS[c.values[0]] || c.values[0]} more than what's on the table.`;
}
function poachSuccessChance(wrestler, rival, company, termId, offerQuality, contractWeeks) {
  let chance = 0.12;
  chance += clamp((10 - wrestler.contractWeeksLeft) / 10, 0, 1) * 0.22;
  chance += clamp((50 - wrestler.rivalHappiness) / 50, 0, 1) * 0.25;
  chance += (offerQuality - 1) * 0.25;
  chance += clamp((company.reputation - rival.reputation) / 250, -0.1, 0.1);
  const fit = negotiationFit(wrestler.character, termId, offerQuality, company.reputation, contractWeeks);
  chance += (fit - 50) / 250;
  return clamp(chance, 0.03, 0.85);
}

function generateWrestler(tier, regionId = 'usa', styleId = 'sports_entertainment') {
  const cfg = TIER_CONFIG[tier];
  const style = STYLE_CONFIG[styleId] || STYLE_CONFIG.sports_entertainment;
  const names = REGION_NAMES[regionId] || REGION_NAMES.usa;
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  const stats = {
    strength: randInt(cfg.statRange[0], cfg.statRange[1]),
    technical: randInt(cfg.statRange[0], cfg.statRange[1]),
    aerial: randInt(cfg.statRange[0], cfg.statRange[1]),
    charisma: randInt(cfg.statRange[0], cfg.statRange[1]),
    stamina: randInt(cfg.statRange[0], cfg.statRange[1]),
  };
  Object.keys(style.statBias || {}).forEach((k) => { stats[k] = clamp(stats[k] + style.statBias[k], 5, 99); });
  if (cfg.charismaFloor) stats.charisma = Math.max(stats.charisma, randInt(cfg.charismaFloor, 97));
  const alignRoll = Math.random();
  const alignment = alignRoll < 0.45 ? 'face' : alignRoll < 0.9 ? 'heel' : 'tweener';
  const prefix = typeof style.prefix === 'object' ? style.prefix[gender] : style.prefix;
  return {
    id: uid(),
    name: `${pick(names.first[gender])} ${pick(names.last)}`,
    gender,
    gimmick: `${prefix} ${pick(style.adj)} ${pick(style.noun)}`,
    alignment, tier, stats,
    popularity: randInt(cfg.popRange[0], cfg.popRange[1]),
    morale: randInt(55, 85),
    condition: 100,
    injury: null,
    salary: randInt(cfg.salaryRange[0], cfg.salaryRange[1]),
    contractWeeksLeft: randInt(12, 30),
    traits: assignTraits(),
    age: randInt(cfg.ageRange[0], cfg.ageRange[1]),
    ambition: assignWrestlerAmbition(),
    merchEarnings: 0,
    matchesWrestled: 0,
    careerInjuries: 0,
    matchesSinceInjury: 0,
    confidence: randInt(cfg.confRange[0], cfg.confRange[1]),
    wellness: { status: 'stable', weeksInStatus: 0 },
    storyline: [],
    hometown: pick(REGION_HOMETOWNS[regionId] || REGION_HOMETOWNS.usa),
    weight: clamp(180 + Math.round((stats.strength / 99) * 130) + randInt(-15, 15), 175, 340),
    contractPromise: null,
    character: generateCharacterCore(),
  };
}

function generateStaff(role) {
  const quality = randInt(35, 92);
  return { id: uid(), name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, role, quality, salary: Math.round(80 + quality * 4.2), trait: assignStaffTrait(role), ambition: assignStaffAmbition(), weeksEmployed: 0 };
}

function generateFreeAgentPool(regionId = 'usa', styleId = 'sports_entertainment', count = 14, rookieHeavy = false) {
  const roll = () => {
    if (rookieHeavy) { const r = Math.random(); return r < 0.25 ? 'Jobber' : r < 0.92 ? 'Rookie' : 'Mid-Card'; }
    const r = Math.random();
    return r < 0.18 ? 'Jobber' : r < 0.55 ? 'Rookie' : r < 0.82 ? 'Mid-Card' : r < 0.94 ? 'Star' : r < 0.98 ? 'Legend' : 'Celebrity';
  };
  return Array.from({ length: count }, () => generateWrestler(roll(), regionId, styleId));
}
function weightedTierPick(weights) {
  const entries = Object.entries(weights);
  const total = sum(entries.map(([, w]) => w));
  let r = Math.random() * total;
  for (const [tier, w] of entries) { r -= w; if (r <= 0) return tier; }
  return entries[0][0];
}
const TALENT_SEARCH_METHODS = [
  { id: 'ask_around', label: 'Ask Around', icon: Users, cost: 0, findChance: 0.5, count: 1, tierWeights: { Rookie: 1 }, statBias: null, signingMult: 0.75, blurb: 'Word of mouth costs nothing, but you get who you get.' },
  { id: 'gym', label: 'Local Gym', icon: Activity, cost: 150, findChance: 0.75, count: 1, tierWeights: { Rookie: 1 }, statBias: 'strength', signingMult: 0.9, blurb: 'Meatheads and grinders. Strong, rough around the edges.' },
  { id: 'bar', label: 'Bar & Club Scene', icon: Coffee, cost: 150, findChance: 0.7, count: 1, tierWeights: { Rookie: 1 }, statBias: 'charisma', signingMult: 0.9, blurb: 'Big mouths and bar fighters. Can talk, may not be trained.' },
  { id: 'wrestling_school', label: 'Wrestling School', icon: Shield, cost: 400, findChance: 0.9, count: 1, tierWeights: { Rookie: 0.75, 'Mid-Card': 0.25 }, statBias: 'technical', signingMult: 1.1, blurb: 'Trained fundamentals. Costs more, but they know what they\u2019re doing.' },
  { id: 'newspaper_ad', label: 'Newspaper Ad', icon: Newspaper, cost: 300, findChance: 0.6, count: 2, tierWeights: { Rookie: 1 }, statBias: null, signingMult: 1.0, blurb: 'Casts a wide net. You never know who answers.' },
  { id: 'radio_spot', label: 'Radio Spot', icon: Radio, cost: 600, findChance: 0.85, count: 2, tierWeights: { Rookie: 0.7, 'Mid-Card': 0.3 }, statBias: null, signingMult: 1.2, blurb: 'Real reach. More likely to turn up someone with actual potential.' },
];

/* ---------- Title helpers ---------- */
function sameIdSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort(); const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
function weeksAsChampion(reignStart, company) {
  return (company.year - reignStart.wonYear) * 52 + (company.week - reignStart.wonWeek);
}
function createTitleObject(name, division, isTag, holderIds, holderNames, week, year) {
  const reignHistory = holderIds.length
    ? [{ holderIds, holderNames, wonWeek: week, wonYear: year, lostWeek: null, lostYear: null }]
    : [];
  return { id: uid(), name, division, isTag, holderIds, prestige: 25, createdWeek: week, createdYear: year, reignHistory };
}
function resolveTitleMatch(title, winnerIds, winnerNames, finishId, week, year) {
  const transferAllowed = finishId !== 'dq' && finishId !== 'countout';
  const holdersChanged = transferAllowed && !sameIdSet(title.holderIds, winnerIds);
  let reignHistory = title.reignHistory;
  let holderIds = title.holderIds;
  let prestige = title.prestige;
  if (holdersChanged) {
    reignHistory = reignHistory.map((r, i) => (i === reignHistory.length - 1 && r.lostWeek === null ? { ...r, lostWeek: week, lostYear: year } : r));
    reignHistory = [...reignHistory, { holderIds: winnerIds, holderNames: winnerNames, wonWeek: week, wonYear: year, lostWeek: null, lostYear: null }];
    holderIds = winnerIds;
    prestige = clamp(prestige + 4, 0, 100);
  } else {
    prestige = clamp(prestige + 1, 0, 100);
  }
  return { title: { ...title, holderIds, prestige, reignHistory }, changed: holdersChanged };
}

function pickInjurySeverity() {
  const total = sum(INJURY_TABLE.map((i) => i.weight));
  let r = Math.random() * total;
  for (const entry of INJURY_TABLE) { if (r < entry.weight) return { label: entry.label, weeksLeft: entry.weeks }; r -= entry.weight; }
  return { label: 'Bumps and Bruises', weeksLeft: 1 };
}

/* ---------- Tag teams & stables ---------- */
function createTagTeamObject(name, memberIds, week, year) {
  return { id: uid(), name, memberIds, chemistry: 20, matchesTogether: 0, formedWeek: week, formedYear: year };
}
function createStableObject(name, leaderId, memberIds, week, year) {
  return { id: uid(), name, leaderId, memberIds, cohesion: 20, formedWeek: week, formedYear: year };
}

/* ---------- Feuds ---------- */
const FEUD_HEAT_DECAY = 3;
const FEUD_PROMO_HEAT = { 'Call-Out': 8, 'Confrontation': 10, 'Contract Signing': 4, 'Celebration': 2, 'Backstage Interview': 5 };
const FEUD_HOOKS = [
  'A backstage altercation that spilled into the parking lot.',
  'One accused the other of disrespecting the business.',
  'A title match gone wrong — accusations of a fast count.',
  'A broken promise between former tag partners.',
  "A jealous rival who can't stand playing second fiddle.",
  'An interview that went too far, calling out family.',
  'A costly bit of interference in a crucial match.',
  'Simple, old-fashioned professional jealousy.',
  'A mentor who feels betrayed by their protégé.',
  "Two names the fans just won't stop comparing.",
];

function createFeudObject(aId, aName, bId, bName, week, year, aPartnerId, aPartnerName, bPartnerId, bPartnerName) {
  const hook = pick(FEUD_HOOKS);
  const isTag = !!(aPartnerId && bPartnerId);
  const aFull = aPartnerName ? `${aName} & ${aPartnerName}` : aName;
  const bFull = bPartnerName ? `${bName} & ${bPartnerName}` : bName;
  return {
    id: uid(), aId, aName, bId, bName,
    aPartnerId: aPartnerId || null, aPartnerName: aPartnerName || null,
    bPartnerId: bPartnerId || null, bPartnerName: bPartnerName || null,
    isTag, heat: 15, status: 'active', matchCount: 0, hook,
    startWeek: week, startYear: year,
    log: [{ week, year, text: `${aFull} and ${bFull} start a rivalry — ${hook}` }],
  };
}
function feudDisplayNames(feud) {
  return {
    aFull: feud.aPartnerName ? `${feud.aName} & ${feud.aPartnerName}` : feud.aName,
    bFull: feud.bPartnerName ? `${feud.bName} & ${feud.bPartnerName}` : feud.bName,
  };
}
function feudPairPresent(feud, participantIds) {
  const sideAIds = [feud.aId, feud.aPartnerId].filter(Boolean);
  const sideBIds = [feud.bId, feud.bPartnerId].filter(Boolean);
  const hasA = sideAIds.some((id) => participantIds.includes(id));
  const hasB = sideBIds.some((id) => participantIds.includes(id));
  return hasA && hasB;
}
function computeFeudMatchHeatGain(finalStars, finishId, heatMult = 1) {
  let gain = 8 + finalStars * 3;
  if (finishId === 'screwjob') gain += 10;
  else if (finishId === 'dq') gain += 5;
  else if (finishId === 'countout') gain += 3;
  return Math.round(gain * heatMult);
}
function advanceFeudFromMatch(feud, finalStars, finishId, isBlowOff, week, year, heatMult = 1) {
  const gain = computeFeudMatchHeatGain(finalStars, finishId, heatMult);
  let heat = clamp(feud.heat + gain, 0, 100);
  const log = [...feud.log];
  if (isBlowOff) {
    log.push({ week, year, text: `Blow-off! ${feud.aName} vs ${feud.bName} settles the score in a ${finalStars}\u2605 battle.`, blowOff: true });
    heat = clamp(heat - 40, 10, 100);
  } else {
    log.push({ week, year, text: `${feud.aName} and ${feud.bName} clash again (${finalStars}\u2605).` });
  }
  return { ...feud, heat, matchCount: feud.matchCount + 1, log: log.slice(-14) };
}
function advanceFeudFromPromo(feud, purpose, week, year, storyBeat) {
  const gain = (FEUD_PROMO_HEAT[purpose] || 5) + (storyBeat ? storyBeat.heatBonus : 0);
  const heat = clamp(feud.heat + gain, 0, 100);
  const text = storyBeat
    ? `${feud.aName} and ${feud.bName}: ${storyBeat.label} — ${storyBeat.desc}`
    : `${feud.aName} and ${feud.bName} trade words in a ${purpose.toLowerCase()} segment.`;
  const log = [...feud.log, { week, year, text }];
  return { ...feud, heat, log: log.slice(-14) };
}

/* ---------- Personal relationships ---------- */
const RELATIONSHIP_TYPES = [
  { id: 'friends', label: 'Friends' },
  { id: 'family', label: 'Family' },
  { id: 'spouses', label: 'Spouses' },
  { id: 'rivals', label: 'Personal Rivalry' },
];
function createRelationshipObject(aId, aName, bId, bName, type, week, year) {
  return { id: uid(), aId, aName, bId, bName, type, strength: 50, formedWeek: week, formedYear: year };
}
function relationshipPairPresent(rel, participantIds) {
  return participantIds.includes(rel.aId) && participantIds.includes(rel.bId);
}
function randomPreexistingRelType() {
  const r = Math.random();
  if (r < 0.5) return 'friends';
  if (r < 0.75) return 'rivals';
  if (r < 0.9) return 'family';
  return 'spouses';
}
function seedAutoRelationships(roster, week, year) {
  const rels = [];
  const pool = [...roster];
  const pairChance = 0.5;
  for (let i = 0; i < pool.length && rels.length < 2; i++) {
    if (Math.random() > pairChance) continue;
    const others = pool.filter((w) => w.id !== pool[i].id && !rels.some((r) => (r.aId === w.id || r.bId === w.id) && (r.aId === pool[i].id || r.bId === pool[i].id)));
    if (!others.length) continue;
    const partner = pick(others);
    const already = rels.some((r) => (r.aId === pool[i].id && r.bId === partner.id) || (r.aId === partner.id && r.bId === pool[i].id));
    if (already) continue;
    rels.push(createRelationshipObject(pool[i].id, pool[i].name, partner.id, partner.name, randomPreexistingRelType(), week, year));
  }
  return rels;
}

/* ---------- Wellness (personal struggles) ---------- */
function tickWellness(w) {
  const wellness = w.wellness || { status: 'stable', weeksInStatus: 0 };
  let { status, weeksInStatus } = wellness;
  let news = null;
  let repPenalty = 0;
  const unhappyStreak = (w.ambition && w.ambition.unhappyStreak) || 0;

  if (status === 'in_program') {
    weeksInStatus += 1;
    if (weeksInStatus >= 5) {
      status = 'stable'; weeksInStatus = 0;
      news = `${w.name} has completed their time away and is ready to return to the ring.`;
    }
  } else if (status === 'struggling') {
    weeksInStatus += 1;
    if (weeksInStatus >= 10) repPenalty = 1;
    if (w.morale >= 55 && (w.ambition ? w.ambition.contentStreak >= 6 : false)) {
      status = 'stable'; weeksInStatus = 0;
      news = `${w.name} seems to have turned things around on their own — morale's back up.`;
    }
  } else {
    if (unhappyStreak >= 20 && w.morale <= 25) {
      status = 'struggling'; weeksInStatus = 0;
      news = `${w.name} appears to be struggling outside the ring. The locker room has noticed.`;
    }
  }
  return { wellness: { status, weeksInStatus }, news, repPenalty };
}
const CONTRACT_TERMS = [
  { id: 'standard', label: 'Standard Contract', bonusMult: 1, blurb: 'Pay the full signing bonus. No strings attached.' },
  { id: 'promise_title', label: 'Promise the Title', bonusMult: 0.5, blurb: "Half the signing bonus — but you're promising they'll be champion within 15 weeks. Break that promise and it costs you.", promiseType: 'title', promiseWeeks: 15 },
  { id: 'creative_control', label: 'Creative Control Clause', bonusMult: 0.75, blurb: "A smaller discount, but they can't be released for 10 weeks without a real hit to your reputation as a boss.", promiseType: 'job_security', promiseWeeks: 10 },
];
function checkContractPromise(w, ctx, week, year) {
  const promise = w.contractPromise;
  if (!promise) return { contractPromise: null, news: null, moraleDelta: 0, bossRepDelta: 0 };
  if (promise.type === 'title') {
    const holdsTitle = ctx.nextTitles.some((t) => t.holderIds.includes(w.id));
    if (holdsTitle) {
      return { contractPromise: null, news: `${w.name} became champion, just as promised when they signed. Word like that gets around.`, moraleDelta: 15, bossRepDelta: 3 };
    }
    const expired = year > promise.deadlineYear || (year === promise.deadlineYear && week > promise.deadlineWeek);
    if (expired) {
      return { contractPromise: null, news: `${w.name} never got the title shot they were promised. They haven't forgotten.`, moraleDelta: -20, bossRepDelta: -5 };
    }
  }
  if (promise.type === 'job_security') {
    const expired = year > promise.deadlineYear || (year === promise.deadlineYear && week > promise.deadlineWeek);
    if (expired) return { contractPromise: null, news: null, moraleDelta: 0, bossRepDelta: 0 };
  }
  return { contractPromise: promise, news: null, moraleDelta: 0, bossRepDelta: 0 };
}

/* ---------- Ambition fulfillment & escalation ---------- */
function checkWrestlerAmbitionFulfilled(wrestler, amb, ctx) {
  switch (amb.type) {
    case 'win_title': return ctx.nextTitles.some((t) => t.holderIds.includes(wrestler.id));
    case 'main_event': {
      const last = ctx.cardOrder[ctx.cardOrder.length - 1];
      return !!last && ctx.venue && last.kind === 'match' && last.participantIds.includes(wrestler.id) && ['midsize', 'sports', 'stadium'].includes(ctx.venue.id);
    }
    case 'beat_rival': return ctx.matchResults.some((m) => m.winnerIds.includes(wrestler.id) && m.participantIds.includes(amb.targetId) && !m.winnerIds.includes(amb.targetId) && (m.titleId || m.feudBlowOffId));
    case 'lead_stable': return ctx.nextStables.some((s) => s.leaderId === wrestler.id);
    case 'tag_gold': return ctx.nextTitles.some((t) => t.isTag && t.holderIds.includes(wrestler.id));
    case 'merch_star': return wrestler.merchEarnings >= 5000;
    case 'iron_man': return wrestler.matchesWrestled >= 50;
    default: return false;
  }
}
function checkStaffAmbitionFulfilled(staffMember, amb, ctx) {
  switch (amb.type) {
    case 'marquee': return !!ctx.venue && ['midsize', 'sports', 'stadium'].includes(ctx.venue.id);
    case 'longevity': return staffMember.weeksEmployed >= 40;
    default: return false; // 'raise' is fulfilled directly via the Give Raise action
  }
}
function tickAmbition(subject, amb, fulfilled, pool, roster) {
  if (fulfilled) {
    const nextAmb = assignAmbition(pool, roster, subject.id);
    return { ambition: { ...nextAmb, satisfaction: 80 }, news: `${subject.name} fulfilled their ambition to ${amb.label.toLowerCase()}!` };
  }
  const weeksSinceAssigned = amb.weeksSinceAssigned + 1;
  const decay = weeksSinceAssigned > 15 ? 2.5 : weeksSinceAssigned > 8 ? 1 : 0.3;
  const satisfaction = clamp(amb.satisfaction - decay, 0, 100);
  let status = amb.status;
  let pendingRequest = amb.pendingRequest;
  let news = null;
  if (satisfaction < 20 && status !== 'holdout') {
    status = 'holdout';
    news = `${subject.name} has gone on a quiet holdout, refusing to be booked until their concerns are addressed.`;
  } else if (satisfaction < 40 && status === 'content') {
    status = 'unhappy';
    pendingRequest = { text: `Wants meaningful progress toward: ${amb.label}.` };
    news = `${subject.name} wants to talk. They're unhappy about their career direction — check the Roster.`;
  } else if (satisfaction >= 40) {
    status = 'content'; pendingRequest = null;
  }
  const unhappyStreak = status === 'content' ? 0 : (amb.unhappyStreak || 0) + 1;
  const contentStreak = status === 'content' ? (amb.contentStreak || 0) + 1 : 0;
  return { ambition: { ...amb, satisfaction, status, pendingRequest, weeksSinceAssigned, unhappyStreak, contentStreak }, news };
}
/* ---------- TV deals ---------- */
const TV_NETWORKS = [
  { id: 'access', name: 'Public Access', minRep: 12, weeklyFee: 200, ratingReq: 0, weeks: 12, fillBonus: 0.01, timeSlots: [{ id: 'late', label: 'Sat 11:00 PM – 12:00 AM', hours: 1 }] },
  { id: 'regional', name: 'Regional Cable', minRep: 25, weeklyFee: 800, ratingReq: 2.0, weeks: 16, fillBonus: 0.03, timeSlots: [{ id: 'afternoon', label: 'Sat 2:00 – 3:00 PM', hours: 1 }, { id: 'late', label: 'Sat 11:00 PM – 12:00 AM', hours: 1 }] },
  { id: 'national', name: 'National Cable', minRep: 45, weeklyFee: 3000, ratingReq: 2.75, weeks: 20, fillBonus: 0.06, timeSlots: [{ id: 'earlyprime', label: 'Thu 7:00 – 8:00 PM', hours: 1 }, { id: 'prime', label: 'Thu 8:00 – 9:00 PM', hours: 1 }, { id: 'afternoon', label: 'Sat 2:00 – 3:00 PM', hours: 1 }] },
  { id: 'premium', name: 'Premium Network', minRep: 68, weeklyFee: 9000, ratingReq: 3.25, weeks: 26, fillBonus: 0.1, timeSlots: [{ id: 'prime', label: 'Wed 8:00 – 9:00 PM', hours: 1 }, { id: 'primelong', label: 'Wed 8:00 – 10:00 PM', hours: 2 }] },
  { id: 'global', name: 'Global Streaming', minRep: 88, weeklyFee: 25000, ratingReq: 3.5, weeks: 30, fillBonus: 0.15, timeSlots: [{ id: 'primelong', label: 'Mon 8:00 – 10:00 PM', hours: 2 }, { id: 'megashow', label: 'Mon 8:00 – 11:00 PM', hours: 3 }] },
];
const TV_STRIKE_LIMIT = 3;
function tvNetworkFor(company) {
  if (!company.tvDeal) return null;
  return TV_NETWORKS.find((n) => n.id === company.tvDeal.networkId) || null;
}

/* ---------- Rival promotions (living world) ---------- */
const PROMOTION_PREFIXES = ['Apex', 'Titan', 'Frontier', 'Elite', 'Vanguard', 'Iron', 'Legacy', 'Prime', 'United', 'Renegade', 'Zenith', 'Coastal', 'Empire', 'Sovereign'];
const PROMOTION_SUFFIXES = ['Wrestling', 'Pro Wrestling', 'Championship Wrestling', 'Combat League', 'Wrestling Federation', 'Grappling Alliance'];
const generatePromotionName = () => `${pick(PROMOTION_PREFIXES)} ${pick(PROMOTION_SUFFIXES)}`;

function generateRivalRoster(region, style, reputation) {
  const size = reputation >= 55 ? randInt(4, 6) : reputation >= 30 ? randInt(3, 5) : randInt(2, 4);
  const tierPool = reputation >= 55 ? ['Mid-Card', 'Mid-Card', 'Star', 'Star', 'Legend'] : reputation >= 30 ? ['Rookie', 'Mid-Card', 'Mid-Card', 'Star'] : ['Jobber', 'Rookie', 'Rookie', 'Mid-Card'];
  return Array.from({ length: size }, () => {
    const w = generateWrestler(pick(tierPool), region, style);
    return { ...w, contractWeeksLeft: randInt(4, 40), rivalHappiness: randInt(30, 90) };
  });
}
function flagshipFromRoster(roster) {
  return [...(roster || [])].sort((a, b) => b.popularity - a.popularity).slice(0, 2).map((w) => ({ name: w.name, gimmick: w.gimmick, popularity: w.popularity }));
}
function generateRivalPromotions(count = 5) {
  const usedNames = new Set();
  return Array.from({ length: count }, () => {
    let name = generatePromotionName();
    while (usedNames.has(name)) name = generatePromotionName();
    usedNames.add(name);
    const region = pick(REGION_LIST).id;
    const style = pick(STYLE_LIST).id;
    const reputation = randInt(10, 55);
    const roster = generateRivalRoster(region, style, reputation);
    return {
      id: uid(),
      name,
      region, style, reputation,
      momentum: randInt(-1, 1),
      relationship: 'neutral',
      roster,
      flagshipTalent: flagshipFromRoster(roster),
    };
  });
}
function generateFlagshipTalent(region, style, reputation) {
  const count = reputation >= 55 ? 2 : 1;
  return Array.from({ length: count }, () => {
    const tier = reputation >= 55 ? 'Star' : reputation >= 30 ? 'Mid-Card' : 'Rookie';
    const w = generateWrestler(tier, region, style);
    return { name: w.name, gimmick: w.gimmick, popularity: w.popularity };
  });
}

/* ---------- Advisors: a permanent staff of four who weigh in each week ---------- */
function generateAdvisorName(regionId) {
  const names = REGION_NAMES[regionId] || REGION_NAMES.usa;
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  return `${pick(names.first[gender])} ${pick(names.last)}`;
}
function generateAdvisors(regionId) {
  return {
    roadAgent: generateAdvisorName(regionId),
    medical: generateAdvisorName(regionId),
    writer: generateAdvisorName(regionId),
    cfo: generateAdvisorName(regionId),
  };
}
const ADVISOR_ROLES = [
  { key: 'roadAgent', title: 'Road Agent', icon: Activity },
  { key: 'medical', title: 'Medical', icon: Heart },
  { key: 'writer', title: 'Lead Writer', icon: Megaphone },
  { key: 'cfo', title: 'CFO', icon: DollarSign },
];
function roadAgentMemo(game) {
  const { roster, history, tagTeams } = game;
  const holdouts = roster.filter((w) => w.ambition && w.ambition.status === 'holdout');
  const struggling = roster.filter((w) => w.wellness && w.wellness.status === 'struggling');
  const injured = roster.filter((w) => w.injury);
  const lowConfidence = roster.filter((w) => w.confidence < 40);
  const avgCondition = roster.length ? average(roster.map((w) => w.condition)) : 100;
  const lastShow = history[0];
  const rustyTeam = (tagTeams || []).find((t) => t.chemistry < 30);
  if (holdouts.length) return pick([
    `${holdouts[0].name} is refusing to work. That's on you to sort out before we can build around them.`,
    `Nobody's touching a card with ${holdouts[0].name} on it 'til that situation gets handled.`,
  ]);
  if (struggling.length) return `${struggling[0].name} isn't right lately. I'd keep them off the road until that's dealt with.`;
  if (avgCondition < 55) return `The roster's averaging ${Math.round(avgCondition)} condition. Ease up on the schedule or we're going to see more injuries.`;
  if (injured.length >= 3) return `We've got ${injured.length} bodies out with injuries. Depth's getting thin back there.`;
  if (injured.length === 1) return `${injured[0].name}'s the only one banged up right now. Not bad.`;
  if (lowConfidence.length >= 2) return `A few of the younger guys are still finding their feet out there — ${lowConfidence.length} of them are shaky on confidence. Watch who you put in the big matches.`;
  if (rustyTeam) return `${rustyTeam.name} still don't have any chemistry together. Give 'em more reps or split 'em up.`;
  if (lastShow && lastShow.avgStars >= 4) return pick([
    `${lastShow.avgStars.toFixed(1)} stars last time out — hell of a show. Keep booking it that way.`,
    `That last card was as good as we've had. Whatever you did, do it again.`,
  ]);
  if (lastShow && lastShow.avgStars >= 3.25) return `Solid ${lastShow.avgStars.toFixed(1)}-star show last week. Nothing to complain about.`;
  if (lastShow && lastShow.avgStars < 2) return `That ${lastShow.avgStars.toFixed(1)}-star show didn't click in the ring. Might be worth freshening up the card.`;
  return pick([
    `Card's looking fine from where I sit. Nothing urgent this week.`,
    `Roster's in decent shape. No fires to put out right now.`,
  ]);
}
function medicalMemo(game) {
  const { roster, company } = game;
  const injured = roster.filter((w) => w.injury);
  const longTermInjured = injured.filter((w) => w.injury.weeksLeft >= 6);
  const medTier = upgradeLevel(game.company, 'medical');
  const avgAge = roster.length ? average(roster.map((w) => w.age)) : 28;
  const struggling = roster.filter((w) => w.wellness && w.wellness.status === 'struggling');
  const onLeave = roster.filter((w) => w.wellness && w.wellness.status === 'in_program');
  if (longTermInjured.length) return `${longTermInjured[0].name} is looking at a long recovery — ${longTermInjured[0].injury.weeksLeft} weeks. Plan around it.`;
  if (injured.length >= 4) return `Full trainer's room this week — ${injured.length} out. We need to talk about pacing the schedule.`;
  if (struggling.length) return `${struggling[0].name}'s wellbeing is more of a concern to me than anything physical right now. That's worth addressing.`;
  if (onLeave.length) return `${onLeave[0].name}'s taking the time they need. We'll have them back before long.`;
  if (injured.length >= 1 && medTier === 1) return `Our medical setup is bare-bones. An upgrade in the Shop would speed up recoveries.`;
  if (avgAge >= 34 && medTier <= 2) return `This is a veteran locker room — average age ${Math.round(avgAge)}. A better medical setup would go a long way with bodies like these.`;
  if (injured.length === 0) return pick([
    `Clean bill of health across the board, for once. Let's keep it that way.`,
    `Nobody's on the shelf right now. I'll take it.`,
  ]);
  return `A couple of bumps and bruises out there, nothing the training room can't handle.`;
}
function writerMemo(game) {
  const { feuds, titles, roster, stables, tagTeams } = game;
  const activeFeuds = feuds.filter((f) => f.status !== 'ended');
  const hotFeud = [...activeFeuds].sort((a, b) => b.heat - a.heat)[0];
  const coldFeud = activeFeuds.find((f) => f.heat < 20 && f.matchCount > 0);
  const vacantTitle = titles.find((t) => t.holderIds.length === 0);
  const unhappy = roster.filter((w) => w.ambition && (w.ambition.status === 'unhappy' || w.ambition.status === 'holdout'));
  const closeToGoal = roster.find((w) => w.ambition && w.ambition.status === 'content' && w.ambition.satisfaction >= 85 && w.ambition.type === 'beat_rival');
  const unusedStable = (stables || []).find((s) => s.cohesion < 25);
  if (hotFeud && hotFeud.heat >= 70) return pick([
    `${hotFeud.aName} vs ${hotFeud.bName} is sitting at ${hotFeud.heat} heat. That's money — pull the trigger on the blow-off soon.`,
    `Fans are hot for ${hotFeud.aName} and ${hotFeud.bName}. Don't let that program go cold before you cash it in.`,
  ]);
  if (vacantTitle) return `The ${vacantTitle.name} is just sitting there vacant. We should crown somebody.`;
  if (closeToGoal && closeToGoal.ambition.targetName) return `${closeToGoal.name} has been vocal about wanting a win over ${closeToGoal.ambition.targetName}. Feels like the time is right.`;
  if (activeFeuds.length === 0) return pick([
    `We've got no heat going into next month. We need some fresh stories on the board.`,
    `Creative's dry right now — not a single feud running. Let's fix that.`,
  ]);
  if (unhappy.length >= 3) return `Locker room's grumbling — ${unhappy.length} guys need something to care about right now.`;
  if (coldFeud) return `${coldFeud.aName} and ${coldFeud.bName} have gone cold — heat's down to ${coldFeud.heat}. Either reheat it or wrap it up.`;
  if (unusedStable) return `${unusedStable.name} hasn't been on the same card together in a while. A faction only means something if we use it.`;
  return pick([
    `Nothing screaming at me this week. Business as usual on the creative side.`,
    `The board's steady. No urgent moves needed from my side.`,
  ]);
}
function cfoMemo(game) {
  const { company, history, draftShow } = game;
  const lastShow = history[0];
  const avgLast4 = history.length ? average(history.slice(0, 4).map((h) => h.netProfit)) : 0;
  if (company.funds < 1500) return `We're nearly out of cash. One bad show from here and we can't make payroll.`;
  if (company.funds < 3000) return `Cash is tight. I'd ease off marketing spend or bump ticket prices before we book again.`;
  if (lastShow && lastShow.netProfit < 0 && history.length >= 3 && avgLast4 < 0) return `We've lost money on multiple shows running now. This isn't a one-off — something in the model needs to change.`;
  if (lastShow && lastShow.netProfit < 0) return `We lost ${money(Math.abs(lastShow.netProfit))} last show. Worth a look at the venue and ticket price before the next one.`;
  if (company.tvDeal === null && company.reputation >= 25) return `We've got the reputation for a TV deal and we're leaving that revenue on the table. Worth a look in the Shop.`;
  if (lastShow && lastShow.netProfit > 15000) return pick([
    `Strong numbers on the books after that last show. We can afford to reinvest.`,
    `${money(lastShow.netProfit)} net on the last show. That's the kind of number I like to see.`,
  ]);
  if (company.funds > 150000) return `We're sitting on a healthy reserve — over ${money(company.funds)}. Might be time to spend it on the roster or the building.`;
  if (draftShow && draftShow.marketingBudget > 5000 && company.reputation < 30) return `That's a big marketing spend for a promotion our size. Make sure it's actually moving the needle before we do it again.`;
  return pick([
    `Books are balanced. Nothing alarming on my end.`,
    `Financially, we're steady. No complaints from accounting this week.`,
  ]);
}
function advisorMemo(role, game) {
  switch (role) {
    case 'roadAgent': return roadAgentMemo(game);
    case 'medical': return medicalMemo(game);
    case 'writer': return writerMemo(game);
    case 'cfo': return cfoMemo(game);
    default: return '';
  }
}

function tickRivalPromotion(rival) {
  const drift = randInt(-3, 4) + rival.momentum;
  const reputation = clamp(rival.reputation + drift, 2, 98);
  const momentum = clamp(rival.momentum + randInt(-1, 1), -2, 2);
  return { ...rival, reputation, momentum };
}
function processRivalConsolidation(rivals) {
  let list = [...rivals];
  const news = [];
  const strong = list.filter((r) => r.reputation >= 55 && r.relationship !== 'pact');
  strong.forEach((acquirer) => {
    if (!list.find((r) => r.id === acquirer.id)) return;
    if (Math.random() < 0.04) {
      const targets = list.filter((r) => r.id !== acquirer.id && r.reputation <= 22 && r.relationship !== 'pact');
      if (targets.length) {
        const target = [...targets].sort((a, b) => a.reputation - b.reputation)[0];
        news.push(`${acquirer.name} has acquired ${target.name}, absorbing their operation.`);
        list = list.filter((r) => r.id !== target.id).map((r) => {
          if (r.id !== acquirer.id) return r;
          const mergedRoster = [...(r.roster || []), ...(target.roster || [])].slice(0, 8);
          return { ...r, reputation: clamp(r.reputation + Math.round(target.reputation / 3), 0, 98), roster: mergedRoster, flagshipTalent: flagshipFromRoster(mergedRoster) };
        });
      }
    }
  });
  if (list.length < 3 && Math.random() < 0.3) {
    let name = generatePromotionName();
    while (list.some((r) => r.name === name)) name = generatePromotionName();
    const region = pick(REGION_LIST).id; const style = pick(STYLE_LIST).id; const reputation = randInt(8, 20);
    const roster = generateRivalRoster(region, style, reputation);
    list = [...list, { id: uid(), name, region, style, reputation, momentum: randInt(-1, 1), relationship: 'neutral', roster, flagshipTalent: flagshipFromRoster(roster) }];
    news.push(`A new promotion, ${name}, has launched.`);
  }
  return { rivals: list, news };
}
function maybeGenerateRivalOffer(company, roster, rivals, existingInbox) {
  if (existingInbox.length >= 3) return null;
  if (!rivals.length) return null;
  if (Math.random() > 0.12) return null;
  const rival = pick(rivals);
  let expiresWeek = company.week + 3; let expiresYear = company.year;
  while (expiresWeek > 52) { expiresWeek -= 52; expiresYear += 1; }
  const kind = Math.random() < 0.5 ? 'buy_offer' : 'alliance_proposal';
  if (kind === 'alliance_proposal') {
    if (rival.relationship === 'pact') return null;
    return { id: uid(), type: 'alliance_proposal', rivalId: rival.id, rivalName: rival.name, text: `${rival.name} is proposing a territory pact — mutual respect, no poaching, free of charge.`, createdWeek: company.week, createdYear: company.year, expiresWeek, expiresYear };
  }
  if (!roster.length) return null;
  const target = pick(roster);
  const offerAmount = Math.round(target.salary * randInt(8, 20));
  return { id: uid(), type: 'buy_offer', rivalId: rival.id, rivalName: rival.name, wrestlerId: target.id, wrestlerName: target.name, offerAmount, text: `${rival.name} wants to buy ${target.name} off your roster for ${money(offerAmount)}.`, createdWeek: company.week, createdYear: company.year, expiresWeek, expiresYear };
}
function rivalPoachChance(rival) {
  if (rival.relationship === 'pact') return 0;
  return clamp(0.1 + rival.reputation / 500 + (rival.relationship === 'rival' ? 0.08 : rival.relationship === 'ally' ? -0.05 : 0), 0.02, 0.35);
}
function canActToday(company) {
  return (company.weekDay || 1) <= WEEK_DAYS.length;
}
function tickOneDay(g) {
  const company = { ...g.company, weekDay: Math.min(WEEK_DAYS.length + 1, (g.company.weekDay || 1) + 1) };
  let freeAgents = g.freeAgents;
  const news = [];

  const unavailable = new Set(company.unavailableVenueIds || []);
  const lockedVenueId = g.draftShow.venueId;
  const availableNow = unlockedVenuesFor(company, g.rivals).filter((v) => v.id !== lockedVenueId && !unavailable.has(v.id));
  if (availableNow.length > 1 && Math.random() < 0.14) {
    const taken = pick(availableNow);
    unavailable.add(taken.id);
    news.push(`${taken.name} just got booked by another promotion this week.`);
  }
  company.unavailableVenueIds = Array.from(unavailable);

  if (freeAgents.length && g.rivals.length) {
    const rival = pick(g.rivals);
    if (Math.random() < rivalPoachChance(rival) * 0.3) {
      const target = pick(freeAgents);
      freeAgents = freeAgents.filter((w) => w.id !== target.id);
      news.push(`${rival.name} scooped up free agent ${target.name} while you weren't looking.`);
    }
  }

  return { ...g, company, freeAgents, news: [...news.reverse(), ...g.news].slice(0, 30) };
}

const TERRITORY_PACT_COST = 2000;
function acquisitionCostFor(rival) {
  let cost = 5000 + rival.reputation * 400;
  if (rival.relationship === 'ally') cost = Math.round(cost * 0.75);
  else if (rival.relationship === 'rival') cost = Math.round(cost * 1.4);
  return cost;
}
const RIVAL_FLAVOR_UP = ['drew a strong crowd this week', 'is building buzz with a new storyline', 'signed a promising rookie'];
const RIVAL_FLAVOR_DOWN = ['is struggling to fill seats', 'lost a top star to injury', 'is facing backstage turmoil'];

/* ---------- Retirement ---------- */
function retirementChance(age) {
  if (age < 38) return 0;
  return clamp((age - 37) * 0.05, 0, 0.65);
}

/* ---------- Wrestling media / monthly recaps ---------- */
const JOURNALIST_LEANS = [
  { id: 'technical', title: 'Technical Wrestling Analyst' },
  { id: 'hardcore', title: 'Hardcore Beat Writer' },
  { id: 'rumors', title: 'Backstage Insider' },
];
function generateJournalists(regionId) {
  return JOURNALIST_LEANS.map((lean) => ({ name: generateAdvisorName(regionId), leanId: lean.id, title: lean.title }));
}
function journalistTake(leanId, recap, rivals, worldEvents) {
  const sortedRivals = (rivals || []).slice().sort((a, b) => b.reputation - a.reputation);
  const topRival = sortedRivals[0] || null;
  const hotRival = (rivals || []).find((r) => r.momentum >= 2);
  const decliningRival = (rivals || []).find((r) => r.momentum <= -2);
  const events = worldEvents || [];
  const poaches = events.filter((e) => e.type === 'poach');
  const consolidations = events.filter((e) => e.type === 'consolidation');
  const launches = events.filter((e) => e.type === 'launch');
  const ups = events.filter((e) => e.type === 'flavor_up');
  const downs = events.filter((e) => e.type === 'flavor_down');
  const candidates = [];

  if (leanId === 'technical') {
    if (recap.shows === 0) return `Nothing to review this month. Can't grade a show that never happened.`;
    if (recap.topMatch && recap.topMatch.stars >= 4) candidates.push(`${recap.topMatch.label} was a clinic — ${recap.topMatch.stars}★ of exactly what this business should look like.`);
    if (recap.avgStars >= 3.5) candidates.push(`Solid fundamentals across the board this month. A ${recap.avgStars.toFixed(1)}★ average speaks for itself.`);
    if (recap.avgStars < 2.5) candidates.push(`The in-ring product needs work. A ${recap.avgStars.toFixed(1)}★ average won't win over the hardcore fans who actually watch the wrestling.`);
    if (topRival) candidates.push(`For my money, ${topRival.name} is putting on the more consistent product across the industry right now.`);
    if (ups.length) candidates.push(`${pick(ups).text} That's the kind of buzz that builds a reputation the right way.`);
    if (launches.length) candidates.push(`A new name entered the business this month — ${pick(launches).text} Time will tell if they last.`);
    if (!candidates.length) candidates.push(`A quiet month for the purists. Nothing that'll make a highlight reel, nothing that hurt either.`);
  } else if (leanId === 'hardcore') {
    if (recap.shows === 0) return `A whole month with no shows? Fans forget you exist if you don't give them something.`;
    if (recap.topMatch && recap.topMatch.stars >= 4.5) candidates.push(`${recap.topMatch.label} was the kind of chaos I live for. ${recap.topMatch.stars}★, no notes.`);
    if (recap.titleChanges.length) candidates.push(`Gold changed hands this month and the crowd ate it up. More of this, less standing around.`);
    if (hotRival) candidates.push(`${hotRival.name} is on an absolute tear lately. Somebody in this business better answer that.`);
    if (consolidations.length) candidates.push(`${pick(consolidations).text} That's the business getting real. Not everybody survives out there.`);
    if (recap.shows <= 1) candidates.push(`One show all month? Fans need chaos more often than that.`);
    if (!candidates.length) candidates.push(`Nothing broke, nothing bled. Forgettable month if you ask me.`);
  } else if (leanId === 'rumors') {
    if (recap.titleChanges.length) candidates.push(`Word is ${recap.titleChanges[0].winner} winning the ${recap.titleChanges[0].titleName} wasn't universally popular backstage. Keep an eye on that locker room.`);
    if (poaches.length) candidates.push(`${pick(poaches).text} Wonder what that signing bonus looked like.`);
    if (consolidations.length) candidates.push(`Big news out of the business this month: ${pick(consolidations).text}`);
    if (launches.length) candidates.push(`${pick(launches).text} Every promotion starts somewhere — worth keeping an eye on.`);
    if (decliningRival) candidates.push(`Hearing things are getting shaky over at ${decliningRival.name}. Wouldn't be shocked if some of their talent starts making calls.`);
    if (downs.length) candidates.push(`${pick(downs).text} Backstage sources say it's worse than they're letting on.`);
    if (topRival && topRival.reputation >= 60) candidates.push(`${topRival.name} is the promotion everybody in this business is talking about right now. Reputation like that doesn't happen by accident.`);
    if (recap.powerRankings.length) {
      const top = recap.powerRankings[0];
      candidates.push(top.promotion ? `${top.name} over at ${top.promotion} is the hottest name in the business right now.` : `${top.name} is the hottest name in the building right now. Don't be shocked if a rival comes calling.`);
    }
    if (recap.totalProfit < 0) candidates.push(`Hearing the books were red this month. How long can that go on before something gives?`);
    if (!candidates.length) candidates.push(`Quiet on the rumor mill this month — which almost never means nothing's happening.`);
  }
  return pick(candidates);
}
const MEDIA_INTERVIEW_MILESTONES = [25, 50, 75, 90];
function mediaInterviewQuote(company, journalist, milestone) {
  const repLabel = bossRepLabel(company.bossReputation !== undefined ? company.bossReputation : 50);
  return `MEDIA SPOTLIGHT: ${journalist.name} of the press corps sat down with ${company.name} this week — reputation just crossed ${milestone}. "People are starting to take notice," ${journalist.name.split(' ')[0]} writes. Around the business, the boss is known as ${repLabel.toLowerCase()}.`;
}
function showLetterGrade(h) {
  const fillRatio = h.capacity ? clamp(h.attendance / h.capacity, 0, 1) : 0.5;
  const starScore = clamp((h.avgStars || 0) / 5, 0, 1);
  const profitScore = clamp(0.5 + (h.netProfit || 0) / 10000, 0, 1);
  const composite = fillRatio * 0.35 + starScore * 0.4 + profitScore * 0.25;
  if (composite >= 0.85) return 'A+';
  if (composite >= 0.75) return 'A';
  if (composite >= 0.65) return 'B+';
  if (composite >= 0.55) return 'B';
  if (composite >= 0.45) return 'C+';
  if (composite >= 0.35) return 'C';
  if (composite >= 0.25) return 'D';
  return 'F';
}
function letterGradeColor(grade) {
  if (grade.startsWith('A')) return C.good;
  if (grade.startsWith('B')) return C.gold;
  if (grade.startsWith('C')) return C.goldSoft;
  return C.rope;
}
function generateMonthlyRecap(slice, roster, monthNum, year, journalists, rivals, worldEvents) {
  const shows = slice.length;
  const avgStars = shows ? average(slice.map((h) => h.avgStars)) : 0;
  const totalAttendance = sum(slice.map((h) => h.attendance));
  const totalRevenue = sum(slice.map((h) => h.revenue));
  const totalProfit = sum(slice.map((h) => h.netProfit));
  const allMatches = slice.flatMap((h) => h.matches.map((m) => ({ ...m, week: h.week })));
  const topMatch = allMatches.length ? allMatches.reduce((best, m) => (m.stars > best.stars ? m : best), allMatches[0]) : null;
  const titleChanges = allMatches.filter((m) => m.titleChanged).map((m) => ({ label: m.label, titleName: m.titleName, winner: m.winner, week: m.week }));
  const ownEntries = roster.map((w) => ({ id: w.id, name: w.name, popularity: w.popularity, gimmick: w.gimmick, promotion: null }));
  const rivalEntries = (rivals || []).flatMap((r) => (r.flagshipTalent || []).map((t) => ({ id: null, name: t.name, popularity: t.popularity, gimmick: t.gimmick, promotion: r.name })));
  const powerRankings = [...ownEntries, ...rivalEntries].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
  const recap = {
    id: uid(), month: monthNum, year, shows,
    avgStars: Number(avgStars.toFixed(2)), totalAttendance, totalRevenue, totalProfit,
    topMatch: topMatch ? { label: topMatch.label, stars: topMatch.stars, week: topMatch.week } : null,
    titleChanges, powerRankings,
  };
  recap.grade = shows ? showLetterGrade({ attendance: totalAttendance, capacity: sum(slice.map((h) => h.capacity)), avgStars, netProfit: totalProfit }) : null;
  const windowStart = monthNum * 4 - 3;
  const worldEventsSlice = (worldEvents || []).filter((e) => e.year === year && e.week >= windowStart && e.week <= monthNum * 4);
  recap.press = (journalists || []).map((j) => ({ name: j.name, title: j.title, take: journalistTake(j.leanId, recap, rivals, worldEventsSlice) }));
  return recap;
}

/* ============================================================
   MATCH ENGINE
   ============================================================ */
function simulateMatch(match, wrestlerLookup, tagTeams = [], upgrades = {}, feuds = []) {
  const participants = match.participantIds.map((id) => wrestlerLookup[id]).filter(Boolean);
  const matchType = ALL_MATCH_TYPES.find((m) => m.id === match.typeId) || MATCH_TYPES[0];
  const ringTier = UPGRADES.ring.levels[(upgrades.ring || 1) - 1];
  const ringShapeBonus = upgrades.ringShapeBonus || 0;
  const weaponsFx = weaponsEffectFor(matchType.id, upgrades.weaponsOwned, upgrades.supplies);
  const weaponsMatch = weaponsFx.qualityBonus > 0;
  const refQuality = upgrades.refereeQuality !== undefined ? upgrades.refereeQuality : 50;
  const refInjuryMult = clamp(1.25 - refQuality / 200, 0.75, 1.25);
  const refQualityBonus = clamp((refQuality - 50) / 250, -0.2, 0.2);
  const roadAgentQuality = upgrades.roadAgentQuality !== undefined ? upgrades.roadAgentQuality : 50;
  const roadAgentQualityBonus = clamp((roadAgentQuality - 50) / 200, -0.25, 0.25);
  const ringCondFx = ringConditionMult(upgrades.ringCondition !== undefined ? upgrades.ringCondition : 100);
  const beatsCount = randInt(matchType.beatsRange[0], matchType.beatsRange[1]);
  let momentum = 0;
  let qualityPoints = 0;
  let crowdPoints = 0;
  const beatLog = [];
  const injuries = [];
  const perfTracker = {};
  participants.forEach((p) => { perfTracker[p.id] = { points: 0, spotsHit: 0, botches: 0 }; });

  for (let i = 0; i < beatsCount; i++) {
    if (participants.length < 2) break;
    const performer = weightedPick(participants, (p) => Math.max(5, p.stats.charisma * 0.5 + p.condition * 0.5));
    const performerSide = match.sides ? match.sides.find((side) => side.includes(performer.id)) : null;
    const opponents = performerSide
      ? participants.filter((p) => !performerSide.includes(p.id))
      : participants.filter((p) => p.id !== performer.id);
    const opponent = weightedPick(opponents, (o) => Math.max(5, o.stats.technical));
    const spot = weightedPick(SPOT_TYPES, (s) => (matchType.weight[s.id] || 0.5) * statScore(performer, s.statWeight));
    const nervesFactor = (match.titleId && performer.confidence < 50) ? 0.82 : 1;
    const performerScore = statScore(performer, spot.statWeight) * (performer.condition / 100) * (1 + momentum * 0.15) * nervesFactor;
    const opponentScore = (opponent.stats.technical * 0.5 + opponent.stats.strength * 0.3 + opponent.stats.stamina * 0.2) * (opponent.condition / 100);
    let successChance = clamp(0.5 + (performerScore - opponentScore) / 140, 0.25, 0.92);
    if (hasTrait(performer, 'loose_cannon')) successChance = clamp(successChance - 0.06, 0.15, 0.92);
    const hit = Math.random() < successChance;

    if (hit) {
      const momentumGain = hasTrait(performer, 'ring_rust') ? 0.08 : 0.12;
      momentum = clamp(momentum + momentumGain, -1, 1);
      let gain = (performerScore / 100) * (0.6 + performer.stats.charisma / 150);
      if (hasTrait(performer, 'fan_favorite')) gain *= 1.15;
      qualityPoints += gain;
      let crowdGain = gain * (1 + performer.popularity / 200);
      if (hasTrait(performer, 'fan_favorite')) crowdGain *= 1.25;
      crowdPoints += crowdGain;
      perfTracker[performer.id].points += gain;
      perfTracker[performer.id].spotsHit += 1;
      beatLog.push(`${performer.name} connects with a ${spot.label} on ${opponent.name}.`);
    } else {
      momentum = clamp(momentum - 0.08, -1, 1);
      qualityPoints -= 0.15;
      perfTracker[performer.id].botches += 1;
      let text = `${performer.name}'s ${spot.label} is countered by ${opponent.name}.`;
      let injuryMult = 1;
      if (hasTrait(performer, 'injury_prone')) injuryMult *= 1.5;
      if (hasTrait(performer, 'consummate_pro')) injuryMult *= 0.6;
      injuryMult *= ringTier.injuryMult;
      injuryMult *= weaponsFx.injuryMult;
      injuryMult *= refInjuryMult;
      injuryMult *= ringCondFx.injuryMult;
      const injuryChance = spot.riskBase * matchType.riskMult * (1 - performer.condition / 150) * injuryMult;
      if (Math.random() < injuryChance) {
        const sev = pickInjurySeverity();
        injuries.push({ wrestlerId: performer.id, ...sev });
        text += ` ${performer.name} looks hurt after a bad landing!`;
      }
      beatLog.push(text);
    }
  }

  const relevantTeams = tagTeams.filter((t) => t.memberIds.every((id) => participants.some((p) => p.id === id)));
  relevantTeams.forEach((t) => { qualityPoints += (t.chemistry / 100) * 0.4; });
  if (relevantTeams.length) beatLog.push(`${relevantTeams.map((t) => t.name).join(' and ')} work like a well-oiled machine out there.`);

  const relevantFeuds = feuds.filter((f) => f.status !== 'ended' && feudPairPresent(f, match.participantIds));
  relevantFeuds.forEach((f) => {
    const isBlowOff = match.feudBlowOffId === f.id;
    qualityPoints += (f.heat / 100) * 0.35 + (isBlowOff ? 0.3 : 0);
  });
  if (relevantFeuds.length) beatLog.push(`The bad blood between ${relevantFeuds.map((f) => `${f.aName} and ${f.bName}`).join(', ')} spills into this one.`);

  qualityPoints += ringTier.qualityBonus + ringShapeBonus + refQualityBonus + roadAgentQualityBonus + ringCondFx.qualityBonus;
  if (weaponsMatch) {
    qualityPoints += weaponsFx.qualityBonus;
    beatLog.push('Weapons come into play and the crowd loses it.');
  }

  const finishType = FINISH_TYPES.find((f) => f.id === match.finishId) || FINISH_TYPES[0];
  qualityPoints += finishType.qualityMod;
  if (match.titleId) qualityPoints += 0.4;
  const rawStars = clamp(1 + qualityPoints / (beatsCount * 0.5 || 1), 0.5, 5.8);
  const finalStars = Math.min(Math.round(rawStars * 2) / 2, 5);
  const crowdAvg = crowdPoints / (beatsCount || 1);
  const crowdTier = crowdAvg > 1.4 ? 'Uproarious' : crowdAvg > 1.0 ? 'Electric' : crowdAvg > 0.6 ? 'Into It' : crowdAvg > 0.3 ? 'Polite' : 'Dead Silent';

  return { beatLog, finalStars, crowdTier, injuries, perfTracker, finishLabel: finishType.label };
}

function computePromoPop(promo, wrestlerLookup, staffLookup) {
  const parts = promo.participantIds.map((id) => wrestlerLookup[id]).filter(Boolean);
  if (!parts.length) return 50;
  const avgCharisma = average(parts.map((p) => p.stats.charisma));
  const avgPop = average(parts.map((p) => p.popularity));
  let base = avgCharisma * 0.6 + avgPop * 0.3 + randInt(-8, 8);
  if (promo.hostStaffId && staffLookup && staffLookup[promo.hostStaffId]) {
    const host = staffLookup[promo.hostStaffId];
    base += (staffEffectiveQuality(host) - 50) / 4;
  }
  return clamp(Math.round(base), 5, 100);
}

function computeFillFactors(draftShow, game) {
  const venue = ALL_VENUES.find((v) => v.id === draftShow.venueId) || ALL_VENUES[0];
  const rosterPopAvg = average(game.roster.map((w) => w.popularity)) || 10;
  const staffAll = [...game.staff.announcers, ...game.staff.commentators];
  const avgStaffQuality = average(staffAll.map((s) => staffEffectiveQuality(s))) || 40;
  const priceFactor = clamp((draftShow.ticketPrice - 15) / 100, -0.3, 0.5);
  const marketingFactor = clamp(draftShow.marketingBudget / 5000, 0, 0.35);
  const repFactor = clamp(game.company.reputation / 150, 0, 0.6);
  const popFactor = clamp(rosterPopAvg / 150, 0, 0.3);
  const staffFactor = clamp(avgStaffQuality / 600, 0, 0.12);
  const productionBonus = currentTier(game.company, 'production').fillBonus;
  const tvNetwork = tvNetworkFor(game.company);
  const tvBonus = tvNetwork ? tvNetwork.fillBonus : 0;
  const crowdMatchFactor = !venue.crowdLean ? 0 : venue.crowdLean === game.company.style ? 0.06 : -0.08;
  const fillRate = clamp(0.25 + repFactor + popFactor + marketingFactor + staffFactor + productionBonus + tvBonus + crowdMatchFactor - priceFactor, 0.08, 0.99);
  const attendance = Math.round(venue.capacity * fillRate);
  const effectiveRent = Math.round(venue.rent * (1 - currentTier(game.company, 'transport').rentDiscount));
  const payroll = sum(game.roster.map((w) => w.salary)) + sum(staffAll.map((s) => s.salary));
  return { venue, fillRate, attendance, payroll, rosterPopAvg, effectiveRent };
}

function estimateShow(draftShow, game) {
  const { venue, fillRate, attendance, payroll, effectiveRent } = computeFillFactors(draftShow, game);
  const diff = DIFFICULTY_CONFIG[game.company.difficulty] || DIFFICULTY_CONFIG.normal;
  const concessions = computeConcessionsRevenue(game.company, attendance);
  const merch = computeMerchResult(game.company, game.roster, attendance).net;
  const tvNetwork = tvNetworkFor(game.company);
  const tv = tvNetwork ? tvNetwork.weeklyFee : 0;
  const revenue = (attendance * draftShow.ticketPrice + concessions + merch + tv) * diff.revenueMult;
  const expenses = (effectiveRent + draftShow.marketingBudget + payroll) * diff.expenseMult;
  return { attendance, capacity: venue.capacity, revenue, expenses, profit: revenue - expenses, fillRate, venue };
}

function simulateShow(draftShow, game) {
  const { venue, fillRate, attendance, payroll, effectiveRent } = computeFillFactors(draftShow, game);
  const diff = DIFFICULTY_CONFIG[game.company.difficulty] || DIFFICULTY_CONFIG.normal;
  const wrestlerLookup = {};
  game.roster.forEach((w) => { wrestlerLookup[w.id] = w; });
  const staffLookup = {};
  [...game.staff.announcers, ...game.staff.commentators, ...(game.staff.referees || []), ...(game.staff.writers || []), ...(game.staff.roadAgents || [])].forEach((s) => { staffLookup[s.id] = s; });
  const referees = game.staff.referees || [];
  const refereeQuality = referees.length ? average(referees.map((r) => staffEffectiveQuality(r))) : 50;
  const roadAgents = game.staff.roadAgents || [];
  const roadAgentQuality = roadAgents.length ? average(roadAgents.map((r) => staffEffectiveQuality(r))) : 50;

  const matchUpgrades = {
    ring: game.company.upgrades.ring,
    ringShapeBonus: ringShapeBonusFor(game.company),
    weaponsOwned: game.company.weaponsOwned || [],
    supplies: game.company.supplies,
    refereeQuality,
    roadAgentQuality,
    ringCondition: game.company.ringCondition,
  };
  const matchResults = draftShow.card.filter((s) => s.kind === 'match').map((m) => ({ ...m, result: simulateMatch(m, wrestlerLookup, game.tagTeams, matchUpgrades, game.feuds) }));
  const promoResults = draftShow.card.filter((s) => s.kind === 'promo').map((p) => ({ ...p, pop: computePromoPop(p, wrestlerLookup, staffLookup) }));

  const ticketRevenue = Math.round(attendance * draftShow.ticketPrice * diff.revenueMult);
  const concessionsRevenue = Math.round(computeConcessionsRevenue(game.company, attendance) * diff.revenueMult);
  const merchResult = computeMerchResult(game.company, game.roster, attendance);
  const merchRevenue = Math.round(merchResult.net * diff.revenueMult);
  const tvNetwork = tvNetworkFor(game.company);
  const tvRevenue = tvNetwork ? Math.round(tvNetwork.weeklyFee * diff.revenueMult) : 0;
  const revenue = ticketRevenue + concessionsRevenue + merchRevenue + tvRevenue;
  const expenses = Math.round((effectiveRent + draftShow.marketingBudget + payroll) * diff.expenseMult);
  const netProfit = revenue - expenses;

  const avgStars = matchResults.length ? average(matchResults.map((m) => m.result.finalStars)) : 2.5;
  const avgPromoPop = promoResults.length ? average(promoResults.map((p) => p.pop)) : 50;
  let repDelta = clamp(Math.round((avgStars - 2.25) * 3 + (fillRate - 0.35) * 8 + (avgPromoPop - 50) / 20), -8, 14);
  if (merchResult.tapesActive) repDelta = clamp(repDelta + 1, -8, 15);
  let crowdVerdict = null;
  if (venue.crowdLean && venue.crowdLean !== game.company.style) {
    if (avgStars >= 3.25) { repDelta = clamp(repDelta + 4, -8, 18); crowdVerdict = 'won_over'; }
    else if (avgStars < 2.25) { repDelta = clamp(repDelta - 3, -12, 18); crowdVerdict = 'bombed'; }
    else crowdVerdict = 'flat';
  }

  return { venue, matchResults, promoResults, attendance, ticketRevenue, concessionsRevenue, merchRevenue, tvRevenue, merchRoyalties: merchResult.royalties, revenue, expenses, payroll, netProfit, avgStars, avgPromoPop, repDelta, fillRate, crowdVerdict };
}

/* ============================================================
   GAME STATE FACTORY
   ============================================================ */
const STORAGE_KEY = 'wgm-save-v1';

function makeEmptyDraft() {
  return { venueId: 'gym', ticketPrice: 20, marketingBudget: 0, showName: '', card: [] };
}
const MARKETING_TIERS = [
  { id: 'word_of_mouth', label: 'Word of Mouth', cost: 0, blurb: 'Free — let the fans spread it themselves.' },
  { id: 'flyers', label: 'Flyers & Posters', cost: 500, blurb: 'Cheap and local.' },
  { id: 'local_ads', label: 'Local Ads', cost: 2000, blurb: 'Radio spots and local press.' },
  { id: 'regional_campaign', label: 'Regional Campaign', cost: 5000, blurb: 'TV spots and billboards.' },
  { id: 'major_push', label: 'Major Push', cost: 10000, blurb: 'A full media blitz.' },
];

function createNewGame(opts) {
  const {
    name, regionId, styleId, rivalCount = 5, fundsTierId = 'standard', difficultyId = 'normal', theme, backgroundId = 'family',
    ringOriginId = 'found', ringDelegated = false,
    venuePathId = 'gym_rental', venueDelegated = false,
    recruitingMethodId = 'in_person', recruitingDelegated = false,
    partner: providedPartner,
  } = opts || {};
  const region = regionId || 'usa';
  const style = styleId || 'sports_entertainment';
  const styleLabel = (STYLE_CONFIG[style] || STYLE_CONFIG.sports_entertainment).label;
  const regionLabel = (REGION_LIST.find((r) => r.id === region) || REGION_LIST[0]).label;
  const fundsTier = FUNDS_TIERS.find((f) => f.id === fundsTierId) || FUNDS_TIERS[1];
  const resolvedTheme = theme || DEFAULT_THEME;
  const background = BOSS_BACKGROUNDS.find((b) => b.id === backgroundId) || BOSS_BACKGROUNDS[2];

  const partner = providedPartner || generatePartner(region);
  const delegatePicks = PARTNER_DELEGATE_PICK[partner.archetypeId];
  const isRecruitingDelegated = recruitingDelegated || recruitingMethodId === 'delegate';
  const resolvedRingOriginId = ringDelegated ? delegatePicks.ring : ringOriginId;
  const resolvedVenuePathId = venueDelegated ? delegatePicks.venue : venuePathId;
  const resolvedRecruitingId = isRecruitingDelegated ? delegatePicks.recruiting : recruitingMethodId;

  const ringOrigin = RING_ORIGINS.find((r) => r.id === resolvedRingOriginId) || RING_ORIGINS[0];
  const venuePath = STARTUP_VENUE_PATHS.find((v) => v.id === resolvedVenuePathId) || STARTUP_VENUE_PATHS[0];
  const recruitingMethod = STARTUP_RECRUITING_METHODS.find((m) => m.id === resolvedRecruitingId) || STARTUP_RECRUITING_METHODS[2];

  const believer = generateWrestler('Rookie', region, style);
  if (recruitingMethod.statBias) believer.stats[recruitingMethod.statBias] = clamp(believer.stats[recruitingMethod.statBias] + 15, 5, 99);
  const startingRoster = [{ ...believer, storyline: [{ week: 1, year: 1, text: `Found via ${recruitingMethod.label.toLowerCase()} and believed in this promotion from day one.` }] }];

  const relationship = initPartnerRelationship(partner.archetypeId, {
    ring: resolvedRingOriginId, venue: resolvedVenuePathId, recruiting: resolvedRecruitingId,
    ringDelegated, venueDelegated, recruitingDelegated: isRecruitingDelegated,
  });
  const finalPartner = { ...partner, relationship };

  const startingFunds = Math.max(500, fundsTier.funds + background.fundsMod - ringOrigin.cost - venuePath.cost - recruitingMethod.cost);
  const startingRep = clamp(5 + background.repMod + venuePath.repBonus, 0, 100);

  const openingNews = [
    `Welcome to ${regionLabel}. Booking in the ${styleLabel} tradition — you've got ${believer.name}, a ring, and a dream. Go find the rest of your roster.`,
    `${finalPartner.name} on the venue: "${partnerReaction(finalPartner.archetypeId, 'venue', resolvedVenuePathId, venueDelegated)}"`,
    `${finalPartner.name} on the ring: "${partnerReaction(finalPartner.archetypeId, 'ring', resolvedRingOriginId, ringDelegated)}"`,
    `${finalPartner.name} on ${believer.name}: "${partnerReaction(finalPartner.archetypeId, 'recruiting', resolvedRecruitingId, isRecruitingDelegated)}"`,
    background.blurb,
  ];

  return {
    saveVersion: SAVE_VERSION,
    partner: finalPartner,
    company: {
      name: name || 'Independent Wrestling',
      funds: startingFunds,
      reputation: startingRep,
      week: 1, year: 1, region, style,
      difficulty: difficultyId, theme: resolvedTheme,
      background: background.id,
      bossReputation: clamp(50 + background.bossRepMod, 0, 100),
      upgrades: { ...DEFAULT_UPGRADES, ring: ringOrigin.ringLevel },
      ringShape: DEFAULT_RING_SHAPE,
      ringShapesOwned: [DEFAULT_RING_SHAPE],
      concessionsMenu: [{ itemId: 'hotdogs', price: 5 }, { itemId: 'soda', price: 4 }],
      merchMenu: [{ itemId: 'tshirt', price: 20, wrestlerIds: [] }],
      weaponsOwned: [],
      tvDeal: null,
      matchResearch: { unlockedTypes: [], inProgress: null },
      advisors: generateAdvisors(region),
      journalists: generateJournalists(region),
      mediaInterviewMilestones: [],
      weekDay: 1,
      unavailableVenueIds: [],
      ringCondition: 100,
      supplies: 100,
      acquisitionsCount: 0,
    },
    roster: startingRoster,
    freeAgents: generateFreeAgentPool(region, style, 16, true),
    staff: { announcers: [], commentators: [], referees: [], writers: [], roadAgents: [] },
    staffPool: { announcers: Array.from({ length: 3 }, () => generateStaff('Announcer')), commentators: Array.from({ length: 3 }, () => generateStaff('Commentator')), referees: Array.from({ length: 3 }, () => generateStaff('Referee')), writers: Array.from({ length: 3 }, () => generateStaff('Writer')), roadAgents: Array.from({ length: 3 }, () => generateStaff('Road Agent')) },
    titles: [],
    tagTeams: [],
    stables: [],
    feuds: [],
    relationships: [],
    inbox: [],
    rivals: generateRivalPromotions(rivalCount),
    mediaRecaps: [],
    devLog: [],
    worldEvents: [],
    history: [],
    news: openingNews,
    draftShow: makeEmptyDraft(),
  };
}

/* Upgrades an older save (pre-titles/region/traits/teams/business-builder/tv-rivals) so it doesn't crash on load. */
function normalizeGame(loaded) {
  const fixCard = (card) => (card || []).map((item) => {
    if (item.kind !== 'match') return item;
    const winnerIds = item.winnerIds || (item.winnerId ? [item.winnerId] : []);
    const titleId = item.titleId !== undefined ? item.titleId : null;
    return { ...item, winnerIds, titleId };
  });
  const fixWrestler = (w) => ({ ...w, traits: w.traits || [], age: w.age || randInt(24, 36), ambition: { unhappyStreak: 0, contentStreak: 0, ...(w.ambition || assignWrestlerAmbition()) }, merchEarnings: w.merchEarnings || 0, matchesWrestled: w.matchesWrestled || 0, gender: w.gender || (Math.random() < 0.5 ? 'male' : 'female'), careerInjuries: w.careerInjuries || 0, matchesSinceInjury: w.matchesSinceInjury || 0, confidence: w.confidence !== undefined ? w.confidence : randInt(50, 75), wellness: w.wellness || { status: 'stable', weeksInStatus: 0 }, storyline: w.storyline || [], hometown: w.hometown || pick(REGION_HOMETOWNS.usa), weight: w.weight || randInt(210, 280), contractPromise: w.contractPromise !== undefined ? w.contractPromise : null, character: w.character || generateCharacterCore() });
  const fixStaff = (s) => ({ ...s, trait: s.trait !== undefined ? s.trait : null, ambition: { unhappyStreak: 0, contentStreak: 0, ...(s.ambition || assignStaffAmbition()) }, weeksEmployed: s.weeksEmployed || 0 });
  const loadedCompany = loaded.company || {};
  const oldUpgrades = loadedCompany.upgrades || {};
  const migratedWeapons = loadedCompany.weaponsOwned || (oldUpgrades.weapons ? ['chairs', 'tables'] : []);
  return {
    ...loaded,
    saveVersion: SAVE_VERSION,
    partner: (() => {
      const p = loaded.partner || generatePartner(loadedCompany.region || 'usa');
      if (p.relationship) return p;
      const { bond, ...rest } = p;
      return { ...rest, relationship: { trust: bond || 55, respect: bond || 55, affection: bond || 55, compatibility: 50, sharedVision: bond || 55, history: [] } };
    })(),
    company: {
      region: 'usa', style: 'sports_entertainment',
      ...loadedCompany,
      difficulty: loadedCompany.difficulty || 'normal',
      theme: loadedCompany.theme || DEFAULT_THEME,
      upgrades: { ring: oldUpgrades.ring || 1, production: oldUpgrades.production || 1, medical: oldUpgrades.medical || 1, transport: oldUpgrades.transport || 1 },
      ringShape: loadedCompany.ringShape || DEFAULT_RING_SHAPE,
      ringShapesOwned: loadedCompany.ringShapesOwned || [DEFAULT_RING_SHAPE],
      concessionsMenu: loadedCompany.concessionsMenu || [],
      merchMenu: (loadedCompany.merchMenu || []).map((e) => ({ itemId: e.itemId, price: e.price, wrestlerIds: e.wrestlerIds || (e.wrestlerId ? [e.wrestlerId] : []) })),
      weaponsOwned: migratedWeapons,
      tvDeal: loadedCompany.tvDeal || null,
      matchResearch: loadedCompany.matchResearch || { unlockedTypes: [], inProgress: null },
      advisors: loadedCompany.advisors || generateAdvisors(loadedCompany.region || 'usa'),
      journalists: loadedCompany.journalists || generateJournalists(loadedCompany.region || 'usa'),
      mediaInterviewMilestones: loadedCompany.mediaInterviewMilestones || [],
      weekDay: loadedCompany.weekDay || 1,
      unavailableVenueIds: loadedCompany.unavailableVenueIds || [],
      ringCondition: loadedCompany.ringCondition !== undefined ? loadedCompany.ringCondition : 100,
      supplies: loadedCompany.supplies !== undefined ? loadedCompany.supplies : 100,
      acquisitionsCount: loadedCompany.acquisitionsCount || 0,
      background: loadedCompany.background || 'family',
      bossReputation: loadedCompany.bossReputation !== undefined ? loadedCompany.bossReputation : 50,
    },
    titles: loaded.titles || [],
    tagTeams: loaded.tagTeams || [],
    stables: loaded.stables || [],
    feuds: loaded.feuds || [],
    relationships: loaded.relationships || [],
    inbox: loaded.inbox || [],
    rivals: (loaded.rivals || generateRivalPromotions()).map((r) => {
      const roster = r.roster || generateRivalRoster(r.region, r.style, r.reputation);
      return { ...r, roster, flagshipTalent: r.flagshipTalent || flagshipFromRoster(roster) };
    }),
    mediaRecaps: loaded.mediaRecaps || [],
    devLog: loaded.devLog || [],
    worldEvents: loaded.worldEvents || [],
    roster: (loaded.roster || []).map(fixWrestler),
    freeAgents: (loaded.freeAgents || []).map(fixWrestler),
    staff: {
      announcers: (loaded.staff?.announcers || []).map(fixStaff),
      commentators: (loaded.staff?.commentators || []).map(fixStaff),
      referees: (loaded.staff?.referees || []).map(fixStaff),
      writers: (loaded.staff?.writers || []).map(fixStaff),
      roadAgents: (loaded.staff?.roadAgents || []).map(fixStaff),
    },
    staffPool: {
      announcers: (loaded.staffPool?.announcers || []).map(fixStaff),
      commentators: (loaded.staffPool?.commentators || []).map(fixStaff),
      referees: (loaded.staffPool?.referees && loaded.staffPool.referees.length ? loaded.staffPool.referees : Array.from({ length: 3 }, () => generateStaff('Referee'))).map(fixStaff),
      writers: (loaded.staffPool?.writers && loaded.staffPool.writers.length ? loaded.staffPool.writers : Array.from({ length: 3 }, () => generateStaff('Writer'))).map(fixStaff),
      roadAgents: (loaded.staffPool?.roadAgents && loaded.staffPool.roadAgents.length ? loaded.staffPool.roadAgents : Array.from({ length: 3 }, () => generateStaff('Road Agent'))).map(fixStaff),
    },
    draftShow: loaded.draftShow ? { showName: '', ...loaded.draftShow, card: fixCard(loaded.draftShow.card) } : makeEmptyDraft(),
  };
}

/* ============================================================
   SMALL PRESENTATIONAL PIECES
   ============================================================ */
function StatBar({ label, value, accent = C.gold }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="wgm-mono w-16 shrink-0" style={{ color: C.cream, opacity: 0.65 }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.12)' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: accent }} />
      </div>
      <span className="wgm-mono w-7 text-right" style={{ color: C.cream }}>{value}</span>
    </div>
  );
}

function StarRow({ value, size = 14 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = value >= i;
    const half = !filled && value >= i - 0.5;
    stars.push(
      <span key={i} style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
        <Star size={size} color={C.gold} fill={filled ? C.gold : 'none'} strokeWidth={1.5} />
        {half && (
          <span style={{ position: 'absolute', inset: 0, width: size / 2, overflow: 'hidden' }}>
            <Star size={size} color={C.gold} fill={C.gold} strokeWidth={1.5} />
          </span>
        )}
      </span>
    );
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>;
}

function AlignmentBadge({ alignment }) {
  const cfg = { face: { label: 'Face', bg: '#3E5C8A' }, heel: { label: 'Heel', bg: C.ropeDark }, tweener: { label: 'Tweener', bg: C.steel } }[alignment];
  return <span className="wgm-mono text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: cfg.bg, color: C.cream }}>{cfg.label.toUpperCase()}</span>;
}

function GenderBadge({ gender, size = 'text-[10px]' }) {
  if (!gender) return null;
  const isMale = gender === 'male';
  return (
    <span className={`wgm-mono ${size} font-bold`} style={{ color: isMale ? '#3E5C8A' : '#A24E8C' }} title={isMale ? 'Male' : 'Female'}>
      {isMale ? '♂' : '♀'}
    </span>
  );
}

function Pill({ children, bg = C.inkFaint, color = C.cream }) {
  return <span className="wgm-mono text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, color }}>{children}</span>;
}

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={18} color={C.gold} />}
        <h2 className="wgm-display text-lg" style={{ color: C.ink }}>{children}</h2>
      </div>
      {sub && <span className="text-xs" style={{ color: C.inkFaint }}>{sub}</span>}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, full, danger, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95 ${full ? 'w-full' : ''} ${disabled ? 'opacity-40' : ''}`}
      style={{ backgroundColor: danger ? C.rope : C.gold, color: C.ink }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, disabled, icon: Icon, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold border ${disabled ? 'opacity-40' : ''}`}
      style={{ borderColor: danger ? C.rope : C.line, color: danger ? C.rope : C.ink }}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(10,8,6,0.6)' }} onClick={onClose}>
      <div
        className={`wgm-pop wgm-scrollbar w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5`}
        style={{ backgroundColor: C.cream }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="wgm-display text-xl" style={{ color: C.ink }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full" style={{ backgroundColor: C.inkFaint }}>
            <X size={16} color={C.cream} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function WrestlingGM() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupMode, setSetupMode] = useState(''); // '' | 'preset' | 'custom'
  const [setupPresetId, setSetupPresetId] = useState('');
  const [setupName, setSetupName] = useState('');
  const [setupRegion, setSetupRegion] = useState('');
  const [setupStyle, setSetupStyle] = useState('');
  const [setupRivalCount, setSetupRivalCount] = useState(5);
  const [setupFundsTierId, setSetupFundsTierId] = useState('standard');
  const [setupDifficultyId, setSetupDifficultyId] = useState('normal');
  const [setupBackgroundId, setSetupBackgroundId] = useState('family');
  const [setupRingOriginId, setSetupRingOriginId] = useState('found');
  const [setupRingDelegated, setSetupRingDelegated] = useState(false);
  const [setupVenuePathId, setSetupVenuePathId] = useState('gym_rental');
  const [setupVenueDelegated, setSetupVenueDelegated] = useState(false);
  const [setupRecruitingMethodId, setSetupRecruitingMethodId] = useState('in_person');
  const [setupPartner, setSetupPartner] = useState(() => generatePartner('usa'));
  const [setupThemeMode, setSetupThemeMode] = useState('preset'); // 'preset' | 'custom'
  const [setupThemePresetId, setSetupThemePresetId] = useState('classic');
  const [setupCustomGold, setSetupCustomGold] = useState('#C4922E');
  const [setupCustomRope, setSetupCustomRope] = useState('#AC3A2C');
  const [tab, setTab] = useState('dashboard');
  const [rosterSubTab, setRosterSubTab] = useState('active');
  const [freeAgentsSubTab, setFreeAgentsSubTab] = useState('wrestlers');
  const [selectedWrestler, setSelectedWrestler] = useState(null);
  const [selectedFreeAgent, setSelectedFreeAgent] = useState(null);
  const [selectedFreeStaff, setSelectedFreeStaff] = useState(null);
  const [showResult, setShowResult] = useState(null);
  const [matchBuilderOpen, setMatchBuilderOpen] = useState(false);
  const [promoBuilderOpen, setPromoBuilderOpen] = useState(false);
  const [titleBuilderOpen, setTitleBuilderOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [teamBuilderOpen, setTeamBuilderOpen] = useState(false);
  const [stableBuilderOpen, setStableBuilderOpen] = useState(false);
  const [selectedStable, setSelectedStable] = useState(null);
  const [feudBuilderOpen, setFeudBuilderOpen] = useState(false);
  const [selectedFeud, setSelectedFeud] = useState(null);
  const [relationshipBuilderOpen, setRelationshipBuilderOpen] = useState(false);
  const [shopDept, setShopDept] = useState('titles');
  const [rivalsModalOpen, setRivalsModalOpen] = useState(false);
  const [poachTarget, setPoachTarget] = useState(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [inboxModalOpen, setInboxModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [devLogModalOpen, setDevLogModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) setGame(normalizeGame(JSON.parse(res.value)));
        else setNeedsSetup(true);
      } catch (e) {
        setNeedsSetup(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (nextGame) => {
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(nextGame), false); }
    catch (e) { console.error('save failed', e); }
  }, []);

  const updateGame = useCallback((updater) => {
    setGame((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persist(next);
      return next;
    });
  }, [persist]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  function startNewGame() {
    const chosenTheme = setupThemeMode === 'custom'
      ? { presetId: 'custom', gold: setupCustomGold, goldSoft: shadeHex(setupCustomGold, 45), rope: setupCustomRope, ropeDark: shadeHex(setupCustomRope, -25) }
      : { presetId: setupThemePresetId, ...(THEME_PRESETS.find((t) => t.id === setupThemePresetId) || THEME_PRESETS[0]) };
    const g = createNewGame({
      name: setupName.trim(), regionId: setupRegion, styleId: setupStyle,
      rivalCount: setupRivalCount, fundsTierId: setupFundsTierId, difficultyId: setupDifficultyId,
      theme: chosenTheme, backgroundId: setupBackgroundId,
      ringOriginId: setupRingOriginId, ringDelegated: setupRingDelegated,
      venuePathId: setupVenuePathId, venueDelegated: setupVenueDelegated,
      recruitingMethodId: setupRecruitingMethodId,
      partner: setupPartner,
    });
    setGame(g); persist(g); setNeedsSetup(false);
  }
  function startDebugTestGame() {
    // Fixed setup parameters for fast, repeatable regression testing.
    // Not bit-for-bit deterministic (wrestler generation still uses
    // Math.random() — no seeded RNG in this codebase), but the starting
    // conditions and flow are consistent every time this is used.
    const g = createNewGame({
      name: 'Debug Test Promotion', regionId: 'usa', styleId: 'sports_entertainment',
      rivalCount: 5, fundsTierId: 'standard', difficultyId: 'normal',
      theme: { presetId: 'classic', ...THEME_PRESETS[0] }, backgroundId: 'family', ringOriginId: 'used',
    });
    setGame(g); persist(g); setNeedsSetup(false);
  }

  function resetGame() {
    setGame(null); setConfirmAction(null); setTab('dashboard');
    setSetupMode(''); setSetupPresetId(''); setSetupName(''); setSetupRegion(''); setSetupStyle('');
    setSetupRivalCount(5); setSetupFundsTierId('standard'); setSetupDifficultyId('normal'); setSetupBackgroundId('family'); setSetupRingOriginId('found');
    setSetupRingDelegated(false); setSetupVenuePathId('gym_rental'); setSetupVenueDelegated(false); setSetupRecruitingMethodId('in_person');
    setSetupPartner(generatePartner('usa'));
    setSetupThemeMode('preset'); setSetupThemePresetId('classic');
    setNeedsSetup(true);
  }

  /* ---------- Roster actions ---------- */
  const bumpBossRep = (g, delta) => clamp((g.company.bossReputation !== undefined ? g.company.bossReputation : 50) + delta, 0, 100);
  function setAlignment(id, alignment) {
    updateGame((g) => ({ ...g, roster: g.roster.map((w) => (w.id === id ? { ...w, alignment } : w)) }));
  }
  function releaseWrestler(id) {
    updateGame((g) => {
      const w = g.roster.find((r) => r.id === id);
      const hasActiveJobSecurity = w && w.contractPromise && w.contractPromise.type === 'job_security' &&
        !(g.company.year > w.contractPromise.deadlineYear || (g.company.year === w.contractPromise.deadlineYear && g.company.week > w.contractPromise.deadlineWeek));
      return {
        ...g,
        company: { ...g.company, bossReputation: bumpBossRep(g, hasActiveJobSecurity ? -8 : -2) },
        roster: g.roster.filter((r) => r.id !== id),
        tagTeams: g.tagTeams.filter((t) => !t.memberIds.includes(id)),
        stables: g.stables
          .map((s) => ({ ...s, memberIds: s.memberIds.filter((m) => m !== id), leaderId: s.leaderId === id ? (s.memberIds.find((m) => m !== id) || null) : s.leaderId }))
          .filter((s) => s.memberIds.length >= 2),
        feuds: g.feuds.map((f) => (f.aId === id || f.bId === id || f.aPartnerId === id || f.bPartnerId === id) ? { ...f, status: 'ended' } : f),
        relationships: g.relationships.filter((r) => r.aId !== id && r.bId !== id),
      };
    });
    setSelectedWrestler(null); setConfirmAction(null);
    showToast('Wrestler released.');
  }
  function renewContract(id) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const w = g.roster.find((r) => r.id === id);
      if (!w) return g;
      let bonus = Math.round(w.salary);
      if (hasTrait(w, 'difficult')) bonus = Math.round(bonus * 1.3);
      if (hasTrait(w, 'company_man')) bonus = Math.round(bonus * 0.8);
      if (g.company.funds < bonus) { showToast('Not enough funds to renew.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - bonus, bossReputation: bumpBossRep(g, 1) },
        roster: g.roster.map((r) => (r.id === id ? { ...r, contractWeeksLeft: randInt(12, 30), salary: Math.round(r.salary * (1 + randInt(5, 20) / 100)) } : r)),
      });
    });
    showToast('Contract renewed.');
  }
  function grantAmbitionRequest(id) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const w = g.roster.find((r) => r.id === id);
      if (!w || !w.ambition || !w.ambition.pendingRequest) return g;
      const cost = 1500;
      if (g.company.funds < cost) { showToast('Not enough funds to address this.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - cost, bossReputation: bumpBossRep(g, 2) },
        roster: g.roster.map((r) => (r.id === id ? { ...r, ambition: { ...r.ambition, satisfaction: clamp(r.ambition.satisfaction + 35, 0, 100), status: 'content', pendingRequest: null } } : r)),
      });
    });
    showToast('Request addressed.');
  }
  function sendToWellnessProgram(id) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const w = g.roster.find((r) => r.id === id);
      if (!w) return g;
      const cost = 3000;
      if (g.company.funds < cost) { showToast('Not enough funds to cover this.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - cost, bossReputation: bumpBossRep(g, 3) },
        roster: g.roster.map((r) => (r.id === id ? {
          ...r,
          wellness: { status: 'in_program', weeksInStatus: 0 },
          morale: clamp(r.morale + 15, 0, 100),
        } : r)),
      });
    });
    showToast(`${game.roster.find((r) => r.id === id)?.name || 'Wrestler'} sent to get support.`);
  }
  function giveStaffRaise(role, id) {
    const key = staffRoleKey(role);
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const s = g.staff[key].find((x) => x.id === id);
      if (!s) return g;
      const cost = Math.round(s.salary * 3);
      if (g.company.funds < cost) { showToast('Not enough funds for a raise.'); return g; }
      const fulfillsAmbition = s.ambition && s.ambition.type === 'raise';
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - cost, bossReputation: bumpBossRep(g, 1) },
        staff: {
          ...g.staff,
          [key]: g.staff[key].map((x) => (x.id === id ? {
            ...x,
            salary: Math.round(x.salary * 1.15),
            quality: clamp(x.quality + 2, 1, 100),
            ambition: fulfillsAmbition ? { ...assignStaffAmbition(), satisfaction: 80 } : { ...x.ambition, satisfaction: clamp(x.ambition.satisfaction + 20, 0, 100), status: x.ambition.satisfaction + 20 >= 40 ? 'content' : x.ambition.status, pendingRequest: x.ambition.satisfaction + 20 >= 40 ? null : x.ambition.pendingRequest },
          } : x)),
        },
      });
    });
    showToast('Gave a raise.');
  }
  function signFreeAgent(id, termId, bonusPct = 1, wagePct = 1, contractWeeks = 18) {
    let outcome = 'none';
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week to sign anyone — run the show or wait for next week.'); return g; }
      const w = g.freeAgents.find((f) => f.id === id);
      if (!w) return g;
      const term = CONTRACT_TERMS.find((t) => t.id === termId) || CONTRACT_TERMS[0];
      let bonus = w.salary * 2 * (w.signingMult || 1) * term.bonusMult * bonusPct;
      if (hasTrait(w, 'difficult')) bonus = Math.round(bonus * 1.3);
      if (hasTrait(w, 'company_man')) bonus = Math.round(bonus * 0.8);
      const bossRep = g.company.bossReputation !== undefined ? g.company.bossReputation : 50;
      if (w.tier === 'Star' || w.tier === 'Legend') {
        if (bossRep >= 70) bonus = Math.round(bonus * 0.85);
        else if (bossRep <= 30) bonus = Math.round(bonus * 1.25);
      }
      bonus = Math.round(bonus);
      const weeklyWage = Math.round(w.salary * wagePct);
      if (g.company.funds < bonus) { showToast('Not enough funds for the signing bonus.'); return g; }
      const offerQuality = (bonusPct + wagePct) / 2;
      const fit = negotiationFit(w.character, term.id, offerQuality, g.company.reputation, contractWeeks);
      if (Math.random() < negotiationRejectionChance(fit)) {
        outcome = 'rejected';
        return tickOneDay({ ...g, news: [negotiationRejectionReason(w, term.id), ...g.news].slice(0, 30) });
      }
      let relationships = g.relationships;
      if (g.roster.length && Math.random() < 0.2) {
        const other = pick(g.roster);
        relationships = [...relationships, createRelationshipObject(w.id, w.name, other.id, other.name, randomPreexistingRelType(), g.company.week, g.company.year)];
      }
      let deadlineWeek = g.company.week + term.promiseWeeks;
      let deadlineYear = g.company.year;
      while (deadlineWeek > 52) { deadlineWeek -= 52; deadlineYear += 1; }
      const contractPromise = term.promiseType ? { type: term.promiseType, deadlineWeek, deadlineYear } : null;
      const signStoryline = w.discoveredVia ? `Discovered via ${w.discoveredVia} and signed with ${g.company.name}.` : `Signed with ${g.company.name}.`;
      const termStoryline = term.id === 'promise_title' ? ` Promised a title within ${term.promiseWeeks} weeks.` : term.id === 'creative_control' ? ` Negotiated a creative control clause.` : '';
      outcome = 'signed';
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - bonus },
        roster: [...g.roster, { ...w, salary: weeklyWage, contractWeeksLeft: contractWeeks, contractPromise, storyline: [...(w.storyline || []), { week: g.company.week, year: g.company.year, text: signStoryline + termStoryline }].slice(-20) }],
        freeAgents: g.freeAgents.filter((f) => f.id !== id),
        relationships,
      });
    });
    if (outcome === 'rejected') showToast('They turned down the offer.');
    else if (outcome !== 'none') showToast('Wrestler signed.');
  }
  function searchForTalent(methodId) {
    const method = TALENT_SEARCH_METHODS.find((m) => m.id === methodId);
    if (!method) return;
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week to search — run the show or wait for next week.'); return g; }
      if (g.company.funds < method.cost) { showToast('Not enough funds for this.'); return g; }
      if (g.freeAgents.length >= 30) { showToast('Free agent pool is full — sign a few before searching more.'); return g; }
      const found = Math.random() < method.findChance;
      if (!found) {
        return tickOneDay({
          ...g,
          company: { ...g.company, funds: g.company.funds - method.cost },
          news: [`${method.label} turned up nothing this time.`, ...g.news].slice(0, 30),
        });
      }
      const candidates = Array.from({ length: method.count }, () => {
        const tier = weightedTierPick(method.tierWeights);
        const w = generateWrestler(tier, g.company.region, g.company.style);
        if (method.statBias) w.stats[method.statBias] = clamp(w.stats[method.statBias] + 15, 5, 99);
        return { ...w, signingMult: method.signingMult, discoveredVia: method.label };
      });
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - method.cost },
        freeAgents: [...g.freeAgents, ...candidates],
        news: [`${method.label} turned up ${candidates.map((c) => c.name).join(' and ')}.`, ...g.news].slice(0, 30),
      });
    });
    showToast('Search complete.');
  }

  /* ---------- Title actions ---------- */
  function createTitle(name, division, isTag, holderIds) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      if (g.company.funds < TITLE_CREATION_COST) { showToast(`Need ${money(TITLE_CREATION_COST)} to commission a title.`); return g; }
      const holderNames = holderIds.map((id) => (g.roster.find((r) => r.id === id) || {}).name || '???');
      const title = createTitleObject(name, division, isTag, holderIds, holderNames, g.company.week, g.company.year);
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - TITLE_CREATION_COST },
        titles: [...g.titles, title],
        news: [`The ${name} has been introduced${holderIds.length ? ` — ${holderNames.join(' & ')} crowned inaugural champion${holderIds.length > 1 ? 's' : ''}.` : ', currently vacant.'}`, ...g.news].slice(0, 30),
      });
    });
    setTitleBuilderOpen(false);
    showToast('Title created.');
  }
  function vacateTitle(id) {
    updateGame((g) => ({
      ...g,
      titles: g.titles.map((t) => {
        if (t.id !== id || t.holderIds.length === 0) return t;
        const reignHistory = t.reignHistory.map((r, i) => (i === t.reignHistory.length - 1 && r.lostWeek === null ? { ...r, lostWeek: g.company.week, lostYear: g.company.year } : r));
        return { ...t, holderIds: [], reignHistory };
      }),
    }));
    setSelectedTitle(null);
    showToast('Title vacated.');
  }

  /* ---------- Tag team & stable actions ---------- */
  function createTeam(name, memberIds) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      return tickOneDay({ ...g, tagTeams: [...g.tagTeams, createTagTeamObject(name, memberIds, g.company.week, g.company.year)] });
    });
    setTeamBuilderOpen(false);
    showToast('Tag team formed.');
  }
  function disbandTeam(id) {
    updateGame((g) => ({ ...g, tagTeams: g.tagTeams.filter((t) => t.id !== id) }));
    showToast('Tag team disbanded.');
  }
  function createStable(name, leaderId, memberIds) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const allMembers = memberIds.includes(leaderId) ? memberIds : [leaderId, ...memberIds];
      return tickOneDay({ ...g, stables: [...g.stables, createStableObject(name, leaderId, allMembers, g.company.week, g.company.year)] });
    });
    setStableBuilderOpen(false);
    showToast('Stable formed.');
  }
  function updateStable(id, memberIds, leaderId) {
    updateGame((g) => ({ ...g, stables: g.stables.map((s) => (s.id === id ? { ...s, memberIds, leaderId } : s)) }));
  }
  function disbandStable(id) {
    updateGame((g) => ({ ...g, stables: g.stables.filter((s) => s.id !== id) }));
    setSelectedStable(null);
    showToast('Stable disbanded.');
  }

  /* ---------- Feud actions ---------- */
  function createFeud(aId, bId, aPartnerId, bPartnerId) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const a = g.roster.find((r) => r.id === aId);
      const b = g.roster.find((r) => r.id === bId);
      if (!a || !b) return g;
      const aPartner = aPartnerId ? g.roster.find((r) => r.id === aPartnerId) : null;
      const bPartner = bPartnerId ? g.roster.find((r) => r.id === bPartnerId) : null;
      return tickOneDay({
        ...g,
        feuds: [...g.feuds, createFeudObject(
          a.id, a.name, b.id, b.name, g.company.week, g.company.year,
          aPartner ? aPartner.id : null, aPartner ? aPartner.name : null,
          bPartner ? bPartner.id : null, bPartner ? bPartner.name : null,
        )],
      });
    });
    setFeudBuilderOpen(false);
    showToast('Feud started.');
  }
  function endFeud(id) {
    updateGame((g) => ({ ...g, feuds: g.feuds.map((f) => (f.id === id ? { ...f, status: 'ended' } : f)) }));
    setSelectedFeud(null);
    showToast('Feud ended.');
  }

  /* ---------- Relationship actions ---------- */
  function createRelationship(aId, bId, type) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const a = g.roster.find((r) => r.id === aId);
      const b = g.roster.find((r) => r.id === bId);
      if (!a || !b) return g;
      return tickOneDay({ ...g, relationships: [...g.relationships, createRelationshipObject(a.id, a.name, b.id, b.name, type, g.company.week, g.company.year)] });
    });
    setRelationshipBuilderOpen(false);
    showToast('Relationship declared.');
  }
  function endRelationship(id) {
    updateGame((g) => ({ ...g, relationships: g.relationships.filter((r) => r.id !== id) }));
    showToast('Relationship ended.');
  }

  /* ---------- TV deal actions ---------- */
  function signTVDeal(networkId, timeSlotId) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      if (g.company.tvDeal) { showToast('Already under a TV deal.'); return g; }
      const network = TV_NETWORKS.find((n) => n.id === networkId);
      if (!network || g.company.reputation < network.minRep) return g;
      const slot = network.timeSlots.find((s) => s.id === timeSlotId) || network.timeSlots[0];
      return tickOneDay({
        ...g,
        company: { ...g.company, tvDeal: { networkId, weeksRemaining: network.weeks, totalWeeks: network.weeks, strikes: 0, signedWeek: g.company.week, signedYear: g.company.year, timeSlotId: slot.id, timeSlotLabel: slot.label, timeSlotHours: slot.hours } },
        news: [`Signed a TV deal with ${network.name} — airing ${slot.label}!`, ...g.news].slice(0, 30),
      });
    });
    showToast('TV deal signed.');
  }

  /* ---------- Rival promotion actions ---------- */
  function setRivalRelationship(rivalId, relationship) {
    updateGame((g) => ({ ...g, rivals: g.rivals.map((r) => (r.id === rivalId ? { ...r, relationship } : r)) }));
  }
  function signTerritoryPact(rivalId) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const rival = g.rivals.find((r) => r.id === rivalId);
      if (!rival || rival.relationship === 'pact') return g;
      if (g.company.funds < TERRITORY_PACT_COST) { showToast('Not enough funds for a pact.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - TERRITORY_PACT_COST, bossReputation: bumpBossRep(g, 2) },
        rivals: g.rivals.map((r) => (r.id === rivalId ? { ...r, relationship: 'pact' } : r)),
        news: [`Signed a territory pact with ${rival.name} — mutual respect, no poaching.`, ...g.news].slice(0, 30),
      });
    });
    showToast('Territory pact signed.');
  }
  function breakTerritoryPact(rivalId) {
    updateGame((g) => {
      const rival = g.rivals.find((r) => r.id === rivalId);
      if (!rival) return g;
      return {
        ...g,
        company: { ...g.company, reputation: clamp(g.company.reputation - 3, 0, 100), bossReputation: bumpBossRep(g, -3) },
        rivals: g.rivals.map((r) => (r.id === rivalId ? { ...r, relationship: 'neutral' } : r)),
        news: [`Broke the territory pact with ${rival.name}. Word travels fast.`, ...g.news].slice(0, 30),
      };
    });
    showToast('Pact broken.');
  }
  function acquireRival(rivalId) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const rival = g.rivals.find((r) => r.id === rivalId);
      if (!rival) return g;
      if (rival.relationship === 'pact') { showToast('Break the pact first.'); return g; }
      const cost = acquisitionCostFor(rival);
      if (g.company.funds < cost) { showToast('Not enough funds for this acquisition.'); return g; }
      const newTalent = (rival.roster && rival.roster.length) ? rival.roster.map((w) => ({ ...w, discoveredVia: `absorbed from ${rival.name}` })) : Array.from({ length: randInt(2, 4) }, () => generateWrestler(pick(['Rookie', 'Mid-Card', 'Mid-Card', 'Star']), rival.region, rival.style));
      const repGain = Math.round(rival.reputation / 5);
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - cost, reputation: clamp(g.company.reputation + repGain, 0, 100), acquisitionsCount: (g.company.acquisitionsCount || 0) + 1, bossReputation: bumpBossRep(g, -2) },
        rivals: g.rivals.filter((r) => r.id !== rivalId),
        freeAgents: [...g.freeAgents, ...newTalent],
        news: [`You've acquired ${rival.name}! Their roster hits the open market, and your company's influence grows.`, ...g.news].slice(0, 30),
      });
    });
    showToast('Promotion acquired.');
  }
  function poachRivalWrestler(rivalId, wrestlerId, termId, bonusPct = 1, wagePct = 1, contractWeeks = 18) {
    let outcome = 'none';
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const rival = g.rivals.find((r) => r.id === rivalId);
      if (!rival) return g;
      if (rival.relationship === 'pact') { showToast("Can't poach from a promotion you have a pact with."); return g; }
      const w = (rival.roster || []).find((r) => r.id === wrestlerId);
      if (!w) return g;
      const eligible = w.contractWeeksLeft <= 6 || w.rivalHappiness < 35;
      if (!eligible) { showToast("They're not close enough to their contract or unhappy enough to approach yet."); return g; }
      const term = CONTRACT_TERMS.find((t) => t.id === termId) || CONTRACT_TERMS[0];
      let bonus = w.salary * 2.5 * term.bonusMult * bonusPct;
      bonus = Math.round(bonus);
      const weeklyWage = Math.round(w.salary * wagePct * 1.1);
      if (g.company.funds < bonus) { showToast('Not enough funds for this offer.'); return g; }
      const offerQuality = (bonusPct + wagePct) / 2;
      const chance = poachSuccessChance(w, rival, g.company, term.id, offerQuality, contractWeeks);
      if (Math.random() >= chance) {
        outcome = 'failed';
        return tickOneDay({ ...g, news: [`${w.name} decided to stay with ${rival.name} — the offer wasn't enough to pull them away.`, ...g.news].slice(0, 30) });
      }
      let deadlineWeek = g.company.week + term.promiseWeeks; let deadlineYear = g.company.year;
      while (deadlineWeek > 52) { deadlineWeek -= 52; deadlineYear += 1; }
      const contractPromise = term.promiseType ? { type: term.promiseType, deadlineWeek, deadlineYear } : null;
      outcome = 'signed';
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - bonus, bossReputation: bumpBossRep(g, -1) },
        roster: [...g.roster, { ...w, salary: weeklyWage, contractWeeksLeft: contractWeeks, contractPromise, discoveredVia: `poached from ${rival.name}`, storyline: [...(w.storyline || []), { week: g.company.week, year: g.company.year, text: `Poached away from ${rival.name}.` }].slice(-20) }],
        rivals: g.rivals.map((r) => (r.id === rivalId ? {
          ...r,
          roster: (r.roster || []).filter((x) => x.id !== wrestlerId),
          flagshipTalent: flagshipFromRoster((r.roster || []).filter((x) => x.id !== wrestlerId)),
          reputation: clamp(r.reputation - 3, 0, 100),
          momentum: clamp(r.momentum - 1, -2, 2),
          relationship: r.relationship === 'ally' || r.relationship === 'neutral' ? 'rival' : r.relationship,
        } : r)),
        news: [`You poached ${w.name} away from ${rival.name}!`, ...g.news].slice(0, 30),
      });
    });
    if (outcome === 'signed') showToast('Poach successful — welcome to the roster.');
    else if (outcome === 'failed') showToast('They turned you down.');
  }

  /* ---------- Upgrade actions ---------- */
  function purchaseUpgrade(key) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const currentLevel = upgradeLevel(g.company, key);
      const def = UPGRADES[key];
      if (currentLevel >= def.levels.length) { showToast('Already at max level.'); return g; }
      const nextTier = def.levels[currentLevel];
      if (g.company.funds < nextTier.cost) { showToast('Not enough funds for this upgrade.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - nextTier.cost, upgrades: { ...g.company.upgrades, [key]: currentLevel + 1 } },
        news: [`Upgraded ${def.label} to "${nextTier.name}."`, ...g.news].slice(0, 30),
      });
    });
    showToast('Upgrade purchased.');
  }

  /* ---------- Ring shape ---------- */
  function purchaseRingShape(id) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const shape = RING_SHAPES.find((s) => s.id === id);
      if (!shape || g.company.ringShapesOwned.includes(id)) return g;
      if (g.company.funds < shape.cost) { showToast('Not enough funds for this ring.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - shape.cost, ringShapesOwned: [...g.company.ringShapesOwned, id], ringShape: id },
        news: [`Commissioned a new ${shape.name} for the promotion.`, ...g.news].slice(0, 30),
      });
    });
    showToast('Ring acquired and equipped.');
  }
  function equipRingShape(id) {
    updateGame((g) => (g.company.ringShapesOwned.includes(id) ? { ...g, company: { ...g.company, ringShape: id } } : g));
  }

  /* ---------- Concessions ---------- */
  function addConcessionItem(itemId) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const item = CONCESSION_ITEMS_CATALOG.find((i) => i.id === itemId);
      if (!item || g.company.concessionsMenu.some((e) => e.itemId === itemId)) return g;
      if (g.company.funds < item.unlockCost) { showToast('Not enough funds.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - item.unlockCost, concessionsMenu: [...g.company.concessionsMenu, { itemId, price: item.suggestedPrice }] },
      });
    });
    showToast('Added to concessions menu.');
  }
  function setConcessionPrice(itemId, price) {
    updateGame((g) => ({ ...g, company: { ...g.company, concessionsMenu: g.company.concessionsMenu.map((e) => (e.itemId === itemId ? { ...e, price } : e)) } }));
  }
  function removeConcessionItem(itemId) {
    updateGame((g) => ({ ...g, company: { ...g.company, concessionsMenu: g.company.concessionsMenu.filter((e) => e.itemId !== itemId) } }));
  }

  /* ---------- Merchandise ---------- */
  function addMerchItem(itemId) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const item = MERCH_ITEMS_CATALOG.find((i) => i.id === itemId);
      if (!item || g.company.merchMenu.some((e) => e.itemId === itemId)) return g;
      if (g.company.funds < item.unlockCost) { showToast('Not enough funds.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - item.unlockCost, merchMenu: [...g.company.merchMenu, { itemId, price: item.suggestedPrice, wrestlerIds: [] }] },
      });
    });
    showToast('Added to merch menu.');
  }
  function setMerchPrice(itemId, price) {
    updateGame((g) => ({ ...g, company: { ...g.company, merchMenu: g.company.merchMenu.map((e) => (e.itemId === itemId ? { ...e, price } : e)) } }));
  }
  function toggleMerchWrestler(itemId, wrestlerId) {
    updateGame((g) => {
      const w = g.roster.find((r) => r.id === wrestlerId);
      if (!w || w.popularity < MERCH_MIN_POPULARITY) { showToast(`Needs at least ${MERCH_MIN_POPULARITY} popularity for merch.`); return g; }
      return {
        ...g,
        company: {
          ...g.company,
          merchMenu: g.company.merchMenu.map((e) => {
            if (e.itemId !== itemId) return e;
            const current = e.wrestlerIds || [];
            const wrestlerIds = current.includes(wrestlerId) ? current.filter((id) => id !== wrestlerId) : [...current, wrestlerId];
            return { ...e, wrestlerIds };
          }),
        },
      };
    });
  }
  function removeMerchItem(itemId) {
    updateGame((g) => ({ ...g, company: { ...g.company, merchMenu: g.company.merchMenu.filter((e) => e.itemId !== itemId) } }));
  }

  /* ---------- Weapons shopping ---------- */
  function purchaseWeaponItem(itemId) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const item = WEAPON_ITEMS_CATALOG.find((i) => i.id === itemId);
      if (!item || g.company.weaponsOwned.includes(itemId)) return g;
      if (g.company.funds < item.cost) { showToast('Not enough funds.'); return g; }
      return tickOneDay({ ...g, company: { ...g.company, funds: g.company.funds - item.cost, weaponsOwned: [...g.company.weaponsOwned, itemId] } });
    });
    showToast('Added to the weapons stash.');
  }

  /* ---------- Match type research ---------- */
  function startMatchResearch(typeId) {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      if (g.company.matchResearch.inProgress) { showToast('Already researching a match type.'); return g; }
      const def = RESEARCHABLE_MATCH_TYPES.find((t) => t.id === typeId);
      if (!def || g.company.matchResearch.unlockedTypes.includes(typeId)) return g;
      if (g.company.reputation < def.minRep) { showToast('Reputation too low for this research.'); return g; }
      if (def.requiresWeapons && !def.requiresWeapons.every((w) => g.company.weaponsOwned.includes(w))) { showToast('Missing required weapons for this match type.'); return g; }
      if (g.company.funds < def.researchCost) { showToast('Not enough funds to start research.'); return g; }
      return tickOneDay({
        ...g,
        company: {
          ...g.company,
          funds: g.company.funds - def.researchCost,
          matchResearch: { ...g.company.matchResearch, inProgress: { typeId, weeksRemaining: def.researchWeeks, totalWeeks: def.researchWeeks } },
        },
        news: [`Research begins on the ${def.label}.`, ...g.news].slice(0, 30),
      });
    });
    showToast('Research started.');
  }

  /* ---------- Staff actions ---------- */
  function hireStaff(role, id) {
    const key = staffRoleKey(role);
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week to hire — run the show or wait for next week.'); return g; }
      if (g.staff[key].length >= 3) { showToast(`You already have 3 ${role.toLowerCase()}s.`); return g; }
      const candidate = g.staffPool[key].find((s) => s.id === id);
      if (!candidate) return g;
      const bonus = Math.round(candidate.salary * 1.5);
      if (g.company.funds < bonus) { showToast('Not enough funds to hire.'); return g; }
      return tickOneDay({
        ...g,
        company: { ...g.company, funds: g.company.funds - bonus },
        staff: { ...g.staff, [key]: [...g.staff[key], candidate] },
        staffPool: { ...g.staffPool, [key]: [...g.staffPool[key].filter((s) => s.id !== id), generateStaff(role)] },
      });
    });
  }
  function fireStaff(role, id) {
    const key = staffRoleKey(role);
    updateGame((g) => ({ ...g, company: { ...g.company, bossReputation: bumpBossRep(g, -1) }, staff: { ...g.staff, [key]: g.staff[key].filter((s) => s.id !== id) } }));
    showToast(`${role} let go.`);
  }
  function repairRing() {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const deficit = 100 - (g.company.ringCondition !== undefined ? g.company.ringCondition : 100);
      if (deficit <= 0) { showToast('The ring is already in top shape.'); return g; }
      const cost = Math.round(deficit * 45);
      if (g.company.funds < cost) { showToast('Not enough funds to repair the ring.'); return g; }
      return tickOneDay({ ...g, company: { ...g.company, funds: g.company.funds - cost, ringCondition: 100 } });
    });
    showToast('Ring repaired.');
  }
  function restockSupplies() {
    updateGame((g) => {
      if (!canActToday(g.company)) { showToast('No time left this week — run the show or wait for next week.'); return g; }
      const deficit = 100 - (g.company.supplies !== undefined ? g.company.supplies : 100);
      if (deficit <= 0) { showToast('Already fully stocked.'); return g; }
      const cost = Math.round(deficit * 20);
      if (g.company.funds < cost) { showToast('Not enough funds to restock.'); return g; }
      return tickOneDay({ ...g, company: { ...g.company, funds: g.company.funds - cost, supplies: 100 } });
    });
    showToast('Restocked.');
  }
  function skipDay() {
    updateGame((g) => {
      if (!canActToday(g.company)) return g;
      return tickOneDay(g);
    });
  }
  function skipToShowDay() {
    updateGame((g) => {
      let next = g;
      while (canActToday(next.company)) next = tickOneDay(next);
      return next;
    });
  }

  /* ---------- Draft show actions ---------- */
  function updateDraft(patch) {
    updateGame((g) => ({ ...g, draftShow: { ...g.draftShow, ...patch } }));
  }
  function addCardItem(item) {
    updateGame((g) => ({ ...g, draftShow: { ...g.draftShow, card: [...g.draftShow.card, item] } }));
  }
  function removeCardItem(index) {
    updateGame((g) => ({ ...g, draftShow: { ...g.draftShow, card: g.draftShow.card.filter((_, i) => i !== index) } }));
  }
  function moveCardItem(index, dir) {
    updateGame((g) => {
      const card = [...g.draftShow.card];
      const j = index + dir;
      if (j < 0 || j >= card.length) return g;
      [card[index], card[j]] = [card[j], card[index]];
      return { ...g, draftShow: { ...g.draftShow, card } };
    });
  }

  function respondToInboxOffer(offerId, accept) {
    updateGame((g) => {
      const offer = (g.inbox || []).find((o) => o.id === offerId);
      if (!offer) return g;
      if (!accept) {
        return { ...g, inbox: g.inbox.filter((o) => o.id !== offerId) };
      }
      if (offer.type === 'alliance_proposal') {
        const rival = g.rivals.find((r) => r.id === offer.rivalId);
        if (!rival) return { ...g, inbox: g.inbox.filter((o) => o.id !== offerId) };
        return {
          ...g,
          rivals: g.rivals.map((r) => (r.id === offer.rivalId ? { ...r, relationship: 'pact' } : r)),
          inbox: g.inbox.filter((o) => o.id !== offerId),
          news: [`Accepted ${rival.name}'s territory pact proposal.`, ...g.news].slice(0, 30),
        };
      }
      if (offer.type === 'buy_offer') {
        const w = g.roster.find((r) => r.id === offer.wrestlerId);
        if (!w) return { ...g, inbox: g.inbox.filter((o) => o.id !== offerId) };
        return {
          ...g,
          company: { ...g.company, funds: g.company.funds + offer.offerAmount },
          roster: g.roster.filter((r) => r.id !== offer.wrestlerId),
          tagTeams: g.tagTeams.filter((t) => !t.memberIds.includes(offer.wrestlerId)),
          stables: g.stables
            .map((s) => ({ ...s, memberIds: s.memberIds.filter((m) => m !== offer.wrestlerId), leaderId: s.leaderId === offer.wrestlerId ? (s.memberIds.find((m) => m !== offer.wrestlerId) || null) : s.leaderId }))
            .filter((s) => s.memberIds.length >= 2),
          feuds: g.feuds.map((f) => (f.aId === offer.wrestlerId || f.bId === offer.wrestlerId || f.aPartnerId === offer.wrestlerId || f.bPartnerId === offer.wrestlerId) ? { ...f, status: 'ended' } : f),
          relationships: g.relationships.filter((r) => r.aId !== offer.wrestlerId && r.bId !== offer.wrestlerId),
          inbox: g.inbox.filter((o) => o.id !== offerId),
          news: [`Sold ${w.name} to ${offer.rivalName} for ${money(offer.offerAmount)}.`, ...g.news].slice(0, 30),
        };
      }
      return g;
    });
    showToast(accept ? 'Offer accepted.' : 'Offer declined.');
  }
  function endWeekWithoutShow() {
    updateGame((g) => {
      const staffAll = [...g.staff.announcers, ...g.staff.commentators, ...(g.staff.referees || []), ...(g.staff.writers || []), ...(g.staff.roadAgents || [])];
      const payroll = sum(g.roster.map((w) => w.salary)) + sum(staffAll.map((s) => s.salary));
      let nextWeek = g.company.week + 1; let nextYear = g.company.year;
      if (nextWeek > 52) { nextWeek = 1; nextYear += 1; }
      let partner = g.partner;
      if (partner && partner.relationship && partner.archetypeId === 'promoter') {
        partner = { ...partner, relationship: nudgePartnerRelationship(partner.relationship, { trust: -2 }, `${partner.name} wasn't thrilled to see a week go by with no show. That's not how this business gets built.`, g.company.week, g.company.year) };
      }
      return {
        ...g,
        company: {
          ...g.company,
          funds: g.company.funds - payroll,
          week: nextWeek, year: nextYear,
          weekDay: 1,
          unavailableVenueIds: [],
        },
        partner,
        news: [`No show ran this week. The roster and staff still had to be paid — ${money(payroll)} in payroll.`, ...g.news].slice(0, 30),
      };
    });
    showToast('Week passed with no show.');
  }
  function runShow() {
    if (!game.draftShow.card.length) { showToast('Add at least one segment to the card first.'); return; }
    const result = simulateShow(game.draftShow, game);
    const wrestlerUpdates = {};
    const storylineAdds = {};
    const addStoryline = (id, text) => { if (!id) return; if (!storylineAdds[id]) storylineAdds[id] = []; storylineAdds[id].push(text); };
    const devLogAdds = [];
    const addDevLog = (category, message) => devLogAdds.push({ week: game.company.week, year: game.company.year, category, message });
    addDevLog('finance', `fillRate=${(result.fillRate * 100).toFixed(1)}% attendance=${result.attendance}/${result.venue.capacity} venue=${result.venue.name}${result.venue.crowdLean ? ` (${result.venue.crowdLean} crowd, company style=${game.company.style})` : ''}`);
    addDevLog('reputation', `repDelta=${result.repDelta} from avgStars=${result.avgStars.toFixed(2)} fillRate=${(result.fillRate * 100).toFixed(1)}% avgPromoPop=${Math.round(result.avgPromoPop)}${result.crowdVerdict ? ` crowdVerdict=${result.crowdVerdict}` : ''}`);

    result.matchResults.forEach((m) => {
      m.participantIds.forEach((pid) => {
        const w = game.roster.find((r) => r.id === pid);
        const perf = m.result.perfTracker[pid] || { points: 0 };
        const isWinner = m.winnerIds.includes(pid);
        let popGain = Math.round(2 + perf.points * 4 + (isWinner ? 3 : 0) + m.result.finalStars * 1.5);
        if (hasTrait(w, 'natural')) popGain = Math.round(popGain * 1.3);
        if (!wrestlerUpdates[pid]) wrestlerUpdates[pid] = { popDelta: 0, moraleDelta: 0, matchInc: 0, merchEarned: 0, confGain: 0 };
        wrestlerUpdates[pid].popDelta += popGain;
        wrestlerUpdates[pid].matchInc += 1;
        wrestlerUpdates[pid].confGain += isWinner ? 2.5 : 1;
        let moraleDelta = isWinner ? 4 : (m.result.finalStars >= 3 ? 1 : -3);
        if (!isWinner && hasTrait(w, 'prima_donna')) moraleDelta -= 3;
        wrestlerUpdates[pid].moraleDelta += moraleDelta;
      });
      m.result.injuries.forEach((inj) => {
        if (!wrestlerUpdates[inj.wrestlerId]) wrestlerUpdates[inj.wrestlerId] = { popDelta: 0, moraleDelta: 0, matchInc: 0, merchEarned: 0, confGain: 0 };
        const injuredWrestler = game.roster.find((r) => r.id === inj.wrestlerId);
        const healMult = currentTier(game.company, 'medical').healMult * (hasTrait(injuredWrestler, 'iron_constitution') ? 0.6 : 1);
        const weeksLeft = Math.max(1, Math.round(inj.weeksLeft * healMult));
        wrestlerUpdates[inj.wrestlerId].injury = { label: inj.label, weeksLeft };
        addStoryline(inj.wrestlerId, `Suffered a ${inj.label.toLowerCase()} — out ${weeksLeft} week${weeksLeft > 1 ? 's' : ''}.`);
      });
    });
    result.promoResults.forEach((p) => {
      p.participantIds.forEach((pid) => {
        if (!wrestlerUpdates[pid]) wrestlerUpdates[pid] = { popDelta: 0, moraleDelta: 0, matchInc: 0, merchEarned: 0, confGain: 0 };
        wrestlerUpdates[pid].popDelta += Math.round(p.pop / 12);
        wrestlerUpdates[pid].moraleDelta += 1;
      });
    });
    Object.entries(result.merchRoyalties || {}).forEach(([wid, amount]) => {
      if (!wrestlerUpdates[wid]) wrestlerUpdates[wid] = { popDelta: 0, moraleDelta: 0, matchInc: 0, merchEarned: 0, confGain: 0 };
      wrestlerUpdates[wid].moraleDelta += clamp(Math.round(amount / 150), 0, 5);
      wrestlerUpdates[wid].merchEarned += amount;
    });

    const onCardIds = new Set([
      ...result.matchResults.flatMap((m) => m.participantIds),
      ...result.promoResults.flatMap((p) => p.participantIds),
    ]);

    const leaderCount = game.roster.filter((w) => hasTrait(w, 'locker_leader')).length;
    const politicianCount = game.roster.filter((w) => hasTrait(w, 'backstage_politician')).length;
    const passiveMorale = clamp(leaderCount * 1 - politicianCount * 1, -4, 4);

    const updatedRoster = game.roster.map((w) => {
      const upd = wrestlerUpdates[w.id];
      const onCard = onCardIds.has(w.id);
      const conditionLoss = hasTrait(w, 'workhorse') ? 5 : hasTrait(w, 'fragile') ? 12 : 8;
      let condition = onCard ? clamp(w.condition - conditionLoss, 10, 100) : clamp(w.condition + 6, 0, 100);
      let injury = w.injury;
      const wasInjured = !!w.injury;
      if (injury) {
        const weeksLeft = injury.weeksLeft - 1;
        injury = weeksLeft <= 0 ? null : { ...injury, weeksLeft };
      }
      if (upd && upd.injury) injury = upd.injury;
      const contractWeeksLeft = Math.max(0, w.contractWeeksLeft - 1);
      const newInjury = !!(upd && upd.injury);
      const matchedThisWeek = !!(upd && upd.matchInc);
      const justRecovered = wasInjured && !injury && !newInjury;
      const confidence = clamp((w.confidence || 50) + (upd ? upd.confGain || 0 : 0) - (justRecovered ? 15 : 0), 5, 100);
      return {
        ...w,
        popularity: clamp(w.popularity + (upd ? upd.popDelta : 0), 0, 100),
        morale: clamp(w.morale + (upd ? upd.moraleDelta : 0) + passiveMorale - (contractWeeksLeft === 0 ? 5 : 0), 0, 100),
        condition, injury, contractWeeksLeft, confidence,
        matchesWrestled: w.matchesWrestled + (upd ? upd.matchInc || 0 : 0),
        merchEarnings: w.merchEarnings + (upd ? upd.merchEarned || 0 : 0),
        careerInjuries: (w.careerInjuries || 0) + (newInjury ? 1 : 0),
        matchesSinceInjury: newInjury ? 0 : (matchedThisWeek ? (w.matchesSinceInjury || 0) + 1 : (w.matchesSinceInjury || 0)),
      };
    });

    const expired = updatedRoster.filter((w) => w.contractWeeksLeft === 0);
    let stillRoster = updatedRoster.filter((w) => w.contractWeeksLeft > 0);
    let freeAgents = [...game.freeAgents, ...expired.map((w) => ({ ...w, contractWeeksLeft: randInt(10, 20) }))];

    let nextWeek = game.company.week + 1; let nextYear = game.company.year;
    if (nextWeek > 52) { nextWeek = 1; nextYear += 1; }
    const yearRolled = nextYear > game.company.year;

    const retirementNews = [];
    if (yearRolled) {
      const aged = stillRoster.map((w) => ({ ...w, age: w.age + 1 }));
      const retiring = aged.filter((w) => Math.random() < retirementChance(w.age));
      retiring.forEach((w) => retirementNews.push(`${w.name} (${w.age}) has announced their retirement from the ring.`));
      const retiredIds = new Set(retiring.map((w) => w.id));
      stillRoster = aged.filter((w) => !retiredIds.has(w.id));
    }

    let tvDeal = game.company.tvDeal;
    const tvNews = [];
    if (tvDeal) {
      const network = TV_NETWORKS.find((n) => n.id === tvDeal.networkId);
      const metRating = result.avgStars >= network.ratingReq;
      const strikes = metRating ? Math.max(0, tvDeal.strikes - 1) : tvDeal.strikes + 1;
      if (strikes >= TV_STRIKE_LIMIT) {
        tvNews.push(`${network.name} has canceled your TV deal after disappointing ratings.`);
        tvDeal = null;
      } else {
        const weeksRemaining = tvDeal.weeksRemaining - 1;
        if (weeksRemaining <= 0) {
          tvNews.push(`Your TV deal with ${network.name} has expired. Time to negotiate a new one.`);
          tvDeal = null;
        } else {
          if (!metRating) tvNews.push(`${network.name} isn't thrilled with a ${result.avgStars.toFixed(1)}★ show — ${strikes}/${TV_STRIKE_LIMIT} strikes.`);
          tvDeal = { ...tvDeal, weeksRemaining, strikes };
        }
      }
    }

    const rivalNews = [];
    const worldEventAdds = [];
    let rivalRepTrickle = 0;
    let nextStaffPool = game.staffPool;
    let nextFreeAgentsFromRivals = [];
    let nextRivals = game.rivals.map((rival) => {
      const ticked = tickRivalPromotion(rival);
      if (rival.relationship === 'pact') rivalRepTrickle += 0.6;
      else if (rival.relationship === 'ally') rivalRepTrickle += 0.3;

      let roster = (ticked.roster || []).map((w) => {
        const weeksLeft = w.contractWeeksLeft - 1;
        if (weeksLeft > 0) {
          const drift = ticked.momentum < 0 ? -randInt(0, 3) : ticked.momentum > 0 ? randInt(-1, 2) : randInt(-1, 1);
          return { ...w, contractWeeksLeft: weeksLeft, rivalHappiness: clamp(w.rivalHappiness + drift, 5, 98) };
        }
        const renewChance = clamp(w.rivalHappiness / 130, 0.15, 0.8);
        if (Math.random() < renewChance) return { ...w, contractWeeksLeft: randInt(15, 40), rivalHappiness: clamp(w.rivalHappiness + randInt(-5, 10), 5, 98) };
        return null;
      });
      const departed = (ticked.roster || []).filter((_, i) => roster[i] === null);
      roster = roster.filter(Boolean);
      departed.forEach((w) => {
        nextFreeAgentsFromRivals.push({ ...w, discoveredVia: `formerly of ${ticked.name}` });
        rivalNews.push(`${w.name} is a free agent after leaving ${ticked.name}.`);
        worldEventAdds.push({ type: 'departure', week: game.company.week, year: game.company.year, rivalName: ticked.name, targetName: w.name, text: `${w.name} left ${ticked.name} as their contract ran out.` });
      });

      if (freeAgents.length && Math.random() < rivalPoachChance(ticked)) {
        const target = pick(freeAgents);
        freeAgents = freeAgents.filter((w) => w.id !== target.id);
        rivalNews.push(`${ticked.name} signed free agent ${target.name}.`);
        worldEventAdds.push({ type: 'poach', week: game.company.week, year: game.company.year, rivalName: ticked.name, targetName: target.name, text: `${ticked.name} signed free agent ${target.name}.` });
      } else if (Math.random() < 0.2) {
        const isUp = ticked.momentum >= 0;
        const flavor = isUp ? pick(RIVAL_FLAVOR_UP) : pick(RIVAL_FLAVOR_DOWN);
        rivalNews.push(`${ticked.name} ${flavor}.`);
        worldEventAdds.push({ type: isUp ? 'flavor_up' : 'flavor_down', week: game.company.week, year: game.company.year, rivalName: ticked.name, text: `${ticked.name} ${flavor}.` });
      }

      if (Math.random() < rivalPoachChance(ticked) * 0.6) {
        const roles = ['Announcer', 'Commentator', 'Referee', 'Writer', 'Road Agent'].filter((r) => (nextStaffPool[staffRoleKey(r)] || []).length > 0);
        if (roles.length) {
          const role = pick(roles);
          const key = staffRoleKey(role);
          const candidate = pick(nextStaffPool[key]);
          nextStaffPool = { ...nextStaffPool, [key]: nextStaffPool[key].filter((s) => s.id !== candidate.id) };
          rivalNews.push(`${ticked.name} hired away ${candidate.name} before you got the chance.`);
          worldEventAdds.push({ type: 'staff_poach', week: game.company.week, year: game.company.year, rivalName: ticked.name, targetName: candidate.name, text: `${ticked.name} hired ${role.toLowerCase()} ${candidate.name} out from under you.` });
        }
      }

      return { ...ticked, roster, flagshipTalent: flagshipFromRoster(roster) };
    });
    if (nextFreeAgentsFromRivals.length) freeAgents = [...freeAgents, ...nextFreeAgentsFromRivals];
    const consolidation = processRivalConsolidation(nextRivals);
    nextRivals = consolidation.rivals;
    consolidation.news.forEach((n) => {
      rivalNews.push(n);
      worldEventAdds.push({ type: n.startsWith('A new promotion') ? 'launch' : 'consolidation', week: game.company.week, year: game.company.year, text: n });
    });

    let nextInbox = (game.inbox || []).filter((o) => !(game.company.year > o.expiresYear || (game.company.year === o.expiresYear && game.company.week > o.expiresWeek)));
    const newOffer = maybeGenerateRivalOffer(game.company, stillRoster, nextRivals, nextInbox);
    if (newOffer) {
      nextInbox = [...nextInbox, newOffer];
      rivalNews.push(`New offer in your inbox: ${newOffer.text}`);
    }

    const FA_POOL_MIN = 12;
    const FA_POOL_CAP = 30;
    if (freeAgents.length < FA_POOL_CAP) {
      const chance = freeAgents.length < FA_POOL_MIN ? 0.85 : 0.5;
      if (Math.random() < chance) {
        const tier = pick(['Jobber', 'Jobber', 'Rookie', 'Rookie', 'Rookie', 'Mid-Card']);
        const fresh = generateWrestler(tier, game.company.region, game.company.style);
        freeAgents = [...freeAgents, fresh];
        rivalNews.push(`New face on the free agent market: ${fresh.name}, fresh off the local scene.`);
        if (freeAgents.length < FA_POOL_CAP && Math.random() < 0.25) {
          const tier2 = pick(['Jobber', 'Rookie', 'Rookie', 'Mid-Card']);
          const fresh2 = generateWrestler(tier2, game.company.region, game.company.style);
          freeAgents = [...freeAgents, fresh2];
          rivalNews.push(`Another name hit the market this week: ${fresh2.name}.`);
        }
      }
    }

    const STAFF_POOL_CAP = 6;
    ['Announcer', 'Commentator', 'Referee', 'Writer', 'Road Agent'].forEach((role) => {
      const key = staffRoleKey(role);
      const pool = nextStaffPool[key] || [];
      if (pool.length < STAFF_POOL_CAP && Math.random() < (pool.length < 3 ? 0.6 : 0.3)) {
        nextStaffPool = { ...nextStaffPool, [key]: [...pool, generateStaff(role)] };
      }
    });

    let nextTagTeams = game.tagTeams
      .map((t) => {
        const teamedUp = result.matchResults.some((m) => t.memberIds.every((id) => m.participantIds.includes(id)));
        if (teamedUp) {
          const savant = t.memberIds.some((id) => hasTrait(game.roster.find((r) => r.id === id), 'chemistry_savant'));
          const lone = t.memberIds.some((id) => hasTrait(game.roster.find((r) => r.id === id), 'lone_wolf'));
          const growth = clamp(6 + (savant ? 3 : 0) - (lone ? 3 : 0), 1, 12);
          return { ...t, chemistry: clamp(t.chemistry + growth, 0, 100), matchesTogether: t.matchesTogether + 1 };
        }
        return { ...t, chemistry: clamp(t.chemistry - 2, 0, 100) };
      })
      .filter((t) => t.memberIds.every((id) => stillRoster.some((r) => r.id === id)));

    const allSegments = [...result.matchResults.map((m) => m.participantIds), ...result.promoResults.map((p) => p.participantIds)];
    let stableRepBonus = 0;
    let nextStables = game.stables
      .map((s) => {
        const appearedTogether = allSegments.some((ids) => s.memberIds.filter((id) => ids.includes(id)).length >= 2);
        if (appearedTogether) { stableRepBonus += Math.round(s.cohesion / 50); return { ...s, cohesion: clamp(s.cohesion + 4, 0, 100) }; }
        return { ...s, cohesion: clamp(s.cohesion - 1, 0, 100) };
      })
      .map((s) => ({ ...s, memberIds: s.memberIds.filter((id) => stillRoster.some((r) => r.id === id)) }))
      .filter((s) => s.memberIds.length >= 2)
      .map((s) => (s.memberIds.includes(s.leaderId) ? s : { ...s, leaderId: s.memberIds[0] }));

    const feudNews = [];
    let feudRepBonus = 0;
    const roadAgentsForHeat = game.staff.roadAgents || [];
    const roadAgentQualityForHeat = roadAgentsForHeat.length ? average(roadAgentsForHeat.map((r) => staffEffectiveQuality(r))) : 50;
    const roadAgentHeatMultForFeuds = clamp(1 + (roadAgentQualityForHeat - 50) / 150, 0.7, 1.35);
    let nextFeuds = game.feuds.map((feud) => {
      if (feud.status === 'ended') return feud;
      if (!stillRoster.some((r) => r.id === feud.aId) || !stillRoster.some((r) => r.id === feud.bId)) return { ...feud, status: 'ended' };
      if (feud.aPartnerId && !stillRoster.some((r) => r.id === feud.aPartnerId)) return { ...feud, status: 'ended' };
      if (feud.bPartnerId && !stillRoster.some((r) => r.id === feud.bPartnerId)) return { ...feud, status: 'ended' };
      let updated = feud;
      let touched = false;
      result.matchResults.forEach((m) => {
        if (feudPairPresent(feud, m.participantIds)) {
          const isBlowOff = m.feudBlowOffId === feud.id;
          if (isBlowOff) {
            feudRepBonus += clamp(Math.round(updated.heat / 40), 1, 4);
            feudNews.push(`${feud.aName} and ${feud.bName} finally settle their feud in the blow-off match!`);
            addStoryline(feud.aId, `Settled the score with ${feud.bName} in a blow-off match.`);
            addStoryline(feud.bId, `Settled the score with ${feud.aName} in a blow-off match.`);
          }
          updated = advanceFeudFromMatch(updated, m.result.finalStars, m.finishId, isBlowOff, game.company.week, game.company.year, roadAgentHeatMultForFeuds);
          touched = true;
        }
      });
      result.promoResults.forEach((p) => {
        if (feudPairPresent(feud, p.participantIds)) {
          const storyBeat = p.storyBeatId && (p.feudId === feud.id || !p.feudId) ? STORY_BEATS.find((b) => b.id === p.storyBeatId) : null;
          updated = advanceFeudFromPromo(updated, p.purpose, game.company.week, game.company.year, storyBeat);
          if (storyBeat) addStoryline(feud.aId, `Story beat: ${storyBeat.label} with ${feud.bName}.`);
          touched = true;
        }
      });
      if (!touched) updated = { ...updated, heat: clamp(updated.heat - FEUD_HEAT_DECAY, 0, 100) };
      return updated;
    });

    const titleNews = [];
    const changedTitleIds = new Set();
    const nextTitles = game.titles.map((title) => {
      const titleMatch = result.matchResults.find((m) => m.titleId === title.id);
      if (!titleMatch) return title;
      const winnerIds = titleMatch.winnerIds;
      const winnerNames = winnerIds.map((id) => (game.roster.find((r) => r.id === id) || {}).name || '???');
      const { title: nextTitle, changed } = resolveTitleMatch(title, winnerIds, winnerNames, titleMatch.finishId, game.company.week, game.company.year);
      if (changed) {
        changedTitleIds.add(title.id);
        titleNews.push(title.holderIds.length ? `${winnerNames.join(' & ')} defeated the champion to win the ${title.name}!` : `${winnerNames.join(' & ')} won the vacant ${title.name}!`);
        winnerIds.forEach((id) => addStoryline(id, `Won the ${title.name}!`));
        title.holderIds.forEach((id) => addStoryline(id, `Lost the ${title.name}.`));
      } else if (titleMatch.finishId === 'dq' || titleMatch.finishId === 'countout') {
        titleNews.push(`The ${title.name} does not change hands on a ${FINISH_TYPES.find((f) => f.id === titleMatch.finishId).label.toLowerCase()}.`);
      }
      return nextTitle;
    });

    const ambitionNews = [];
    const ambitionCtx = { matchResults: result.matchResults, venue: result.venue, cardOrder: draftShow.card, nextTitles, nextTagTeams, nextStables };
    const departingIds = new Set();
    let bossRepFromDepartures = 0;
    let rosterAfterAmbitions = stillRoster.map((w) => {
      const amb = w.ambition || assignWrestlerAmbition();
      const fulfilled = checkWrestlerAmbitionFulfilled(w, amb, ambitionCtx);
      const { ambition: nextAmb, news } = tickAmbition(w, amb, fulfilled, WRESTLER_AMBITIONS, stillRoster);
      if (news) { ambitionNews.push(news); addStoryline(w.id, news); }
      if (nextAmb.satisfaction <= 0) {
        departingIds.add(w.id);
        bossRepFromDepartures -= 1;
        const rival = game.rivals.length ? pick(game.rivals) : null;
        ambitionNews.push(rival ? `${w.name} has left ${game.company.name} to sign with ${rival.name}, citing unmet ambitions.` : `${w.name} has walked out on ${game.company.name}, citing unmet ambitions.`);
      }
      return { ...w, ambition: nextAmb };
    });
    let nextRivalsWithSignings = nextRivals;
    if (departingIds.size) {
      rosterAfterAmbitions = rosterAfterAmbitions.filter((w) => !departingIds.has(w.id));
      nextRivalsWithSignings = nextRivals.map((r) => (Math.random() < 0.4 ? { ...r, reputation: clamp(r.reputation + 2, 0, 100) } : r));
    }
    const traitEvolutionNews = [];
    rosterAfterAmbitions = rosterAfterAmbitions.map((w) => {
      const { traits, news: tNews } = evolveWrestlerTraits(w, ambitionCtx);
      tNews.forEach((n) => { traitEvolutionNews.push(n); addStoryline(w.id, n); });
      return { ...w, traits };
    });
    const wellnessNews = [];
    let wellnessRepPenalty = 0;
    let contractPromiseBossRep = 0;
    let contractPromiseTrustDelta = 0;
    rosterAfterAmbitions = rosterAfterAmbitions.map((w) => {
      const { wellness, news: wNews, repPenalty } = tickWellness(w);
      if (wNews) { wellnessNews.push(wNews); addStoryline(w.id, wNews); }
      wellnessRepPenalty += repPenalty;
      const { contractPromise, news: promiseNews, moraleDelta, bossRepDelta } = checkContractPromise(w, ambitionCtx, game.company.week, game.company.year);
      if (promiseNews) { wellnessNews.push(promiseNews); addStoryline(w.id, promiseNews); }
      contractPromiseBossRep += bossRepDelta;
      contractPromiseTrustDelta += bossRepDelta > 0 ? 1 : bossRepDelta < 0 ? -2 : 0;
      return { ...w, wellness, contractPromise, morale: clamp(w.morale + moraleDelta, 0, 100) };
    });

    const relationshipNews = [];
    const relationshipMoraleDeltas = {};
    const relBonus = { friends: 3, family: 5, spouses: 6, rivals: 0 };
    let nextRelationships = game.relationships.map((rel) => {
      if (departingIds.has(rel.aId) || departingIds.has(rel.bId)) return rel;
      const sharedSegment = allSegments.some((ids) => ids.includes(rel.aId) && ids.includes(rel.bId));
      if (!sharedSegment) return rel;
      if (rel.type === 'rivals') {
        const activeFeudBetween = game.feuds.some((f) => f.status !== 'ended' && ((f.aId === rel.aId && f.bId === rel.bId) || (f.aId === rel.bId && f.bId === rel.aId)));
        if (!activeFeudBetween) {
          relationshipMoraleDeltas[rel.aId] = (relationshipMoraleDeltas[rel.aId] || 0) - 4;
          relationshipMoraleDeltas[rel.bId] = (relationshipMoraleDeltas[rel.bId] || 0) - 4;
        }
        return { ...rel, strength: clamp(rel.strength - 2, 0, 100) };
      }
      const bonus = relBonus[rel.type] || 3;
      relationshipMoraleDeltas[rel.aId] = (relationshipMoraleDeltas[rel.aId] || 0) + bonus;
      relationshipMoraleDeltas[rel.bId] = (relationshipMoraleDeltas[rel.bId] || 0) + bonus;
      return { ...rel, strength: clamp(rel.strength + 3, 0, 100) };
    });
    if (departingIds.size) {
      nextRelationships.forEach((rel) => {
        const aGone = departingIds.has(rel.aId); const bGone = departingIds.has(rel.bId);
        if ((aGone || bGone) && (rel.type === 'spouses' || rel.type === 'family' || rel.type === 'friends')) {
          const survivorId = aGone ? rel.bId : rel.aId;
          const goneName = aGone ? rel.aName : rel.bName;
          relationshipMoraleDeltas[survivorId] = (relationshipMoraleDeltas[survivorId] || 0) - (rel.type === 'spouses' ? 20 : rel.type === 'family' ? 14 : 8);
          relationshipNews.push(`${goneName}'s departure has hit ${aGone ? rel.bName : rel.aName} hard.`);
          addStoryline(survivorId, `${goneName}'s departure hit them hard.`);
        }
      });
      nextRelationships = nextRelationships.filter((rel) => !departingIds.has(rel.aId) && !departingIds.has(rel.bId));
    }
    allSegments.forEach((ids) => {
      if (ids.length < 2 || nextRelationships.length > 60) return;
      if (Math.random() > 0.05) return;
      const shuffled = [...ids].sort(() => Math.random() - 0.5);
      const [aId, bId] = shuffled;
      if (!aId || !bId || aId === bId) return;
      const exists = nextRelationships.some((r) => (r.aId === aId && r.bId === bId) || (r.aId === bId && r.bId === aId));
      if (exists) return;
      const a = stillRoster.find((r) => r.id === aId); const b = stillRoster.find((r) => r.id === bId);
      if (!a || !b) return;
      nextRelationships = [...nextRelationships, createRelationshipObject(a.id, a.name, b.id, b.name, 'friends', game.company.week, game.company.year)];
      relationshipNews.push(`${a.name} and ${b.name} have become friends backstage.`);
      addStoryline(a.id, `Became friends with ${b.name} backstage.`);
      addStoryline(b.id, `Became friends with ${a.name} backstage.`);
    });
    if (Object.keys(relationshipMoraleDeltas).length) {
      rosterAfterAmbitions = rosterAfterAmbitions.map((w) => (
        relationshipMoraleDeltas[w.id] ? { ...w, morale: clamp(w.morale + relationshipMoraleDeltas[w.id], 0, 100) } : w
      ));
    }
    stillRoster = rosterAfterAmbitions;
    if (Object.keys(storylineAdds).length) {
      stillRoster = stillRoster.map((w) => {
        const adds = storylineAdds[w.id];
        if (!adds || !adds.length) return w;
        const entries = adds.map((text) => ({ week: game.company.week, year: game.company.year, text }));
        return { ...w, storyline: [...(w.storyline || []), ...entries].slice(-20) };
      });
    }

    const staffAmbitionNews = [];
    function tickStaffGroup(list) {
      return list.map((s) => {
        const amb = s.ambition || assignStaffAmbition();
        const fulfilled = checkStaffAmbitionFulfilled(s, amb, ambitionCtx);
        const { ambition: nextAmb, news } = tickAmbition(s, amb, fulfilled, STAFF_AMBITIONS, null);
        if (news) staffAmbitionNews.push(news);
        const withTenure = { ...s, ambition: nextAmb, weeksEmployed: s.weeksEmployed + 1 };
        const { trait, news: traitNews } = evolveStaffTrait(withTenure);
        traitNews.forEach((n) => traitEvolutionNews.push(n));
        return { ...withTenure, trait };
      });
    }
    const nextStaff = { announcers: tickStaffGroup(game.staff.announcers), commentators: tickStaffGroup(game.staff.commentators), referees: tickStaffGroup(game.staff.referees || []), writers: tickStaffGroup(game.staff.writers || []), roadAgents: tickStaffGroup(game.staff.roadAgents || []) };

    if (departingIds.size) {
      nextTagTeams = nextTagTeams.filter((t) => t.memberIds.every((id) => !departingIds.has(id)));
      nextStables = nextStables
        .map((s) => ({ ...s, memberIds: s.memberIds.filter((id) => !departingIds.has(id)) }))
        .filter((s) => s.memberIds.length >= 2)
        .map((s) => (s.memberIds.includes(s.leaderId) ? s : { ...s, leaderId: s.memberIds[0] }));
      nextFeuds = nextFeuds.map((f) => (departingIds.has(f.aId) || departingIds.has(f.bId) ? { ...f, status: 'ended' } : f));
    }

    const newsEntries = [];
    newsEntries.push(`Week ${game.company.week}: the ${result.venue.name} show drew ${result.attendance.toLocaleString()} fans, averaging ${result.avgStars.toFixed(1)}★.`);
    result.matchResults.forEach((m) => m.result.injuries.forEach((inj) => {
      const w = game.roster.find((r) => r.id === inj.wrestlerId);
      newsEntries.push(`${w ? w.name : 'A wrestler'} suffered a ${inj.label.toLowerCase()} — out ${inj.weeksLeft} week${inj.weeksLeft > 1 ? 's' : ''}.`);
    }));
    expired.forEach((w) => newsEntries.push(`${w.name}'s contract expired and hit the open market.`));
    titleNews.forEach((n) => newsEntries.push(n));
    feudNews.forEach((n) => newsEntries.push(n));
    retirementNews.forEach((n) => newsEntries.push(n));
    tvNews.forEach((n) => newsEntries.push(n));
    rivalNews.forEach((n) => newsEntries.push(n));
    ambitionNews.forEach((n) => newsEntries.push(n));
    staffAmbitionNews.forEach((n) => newsEntries.push(n));
    traitEvolutionNews.forEach((n) => newsEntries.push(n));
    wellnessNews.forEach((n) => newsEntries.push(n));
    relationshipNews.forEach((n) => newsEntries.push(n));
    newsEntries.push(result.netProfit >= 0 ? `The show turned a profit of ${money(result.netProfit)}.` : `The show lost ${money(Math.abs(result.netProfit))}.`);

    let nextPartner = game.partner;
    if (nextPartner && nextPartner.relationship) {
      const deltas = partnerShowDeltas(nextPartner.archetypeId, result.avgStars, result.netProfit);
      if (contractPromiseTrustDelta) deltas.trust = (deltas.trust || 0) + contractPromiseTrustDelta;
      if (Object.keys(deltas).length) {
        nextPartner = { ...nextPartner, relationship: nudgePartnerRelationship(nextPartner.relationship, deltas, null, game.company.week, game.company.year) };
      }
    }

    const historyEntry = {
      week: game.company.week, year: game.company.year, venueName: result.venue.name,
      showName: draftShow.showName || `${game.company.name} Wrestling`,
      attendance: result.attendance, capacity: result.venue.capacity, avgStars: Number(result.avgStars.toFixed(2)),
      netProfit: result.netProfit, revenue: result.revenue, expenses: result.expenses, repDelta: result.repDelta,
      grade: showLetterGrade({ attendance: result.attendance, capacity: result.venue.capacity, avgStars: result.avgStars, netProfit: result.netProfit }),
      matches: result.matchResults.map((m) => ({
        label: m.participantIds.map((id) => (game.roster.find((r) => r.id === id) || {}).name || '???').join(' vs '),
        stars: m.result.finalStars,
        winner: m.winnerIds.map((id) => (game.roster.find((r) => r.id === id) || {}).name || '???').join(' & '),
        titleName: m.titleId ? (game.titles.find((t) => t.id === m.titleId) || {}).name : null,
        titleChanged: m.titleId ? changedTitleIds.has(m.titleId) : false,
        blowOff: !!(m.feudBlowOffId && game.feuds.find((f) => f.id === m.feudBlowOffId)),
      })),
    };

    let matchResearch = game.company.matchResearch;
    if (matchResearch.inProgress) {
      const weeksRemaining = matchResearch.inProgress.weeksRemaining - 1;
      if (weeksRemaining <= 0) {
        const def = RESEARCHABLE_MATCH_TYPES.find((t) => t.id === matchResearch.inProgress.typeId);
        matchResearch = { unlockedTypes: [...matchResearch.unlockedTypes, matchResearch.inProgress.typeId], inProgress: null };
        newsEntries.push(`R&D complete — the ${def ? def.label : 'new match type'} is ready to book!`);
      } else {
        matchResearch = { ...matchResearch, inProgress: { ...matchResearch.inProgress, weeksRemaining } };
      }
    }

    let nextMediaRecaps = game.mediaRecaps;
    if (game.company.week % 4 === 0) {
      const sliceStart = game.company.week - 3;
      const recapSlice = [historyEntry, ...game.history].filter((h) => h.year === game.company.year && h.week >= sliceStart && h.week <= game.company.week);
      const monthNum = Math.ceil(game.company.week / 4);
      const recap = generateMonthlyRecap(recapSlice, stillRoster, monthNum, game.company.year, game.company.journalists, nextRivalsWithSignings, [...worldEventAdds, ...(game.worldEvents || [])]);
      nextMediaRecaps = [recap, ...game.mediaRecaps].slice(0, 24);
      newsEntries.push(`Wrestling media has published its Month ${monthNum} recap.`);
      (recap.press || []).forEach((p) => addDevLog('journalist', `${p.name} (${p.title}) said: "${p.take}"`));
      if (nextPartner && nextPartner.relationship) {
        const momentText = `${nextPartner.name}: "${partnerRelationshipReadout(nextPartner.relationship)}"`;
        newsEntries.push(momentText);
        nextPartner = { ...nextPartner, relationship: { ...nextPartner.relationship, history: [...nextPartner.relationship.history, { week: game.company.week, year: game.company.year, text: momentText }].slice(-20) } };
      }
    }

    const nextReputation = clamp(Math.round(game.company.reputation + result.repDelta + stableRepBonus + feudRepBonus - wellnessRepPenalty + rivalRepTrickle), 0, 100);
    const priorMilestones = game.company.mediaInterviewMilestones || [];
    const crossedMilestone = MEDIA_INTERVIEW_MILESTONES.find((m) => game.company.reputation < m && nextReputation >= m && !priorMilestones.includes(m));
    let nextMilestones = priorMilestones;
    if (crossedMilestone) {
      nextMilestones = [...priorMilestones, crossedMilestone];
      const journalist = game.company.journalists && game.company.journalists.length ? pick(game.company.journalists) : null;
      if (journalist) newsEntries.push(mediaInterviewQuote(game.company, journalist, crossedMilestone));
    }

    const matchesOnCard = draftShow.card.filter((s) => s.kind === 'match').length;
    const hardcoreMatchesOnCard = draftShow.card.filter((s) => s.kind === 'match' && WEAPONS_MATCH_TYPES.includes(s.typeId)).length;
    const ringWear = 6 + matchesOnCard * 2 + hardcoreMatchesOnCard * 3;
    const nextRingCondition = clamp((game.company.ringCondition !== undefined ? game.company.ringCondition : 100) - ringWear, 0, 100);
    const suppliesUsed = 5 + Math.round(result.attendance / 50);
    const nextSupplies = clamp((game.company.supplies !== undefined ? game.company.supplies : 100) - suppliesUsed, 0, 100);
    if (nextRingCondition <= 25) newsEntries.push('The ring is showing serious wear — worth repairing before it becomes a safety issue.');
    if (nextSupplies <= 25) newsEntries.push('Concessions, merch, and weapons stock are running low — time to restock.');

    const nextGame = {
      ...game,
      company: {
        ...game.company,
        funds: game.company.funds + result.netProfit,
        reputation: nextReputation,
        mediaInterviewMilestones: nextMilestones,
        bossReputation: clamp((game.company.bossReputation !== undefined ? game.company.bossReputation : 50) + bossRepFromDepartures + contractPromiseBossRep, 0, 100),
        week: nextWeek, year: nextYear,
        weekDay: 1,
        unavailableVenueIds: [],
        ringCondition: nextRingCondition,
        supplies: nextSupplies,
        tvDeal,
        matchResearch,
      },
      roster: stillRoster,
      freeAgents,
      staff: nextStaff,
      staffPool: nextStaffPool,
      titles: nextTitles,
      tagTeams: nextTagTeams,
      stables: nextStables,
      feuds: nextFeuds,
      relationships: nextRelationships,
      inbox: nextInbox,
      partner: nextPartner,
      devLog: [...devLogAdds.map((d) => ({ ...d })).reverse(), ...(game.devLog || [])].slice(0, 60),
      worldEvents: [...worldEventAdds, ...(game.worldEvents || [])].slice(0, 120),
      rivals: nextRivalsWithSignings,
      mediaRecaps: nextMediaRecaps,
      history: [historyEntry, ...game.history].slice(0, 60),
      news: [...newsEntries.reverse(), ...game.news].slice(0, 30),
      draftShow: makeEmptyDraft(),
    };

    setShowResult({ ...result, historyEntry, week: game.company.week });
    updateGame(nextGame);
    setTab('dashboard');
  }

  /* ---------- Loading / setup screens ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.ink }}>
        <style>{FONT_STYLE}</style>
        <Loader2 className="animate-spin" color={C.gold} size={28} />
      </div>
    );
  }

  if (needsSetup || !game) {
    const livePreviewTheme = setupThemeMode === 'custom'
      ? { gold: setupCustomGold, goldSoft: shadeHex(setupCustomGold, 45), rope: setupCustomRope, ropeDark: shadeHex(setupCustomRope, -25) }
      : (THEME_PRESETS.find((t) => t.id === setupThemePresetId) || THEME_PRESETS[0]);
    const modeReady = (setupMode === 'preset' && setupPresetId) || (setupMode === 'custom' && setupRegion && setupStyle);

    function pickPreset(preset) {
      setSetupMode('preset'); setSetupPresetId(preset.id);
      setSetupRegion(preset.region); setSetupStyle(preset.style);
      setSetupName(preset.name);
      if (preset.fundsTierId) setSetupFundsTierId(preset.fundsTierId);
    }

    return (
      <div className="wgm-root min-h-screen p-6" style={{ backgroundColor: C.ink }}>
        <style>{FONT_STYLE}</style>
        <style>{themeCssVars(livePreviewTheme)}</style>
        <div className="w-full max-w-sm mx-auto text-center pb-10">
          <Trophy size={36} color={C.gold} className="mx-auto mb-2" />
          <h1 className="wgm-display text-4xl mb-1" style={{ color: C.cream }}>BOOKED</h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(246,240,225,0.6)' }}>Build a wrestling promotion from a folding-chair territory into a global powerhouse.</p>

          <div className="flex items-center gap-2 mb-2">
            <Building2 size={14} color={C.gold} />
            <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>1. START FROM SCRATCH OR PICK A PRESET</p>
          </div>
          <button onClick={() => { setSetupMode('custom'); setSetupPresetId(''); }} className="w-full rounded-lg p-3 text-left mb-2" style={{ backgroundColor: setupMode === 'custom' ? C.gold : C.inkSoft, border: `1px solid ${setupMode === 'custom' ? C.gold : C.inkFaint}` }}>
            <p className="text-sm font-bold" style={{ color: setupMode === 'custom' ? C.ink : C.cream }}>Start From Scratch</p>
            <p className="text-[11px]" style={{ color: setupMode === 'custom' ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>Pick your own region and style.</p>
          </button>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {PRESET_COMPANIES.map((p) => {
              const active = setupMode === 'preset' && setupPresetId === p.id;
              const regionLabel = (REGION_LIST.find((r) => r.id === p.region) || {}).label;
              const styleLabel = (STYLE_CONFIG[p.style] || {}).label;
              return (
                <button key={p.id} onClick={() => pickPreset(p)} className="rounded-lg p-2.5 text-left" style={{ backgroundColor: active ? C.gold : C.inkSoft, border: `1px solid ${active ? C.gold : C.inkFaint}` }}>
                  <p className="text-xs font-bold" style={{ color: active ? C.ink : C.cream }}>{p.name}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: active ? C.inkSoft : 'rgba(246,240,225,0.5)' }}>{regionLabel} · {styleLabel}</p>
                  <p className="text-[9px] mt-1" style={{ color: active ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{p.blurb}</p>
                </button>
              );
            })}
          </div>

          {setupMode === 'custom' && (
            <div className="wgm-pop">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={14} color={C.gold} />
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>REGION</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {REGION_LIST.map((r) => (
                  <button key={r.id} onClick={() => setSetupRegion(r.id)} className="rounded-lg p-2.5 text-left" style={{ backgroundColor: setupRegion === r.id ? C.gold : C.inkSoft, border: `1px solid ${setupRegion === r.id ? C.gold : C.inkFaint}` }}>
                    <p className="text-xs font-bold" style={{ color: setupRegion === r.id ? C.ink : C.cream }}>{r.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: setupRegion === r.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{r.blurb}</p>
                  </button>
                ))}
              </div>

              {setupRegion && (
                <div className="wgm-pop">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame size={14} color={C.gold} />
                    <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>STYLE</p>
                  </div>
                  <div className="space-y-2 mb-6">
                    {STYLE_LIST.map((s) => (
                      <button key={s.id} onClick={() => setSetupStyle(s.id)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: setupStyle === s.id ? C.gold : C.inkSoft, border: `1px solid ${setupStyle === s.id ? C.gold : C.inkFaint}` }}>
                        <p className="text-sm font-bold" style={{ color: setupStyle === s.id ? C.ink : C.cream }}>{s.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: setupStyle === s.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{s.blurb}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {modeReady && (
            <div className="wgm-pop">
              <p className="wgm-mono text-[11px] tracking-widest mb-2" style={{ color: C.goldSoft }}>2. NAME YOUR PROMOTION</p>
              <input
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="Name your promotion"
                className="w-full rounded-md px-4 py-3 mb-6 text-sm outline-none"
                style={{ backgroundColor: C.inkSoft, color: C.cream, border: `1px solid ${C.inkFaint}` }}
              />

              <div className="flex items-center gap-2 mb-2">
                <Users size={14} color={C.gold} />
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>3. WORLD SIZE</p>
              </div>
              <p className="text-[11px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>Rival promotions competing with you</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {RIVAL_COUNT_OPTIONS.map((n) => (
                  <button key={n} onClick={() => setSetupRivalCount(n)} className="rounded-lg py-2 text-sm font-bold" style={{ backgroundColor: setupRivalCount === n ? C.gold : C.inkSoft, color: setupRivalCount === n ? C.ink : C.cream }}>{n}</button>
                ))}
              </div>

              <p className="text-[11px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>Starting funds</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {FUNDS_TIERS.map((f) => (
                  <button key={f.id} onClick={() => setSetupFundsTierId(f.id)} className="rounded-lg p-2 text-left" style={{ backgroundColor: setupFundsTierId === f.id ? C.gold : C.inkSoft, border: `1px solid ${setupFundsTierId === f.id ? C.gold : C.inkFaint}` }}>
                    <p className="text-xs font-bold" style={{ color: setupFundsTierId === f.id ? C.ink : C.cream }}>{f.label}</p>
                    <p className="wgm-mono text-[9px]" style={{ color: setupFundsTierId === f.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{money(f.funds)}</p>
                  </button>
                ))}
              </div>

              <p className="text-[11px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>Difficulty</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {Object.values(DIFFICULTY_CONFIG).map((d) => (
                  <button key={d.id} onClick={() => setSetupDifficultyId(d.id)} className="rounded-lg p-2 text-left" style={{ backgroundColor: setupDifficultyId === d.id ? C.gold : C.inkSoft, border: `1px solid ${setupDifficultyId === d.id ? C.gold : C.inkFaint}` }}>
                    <p className="text-xs font-bold" style={{ color: setupDifficultyId === d.id ? C.ink : C.cream }}>{d.label}</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Users size={14} color={C.gold} />
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>4. YOUR BACKGROUND</p>
              </div>
              <p className="text-[11px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>Who are you before day one?</p>
              <div className="space-y-2 mb-6">
                {BOSS_BACKGROUNDS.map((b) => (
                  <button key={b.id} onClick={() => setSetupBackgroundId(b.id)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: setupBackgroundId === b.id ? C.gold : C.inkSoft, border: `1px solid ${setupBackgroundId === b.id ? C.gold : C.inkFaint}` }}>
                    <p className="text-sm font-bold" style={{ color: setupBackgroundId === b.id ? C.ink : C.cream }}>{b.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: setupBackgroundId === b.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{b.blurb}</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <UserCircle size={14} color={C.gold} />
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>5. MEET YOUR PARTNER</p>
              </div>
              <div className="rounded-lg p-3 mb-6" style={{ backgroundColor: C.inkSoft, border: `1px solid ${C.inkFaint}` }}>
                <p className="text-sm font-bold mb-0.5" style={{ color: C.cream }}>{setupPartner.name} — {setupPartner.label}</p>
                <p className="text-[11px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>{setupPartner.dream}</p>
                <p className="text-xs italic" style={{ color: C.goldSoft }}>"We've got {money((FUNDS_TIERS.find((f) => f.id === setupFundsTierId) || FUNDS_TIERS[1]).funds)}. Where should we start?"</p>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} color={C.gold} />
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>6. YOUR RING</p>
              </div>
              <p className="text-[11px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>Every promotion starts somewhere. How'd you get yours?</p>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setSetupRingDelegated(false)} className="flex-1 py-1.5 rounded-md text-xs font-semibold" style={{ backgroundColor: !setupRingDelegated ? C.gold : C.inkSoft, color: !setupRingDelegated ? C.ink : 'rgba(246,240,225,0.6)' }}>Decide Myself</button>
                <button onClick={() => setSetupRingDelegated(true)} className="flex-1 py-1.5 rounded-md text-xs font-semibold" style={{ backgroundColor: setupRingDelegated ? C.gold : C.inkSoft, color: setupRingDelegated ? C.ink : 'rgba(246,240,225,0.6)' }}>Delegate to {setupPartner.name.split(' ')[0]}</button>
              </div>
              {setupRingDelegated ? (
                <p className="text-[11px] mb-6 italic" style={{ color: C.goldSoft }}>"{partnerReaction(setupPartner.archetypeId, 'ring', PARTNER_DELEGATE_PICK[setupPartner.archetypeId].ring, true)}"</p>
              ) : (
                <div className="space-y-2 mb-6">
                  {RING_ORIGINS.map((r) => (
                    <button key={r.id} onClick={() => setSetupRingOriginId(r.id)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: setupRingOriginId === r.id ? C.gold : C.inkSoft, border: `1px solid ${setupRingOriginId === r.id ? C.gold : C.inkFaint}` }}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold" style={{ color: setupRingOriginId === r.id ? C.ink : C.cream }}>{r.label}</p>
                        <span className="wgm-mono text-[10px]" style={{ color: setupRingOriginId === r.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{r.cost === 0 ? 'FREE' : money(r.cost)}</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: setupRingOriginId === r.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{r.blurb}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Building2 size={14} color={C.gold} />
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>7. YOUR VENUE</p>
              </div>
              <p className="text-[11px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>Where are you running your first shows?</p>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setSetupVenueDelegated(false)} className="flex-1 py-1.5 rounded-md text-xs font-semibold" style={{ backgroundColor: !setupVenueDelegated ? C.gold : C.inkSoft, color: !setupVenueDelegated ? C.ink : 'rgba(246,240,225,0.6)' }}>Decide Myself</button>
                <button onClick={() => setSetupVenueDelegated(true)} className="flex-1 py-1.5 rounded-md text-xs font-semibold" style={{ backgroundColor: setupVenueDelegated ? C.gold : C.inkSoft, color: setupVenueDelegated ? C.ink : 'rgba(246,240,225,0.6)' }}>Delegate to {setupPartner.name.split(' ')[0]}</button>
              </div>
              {setupVenueDelegated ? (
                <p className="text-[11px] mb-6 italic" style={{ color: C.goldSoft }}>"{partnerReaction(setupPartner.archetypeId, 'venue', PARTNER_DELEGATE_PICK[setupPartner.archetypeId].venue, true)}"</p>
              ) : (
                <div className="space-y-2 mb-6">
                  {STARTUP_VENUE_PATHS.map((v) => (
                    <button key={v.id} onClick={() => setSetupVenuePathId(v.id)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: setupVenuePathId === v.id ? C.gold : C.inkSoft, border: `1px solid ${setupVenuePathId === v.id ? C.gold : C.inkFaint}` }}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold" style={{ color: setupVenuePathId === v.id ? C.ink : C.cream }}>{v.label}</p>
                        <span className="wgm-mono text-[10px]" style={{ color: setupVenuePathId === v.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{v.cost === 0 ? 'FREE' : money(v.cost)}</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: setupVenuePathId === v.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{v.blurb}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Users size={14} color={C.gold} />
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>8. FINDING YOUR FIRST WRESTLER</p>
              </div>
              <p className="text-[11px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>How did you find the one who believed in this from day one?</p>
              <div className="space-y-2 mb-6">
                {STARTUP_RECRUITING_METHODS.map((m) => (
                  <button key={m.id} onClick={() => setSetupRecruitingMethodId(m.id)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: setupRecruitingMethodId === m.id ? C.gold : C.inkSoft, border: `1px solid ${setupRecruitingMethodId === m.id ? C.gold : C.inkFaint}` }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: setupRecruitingMethodId === m.id ? C.ink : C.cream }}>{m.isDelegate ? `${m.label} — ${setupPartner.name.split(' ')[0]}` : m.label}</p>
                      <span className="wgm-mono text-[10px]" style={{ color: setupRecruitingMethodId === m.id ? C.inkSoft : 'rgba(246,240,225,0.55)' }}>{m.cost === 0 ? 'FREE' : money(m.cost)}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Palette size={14} color={C.gold} />
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>9. COMPANY COLORS</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {THEME_PRESETS.map((t) => (
                  <button key={t.id} onClick={() => { setSetupThemeMode('preset'); setSetupThemePresetId(t.id); }} className="rounded-lg p-2 flex flex-col items-center gap-1.5" style={{ backgroundColor: setupThemeMode === 'preset' && setupThemePresetId === t.id ? C.inkFaint : C.inkSoft, border: `1px solid ${setupThemeMode === 'preset' && setupThemePresetId === t.id ? t.gold : C.inkFaint}` }}>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.gold }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.rope }} />
                    </div>
                    <span className="text-[9px]" style={{ color: C.cream }}>{t.name}</span>
                  </button>
                ))}
                <button onClick={() => setSetupThemeMode('custom')} className="rounded-lg p-2 flex flex-col items-center gap-1.5 justify-center" style={{ backgroundColor: setupThemeMode === 'custom' ? C.inkFaint : C.inkSoft, border: `1px solid ${setupThemeMode === 'custom' ? setupCustomGold : C.inkFaint}` }}>
                  <Wrench size={16} color={C.cream} />
                  <span className="text-[9px]" style={{ color: C.cream }}>Custom</span>
                </button>
              </div>
              {setupThemeMode === 'custom' && (
                <div className="flex items-center justify-center gap-4 mb-6 wgm-pop">
                  <label className="flex flex-col items-center gap-1">
                    <span className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.6)' }}>PRIMARY</span>
                    <input type="color" value={setupCustomGold} onChange={(e) => setSetupCustomGold(e.target.value)} className="w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer" />
                  </label>
                  <label className="flex flex-col items-center gap-1">
                    <span className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.6)' }}>ACCENT</span>
                    <input type="color" value={setupCustomRope} onChange={(e) => setSetupCustomRope(e.target.value)} className="w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer" />
                  </label>
                </div>
              )}
              {setupThemeMode !== 'custom' && <div className="mb-3" />}

              <PrimaryButton full onClick={startNewGame} disabled={!setupName.trim()}>Open For Business</PrimaryButton>
              <button onClick={startDebugTestGame} className="wgm-mono text-[9px] underline mt-3 block mx-auto" style={{ color: 'rgba(246,240,225,0.35)' }}>
                Skip setup — start a fixed debug test save
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { company, roster, freeAgents, staff, staffPool, titles, tagTeams, stables, feuds, relationships, rivals, history, news, draftShow } = game;
  const healthyRoster = roster.filter((w) => !w.injury && !(w.ambition && w.ambition.status === 'holdout') && !(w.wellness && w.wellness.status === 'in_program'));
  const estimate = estimateShow(draftShow, game);
  const draftVenue = ALL_VENUES.find((v) => v.id === draftShow.venueId) || ALL_VENUES[0];
  const unlocked = unlockedVenuesFor(company, rivals);
  const nextVenue = nextLockedVenue(company.reputation);

  const TABS = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'roster', label: 'Roster', icon: Users },
    { id: 'freeagents', label: 'Free Agents', icon: UserPlus },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'book', label: 'Book', icon: Calendar },
    { id: 'history', label: 'History', icon: Trophy },
  ];

  return (
    <div className="wgm-root min-h-screen pb-20" style={{ backgroundColor: C.canvas }}>
      <style>{FONT_STYLE}</style>
      <style>{themeCssVars(company.theme)}</style>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ backgroundColor: C.ink }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="wgm-mono text-[10px] tracking-widest" style={{ color: C.goldSoft }}>{repTierLabel(company.reputation).toUpperCase()}</p>
            <h1 className="wgm-display text-xl leading-tight" style={{ color: C.cream }}>{company.name}</h1>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDevLogModalOpen(true)} className="opacity-40" aria-label="Developer log">
                <Bug size={12} color="rgba(246,240,225,0.6)" />
              </button>
              <p className="wgm-mono text-[10px]" style={{ color: 'rgba(246,240,225,0.55)' }}>WEEK {company.week} · YR {company.year}</p>
            </div>
            <p className="wgm-display text-lg" style={{ color: company.funds < 0 ? C.rope : C.gold }}>{money(company.funds)}</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.12)' }}>
          <div className="h-full rounded-full" style={{ width: `${company.reputation}%`, backgroundColor: C.gold }} />
        </div>
        {nextVenue && (
          <p className="wgm-mono text-[10px] mt-1" style={{ color: 'rgba(246,240,225,0.5)' }}>
            {nextVenue.minRep - company.reputation} rep to unlock {nextVenue.name}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {tab === 'dashboard' && (
          <DashboardTab
            game={game} news={news} draftShow={draftShow} draftVenue={draftVenue}
            onGoBook={() => setTab('book')} unlocked={unlocked}
            onNewGame={() => setConfirmAction({ type: 'newGame' })}
            onOpenUpgrades={() => { setShopDept('ring'); setTab('shop'); }}
            onOpenTv={() => { setShopDept('tv'); setTab('shop'); }}
            onOpenRivals={() => setRivalsModalOpen(true)}
            onOpenMedia={() => setMediaModalOpen(true)}
            onOpenInbox={() => setInboxModalOpen(true)}
            onOpenPartner={() => setPartnerModalOpen(true)}
            onGoRoster={() => { setRosterSubTab('active'); setTab('roster'); }}
            onGoFreeAgents={() => setTab('freeagents')}
            onGoHistory={() => setTab('history')}
          />
        )}
        {tab === 'roster' && (
          <RosterTab
            roster={roster} staff={staff} titles={titles} tagTeams={tagTeams} stables={stables} feuds={feuds} relationships={relationships} funds={company.funds}
            subTab={rosterSubTab} setSubTab={setRosterSubTab}
            onSelect={setSelectedWrestler}
            onFireStaff={(role, id) => setConfirmAction({ type: 'fireStaff', role, id })} onRaiseStaff={giveStaffRaise}
            onOpenTeamBuilder={() => setTeamBuilderOpen(true)} onDisbandTeam={disbandTeam}
            onOpenStableBuilder={() => setStableBuilderOpen(true)} onSelectStable={setSelectedStable}
            onOpenFeudBuilder={() => setFeudBuilderOpen(true)} onSelectFeud={setSelectedFeud}
            onOpenRelationshipBuilder={() => setRelationshipBuilderOpen(true)} onEndRelationship={endRelationship}
          />
        )}
        {tab === 'freeagents' && (
          <FreeAgentsTab
            freeAgents={freeAgents} staffPool={staffPool} funds={company.funds}
            subTab={freeAgentsSubTab} setSubTab={setFreeAgentsSubTab}
            onSign={signFreeAgent} onSearchTalent={searchForTalent} onHireStaff={hireStaff}
            onSelectFreeAgent={setSelectedFreeAgent} onSelectFreeStaff={setSelectedFreeStaff}
          />
        )}
        {tab === 'shop' && (
          <ShopTab
            company={company} roster={roster} titles={titles} unlocked={unlocked} funds={company.funds}
            dept={shopDept} setDept={setShopDept}
            onOpenTitleBuilder={() => setTitleBuilderOpen(true)} onSelectTitle={setSelectedTitle}
            onPurchaseUpgrade={purchaseUpgrade}
            onPurchaseRingShape={purchaseRingShape} onEquipRingShape={equipRingShape}
            onAddConcession={addConcessionItem} onSetConcessionPrice={setConcessionPrice} onRemoveConcession={removeConcessionItem}
            onAddMerch={addMerchItem} onSetMerchPrice={setMerchPrice} onSetMerchWrestler={toggleMerchWrestler} onRemoveMerch={removeMerchItem}
            onPurchaseWeaponItem={purchaseWeaponItem} onStartResearch={startMatchResearch}
            onSignTv={signTVDeal}
          />
        )}
        {tab === 'book' && (
          <BookShowTab
            draftShow={draftShow} draftVenue={draftVenue} unlocked={unlocked} estimate={estimate}
            roster={roster} healthyRoster={healthyRoster} titles={titles} feuds={feuds} funds={company.funds} company={company}
            onUpdateDraft={updateDraft} onOpenMatchBuilder={() => setMatchBuilderOpen(true)}
            onOpenPromoBuilder={() => setPromoBuilderOpen(true)} onRemove={removeCardItem} onMove={moveCardItem}
            onRun={runShow}
            onEndWeekWithoutShow={endWeekWithoutShow}
            onRepairRing={repairRing} onRestockSupplies={restockSupplies} onSkipDay={skipDay} onSkipToShowDay={skipToShowDay}
          />
        )}
        {tab === 'history' && <HistoryTab history={history} />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex" style={{ backgroundColor: C.ink, borderTop: `1px solid ${C.inkFaint}` }}>
        {TABS.map((t) => {
          const Icon = t.icon; const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex flex-col items-center gap-1 py-2.5">
              <Icon size={18} color={active ? C.gold : 'rgba(246,240,225,0.45)'} />
              <span className="wgm-mono text-[9px]" style={{ color: active ? C.gold : 'rgba(246,240,225,0.45)' }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 wgm-pop px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: C.ink, color: C.cream }}>
          {toast}
        </div>
      )}

      {/* Wrestler modal */}
      {selectedWrestler && (
        <WrestlerModal
          wrestler={roster.find((r) => r.id === selectedWrestler.id) || selectedWrestler} titles={titles} tagTeams={tagTeams} stables={stables} relationships={relationships} onClose={() => setSelectedWrestler(null)}
          onAlign={setAlignment} onRelease={(id) => setConfirmAction({ type: 'release', id })}
          onRenew={renewContract} onGrantRequest={grantAmbitionRequest} onSendToWellness={sendToWellnessProgram} funds={company.funds}
        />
      )}

      {/* Free agent wrestler detail */}
      {selectedFreeAgent && (
        <FreeAgentModal
          wrestler={freeAgents.find((f) => f.id === selectedFreeAgent.id) || selectedFreeAgent}
          onClose={() => setSelectedFreeAgent(null)}
          onSign={(id, termId, bonusPct, wagePct, contractWeeks) => { signFreeAgent(id, termId, bonusPct, wagePct, contractWeeks); setSelectedFreeAgent(null); }}
          funds={company.funds} bossReputation={company.bossReputation} reputation={company.reputation}
        />
      )}

      {/* Free agent staff detail */}
      {selectedFreeStaff && (
        <FreeStaffModal
          staffMember={selectedFreeStaff}
          onClose={() => setSelectedFreeStaff(null)}
          onHire={(role, id) => { hireStaff(role, id); setSelectedFreeStaff(null); }}
          funds={company.funds}
        />
      )}

      {/* Match builder */}
      {matchBuilderOpen && (
        <MatchBuilderModal
          roster={healthyRoster} titles={titles} tagTeams={tagTeams} feuds={feuds} style={company.style} unlockedResearch={company.matchResearch.unlockedTypes} onClose={() => setMatchBuilderOpen(false)}
          onAdd={(item) => { addCardItem(item); setMatchBuilderOpen(false); }}
        />
      )}

      {/* Title builder */}
      {titleBuilderOpen && (
        <TitleBuilderModal
          roster={roster} funds={company.funds} onClose={() => setTitleBuilderOpen(false)}
          onCreate={createTitle}
        />
      )}

      {/* Title detail */}
      {selectedTitle && (
        <TitleDetailModal title={titles.find((t) => t.id === selectedTitle.id) || selectedTitle} company={company} onClose={() => setSelectedTitle(null)} onVacate={vacateTitle} />
      )}

      {/* Team builder */}
      {teamBuilderOpen && (
        <TeamBuilderModal roster={roster} tagTeams={tagTeams} onClose={() => setTeamBuilderOpen(false)} onCreate={createTeam} />
      )}

      {/* Stable builder */}
      {stableBuilderOpen && (
        <StableBuilderModal roster={roster} onClose={() => setStableBuilderOpen(false)} onCreate={createStable} />
      )}

      {/* Stable detail */}
      {selectedStable && (
        <StableDetailModal
          stable={stables.find((s) => s.id === selectedStable.id) || selectedStable} roster={roster}
          onClose={() => setSelectedStable(null)} onUpdate={updateStable} onDisband={disbandStable}
        />
      )}

      {/* Feud builder */}
      {feudBuilderOpen && (
        <FeudBuilderModal roster={roster} writerTierLevel={writerTier(staff.writers)} onClose={() => setFeudBuilderOpen(false)} onCreate={createFeud} />
      )}

      {/* Relationship builder */}
      {relationshipBuilderOpen && (
        <RelationshipBuilderModal roster={roster} onClose={() => setRelationshipBuilderOpen(false)} onCreate={createRelationship} />
      )}

      {/* Feud detail */}
      {selectedFeud && (
        <FeudDetailModal feud={feuds.find((f) => f.id === selectedFeud.id) || selectedFeud} onClose={() => setSelectedFeud(null)} onEnd={endFeud} />
      )}

      {/* Rival promotions */}
      {rivalsModalOpen && (
        <RivalsModal rivals={rivals} company={company} onClose={() => setRivalsModalOpen(false)} onSetRelationship={setRivalRelationship} onSignPact={signTerritoryPact} onBreakPact={breakTerritoryPact} onAcquire={acquireRival} onOpenPoach={(rivalId, wrestlerId) => setPoachTarget({ rivalId, wrestlerId })} />
      )}

      {/* Wrestling media */}
      {mediaModalOpen && (
        <MediaModal recaps={game.mediaRecaps} companyName={company.name} onClose={() => setMediaModalOpen(false)} />
      )}

      {/* Inbox */}
      {inboxModalOpen && (
        <InboxModal inbox={game.inbox || []} company={company} onClose={() => setInboxModalOpen(false)} onRespond={respondToInboxOffer} />
      )}

      {/* Partner */}
      {partnerModalOpen && (
        <PartnerModal partner={game.partner} onClose={() => setPartnerModalOpen(false)} />
      )}

      {/* Poach */}
      {poachTarget && (() => {
        const rival = rivals.find((r) => r.id === poachTarget.rivalId);
        const wrestler = rival && (rival.roster || []).find((w) => w.id === poachTarget.wrestlerId);
        if (!rival || !wrestler) return null;
        return (
          <PoachModal
            wrestler={wrestler} rival={rival} company={company}
            onClose={() => setPoachTarget(null)}
            onPoach={(rivalId, wrestlerId, termId, bonusPct, wagePct, contractWeeks) => { poachRivalWrestler(rivalId, wrestlerId, termId, bonusPct, wagePct, contractWeeks); setPoachTarget(null); }}
          />
        );
      })()}

      {/* Developer log */}
      {devLogModalOpen && (
        <DevLogModal devLog={game.devLog || []} onClose={() => setDevLogModalOpen(false)} />
      )}

      {/* Promo builder */}
      {promoBuilderOpen && (
        <PromoBuilderModal
          roster={roster} staff={staff} feuds={feuds} writerTierLevel={writerTier(staff.writers)} onClose={() => setPromoBuilderOpen(false)}
          onAdd={(item) => { addCardItem(item); setPromoBuilderOpen(false); }}
        />
      )}

      {/* Show result */}
      {showResult && (
        <ShowResultModal result={showResult} roster={roster} onClose={() => setShowResult(null)} />
      )}

      {/* Confirm dialogs */}
      {confirmAction && (
        <Modal title="Are you sure?" onClose={() => setConfirmAction(null)}>
          <p className="text-sm mb-5" style={{ color: C.inkFaint }}>
            {confirmAction.type === 'release' && 'This wrestler will be released with no buyout. This cannot be undone.'}
            {confirmAction.type === 'fireStaff' && `This ${confirmAction.role.toLowerCase()} will be let go immediately.`}
            {confirmAction.type === 'newGame' && 'This will permanently erase your current promotion and start fresh.'}
          </p>
          <div className="flex gap-2">
            <GhostButton onClick={() => setConfirmAction(null)}>Cancel</GhostButton>
            <PrimaryButton danger onClick={() => {
              if (confirmAction.type === 'release') releaseWrestler(confirmAction.id);
              else if (confirmAction.type === 'fireStaff') { fireStaff(confirmAction.role, confirmAction.id); setConfirmAction(null); }
              else if (confirmAction.type === 'newGame') resetGame();
            }}>Confirm</PrimaryButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD TAB
   ============================================================ */
function DashboardTab({ game, news, draftShow, draftVenue, onGoBook, onNewGame, onOpenUpgrades, onOpenTv, onOpenRivals, onOpenMedia, onOpenInbox, onOpenPartner, onGoRoster, onGoFreeAgents, onGoHistory }) {
  const { company, roster } = game;
  const injured = roster.filter((w) => w.injury);
  const needsTalk = roster.filter((w) => w.ambition && (w.ambition.status === 'unhappy' || w.ambition.status === 'holdout'));
  const avgPop = Math.round(average(roster.map((w) => w.popularity)));
  const regionLabel = (REGION_LIST.find((r) => r.id === company.region) || REGION_LIST[0]).label;
  const styleLabel = (STYLE_CONFIG[company.style] || STYLE_CONFIG.sports_entertainment).label;
  return (
    <div className="space-y-4 wgm-desk -mx-4 px-4 pt-1 pb-2">
      <div className="wgm-nameplate rounded-md px-3 py-2 flex items-center justify-between relative">
        <div className="wgm-screw absolute" style={{ top: 4, left: 4 }} />
        <div className="wgm-screw absolute" style={{ top: 4, right: 4 }} />
        <div className="wgm-screw absolute" style={{ bottom: 4, left: 4 }} />
        <div className="wgm-screw absolute" style={{ bottom: 4, right: 4 }} />
        <p className="wgm-display text-sm tracking-wide" style={{ color: C.ink }}>{game.company.name.toUpperCase()}</p>
        <p className="wgm-mono text-[9px]" style={{ color: C.inkSoft, opacity: 0.75 }}>GM'S DESK</p>
      </div>

      <div className="flex items-center justify-between -mt-1">
        <div className="flex items-center gap-1.5">
          <Globe size={11} color={C.inkFaint} />
          <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>{regionLabel} · {styleLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <UserCircle size={11} color={C.inkFaint} />
          <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>{bossRepLabel(company.bossReputation !== undefined ? company.bossReputation : 50)} Boss</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat icon={Users} label="Roster" value={roster.length} onClick={onGoRoster} />
        <MiniStat icon={TrendingUp} label="Avg Pop." value={avgPop} onClick={onGoRoster} />
        <MiniStat icon={AlertTriangle} label="Injured" value={injured.length} warn={injured.length > 0} onClick={onGoRoster} />
        <MiniStat icon={UserCircle} label="Wants to Talk" value={needsTalk.length} warn={needsTalk.length > 0} onClick={onGoRoster} />
      </div>

      {game.partner && (
        <button onClick={onOpenPartner} className="w-full text-left rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <UserCircle size={15} color={C.gold} />
              <div>
                <p className="text-sm font-semibold" style={{ color: C.ink }}>{game.partner.name}</p>
                <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{game.partner.label.toUpperCase()}</p>
              </div>
            </div>
            <ChevronRight size={16} color={C.inkFaint} />
          </div>
          <p className="text-[11px]" style={{ color: C.inkFaint }}>{partnerRelationshipReadout(game.partner.relationship)}</p>
        </button>
      )}

      <div>
        <SectionTitle icon={Briefcase}>Advisor Briefing</SectionTitle>
        <div className="rounded-lg p-1 mt-1" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
          {ADVISOR_ROLES.map((role, i) => {
            const Icon = role.icon;
            return (
              <div key={role.key} className="px-2.5 py-2 flex items-start gap-2" style={{ borderTop: i > 0 ? `1px solid ${C.line}` : 'none' }}>
                <Icon size={13} color={C.gold} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="wgm-mono text-[8px] font-bold block" style={{ color: C.inkFaint }}>{company.advisors[role.key].toUpperCase()} · {role.title.toUpperCase()}</span>
                  <p className="text-xs" style={{ color: C.inkSoft }}>{advisorMemo(role.key, game)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="wgm-ticket rounded-xl p-4" style={{ backgroundColor: C.ink }}>
        <SectionTitleDark icon={Calendar}>Next Show</SectionTitleDark>
        {draftShow.card.length === 0 ? (
          <div>
            <p className="text-sm mb-3" style={{ color: 'rgba(246,240,225,0.6)' }}>No card booked yet for Week {company.week}.</p>
            <PrimaryButton onClick={onGoBook} icon={Plus} full>Book a Show</PrimaryButton>
          </div>
        ) : (
          <div>
            <p className="text-sm mb-1" style={{ color: C.cream }}>{draftVenue.name} · {draftShow.card.length} segment{draftShow.card.length > 1 ? 's' : ''} · {money(draftShow.ticketPrice)} tix</p>
            <p className="text-xs mb-3" style={{ color: 'rgba(246,240,225,0.55)' }}>Finish building the card and run the show when ready.</p>
            <PrimaryButton onClick={onGoBook} icon={ChevronRight} full>Continue Booking</PrimaryButton>
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        <button onClick={onOpenUpgrades} className="w-full p-3.5 text-left flex items-center justify-between" style={{ backgroundColor: C.cream }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} color={C.gold} />
            <div>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>Shop</p>
              <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>RING LV{upgradeLevel(company, 'ring')} · {company.merchMenu.length} MERCH · {company.weaponsOwned.length}/{WEAPON_ITEMS_CATALOG.length} GEAR</p>
            </div>
          </div>
          <ChevronRight size={16} color={C.inkFaint} />
        </button>
        <button onClick={onOpenTv} className="w-full p-3.5 text-left flex items-center justify-between" style={{ backgroundColor: C.cream, borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2">
            <Tv size={16} color={C.gold} />
            <div>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>TV Deal</p>
              <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{company.tvDeal ? `${(TV_NETWORKS.find((n) => n.id === company.tvDeal.networkId) || {}).name} · ${company.tvDeal.weeksRemaining}WK LEFT` : 'NO DEAL'}</p>
            </div>
          </div>
          <ChevronRight size={16} color={C.inkFaint} />
        </button>
        <button onClick={onOpenRivals} className="w-full p-3.5 text-left flex items-center justify-between" style={{ backgroundColor: C.cream, borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2">
            <Building2 size={16} color={C.gold} />
            <div>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>Rival Promotions</p>
              <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{game.rivals.length} PROMOTIONS · {game.rivals.filter((r) => r.relationship === 'ally').length} ALLIES · {game.rivals.filter((r) => r.relationship === 'rival').length} RIVALS</p>
            </div>
          </div>
          <ChevronRight size={16} color={C.inkFaint} />
        </button>
        <button onClick={onOpenMedia} className="w-full p-3.5 text-left flex items-center justify-between" style={{ backgroundColor: C.cream, borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2">
            <Newspaper size={16} color={C.gold} />
            <div>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>Wrestling Media</p>
              <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{game.mediaRecaps.length ? `${game.mediaRecaps.length} RECAP${game.mediaRecaps.length !== 1 ? 'S' : ''} PUBLISHED` : 'NO RECAPS YET'}</p>
            </div>
          </div>
          <ChevronRight size={16} color={C.inkFaint} />
        </button>
        <button onClick={onOpenInbox} className="w-full p-3.5 text-left flex items-center justify-between" style={{ backgroundColor: C.cream, borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2">
            <Mail size={16} color={(game.inbox || []).length ? C.rope : C.gold} />
            <div>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>Inbox</p>
              <p className="wgm-mono text-[9px]" style={{ color: (game.inbox || []).length ? C.rope : C.inkFaint }}>{(game.inbox || []).length ? `${game.inbox.length} PENDING OFFER${game.inbox.length !== 1 ? 'S' : ''}` : 'NOTHING PENDING'}</p>
            </div>
          </div>
          <ChevronRight size={16} color={C.inkFaint} />
        </button>
      </div>

      <div>
        <button onClick={onGoHistory} className="w-full text-left">
          <SectionTitle icon={Megaphone} sub="View records →">Latest News</SectionTitle>
        </button>
        <div className="space-y-3 pt-1">
          {news.slice(0, 4).map((n, i) => (
            <div key={i} className="wgm-memo relative rounded-sm px-3 py-2.5 text-xs" style={{ backgroundColor: C.cream, color: C.inkSoft }}>
              <div className="wgm-pin absolute" style={{ top: -3, left: '50%', marginLeft: -3.5 }} />
              {n}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 text-center">
        <button onClick={onNewGame} className="wgm-mono text-[10px] underline" style={{ color: C.inkFaint }}>Start a New Promotion</button>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, warn, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className="rounded-lg p-3 text-center w-full" style={{ backgroundColor: warn ? 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.1)' : C.cream, border: `1px solid ${warn ? C.rope : C.line}` }}>
      <Icon size={16} color={warn ? C.rope : C.gold} className="mx-auto mb-1" />
      <p className="wgm-display text-lg leading-none" style={{ color: C.ink }}>{value}</p>
      <p className="wgm-mono text-[9px] mt-1" style={{ color: C.inkFaint }}>{label.toUpperCase()}</p>
    </Tag>
  );
}

function SectionTitleDark({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} color={C.gold} />
      <h2 className="wgm-display text-base" style={{ color: C.cream }}>{children}</h2>
    </div>
  );
}

/* ============================================================
   ROSTER TAB
   ============================================================ */
function RosterTab({ roster, staff, titles, tagTeams, stables, feuds, relationships, funds, subTab, setSubTab, onSelect, onFireStaff, onRaiseStaff, onOpenTeamBuilder, onDisbandTeam, onOpenStableBuilder, onSelectStable, onOpenFeudBuilder, onSelectFeud, onOpenRelationshipBuilder, onEndRelationship }) {
  const activeFeuds = feuds.filter((f) => f.status !== 'ended');
  const allStaff = [...staff.announcers, ...staff.commentators, ...(staff.referees || []), ...(staff.writers || []), ...(staff.roadAgents || [])];
  return (
    <div>
      <div className="wgm-spiral -mx-4 mb-3" />
      <div className="flex gap-2 mb-4 overflow-x-auto wgm-scrollbar pb-1">
        <PillTab active={subTab === 'active'} onClick={() => setSubTab('active')}>Roster ({roster.length + allStaff.length})</PillTab>
        <PillTab active={subTab === 'teams'} onClick={() => setSubTab('teams')}>Teams ({tagTeams.length})</PillTab>
        <PillTab active={subTab === 'stables'} onClick={() => setSubTab('stables')}>Stables ({stables.length})</PillTab>
        <PillTab active={subTab === 'feuds'} onClick={() => setSubTab('feuds')}>Feuds ({activeFeuds.length})</PillTab>
        <PillTab active={subTab === 'relationships'} onClick={() => setSubTab('relationships')}>Relationships ({relationships.length})</PillTab>
      </div>

      {subTab === 'active' && (
        <div>
          <TierLegend />
          <p className="wgm-mono text-[10px] mb-2 px-2 py-1 inline-block rounded" style={{ color: C.cream, backgroundColor: C.ink }}>WRESTLERS ({roster.length})</p>
          <div className="space-y-2 mb-6">
            {roster.length === 0 && <EmptyState text="No wrestlers signed. Check the Free Agents tab to build your roster." />}
            {roster.map((w) => <WrestlerRow key={w.id} w={w} titles={titles} onClick={() => onSelect(w)} />)}
          </div>

          <p className="wgm-mono text-[10px] mb-2 px-2 py-1 inline-block rounded" style={{ color: C.cream, backgroundColor: C.ink }}>STAFF ({allStaff.length})</p>
          <div className="space-y-2">
            {allStaff.length === 0 && <EmptyState text="No staff hired. Check the Free Agents tab to build your production team." />}
            {staff.announcers.map((s) => <StaffRow key={s.id} s={s} role="Announcer" funds={funds} onFire={onFireStaff} onRaise={onRaiseStaff} />)}
            {staff.commentators.map((s) => <StaffRow key={s.id} s={s} role="Commentator" funds={funds} onFire={onFireStaff} onRaise={onRaiseStaff} />)}
            {(staff.referees || []).map((s) => <StaffRow key={s.id} s={s} role="Referee" funds={funds} onFire={onFireStaff} onRaise={onRaiseStaff} />)}
            {(staff.writers || []).map((s) => <StaffRow key={s.id} s={s} role="Writer" funds={funds} onFire={onFireStaff} onRaise={onRaiseStaff} />)}
            {(staff.roadAgents || []).map((s) => <StaffRow key={s.id} s={s} role="Road Agent" funds={funds} onFire={onFireStaff} onRaise={onRaiseStaff} />)}
          </div>
        </div>
      )}

      {subTab === 'teams' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: C.inkFaint }}>Pair two wrestlers up to build tag chemistry over time.</p>
            <GhostButton icon={Plus} onClick={onOpenTeamBuilder}>New Team</GhostButton>
          </div>
          {tagTeams.length === 0 && <EmptyState text="No tag teams yet." />}
          <div className="space-y-2">
            {tagTeams.map((t) => (
              <div key={t.id} className="rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: C.ink }}>{t.name}</p>
                    <p className="text-[11px]" style={{ color: C.inkFaint }}>{t.memberIds.map((id) => (roster.find((r) => r.id === id) || {}).name || '???').join(' & ')}</p>
                  </div>
                  <GhostButton danger onClick={() => onDisbandTeam(t.id)}>Disband</GhostButton>
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.canvasAlt }}>
                  <div className="h-full rounded-full" style={{ width: `${t.chemistry}%`, backgroundColor: C.gold }} />
                </div>
                <p className="wgm-mono text-[9px] mt-1" style={{ color: C.inkFaint }}>CHEMISTRY {t.chemistry} · {t.matchesTogether} MATCHES TOGETHER</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'stables' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: C.inkFaint }}>Group wrestlers into a faction with a shared storyline.</p>
            <GhostButton icon={Plus} onClick={onOpenStableBuilder}>New Stable</GhostButton>
          </div>
          {stables.length === 0 && <EmptyState text="No stables yet." />}
          <div className="space-y-2">
            {stables.map((s) => (
              <button key={s.id} onClick={() => onSelectStable(s)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: C.ink }}>{s.name}</p>
                    <p className="text-[11px]" style={{ color: C.inkFaint }}>
                      Led by {(roster.find((r) => r.id === s.leaderId) || {}).name || '???'} · {s.memberIds.length} members
                    </p>
                  </div>
                  <ChevronRight size={16} color={C.inkFaint} />
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.canvasAlt }}>
                  <div className="h-full rounded-full" style={{ width: `${s.cohesion}%`, backgroundColor: C.rope }} />
                </div>
                <p className="wgm-mono text-[9px] mt-1" style={{ color: C.inkFaint }}>COHESION {s.cohesion}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {subTab === 'feuds' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: C.inkFaint }}>Book two rivals together and heat builds automatically. Mark a match as the Blow-Off when you're ready to pay it off.</p>
            <GhostButton icon={Plus} onClick={onOpenFeudBuilder}>New Feud</GhostButton>
          </div>
          {activeFeuds.length === 0 && <EmptyState text="No active feuds. Start one between two wrestlers." />}
          <div className="space-y-2">
            {activeFeuds.map((f) => (
              <button key={f.id} onClick={() => onSelectFeud(f)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: C.ink }}>{feudDisplayNames(f).aFull} <span style={{ color: C.rope }}>vs</span> {feudDisplayNames(f).bFull}</p>
                    {f.isTag && <Pill bg={C.steel}>TAG TEAM FEUD</Pill>}
                    {f.hook && <p className="text-[10px] italic truncate mt-0.5" style={{ color: C.inkFaint }}>{f.hook}</p>}
                    <p className="text-[11px]" style={{ color: C.inkFaint }}>{f.matchCount} match{f.matchCount !== 1 ? 'es' : ''} so far</p>
                  </div>
                  <ChevronRight size={16} color={C.inkFaint} />
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.canvasAlt }}>
                  <div className="h-full rounded-full" style={{ width: `${f.heat}%`, backgroundColor: f.heat >= 70 ? C.rope : C.gold }} />
                </div>
                <p className="wgm-mono text-[9px] mt-1" style={{ color: C.inkFaint }}>HEAT {f.heat}{f.heat >= 70 ? ' · READY FOR A BLOW-OFF' : ''}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {subTab === 'relationships' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: C.inkFaint }}>Friends, family, spouses, and personal rivalries — separate from anything booked in the ring.</p>
            <GhostButton icon={Plus} onClick={onOpenRelationshipBuilder}>New</GhostButton>
          </div>
          {relationships.length === 0 && <EmptyState text="No relationships declared yet." />}
          <div className="space-y-2">
            {relationships.map((r) => {
              const typeLabel = (RELATIONSHIP_TYPES.find((t) => t.id === r.type) || {}).label || r.type;
              return (
                <div key={r.id} className="rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: C.ink }}>{r.aName} <span style={{ color: r.type === 'rivals' ? C.rope : C.gold }}>{typeLabel === 'Personal Rivalry' ? 'vs' : '&'}</span> {r.bName}</p>
                      <Pill bg={r.type === 'rivals' ? C.rope : C.gold} color={r.type === 'rivals' ? C.cream : C.ink}>{typeLabel.toUpperCase()}</Pill>
                    </div>
                    <GhostButton danger onClick={() => onEndRelationship(r.id)}>End</GhostButton>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.canvasAlt }}>
                    <div className="h-full rounded-full" style={{ width: `${r.strength}%`, backgroundColor: r.type === 'rivals' ? C.rope : C.gold }} />
                  </div>
                  <p className="wgm-mono text-[9px] mt-1" style={{ color: C.inkFaint }}>STRENGTH {r.strength}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FREE AGENTS TAB
   ============================================================ */
function FreeAgentsTab({ freeAgents, staffPool, funds, subTab, setSubTab, onSign, onSearchTalent, onHireStaff, onSelectFreeAgent, onSelectFreeStaff }) {
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <PillTab active={subTab === 'wrestlers'} onClick={() => setSubTab('wrestlers')}>Wrestlers ({freeAgents.length})</PillTab>
        <PillTab active={subTab === 'staff'} onClick={() => setSubTab('staff')}>Staff ({staffPool.announcers.length + staffPool.commentators.length + (staffPool.referees || []).length + (staffPool.writers || []).length + (staffPool.roadAgents || []).length})</PillTab>
      </div>

      {subTab === 'wrestlers' && (
        <div>
          <TierLegend />
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: C.inkFaint }}>Tap a card for the full profile. Signing costs a bonus on top of their weekly rate.</p>
            <GhostButton icon={Users} onClick={() => setSearchPanelOpen((o) => !o)}>Find Talent</GhostButton>
          </div>

          {searchPanelOpen && (
            <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.canvasAlt }}>
              <p className="wgm-mono text-[9px] mb-2" style={{ color: C.inkFaint }}>WHERE DO YOU LOOK?</p>
              <div className="space-y-2">
                {TALENT_SEARCH_METHODS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id} onClick={() => { onSearchTalent(m.id); setSearchPanelOpen(false); }} disabled={funds < m.cost} className="w-full rounded-lg p-2.5 text-left flex items-center gap-2.5" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, opacity: funds < m.cost ? 0.5 : 1 }}>
                      <Icon size={16} color={C.gold} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold" style={{ color: C.ink }}>{m.label}</p>
                          <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{m.cost === 0 ? 'FREE' : money(m.cost)}</span>
                        </div>
                        <p className="text-[10px]" style={{ color: C.inkFaint }}>{m.blurb}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {freeAgents.length === 0 && <EmptyState text="No free agents available. Go find some talent." />}
          <div className="space-y-2">
            {freeAgents.map((w) => {
              const cost = Math.round(w.salary * 2 * (w.signingMult || 1));
              return (
                <div key={w.id} onClick={() => onSelectFreeAgent(w)} className="w-full text-left rounded-lg p-3 cursor-pointer" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
                  <div className="flex items-center gap-3">
                    <TierBadge tier={w.tier} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{w.name}</p>
                        <GenderBadge gender={w.gender} /> <AlignmentBadge alignment={w.alignment} />
                      </div>
                      <p className="text-[11px] truncate" style={{ color: C.inkFaint }}>"{w.gimmick}" · Age {w.age} · {money(w.salary)}/wk{w.discoveredVia ? ` · via ${w.discoveredVia}` : ''}</p>
                    </div>
                    <ChevronRight size={16} color={C.inkFaint} />
                  </div>
                  <WrestlerStatLine w={w} />
                  <TraitBadges traits={w.traits} max={3} />
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <GhostButton icon={UserPlus} onClick={() => onSign(w.id)} disabled={funds < cost}>Sign ({money(cost)})</GhostButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'staff' && (
        <div className="space-y-6">
          {[{ role: 'Announcer', icon: Radio, list: staffPool.announcers }, { role: 'Commentator', icon: Mic, list: staffPool.commentators }, { role: 'Referee', icon: Shield, list: staffPool.referees || [] }, { role: 'Writer', icon: Newspaper, list: staffPool.writers || [] }, { role: 'Road Agent', icon: Truck, list: staffPool.roadAgents || [] }].map(({ role, icon: Icon, list }) => (
            <div key={role}>
              <SectionTitle icon={Icon}>{role}s</SectionTitle>
              {list.length === 0 && <EmptyState text={`No ${role.toLowerCase()}s available right now.`} />}
              <div className="space-y-2">
                {list.map((s) => (
                  <div key={s.id} onClick={() => onSelectFreeStaff({ ...s, role })} className="w-full text-left rounded-lg p-3 cursor-pointer" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.steel }}>
                        <Icon size={15} color="white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{s.name}</p>
                        <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>QUALITY {s.quality} · {money(s.salary)}/wk</p>
                        {s.trait && <StaffTraitBadge id={s.trait} />}
                      </div>
                      <ChevronRight size={16} color={C.inkFaint} />
                    </div>
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <GhostButton icon={UserPlus} onClick={() => onHireStaff(role, s.id)} disabled={funds < s.salary * 1.5}>Hire ({money(s.salary * 1.5)})</GhostButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PillTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: active ? C.ink : C.canvasAlt, color: active ? C.gold : C.inkFaint }}>
      {children}
    </button>
  );
}

function TierBadge({ tier }) {
  const colors = { Jobber: '#5A5248', Rookie: C.steel, 'Mid-Card': '#7A6A3E', Star: C.gold, Legend: C.rope, Celebrity: '#8B5FBF' };
  const abbr = { Jobber: 'JB', 'Mid-Card': 'MC', Celebrity: 'CE' };
  return <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: colors[tier] || C.steel }}><span className="wgm-mono text-[9px] font-bold text-white">{abbr[tier] || tier.slice(0, 2).toUpperCase()}</span></div>;
}

function TierLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 px-0.5">
      {[['Jobber', '#5A5248', 'JB'], ['Rookie', C.steel, 'RO'], ['Mid-Card', '#7A6A3E', 'MC'], ['Star', C.gold, 'ST'], ['Legend', C.rope, 'LE'], ['Celebrity', '#8B5FBF', 'CE']].map(([label, color, abbr]) => (
        <div key={label} className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
            <span className="wgm-mono font-bold text-white" style={{ fontSize: '5px' }}>{abbr}</span>
          </div>
          <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function championTitlesFor(titles, wrestlerId) {
  return (titles || []).filter((t) => t.holderIds.includes(wrestlerId));
}

function WrestlerStatLine({ w }) {
  if (!w || !w.stats) return null;
  return (
    <div className="flex items-center gap-2 mt-1 flex-wrap">
      <span className="wgm-mono text-[8px]" style={{ color: C.inkFaint }}>STR {w.stats.strength}</span>
      <span className="wgm-mono text-[8px]" style={{ color: C.inkFaint }}>TEC {w.stats.technical}</span>
      <span className="wgm-mono text-[8px]" style={{ color: C.inkFaint }}>AER {w.stats.aerial}</span>
      <span className="wgm-mono text-[8px]" style={{ color: C.inkFaint }}>CHA {w.stats.charisma}</span>
      <span className="wgm-mono text-[8px]" style={{ color: C.inkFaint }}>STA {w.stats.stamina}</span>
      <span className="wgm-mono text-[8px]" style={{ color: C.gold }}>POP {w.popularity}</span>
    </div>
  );
}

function TraitBadges({ traits, max = 2 }) {
  if (!traits || !traits.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {traits.slice(0, max).map((id) => {
        const t = traitInfo(id);
        if (!t) return null;
        return <span key={id} className="wgm-mono text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: t.polarity === 'positive' ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.18)' : 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.14)', color: t.polarity === 'positive' ? C.gold : C.rope }}>{t.label}</span>;
      })}
    </div>
  );
}

function WrestlerRow({ w, titles, onClick }) {
  const champTitles = championTitlesFor(titles, w.id);
  const ambStatus = w.ambition && w.ambition.status;
  const wellStatus = w.wellness && w.wellness.status;
  const borderColor = w.injury ? C.rope : ambStatus === 'holdout' ? C.rope : wellStatus === 'struggling' ? C.rope : champTitles.length ? C.gold : C.line;
  const tierColors = { Rookie: C.steel, 'Mid-Card': '#7A6A3E', Star: C.gold, Legend: C.rope };
  return (
    <button onClick={onClick} className="wgm-index-card w-full rounded-lg p-3 flex items-center gap-3 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${borderColor}`, borderLeftWidth: 5, borderLeftColor: tierColors[w.tier] }}>
      <TierBadge tier={w.tier} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{w.name}</p>
          <GenderBadge gender={w.gender} /> <AlignmentBadge alignment={w.alignment} />
          {champTitles.length > 0 && <Crown size={12} color={C.gold} fill={C.gold} />}
          {ambStatus === 'holdout' && <AlertTriangle size={12} color={C.rope} />}
          {ambStatus === 'unhappy' && <AlertTriangle size={12} color={C.goldSoft} />}
        </div>
        <p className="text-[11px] truncate" style={{ color: C.inkFaint }}>"{w.gimmick}"</p>
        {champTitles.length > 0 && <p className="text-[10px] truncate" style={{ color: C.gold }}>{champTitles.map((t) => t.name).join(', ')}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className="wgm-mono text-[9px]" style={{ color: C.gold }}>POP {w.popularity}</span>
          <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>AGE {w.age}</span>
          {w.injury ? (
            <span className="wgm-mono text-[9px]" style={{ color: C.rope }}>{w.injury.label.toUpperCase()} · {w.injury.weeksLeft}W</span>
          ) : w.contractWeeksLeft <= 4 ? (
            <span className="wgm-mono text-[9px]" style={{ color: C.rope }}>CONTRACT EXPIRING</span>
          ) : (
            <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{w.contractWeeksLeft}W LEFT</span>
          )}
          {ambStatus === 'holdout' && <span className="wgm-mono text-[9px] font-bold" style={{ color: C.rope }}>HOLDOUT</span>}
          {ambStatus === 'unhappy' && <span className="wgm-mono text-[9px] font-bold" style={{ color: C.goldSoft }}>UNHAPPY</span>}
          {wellStatus === 'struggling' && <span className="wgm-mono text-[9px] font-bold" style={{ color: C.rope }}>NEEDS SUPPORT</span>}
          {wellStatus === 'in_program' && <span className="wgm-mono text-[9px] font-bold" style={{ color: C.steel }}>ON LEAVE</span>}
        </div>
        <TraitBadges traits={w.traits} />
      </div>
      <ChevronRight size={16} color={C.inkFaint} />
    </button>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-lg p-6 text-center text-xs" style={{ backgroundColor: C.canvasAlt, color: C.inkFaint }}>{text}</div>;
}

function WrestlerModal({ wrestler, titles, tagTeams, stables, relationships, onClose, onAlign, onRelease, onRenew, onGrantRequest, onSendToWellness, funds }) {
  const champTitles = championTitlesFor(titles, wrestler.id);
  const team = (tagTeams || []).find((t) => t.memberIds.includes(wrestler.id));
  const stable = (stables || []).find((s) => s.memberIds.includes(wrestler.id));
  const myRelationships = (relationships || []).filter((r) => r.aId === wrestler.id || r.bId === wrestler.id);
  const amb = wrestler.ambition;
  const wellness = wrestler.wellness || { status: 'stable' };
  return (
    <Modal title={wrestler.name} onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <TierBadge tier={wrestler.tier} />
        <div>
          <p className="text-xs italic" style={{ color: C.inkFaint }}>"{wrestler.gimmick}" · Age {wrestler.age}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <GenderBadge gender={wrestler.gender} />
            <AlignmentBadge alignment={wrestler.alignment} />
          </div>
        </div>
      </div>

      {wrestler.character && (
        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.canvasAlt }}>
          <p className="wgm-mono text-[10px] mb-1.5" style={{ color: C.inkFaint }}>ABOUT</p>
          <p className="text-[12px] mb-2" style={{ color: C.ink }}>{characterReadout(wrestler.character)}</p>
          <p className="text-[11px] italic" style={{ color: C.inkFaint }}>{backgroundSummary(wrestler.character)}</p>
          {wrestler.character.lifetimeDream && (
            <p className="text-[11px] mt-2 pt-2" style={{ color: C.goldSoft, borderTop: `1px solid ${C.line}` }}>Lifetime Dream: {wrestler.character.lifetimeDream}</p>
          )}
        </div>
      )}

      <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: wellness.status === 'struggling' ? 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.1)' : C.canvasAlt, border: `1px solid ${wellness.status === 'struggling' ? C.rope : C.line}` }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>CONFIDENCE</p>
          <span className="wgm-mono text-[10px]" style={{ color: C.ink }}>{Math.round(wrestler.confidence)}/100</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ backgroundColor: C.canvas }}>
          <div className="h-full rounded-full" style={{ width: `${wrestler.confidence}%`, backgroundColor: wrestler.confidence < 40 ? C.rope : wrestler.confidence < 60 ? C.goldSoft : C.good }} />
        </div>
        {wrestler.confidence < 50 && <p className="text-[10px] mb-2" style={{ color: C.inkFaint }}>Nerves may cost them in a big title opportunity.</p>}
        {wellness.status !== 'stable' && (
          <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-1">
              <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>WELL-BEING</p>
              {wellness.status === 'struggling' && <Pill bg={C.rope}>NEEDS SUPPORT</Pill>}
              {wellness.status === 'in_program' && <Pill bg={C.steel}>ON LEAVE</Pill>}
            </div>
            {wellness.status === 'struggling' && (
              <div>
                <p className="text-[11px] mb-2" style={{ color: C.inkFaint }}>They're struggling outside the ring. Time away could help them get back on track.</p>
                <GhostButton onClick={() => onSendToWellness(wrestler.id)} disabled={funds < 3000}>Send for Support ({money(3000)})</GhostButton>
              </div>
            )}
            {wellness.status === 'in_program' && <p className="text-[11px]" style={{ color: C.inkFaint }}>Taking time away to focus on themselves. Back in a few weeks.</p>}
          </div>
        )}
      </div>

      {myRelationships.length > 0 && (
        <div className="mb-4">
          <p className="wgm-mono text-[10px] mb-1.5" style={{ color: C.inkFaint }}>RELATIONSHIPS</p>
          <div className="flex flex-wrap gap-2">
            {myRelationships.map((r) => {
              const otherName = r.aId === wrestler.id ? r.bName : r.aName;
              const typeLabel = (RELATIONSHIP_TYPES.find((t) => t.id === r.type) || {}).label || r.type;
              return <Pill key={r.id} bg={r.type === 'rivals' ? C.rope : C.gold} color={r.type === 'rivals' ? C.cream : C.ink}>{typeLabel}: {otherName}</Pill>;
            })}
          </div>
        </div>
      )}

      {amb && (
        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: amb.status === 'holdout' ? 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.1)' : amb.status === 'unhappy' ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.1)' : C.canvasAlt, border: `1px solid ${amb.status === 'holdout' ? C.rope : C.line}` }}>
          <div className="flex items-center justify-between mb-1">
            <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>AMBITION</p>
            {amb.status === 'holdout' && <Pill bg={C.rope}>HOLDOUT</Pill>}
            {amb.status === 'unhappy' && <Pill bg={C.gold} color={C.ink}>UNHAPPY</Pill>}
          </div>
          <p className="text-sm font-semibold mb-2" style={{ color: C.ink }}>
            {amb.label}{amb.type === 'beat_rival' && amb.targetName ? ` (${amb.targetName})` : ''}
          </p>
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.canvas }}>
            <div className="h-full rounded-full" style={{ width: `${amb.satisfaction}%`, backgroundColor: amb.satisfaction < 20 ? C.rope : amb.satisfaction < 40 ? C.goldSoft : C.good }} />
          </div>
          <p className="wgm-mono text-[9px] mb-2" style={{ color: C.inkFaint }}>SATISFACTION {Math.round(amb.satisfaction)}/100</p>
          {amb.pendingRequest && (
            <div>
              <p className="text-[11px] mb-2" style={{ color: C.inkFaint }}>{amb.pendingRequest.text}</p>
              <GhostButton icon={Check} onClick={() => onGrantRequest(wrestler.id)} disabled={funds < 1500}>Grant Request ({money(1500)})</GhostButton>
            </div>
          )}
          {amb.status === 'holdout' && !amb.pendingRequest && <p className="text-[11px]" style={{ color: C.rope }}>Refusing to be booked until things improve.</p>}
        </div>
      )}

      {(wrestler.traits && wrestler.traits.length > 0) && (
        <div className="mb-4">
          <p className="wgm-mono text-[10px] mb-1.5" style={{ color: C.inkFaint }}>PERSONALITY</p>
          <div className="space-y-1">
            {wrestler.traits.map((id) => {
              const t = traitInfo(id);
              if (!t) return null;
              return (
                <div key={id} className="flex items-center gap-2 rounded-md p-2" style={{ backgroundColor: t.polarity === 'positive' ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.1)' : 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.08)' }}>
                  <span className="wgm-mono text-[10px] font-bold shrink-0" style={{ color: t.polarity === 'positive' ? C.gold : C.rope }}>{t.label}</span>
                  <span className="text-[11px]" style={{ color: C.inkFaint }}>{t.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {(team || stable) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {team && <Pill bg={C.gold} color={C.ink}>TEAM: {team.name} ({team.chemistry} chem)</Pill>}
          {stable && <Pill bg={C.steel}>STABLE: {stable.name}</Pill>}
        </div>
      )}

      {champTitles.length > 0 && (
        <div className="rounded-lg p-2.5 mb-4 flex items-center gap-2" style={{ backgroundColor: 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.14)' }}>
          <Crown size={14} color={C.gold} fill={C.gold} />
          <p className="text-xs font-semibold" style={{ color: C.gold }}>{champTitles.map((t) => t.name).join(' · ')}</p>
        </div>
      )}

      <div className="rounded-lg p-3 mb-4 space-y-2" style={{ backgroundColor: C.ink }}>
        <StatBar label="STR" value={wrestler.stats.strength} />
        <StatBar label="TECH" value={wrestler.stats.technical} />
        <StatBar label="AERIAL" value={wrestler.stats.aerial} />
        <StatBar label="CHARISMA" value={wrestler.stats.charisma} />
        <StatBar label="STAMINA" value={wrestler.stats.stamina} />
        <div className="h-px my-2" style={{ backgroundColor: C.inkFaint }} />
        <StatBar label="POPULAR." value={wrestler.popularity} accent="#3E5C8A" />
        <StatBar label="MORALE" value={wrestler.morale} accent={C.good} />
        <StatBar label="CONDITION" value={wrestler.condition} accent={wrestler.condition < 50 ? C.rope : C.good} />
      </div>

      {wrestler.injury && (
        <div className="rounded-lg p-2.5 mb-4 flex items-center gap-2" style={{ backgroundColor: 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.1)' }}>
          <AlertTriangle size={14} color={C.rope} />
          <p className="text-xs" style={{ color: C.rope }}>{wrestler.injury.label} — {wrestler.injury.weeksLeft} week{wrestler.injury.weeksLeft > 1 ? 's' : ''} remaining</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs mb-4" style={{ color: C.inkFaint }}>
        <span>Salary: <span className="wgm-mono" style={{ color: C.ink }}>{money(wrestler.salary)}/wk</span></span>
        <span>Contract: <span className="wgm-mono" style={{ color: wrestler.contractWeeksLeft <= 4 ? C.rope : C.ink }}>{wrestler.contractWeeksLeft}wk</span></span>
      </div>

      {wrestler.storyline && wrestler.storyline.length > 0 && (
        <div className="mb-4">
          <p className="wgm-mono text-[10px] mb-1.5" style={{ color: C.inkFaint }}>STORYLINE</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto wgm-scrollbar">
            {[...wrestler.storyline].reverse().map((entry, i) => (
              <div key={i} className="rounded-md p-2" style={{ backgroundColor: C.canvasAlt }}>
                <p className="text-[11px]" style={{ color: C.ink }}>{entry.text}</p>
                <p className="wgm-mono text-[9px] mt-0.5" style={{ color: C.inkFaint }}>Week {entry.week}, Year {entry.year}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>ALIGNMENT</p>
      <div className="flex gap-2 mb-4">
        {['face', 'heel', 'tweener'].map((a) => (
          <button key={a} onClick={() => onAlign(wrestler.id, a)} className="flex-1 py-1.5 rounded-md text-xs font-semibold capitalize" style={{ backgroundColor: wrestler.alignment === a ? C.gold : C.canvasAlt, color: wrestler.alignment === a ? C.ink : C.inkFaint }}>
            {a}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {wrestler.contractWeeksLeft <= 6 && <GhostButton icon={Check} onClick={() => onRenew(wrestler.id)} disabled={funds < wrestler.salary}>Renew ({money(wrestler.salary)})</GhostButton>}
        <GhostButton icon={UserMinus} danger onClick={() => onRelease(wrestler.id)}>Release</GhostButton>
      </div>
    </Modal>
  );
}

function FreeAgentModal({ wrestler, onClose, onSign, funds, bossReputation, reputation }) {
  const [termId, setTermId] = useState('standard');
  const [bonusPct, setBonusPct] = useState(1);
  const [wagePct, setWagePct] = useState(1);
  const [contractWeeks, setContractWeeks] = useState(18);
  const bossRep = bossReputation !== undefined ? bossReputation : 50;
  const isBigName = wrestler.tier === 'Star' || wrestler.tier === 'Legend';
  const term = CONTRACT_TERMS.find((t) => t.id === termId) || CONTRACT_TERMS[0];
  let cost = wrestler.salary * 2 * (wrestler.signingMult || 1) * term.bonusMult * bonusPct;
  if (hasTrait(wrestler, 'difficult')) cost = Math.round(cost * 1.3);
  if (hasTrait(wrestler, 'company_man')) cost = Math.round(cost * 0.8);
  if (isBigName) {
    if (bossRep >= 70) cost = Math.round(cost * 0.85);
    else if (bossRep <= 30) cost = Math.round(cost * 1.25);
  }
  cost = Math.round(cost);
  const weeklyWage = Math.round(wrestler.salary * wagePct);
  const offerQuality = (bonusPct + wagePct) / 2;
  return (
    <Modal title={wrestler.name} onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <TierBadge tier={wrestler.tier} />
        <div>
          <p className="text-xs italic" style={{ color: C.inkFaint }}>"{wrestler.gimmick}" · Age {wrestler.age}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <GenderBadge gender={wrestler.gender} />
            <AlignmentBadge alignment={wrestler.alignment} />
          </div>
        </div>
      </div>

      {(wrestler.traits && wrestler.traits.length > 0) && (
        <div className="mb-4">
          <p className="wgm-mono text-[10px] mb-1.5" style={{ color: C.inkFaint }}>PERSONALITY</p>
          <div className="space-y-1">
            {wrestler.traits.map((id) => {
              const t = traitInfo(id);
              if (!t) return null;
              return (
                <div key={id} className="flex items-center gap-2 rounded-md p-2" style={{ backgroundColor: t.polarity === 'positive' ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.1)' : 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.08)' }}>
                  <span className="wgm-mono text-[10px] font-bold shrink-0" style={{ color: t.polarity === 'positive' ? C.gold : C.rope }}>{t.label}</span>
                  <span className="text-[11px]" style={{ color: C.inkFaint }}>{t.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg p-3 mb-4 space-y-2" style={{ backgroundColor: C.ink }}>
        <StatBar label="STR" value={wrestler.stats.strength} />
        <StatBar label="TECH" value={wrestler.stats.technical} />
        <StatBar label="AERIAL" value={wrestler.stats.aerial} />
        <StatBar label="CHARISMA" value={wrestler.stats.charisma} />
        <StatBar label="STAMINA" value={wrestler.stats.stamina} />
        <div className="h-px my-2" style={{ backgroundColor: C.inkFaint }} />
        <StatBar label="POPULAR." value={wrestler.popularity} accent="#3E5C8A" />
      </div>

      {wrestler.ambition && (
        <div className="rounded-lg p-2.5 mb-4" style={{ backgroundColor: C.canvasAlt }}>
          <p className="wgm-mono text-[9px] mb-0.5" style={{ color: C.inkFaint }}>WHAT THEY WANT</p>
          <p className="text-xs" style={{ color: C.ink }}>{wrestler.ambition.label}{wrestler.ambition.type === 'beat_rival' && wrestler.ambition.targetName ? ` (${wrestler.ambition.targetName})` : ''}</p>
        </div>
      )}

      {isBigName && bossRep <= 30 && (
        <p className="text-[11px] mb-4" style={{ color: C.rope }}>Word is you're tough to work for. {wrestler.name.split(' ')[0]} is going to cost extra to convince.</p>
      )}
      {isBigName && bossRep >= 70 && (
        <p className="text-[11px] mb-4" style={{ color: C.good }}>Your reputation as a boss precedes you. {wrestler.name.split(' ')[0]} is willing to take a discount to sign here.</p>
      )}

      <div className="flex items-center justify-between text-xs mb-2" style={{ color: C.inkFaint }}>
        <span>Asking Salary: <span className="wgm-mono" style={{ color: C.ink }}>{money(wrestler.salary)}/wk</span></span>
      </div>
      {wrestler.discoveredVia && (
        <p className="text-[11px] mb-3" style={{ color: C.inkFaint }}>Found: {wrestler.discoveredVia}</p>
      )}

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>NEGOTIATE THE CONTRACT</p>
      <div className="space-y-2 mb-4">
        {CONTRACT_TERMS.map((t) => {
          const fit = negotiationFit(wrestler.character, t.id, offerQuality, reputation, contractWeeks);
          return (
            <button key={t.id} onClick={() => setTermId(t.id)} className="w-full rounded-lg p-2.5 text-left" style={{ backgroundColor: termId === t.id ? C.gold : C.canvasAlt, border: `1px solid ${C.line}` }}>
              <p className="text-xs font-bold" style={{ color: termId === t.id ? C.ink : C.ink }}>{t.label}</p>
              <p className="text-[10px]" style={{ color: termId === t.id ? C.inkSoft : C.inkFaint }}>{t.blurb}</p>
              <p className="text-[10px] italic mt-1" style={{ color: termId === t.id ? C.inkSoft : (fit >= 45 ? C.good : C.rope) }}>{negotiationFitHint(fit)}</p>
            </button>
          );
        })}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>SIGNING BONUS</span>
          <span className="wgm-mono text-[10px]" style={{ color: C.ink }}>{money(cost)} ({Math.round(bonusPct * 100)}%)</span>
        </div>
        <input type="range" min="0.5" max="1.5" step="0.05" value={bonusPct} onChange={(e) => setBonusPct(Number(e.target.value))} className="w-full" />
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>WEEKLY WAGE</span>
          <span className="wgm-mono text-[10px]" style={{ color: C.ink }}>{money(weeklyWage)}/wk ({Math.round(wagePct * 100)}%)</span>
        </div>
        <input type="range" min="0.8" max="1.3" step="0.05" value={wagePct} onChange={(e) => setWagePct(Number(e.target.value))} className="w-full" />
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>CONTRACT LENGTH</span>
          <span className="wgm-mono text-[10px]" style={{ color: C.ink }}>{contractWeeks} weeks</span>
        </div>
        <input type="range" min="8" max="40" step="2" value={contractWeeks} onChange={(e) => setContractWeeks(Number(e.target.value))} className="w-full" />
        <p className="text-[10px] mt-1" style={{ color: C.inkFaint }}>Longer deals appeal to anyone craving security — and can put off anyone craving freedom.</p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: C.inkFaint }}>A bad fit isn't a guaranteed no — but the further off it is, the more likely they walk. Offering above their ask (or below it) moves that either way.</p>

      <PrimaryButton full icon={UserPlus} onClick={() => onSign(wrestler.id, termId, bonusPct, wagePct, contractWeeks)} disabled={funds < cost}>Sign for {money(cost)}</PrimaryButton>
    </Modal>
  );
}

function FreeStaffModal({ staffMember, onClose, onHire, funds }) {
  const cost = Math.round(staffMember.salary * 1.5);
  return (
    <Modal title={staffMember.name} onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.steel }}>
          {staffMember.role === 'Announcer' ? <Radio size={15} color="white" /> : staffMember.role === 'Referee' ? <Shield size={15} color="white" /> : staffMember.role === 'Writer' ? <Newspaper size={15} color="white" /> : staffMember.role === 'Road Agent' ? <Truck size={15} color="white" /> : <Mic size={15} color="white" />}
        </div>
        <p className="text-xs italic" style={{ color: C.inkFaint }}>{staffMember.role}</p>
      </div>

      <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.ink }}>
        <StatBar label="QUALITY" value={staffMember.quality} />
      </div>

      {staffMember.trait && (
        <div className="mb-4">
          <p className="wgm-mono text-[10px] mb-1.5" style={{ color: C.inkFaint }}>TRAIT</p>
          {(() => {
            const t = STAFF_TRAITS.find((x) => x.id === staffMember.trait);
            if (!t) return null;
            return (
              <div className="flex items-center gap-2 rounded-md p-2" style={{ backgroundColor: t.polarity === 'positive' ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.1)' : 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.08)' }}>
                <span className="wgm-mono text-[10px] font-bold shrink-0" style={{ color: t.polarity === 'positive' ? C.gold : C.rope }}>{t.label}</span>
                <span className="text-[11px]" style={{ color: C.inkFaint }}>{t.polarity === 'positive' ? `+${t.mod} to show quality` : `${t.mod} to show quality`}</span>
              </div>
            );
          })()}
        </div>
      )}

      {staffMember.ambition && (
        <div className="rounded-lg p-2.5 mb-4" style={{ backgroundColor: C.canvasAlt }}>
          <p className="wgm-mono text-[9px] mb-0.5" style={{ color: C.inkFaint }}>WHAT THEY WANT</p>
          <p className="text-xs" style={{ color: C.ink }}>{staffMember.ambition.label}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs mb-5" style={{ color: C.inkFaint }}>
        <span>Asking Salary: <span className="wgm-mono" style={{ color: C.ink }}>{money(staffMember.salary)}/wk</span></span>
      </div>

      <PrimaryButton full icon={UserPlus} onClick={() => onHire(staffMember.role, staffMember.id)} disabled={funds < cost}>Hire for {money(cost)}</PrimaryButton>
    </Modal>
  );
}

/* ============================================================
   STAFF SUPPORT
   ============================================================ */
function StaffTraitBadge({ id }) {
  const t = STAFF_TRAITS.find((x) => x.id === id);
  if (!t) return null;
  return <span className="wgm-mono text-[9px] px-1.5 py-0.5 rounded inline-block mt-1" style={{ backgroundColor: t.polarity === 'positive' ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.18)' : 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.14)', color: t.polarity === 'positive' ? C.gold : C.rope }}>{t.label}</span>;
}

function StaffRow({ s, role, funds, onFire, onRaise }) {
  const amb = s.ambition;
  const raiseCost = Math.round(s.salary * 3);
  const roleColor = role === 'Announcer' ? '#3E5C8A' : role === 'Referee' ? C.gold : role === 'Writer' ? '#6B4E9E' : role === 'Road Agent' ? C.rope : C.steel;
  return (
    <div className="wgm-index-card rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${amb && amb.status === 'holdout' ? C.rope : C.line}`, borderLeftWidth: 5, borderLeftColor: roleColor }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.steel }}>
          {role === 'Announcer' ? <Radio size={15} color="white" /> : role === 'Referee' ? <Shield size={15} color="white" /> : role === 'Writer' ? <Newspaper size={15} color="white" /> : role === 'Road Agent' ? <Truck size={15} color="white" /> : <Mic size={15} color="white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{s.name}</p>
          <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{role.toUpperCase()} · QUALITY {s.quality} · {money(s.salary)}/wk</p>
          {s.trait && <StaffTraitBadge id={s.trait} />}
        </div>
        <GhostButton danger onClick={() => onFire(role, s.id)}>Fire</GhostButton>
      </div>
      {amb && (
        <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px]" style={{ color: C.inkFaint }}>{amb.label}</p>
            {amb.status === 'holdout' && <Pill bg={C.rope}>HOLDOUT</Pill>}
            {amb.status === 'unhappy' && <Pill bg={C.gold} color={C.ink}>UNHAPPY</Pill>}
          </div>
          <div className="h-1 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.canvasAlt }}>
            <div className="h-full rounded-full" style={{ width: `${amb.satisfaction}%`, backgroundColor: amb.satisfaction < 20 ? C.rope : amb.satisfaction < 40 ? C.goldSoft : C.good }} />
          </div>
          <GhostButton onClick={() => onRaise(role, s.id)} disabled={funds < raiseCost}>Give Raise ({money(raiseCost)})</GhostButton>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   BOOK SHOW TAB
   ============================================================ */
function BookShowTab({ draftShow, draftVenue, unlocked, estimate, roster, healthyRoster, titles, feuds, funds, company, onUpdateDraft, onOpenMatchBuilder, onOpenPromoBuilder, onRemove, onMove, onRun, onRepairRing, onRestockSupplies, onSkipDay, onSkipToShowDay, onEndWeekWithoutShow }) {
  const [venueEditorOpen, setVenueEditorOpen] = useState(false);
  const wrestlerName = (id) => (roster.find((r) => r.id === id) || {}).name || '???';
  const wrestlerBilling = (id) => {
    const w = roster.find((r) => r.id === id);
    if (!w) return { name: '???', sub: '' };
    return { name: w.name, sub: `${w.hometown || ''}${w.hometown && w.weight ? ' · ' : ''}${w.weight ? `${w.weight} lbs` : ''}` };
  };
  const marketingTier = MARKETING_TIERS.find((t) => t.cost === draftShow.marketingBudget) || MARKETING_TIERS[0];
  const weekDay = company.weekDay || 1;
  const canAct = weekDay <= WEEK_DAYS.length;
  const dayLabel = weekDay <= WEEK_DAYS.length ? WEEK_DAYS[weekDay - 1] : 'Show Day';
  const ringCondition = company.ringCondition !== undefined ? company.ringCondition : 100;
  const supplies = company.supplies !== undefined ? company.supplies : 100;
  const ringRepairCost = Math.round((100 - ringCondition) * 45);
  const restockCost = Math.round((100 - supplies) * 20);
  const availableVenues = unlocked.filter((v) => v.id === draftShow.venueId || !(company.unavailableVenueIds || []).includes(v.id));
  return (
    <div className="space-y-4">
      <div className="rounded-lg p-3" style={{ backgroundColor: C.ink }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} color={C.gold} />
            <p className="wgm-display text-base" style={{ color: C.cream }}>{dayLabel}</p>
          </div>
          <p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>{canAct ? `DAY ${weekDay} OF ${WEEK_DAYS.length}` : 'OUT OF DAYS — RUN THE SHOW'}</p>
        </div>
        <div className="flex gap-1 mb-3">
          {WEEK_DAYS.map((d, i) => (
            <div key={d} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: i < weekDay - 1 ? C.gold : i === weekDay - 1 && canAct ? 'rgba(196,146,46,0.5)' : 'rgba(246,240,225,0.15)' }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>RING</span>
              <span className="wgm-mono text-[9px]" style={{ color: ringCondition < 40 ? C.rope : C.cream }}>{Math.round(ringCondition)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.15)' }}>
              <div className="h-full rounded-full" style={{ width: `${ringCondition}%`, backgroundColor: ringCondition < 40 ? C.rope : C.gold }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>SUPPLIES</span>
              <span className="wgm-mono text-[9px]" style={{ color: supplies < 30 ? C.rope : C.cream }}>{Math.round(supplies)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.15)' }}>
              <div className="h-full rounded-full" style={{ width: `${supplies}%`, backgroundColor: supplies < 30 ? C.rope : C.gold }} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <GhostButton onClick={onRepairRing} disabled={!canAct || ringCondition >= 100 || funds < ringRepairCost}>Repair Ring {ringCondition < 100 ? `(${money(ringRepairCost)})` : ''}</GhostButton>
          <GhostButton onClick={onRestockSupplies} disabled={!canAct || supplies >= 100 || funds < restockCost}>Restock {supplies < 100 ? `(${money(restockCost)})` : ''}</GhostButton>
        </div>
        <div className="flex gap-2">
          <GhostButton onClick={onSkipDay} disabled={!canAct}>Skip Day</GhostButton>
          <GhostButton onClick={onSkipToShowDay} disabled={!canAct}>Skip to Show Day</GhostButton>
        </div>
        <button onClick={onEndWeekWithoutShow} className="wgm-mono text-[9px] underline mt-2" style={{ color: 'rgba(246,240,225,0.5)' }}>
          Not ready? End the week with no show (payroll still due).
        </button>
      </div>

      <div>
        <SectionTitle icon={Ticket}>Show Name</SectionTitle>
        <input
          type="text" value={draftShow.showName} onChange={(e) => onUpdateDraft({ showName: e.target.value })}
          placeholder={`${company.name} Wrestling`} maxLength={40}
          className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }}
        />
      </div>

      <div>
        <SectionTitle icon={Megaphone} sub={marketingTier.label}>Marketing</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {MARKETING_TIERS.map((t) => (
            <button key={t.id} onClick={() => onUpdateDraft({ marketingBudget: t.cost })} className="rounded-lg p-2.5 text-left" style={{ backgroundColor: draftShow.marketingBudget === t.cost ? C.ink : C.cream, border: `1px solid ${C.line}` }}>
              <p className="text-xs font-semibold" style={{ color: draftShow.marketingBudget === t.cost ? C.gold : C.ink }}>{t.label}</p>
              <p className="wgm-mono text-[9px]" style={{ color: draftShow.marketingBudget === t.cost ? 'rgba(246,240,225,0.6)' : C.inkFaint }}>{t.cost === 0 ? 'FREE' : money(t.cost)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="wgm-ticket rounded-lg p-3 grid grid-cols-3 gap-2 text-center" style={{ backgroundColor: C.canvasAlt }}>
        <div><p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>EST. FANS</p><p className="wgm-display text-base" style={{ color: C.ink }}>{estimate.attendance.toLocaleString()}</p></div>
        <div><p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>REVENUE</p><p className="wgm-display text-base" style={{ color: C.good }}>{money(estimate.revenue)}</p></div>
        <div><p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>EST. PROFIT</p><p className="wgm-display text-base" style={{ color: estimate.profit >= 0 ? C.good : C.rope }}>{money(estimate.profit)}</p></div>
      </div>

      <div className="wgm-rope-frame p-4" style={{ backgroundColor: C.cream }}>
        <div className="text-center mb-3">
          <p className="wgm-mono text-[9px] tracking-widest" style={{ color: C.inkFaint }}>{(company.name || 'INDEPENDENT WRESTLING').toUpperCase()} PRESENTS</p>
          <h2 className="wgm-display text-3xl leading-tight" style={{ color: C.ink }}>{(draftShow.showName || 'WRESTLING').toUpperCase()}</h2>
          <button onClick={() => setVenueEditorOpen((o) => !o)} className="mt-1">
            <p className="text-xs font-semibold underline" style={{ color: C.ink }}>{draftVenue.name}</p>
            <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>WEEK {company.week} · YEAR {company.year} · {money(draftShow.ticketPrice)} ADMISSION · TAP TO EDIT</p>
          </button>
        </div>

        {venueEditorOpen && (
          <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: C.canvasAlt }}>
            <p className="wgm-mono text-[9px] mb-1.5" style={{ color: C.inkFaint }}>VENUE — {availableVenues.length} AVAILABLE THIS WEEK</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {availableVenues.map((v) => {
                const leanLabel = v.crowdLean ? (STYLE_CONFIG[v.crowdLean] || {}).label : null;
                const isHome = v.crowdLean === company.style;
                return (
                  <button key={v.id} onClick={() => onUpdateDraft({ venueId: v.id })} className="rounded-md p-2 text-left" style={{ backgroundColor: draftShow.venueId === v.id ? C.ink : C.cream, border: `1px solid ${v.crowdLean ? (isHome ? C.gold : C.rope) : C.line}` }}>
                    <p className="text-xs font-semibold" style={{ color: draftShow.venueId === v.id ? C.gold : C.ink }}>{v.name}</p>
                    <p className="wgm-mono text-[9px]" style={{ color: draftShow.venueId === v.id ? 'rgba(246,240,225,0.6)' : C.inkFaint }}>Cap {v.capacity.toLocaleString()} · {money(v.rent)} rent</p>
                    {leanLabel && (
                      <p className="wgm-mono text-[9px] mt-0.5" style={{ color: draftShow.venueId === v.id ? (isHome ? C.gold : '#E8897A') : (isHome ? C.gold : C.rope) }}>
                        {isHome ? `HOME CROWD · ${leanLabel.toUpperCase()}` : `${leanLabel.toUpperCase()} CROWD · MISMATCH`}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            {(company.unavailableVenueIds || []).length > 0 && (
              <p className="text-[10px] mb-2" style={{ color: C.rope }}>
                Booked elsewhere this week: {(company.unavailableVenueIds || []).map((id) => (ALL_VENUES.find((v) => v.id === id) || {}).name).filter(Boolean).join(', ')}
              </p>
            )}
            <p className="wgm-mono text-[9px] mb-1.5" style={{ color: C.inkFaint }}>TICKET PRICE — {money(draftShow.ticketPrice)}</p>
            <input type="range" min="5" max="150" step="5" value={draftShow.ticketPrice} onChange={(e) => onUpdateDraft({ ticketPrice: Number(e.target.value) })} className="w-full" />
          </div>
        )}

        <div className="space-y-3 mb-3">
          {draftShow.card.length === 0 && <EmptyState text="Add matches and promos to build your show." />}
          {draftShow.card.map((item, i) => {
            const isMainEvent = i === draftShow.card.length - 1 && item.kind === 'match';
            const title = item.kind === 'match' && item.titleId ? titles.find((t) => t.id === item.titleId) : null;
            const blowOffFeud = item.kind === 'match' && item.feudBlowOffId ? feuds.find((f) => f.id === item.feudBlowOffId) : null;
            return (
              <div key={item.id} className="wgm-bout-divider pt-3 first:border-t-0 first:pt-0 relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="wgm-mono text-[10px] font-bold" style={{ color: C.inkFaint }}>
                    {isMainEvent ? 'MAIN EVENT' : `BOUT ${i + 1}`}{item.kind === 'promo' ? ' · SPECIAL ATTRACTION' : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onMove(i, -1)} disabled={i === 0} className="p-1 rounded disabled:opacity-20"><ChevronUp size={12} color={C.inkFaint} /></button>
                    <button onClick={() => onMove(i, 1)} disabled={i === draftShow.card.length - 1} className="p-1 rounded disabled:opacity-20"><ChevronDown size={12} color={C.inkFaint} /></button>
                    <button onClick={() => onRemove(i)} className="p-1 rounded" style={{ backgroundColor: C.ropeDark }}><X size={11} color={C.cream} /></button>
                  </div>
                </div>

                {title && <p className="wgm-display text-sm text-center mb-1" style={{ color: C.rope }}>{title.name.toUpperCase()} MATCH</p>}
                {blowOffFeud && <p className="wgm-mono text-[9px] text-center mb-1 font-bold" style={{ color: C.rope }}>BLOW-OFF: THE FEUD SETTLES TONIGHT</p>}
                <p className="wgm-mono text-[9px] text-center mb-2" style={{ color: C.inkFaint }}>{(ALL_MATCH_TYPES.find((m) => m.id === item.typeId) || {}).label || `PROMO · ${item.purpose}`}</p>

                {item.kind === 'match' && item.participantIds.length === 2 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-center">
                      <p className={isMainEvent ? 'wgm-display text-lg' : 'text-sm font-bold'} style={{ color: C.ink }}>{wrestlerBilling(item.participantIds[0]).name}</p>
                      <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{wrestlerBilling(item.participantIds[0]).sub}</p>
                    </div>
                    <span className="wgm-display text-sm shrink-0" style={{ color: C.rope }}>VS</span>
                    <div className="flex-1 text-center">
                      <p className={isMainEvent ? 'wgm-display text-lg' : 'text-sm font-bold'} style={{ color: C.ink }}>{wrestlerBilling(item.participantIds[1]).name}</p>
                      <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{wrestlerBilling(item.participantIds[1]).sub}</p>
                    </div>
                  </div>
                ) : item.kind === 'match' && item.sides ? (
                  <div className="flex items-start gap-2">
                    <div className="flex-1 text-center">
                      {item.sides[0].map((pid) => (
                        <div key={pid} className="mb-1">
                          <p className="text-sm font-bold" style={{ color: C.ink }}>{wrestlerBilling(pid).name}</p>
                          <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{wrestlerBilling(pid).sub}</p>
                        </div>
                      ))}
                    </div>
                    <span className="wgm-display text-sm shrink-0 mt-1" style={{ color: C.rope }}>VS</span>
                    <div className="flex-1 text-center">
                      {item.sides[1].map((pid) => (
                        <div key={pid} className="mb-1">
                          <p className="text-sm font-bold" style={{ color: C.ink }}>{wrestlerBilling(pid).name}</p>
                          <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{wrestlerBilling(pid).sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : item.kind === 'match' ? (
                  <div className="text-center space-y-1">
                    {item.participantIds.map((pid, j) => (
                      <p key={pid} className="text-sm font-bold" style={{ color: C.ink }}>
                        {wrestlerBilling(pid).name} <span className="wgm-mono text-[9px] font-normal" style={{ color: C.inkFaint }}>({wrestlerBilling(pid).sub})</span>{j < item.participantIds.length - 1 ? <span style={{ color: C.rope }}> · VS ·</span> : ''}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-center" style={{ color: C.ink }}>{item.participantIds.map(wrestlerName).join(' & ')}</p>
                )}

                {item.kind === 'match' && (
                  <p className="wgm-mono text-[9px] text-center mt-2" style={{ color: C.inkFaint }}>WINNER: {item.winnerIds.map(wrestlerName).join(' & ')} BY {FINISH_TYPES.find((f) => f.id === item.finishId).label.toUpperCase()}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <GhostButton icon={Plus} onClick={onOpenMatchBuilder} disabled={healthyRoster.length < 2}>Add Match</GhostButton>
          <GhostButton icon={Plus} onClick={onOpenPromoBuilder} disabled={roster.length < 1}>Add Promo</GhostButton>
        </div>
      </div>

      <PrimaryButton full icon={Zap} onClick={onRun} disabled={draftShow.card.length === 0}>Run Show — {draftVenue.name}</PrimaryButton>
    </div>
  );
}

/* ============================================================
   MATCH BUILDER MODAL
   ============================================================ */
function MatchBuilderModal({ roster, titles, tagTeams, feuds, style, unlockedResearch, onClose, onAdd }) {
  const availableTypes = [...MATCH_TYPES, ...RESEARCHABLE_MATCH_TYPES.filter((t) => (unlockedResearch || []).includes(t.id))];
  const styleTypes = style && STYLE_CONFIG[style]
    ? [...availableTypes].sort((a, b) => {
        const pref = STYLE_CONFIG[style].preferredTypes;
        const ia = pref.indexOf(a.id); const ib = pref.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
    : availableTypes;
  const [typeId, setTypeId] = useState(styleTypes[0].id);
  const [selected, setSelected] = useState([]);
  const [winnerIds, setWinnerIds] = useState([]);
  const [sideMap, setSideMap] = useState({});
  const [finishId, setFinishId] = useState('clean');
  const [titleId, setTitleId] = useState('');
  const [feudBlowOffId, setFeudBlowOffId] = useState('');
  const type = availableTypes.find((m) => m.id === typeId) || availableTypes[0];
  const isSidesMatch = !!type.sides;
  const sideSize = type.sideSize || 2;
  const eligibleFeuds = (feuds || []).filter((f) => f.status !== 'ended' && feudPairPresent(f, selected));

  useEffect(() => {
    if (!isSidesMatch || selected.length !== sideSize * 2) { setSideMap({}); return; }
    setSideMap((prev) => {
      const stillValid = selected.every((id) => prev[id]) && Object.values(prev).filter((v) => v === 'A').length === sideSize;
      if (stillValid) return prev;
      const registeredTeam = (tagTeams || []).find((t) => t.memberIds.every((id) => selected.includes(id)));
      const aIds = registeredTeam ? [...registeredTeam.memberIds, ...selected.filter((id) => !registeredTeam.memberIds.includes(id))].slice(0, sideSize) : selected.slice(0, sideSize);
      const next = {};
      selected.forEach((id) => { next[id] = aIds.includes(id) ? 'A' : 'B'; });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSidesMatch, sideSize, selected.join(','), tagTeams]);

  const sideAIds = selected.filter((id) => sideMap[id] === 'A');
  const sideBIds = selected.filter((id) => sideMap[id] === 'B');
  const sidesBalanced = isSidesMatch && sideAIds.length === sideSize && sideBIds.length === sideSize;
  const titleChoices = titles.filter((t) => (isSidesMatch ? t.isTag : !t.isTag));
  const selectedTitle = titleChoices.find((t) => t.id === titleId);

  function toggle(id) {
    setSelected((prev) => {
      if (prev.includes(id)) { const next = prev.filter((p) => p !== id); setWinnerIds((w) => w.filter((x) => x !== id)); return next; }
      if (prev.length >= type.maxP) return prev;
      return [...prev, id];
    });
  }
  function toggleWinner(id) {
    setWinnerIds((prev) => (prev.includes(id) ? [] : [id]));
  }
  function flipSide(id) {
    setSideMap((prev) => {
      const target = prev[id] === 'A' ? 'B' : 'A';
      const targetIds = selected.filter((sid) => prev[sid] === target && sid !== id);
      const swapPartner = targetIds[0];
      const next = { ...prev, [id]: target };
      if (swapPartner) next[swapPartner] = prev[id];
      return next;
    });
    setWinnerIds([]);
  }
  function pickWinningSide(sideLetter) {
    setWinnerIds(sideLetter === 'A' ? sideAIds : sideBIds);
  }

  const canAdd = isSidesMatch
    ? selected.length === sideSize * 2 && sidesBalanced && winnerIds.length === sideSize
    : selected.length >= type.minP && selected.length <= type.maxP && winnerIds.length === 1;
  const activeFeudBlowOffId = eligibleFeuds.some((f) => f.id === feudBlowOffId) ? feudBlowOffId : '';

  return (
    <Modal title="Add Match" onClose={onClose} wide>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>MATCH TYPE</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {styleTypes.map((m) => (
          <button key={m.id} onClick={() => { setTypeId(m.id); setSelected([]); setWinnerIds([]); setTitleId(''); }} className="rounded-md p-2 text-xs font-semibold text-left" style={{ backgroundColor: typeId === m.id ? C.ink : C.canvasAlt, color: typeId === m.id ? C.gold : C.inkFaint }}>
            {m.label}<br /><span className="wgm-mono text-[9px] opacity-70">{m.minP === m.maxP ? `${m.minP} wrestlers` : `${m.minP}–${m.maxP} wrestlers`}</span>
          </button>
        ))}
      </div>

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>PARTICIPANTS ({selected.length}/{type.maxP})</p>
      <div className="max-h-52 overflow-y-auto wgm-scrollbar space-y-1.5 mb-4">
        {roster.map((w) => {
          const team = (tagTeams || []).find((t) => t.memberIds.includes(w.id));
          return (
            <label key={w.id} className="flex flex-col gap-1 rounded-md p-2 text-xs cursor-pointer" style={{ backgroundColor: selected.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} />
                <span className="flex-1" style={{ color: C.ink }}>{w.name} <span style={{ color: C.inkFaint }}>({w.tier})</span></span>
                {team && <Pill bg={C.gold} color={C.ink}>{team.name}</Pill>}
                {isSidesMatch && selected.includes(w.id) && (
                  <button type="button" onClick={() => flipSide(w.id)} className="wgm-mono text-[9px] px-2 py-1 rounded-full font-bold" style={{ backgroundColor: sideMap[w.id] === 'A' ? C.gold : C.rope, color: sideMap[w.id] === 'A' ? C.ink : C.cream }}>
                    SIDE {sideMap[w.id] || '?'}
                  </button>
                )}
                <GenderBadge gender={w.gender} /> <AlignmentBadge alignment={w.alignment} />
              </div>
              <WrestlerStatLine w={w} />
            </label>
          );
        })}
      </div>

      {titleChoices.length > 0 && (
        <>
          <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>TITLE ON THE LINE</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => { setTitleId(''); setWinnerIds([]); }} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: titleId === '' ? C.ink : C.canvasAlt, color: titleId === '' ? C.gold : C.inkFaint }}>No Title</button>
            {titleChoices.map((t) => (
              <button key={t.id} onClick={() => { setTitleId(t.id); setWinnerIds([]); }} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: titleId === t.id ? C.gold : C.canvasAlt, color: titleId === t.id ? C.ink : C.inkFaint }}>{t.name}{t.isTag ? ' (Tag)' : ''}</button>
            ))}
          </div>
        </>
      )}

      {isSidesMatch ? (
        sidesBalanced && (
          <>
            <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>WINNING SIDE</p>
            <div className="flex flex-col gap-2 mb-4">
              <button onClick={() => pickWinningSide('A')} className="px-3 py-2 rounded-md text-xs font-semibold text-left" style={{ backgroundColor: winnerIds.length && sideAIds.every((id) => winnerIds.includes(id)) ? C.gold : C.canvasAlt, color: winnerIds.length && sideAIds.every((id) => winnerIds.includes(id)) ? C.ink : C.inkFaint }}>
                Side A: {sideAIds.map((id) => (roster.find((r) => r.id === id) || {}).name).join(' & ')}
              </button>
              <button onClick={() => pickWinningSide('B')} className="px-3 py-2 rounded-md text-xs font-semibold text-left" style={{ backgroundColor: winnerIds.length && sideBIds.every((id) => winnerIds.includes(id)) ? C.rope : C.canvasAlt, color: winnerIds.length && sideBIds.every((id) => winnerIds.includes(id)) ? C.cream : C.inkFaint }}>
                Side B: {sideBIds.map((id) => (roster.find((r) => r.id === id) || {}).name).join(' & ')}
              </button>
            </div>
          </>
        )
      ) : (
        selected.length >= type.minP && (
          <>
            <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>WINNER</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selected.map((id) => {
                const w = roster.find((r) => r.id === id);
                return <button key={id} onClick={() => toggleWinner(id)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: winnerIds.includes(id) ? C.gold : C.canvasAlt, color: winnerIds.includes(id) ? C.ink : C.inkFaint }}>{w.name}</button>;
              })}
            </div>
          </>
        )
      )}

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>FINISH</p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {FINISH_TYPES.map((f) => (
          <button key={f.id} onClick={() => setFinishId(f.id)} className="rounded-md p-2 text-xs font-semibold" style={{ backgroundColor: finishId === f.id ? C.ink : C.canvasAlt, color: finishId === f.id ? C.gold : C.inkFaint }}>{f.label}</button>
        ))}
      </div>
      {titleId && (finishId === 'dq' || finishId === 'countout') && (
        <p className="text-[11px] mb-4" style={{ color: C.rope }}>The champion retains the title on a {FINISH_TYPES.find((f) => f.id === finishId).label.toLowerCase()}, regardless of who wins the bout.</p>
      )}

      {eligibleFeuds.length > 0 && (
        <>
          <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>MARK AS BLOW-OFF (OPTIONAL)</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setFeudBlowOffId('')} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: activeFeudBlowOffId === '' ? C.ink : C.canvasAlt, color: activeFeudBlowOffId === '' ? C.gold : C.inkFaint }}>None</button>
            {eligibleFeuds.map((f) => (
              <button key={f.id} onClick={() => setFeudBlowOffId(f.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: activeFeudBlowOffId === f.id ? C.rope : C.canvasAlt, color: activeFeudBlowOffId === f.id ? C.cream : C.inkFaint }}>
                {f.aName} vs {f.bName} ({f.heat} heat)
              </button>
            ))}
          </div>
          {activeFeudBlowOffId && (
            <p className="text-[11px] mb-4" style={{ color: C.rope }}>This match pays off the feud — heat drops after but the rivalry can always continue.</p>
          )}
        </>
      )}

      <PrimaryButton full disabled={!canAdd} onClick={() => onAdd({ kind: 'match', id: uid(), typeId, participantIds: selected, winnerIds, finishId, titleId: titleId || null, feudBlowOffId: activeFeudBlowOffId || null, sides: isSidesMatch ? [sideAIds, sideBIds] : null })}>Add to Card</PrimaryButton>
    </Modal>
  );
}

/* ============================================================
   PROMO BUILDER MODAL
   ============================================================ */
function PromoBuilderModal({ roster, staff, feuds, writerTierLevel, onClose, onAdd }) {
  const [selected, setSelected] = useState([]);
  const [purpose, setPurpose] = useState(PROMO_PURPOSES[0]);
  const [hostStaffId, setHostStaffId] = useState('');
  const [storyBeatId, setStoryBeatId] = useState('');
  const allStaff = [...(staff ? staff.announcers : []), ...(staff ? staff.commentators : [])];
  const matchedFeud = (feuds || []).find((f) => f.status !== 'ended' && feudPairPresent(f, selected));
  const beatsUnlocked = (writerTierLevel || 0) >= 2 && !!matchedFeud;

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= 3 ? prev : [...prev, id]));
  }

  return (
    <Modal title="Add Promo Segment" onClose={onClose} wide>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>PURPOSE</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PROMO_PURPOSES.map((p) => (
          <button key={p} onClick={() => setPurpose(p)} className="rounded-md p-2 text-xs font-semibold" style={{ backgroundColor: purpose === p ? C.ink : C.canvasAlt, color: purpose === p ? C.gold : C.inkFaint }}>{p}</button>
        ))}
      </div>

      {allStaff.length > 0 && (
        <>
          <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>HOSTED BY (OPTIONAL)</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setHostStaffId('')} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: hostStaffId === '' ? C.ink : C.canvasAlt, color: hostStaffId === '' ? C.gold : C.inkFaint }}>No Host</button>
            {allStaff.map((s) => (
              <button key={s.id} onClick={() => setHostStaffId(s.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: hostStaffId === s.id ? C.gold : C.canvasAlt, color: hostStaffId === s.id ? C.ink : C.inkFaint }}>
                {s.name} ({s.quality})
              </button>
            ))}
          </div>
        </>
      )}

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>PARTICIPANTS ({selected.length}/3)</p>
      <div className="max-h-60 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {roster.map((w) => {
          const holdout = w.ambition && w.ambition.status === 'holdout';
          const onLeave = w.wellness && w.wellness.status === 'in_program';
          const unavailable = !!w.injury || holdout || onLeave;
          return (
            <label key={w.id} className="flex flex-col gap-1 rounded-md p-2 text-xs cursor-pointer" style={{ backgroundColor: selected.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} disabled={unavailable} />
                <span className="flex-1" style={{ color: unavailable ? C.inkFaint : C.ink }}>{w.name} {w.injury && '(injured)'}{holdout && '(holdout)'}{onLeave && '(on leave)'}</span>
                <GenderBadge gender={w.gender} /> <AlignmentBadge alignment={w.alignment} />
              </div>
              <WrestlerStatLine w={w} />
            </label>
          );
        })}
      </div>

      {matchedFeud && !beatsUnlocked && (
        <p className="text-[11px] mb-4" style={{ color: C.inkFaint }}>This ties into the {matchedFeud.aName} / {matchedFeud.bName} feud. A higher-quality writer would unlock a scripted Story Beat here.</p>
      )}
      {beatsUnlocked && (
        <div className="mb-5">
          <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>STORY BEAT (OPTIONAL) — ties into {matchedFeud.aName} vs {matchedFeud.bName}</p>
          <div className="space-y-2">
            <button onClick={() => setStoryBeatId('')} className="w-full rounded-md p-2 text-left text-xs" style={{ backgroundColor: storyBeatId === '' ? C.ink : C.canvasAlt, color: storyBeatId === '' ? C.gold : C.inkFaint }}>No scripted beat</button>
            {STORY_BEATS.map((b) => (
              <button key={b.id} onClick={() => setStoryBeatId(b.id)} className="w-full rounded-md p-2 text-left" style={{ backgroundColor: storyBeatId === b.id ? C.gold : C.canvasAlt, border: `1px solid ${C.line}` }}>
                <p className="text-xs font-semibold" style={{ color: storyBeatId === b.id ? C.ink : C.ink }}>{b.label}</p>
                <p className="text-[10px]" style={{ color: storyBeatId === b.id ? C.inkSoft : C.inkFaint }}>{b.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <PrimaryButton full disabled={selected.length === 0} onClick={() => onAdd({ kind: 'promo', id: uid(), participantIds: selected, purpose, hostStaffId: hostStaffId || null, storyBeatId: (beatsUnlocked && storyBeatId) || null, feudId: matchedFeud ? matchedFeud.id : null })}>Add to Card</PrimaryButton>
    </Modal>
  );
}

/* ============================================================
   SHOW RESULT MODAL
   ============================================================ */
function ShowResultModal({ result, roster, onClose }) {
  const [expanded, setExpanded] = useState(null);
  const wrestlerName = (id) => (roster.find((r) => r.id === id) || {}).name || '???';

  return (
    <Modal title={`${result.venue.name} Results`} onClose={onClose} wide>
      <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: C.ink }}>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>ATTENDANCE</p><p className="wgm-display text-xl" style={{ color: C.cream }}>{result.attendance.toLocaleString()} / {result.venue.capacity.toLocaleString()}</p></div>
          <div><p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>SHOW RATING</p><div className="flex justify-center mt-1"><StarRow value={result.avgStars} /></div></div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>OVERALL GRADE</span>
          <span className="wgm-display text-lg" style={{ color: letterGradeColor(showLetterGrade({ attendance: result.attendance, capacity: result.venue.capacity, avgStars: result.avgStars, netProfit: result.netProfit })) }}>
            {showLetterGrade({ attendance: result.attendance, capacity: result.venue.capacity, avgStars: result.avgStars, netProfit: result.netProfit })}
          </span>
        </div>
        {result.crowdVerdict && (
          <p className="text-center text-[11px] mt-2" style={{ color: result.crowdVerdict === 'won_over' ? C.good : result.crowdVerdict === 'bombed' ? C.rope : 'rgba(246,240,225,0.6)' }}>
            {result.crowdVerdict === 'won_over' && `This crowd wasn't your usual audience — but you won them over. Extra reputation earned.`}
            {result.crowdVerdict === 'bombed' && `This crowd wasn't your usual audience, and the show didn't land. That cost you extra reputation.`}
            {result.crowdVerdict === 'flat' && `A mismatched crowd tonight — the show was fine, but it didn't change many minds either way.`}
          </p>
        )}
        <div className="h-px my-3" style={{ backgroundColor: C.inkFaint }} />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>REVENUE</p><p className="wgm-mono text-sm" style={{ color: C.good }}>{money(result.revenue)}</p></div>
          <div><p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>EXPENSES</p><p className="wgm-mono text-sm" style={{ color: C.rope }}>{money(result.expenses)}</p></div>
          <div><p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>NET</p><p className="wgm-mono text-sm font-bold" style={{ color: result.netProfit >= 0 ? C.good : C.rope }}>{money(result.netProfit)}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-2" style={{ borderTop: `1px solid ${C.inkFaint}` }}>
          <div><p className="wgm-mono text-[8px]" style={{ color: 'rgba(246,240,225,0.45)' }}>TICKETS</p><p className="wgm-mono text-xs" style={{ color: C.cream }}>{money(result.ticketRevenue)}</p></div>
          <div><p className="wgm-mono text-[8px]" style={{ color: 'rgba(246,240,225,0.45)' }}>CONCESSIONS</p><p className="wgm-mono text-xs" style={{ color: C.cream }}>{money(result.concessionsRevenue)}</p></div>
          <div><p className="wgm-mono text-[8px]" style={{ color: 'rgba(246,240,225,0.45)' }}>MERCH</p><p className="wgm-mono text-xs" style={{ color: C.cream }}>{money(result.merchRevenue)}</p></div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {result.repDelta >= 0 ? <TrendingUp size={13} color={C.good} /> : <TrendingDown size={13} color={C.rope} />}
          <span className="wgm-mono text-[11px]" style={{ color: result.repDelta >= 0 ? C.good : C.rope }}>{result.repDelta >= 0 ? '+' : ''}{result.repDelta} reputation</span>
        </div>
      </div>

      <div className="space-y-2 mb-2">
        {result.matchResults.map((m, i) => (
          <div key={m.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full p-3 flex items-center justify-between text-left" style={{ backgroundColor: C.cream }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.ink }}>{m.participantIds.map(wrestlerName).join(' vs ')}</p>
                <p className="text-[11px]" style={{ color: C.inkFaint }}>{m.winnerIds.map(wrestlerName).join(' & ')} wins by {m.result.finishLabel.toLowerCase()} · crowd was {m.result.crowdTier.toLowerCase()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StarRow value={m.result.finalStars} size={12} />
                <ChevronDown size={14} color={C.inkFaint} style={{ transform: expanded === i ? 'rotate(180deg)' : 'none' }} />
              </div>
            </button>
            {expanded === i && (
              <div className="p-3 space-y-1" style={{ backgroundColor: C.canvasAlt }}>
                {m.result.beatLog.map((line, j) => <p key={j} className="text-[11px]" style={{ color: C.inkSoft }}>• {line}</p>)}
                {m.result.injuries.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} color={C.rope} />
                    <p className="text-[11px] font-semibold" style={{ color: C.rope }}>{m.result.injuries.map((inj) => `${wrestlerName(inj.wrestlerId)}: ${inj.label}`).join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {result.promoResults.map((p) => (
          <div key={p.id} className="rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
            <p className="text-sm font-semibold" style={{ color: C.ink }}>{p.purpose}: {p.participantIds.map(wrestlerName).join(' & ')}</p>
            <p className="text-[11px]" style={{ color: C.inkFaint }}>Crowd reaction score: {p.pop}/100</p>
          </div>
        ))}
      </div>

      <PrimaryButton full onClick={onClose}>Continue</PrimaryButton>
    </Modal>
  );
}

/* ============================================================
   HISTORY TAB
   ============================================================ */
function HistoryTab({ history }) {
  if (history.length === 0) return <EmptyState text="No shows run yet. Your first event will appear here." />;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-5 rounded-sm wgm-ledger-spine" />
        <h2 className="wgm-display text-lg" style={{ color: C.ink }}>COMPANY RECORDS</h2>
      </div>
      <div className="wgm-ledger space-y-2 rounded-lg p-1">
        {history.map((h, i) => (
          <div key={i} className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            <div className="wgm-ledger-spine w-7 shrink-0 flex items-center justify-center">
              <span className="wgm-mono text-[9px] font-bold" style={{ color: C.cream, writingMode: 'vertical-rl' }}>NO.{String(history.length - i).padStart(3, '0')}</span>
            </div>
            <div className="flex-1 p-3" style={{ backgroundColor: C.cream }}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.ink }}>{h.showName || `Week ${h.week} Show`}</p>
                  <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>WEEK {h.week}, YEAR {h.year} · {h.venueName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {h.grade && <span className="wgm-display text-sm" style={{ color: letterGradeColor(h.grade) }}>{h.grade}</span>}
                  <StarRow value={h.avgStars} size={12} />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] mb-1.5 wgm-mono" style={{ color: C.inkFaint }}>
                <span>{h.attendance.toLocaleString()} / {h.capacity.toLocaleString()} FANS</span>
                <span style={{ color: h.netProfit >= 0 ? C.ink : C.rope, fontWeight: 700 }}>{h.netProfit >= 0 ? '+' : '−'}{money(Math.abs(h.netProfit))}</span>
              </div>
              <div className="space-y-0.5">
                {h.matches.map((m, j) => (
                  <p key={j} className="text-[10px]" style={{ color: C.inkSoft }}>
                    {m.titleName && <Crown size={10} color={C.gold} fill={C.gold} className="inline mr-1" />}
                    {m.blowOff && <Flame size={10} color={C.rope} className="inline mr-1" />}
                    {m.label} — {m.winner} ({m.stars}★){m.titleName ? ` · ${m.titleName}` : ''}{m.blowOff ? ' · BLOW-OFF' : ''}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   TITLES TAB
   ============================================================ */
function TitlesTab({ titles, company, onOpenBuilder, onSelectTitle, funds }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: C.inkFaint }}>Commission a championship for {money(TITLE_CREATION_COST)}.</p>
        <GhostButton icon={Plus} onClick={onOpenBuilder} disabled={funds < TITLE_CREATION_COST}>New Title</GhostButton>
      </div>
      {titles.length === 0 && <EmptyState text="No championships yet. Create one to give your matches something to fight for." />}
      <div className="space-y-2">
        {titles.map((t) => {
          const currentReign = t.reignHistory.find((r) => r.lostWeek === null);
          const weeks = currentReign ? weeksAsChampion(currentReign, company) : 0;
          return (
            <button key={t.id} onClick={() => onSelectTitle(t)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Crown size={14} color={C.gold} fill={C.gold} />
                    <p className="text-sm font-bold truncate" style={{ color: C.ink }}>{t.name}</p>
                  </div>
                  <Pill>{t.division}{t.isTag ? ' · TAG' : ''}</Pill>
                  <p className="text-xs mt-1.5" style={{ color: t.holderIds.length ? C.ink : C.inkFaint }}>
                    {t.holderIds.length ? currentReign.holderNames.join(' & ') : 'VACANT'}
                    {t.holderIds.length > 0 && <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}> · {weeks}wk reign</span>}
                  </p>
                </div>
                <ChevronRight size={16} color={C.inkFaint} />
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.canvasAlt }}>
                <div className="h-full rounded-full" style={{ width: `${t.prestige}%`, backgroundColor: C.gold }} />
              </div>
              <p className="wgm-mono text-[9px] mt-1" style={{ color: C.inkFaint }}>PRESTIGE {t.prestige}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TitleBuilderModal({ roster, funds, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [division, setDivision] = useState(TITLE_DIVISIONS[0]);
  const isTag = division === 'Tag Team' || division === 'Trios';
  const [holderIds, setHolderIds] = useState([]);

  function toggleHolder(id) {
    setHolderIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      const max = isTag ? 2 : 1;
      if (prev.length >= max) return isTag ? prev : [id];
      return [...prev, id];
    });
  }

  const canCreate = name.trim().length > 0 && funds >= TITLE_CREATION_COST;

  return (
    <Modal title="Commission a Title" onClose={onClose} wide>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>TITLE NAME</p>
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. World Heavyweight Championship"
        className="w-full rounded-md px-3 py-2.5 mb-4 text-sm outline-none" style={{ backgroundColor: C.canvasAlt, color: C.ink, border: `1px solid ${C.line}` }}
      />

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>DIVISION</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TITLE_DIVISIONS.map((d) => (
          <button key={d} onClick={() => { setDivision(d); setHolderIds([]); }} className="rounded-md p-2 text-xs font-semibold" style={{ backgroundColor: division === d ? C.ink : C.canvasAlt, color: division === d ? C.gold : C.inkFaint }}>{d}</button>
        ))}
      </div>

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>INAUGURAL CHAMPION{isTag ? 'S (PICK UP TO 2, OPTIONAL)' : ' (OPTIONAL)'}</p>
      <div className="max-h-40 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {roster.map((w) => (
          <label key={w.id} className="flex items-center gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: holderIds.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
            <input type="checkbox" checked={holderIds.includes(w.id)} onChange={() => toggleHolder(w.id)} />
            <span className="flex-1" style={{ color: C.ink }}>{w.name}</span>
            <GenderBadge gender={w.gender} /> <AlignmentBadge alignment={w.alignment} />
          </label>
        ))}
      </div>

      <PrimaryButton full disabled={!canCreate} onClick={() => onCreate(name.trim(), division, isTag, holderIds)}>Commission ({money(TITLE_CREATION_COST)})</PrimaryButton>
    </Modal>
  );
}

function TitleDetailModal({ title, company, onClose, onVacate }) {
  return (
    <Modal title={title.name} onClose={onClose} wide>
      <div className="flex items-center gap-2 mb-4">
        <Pill>{title.division}{title.isTag ? ' · TAG' : ''}</Pill>
        <Pill bg={C.gold} color={C.ink}>PRESTIGE {title.prestige}</Pill>
      </div>

      <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.ink }}>
        <p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>CURRENT CHAMPION{title.holderIds.length > 1 ? 'S' : ''}</p>
        <div className="flex items-center gap-2 mt-1">
          <Crown size={18} color={C.gold} fill={C.gold} />
          <p className="wgm-display text-lg" style={{ color: C.cream }}>{title.holderIds.length ? title.reignHistory[title.reignHistory.length - 1].holderNames.join(' & ') : 'VACANT'}</p>
        </div>
      </div>

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>TITLE HISTORY</p>
      <div className="space-y-1.5 mb-5 max-h-56 overflow-y-auto wgm-scrollbar">
        {[...title.reignHistory].reverse().map((r, i) => (
          <div key={i} className="rounded-md p-2.5" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
            <p className="text-xs font-semibold" style={{ color: C.ink }}>{r.holderNames.join(' & ')}</p>
            <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>
              Won Wk {r.wonWeek}/Yr {r.wonYear} — {r.lostWeek === null ? 'Still champion' : `Lost Wk ${r.lostWeek}/Yr ${r.lostYear}`}
            </p>
          </div>
        ))}
        {title.reignHistory.length === 0 && <EmptyState text="No reigns recorded yet." />}
      </div>

      {title.holderIds.length > 0 && <GhostButton danger icon={X} onClick={() => onVacate(title.id)}>Vacate Title</GhostButton>}
    </Modal>
  );
}

/* ============================================================
   TAG TEAM BUILDER
   ============================================================ */
function TeamBuilderModal({ roster, tagTeams, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const teamedIds = new Set(tagTeams.flatMap((t) => t.memberIds));
  const eligible = roster.filter((w) => !teamedIds.has(w.id));

  function toggle(id) {
    setMemberIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  const canCreate = name.trim().length > 0 && memberIds.length === 2;

  return (
    <Modal title="Form a Tag Team" onClose={onClose} wide>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>TEAM NAME</p>
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Midnight Riders"
        className="w-full rounded-md px-3 py-2.5 mb-4 text-sm outline-none" style={{ backgroundColor: C.canvasAlt, color: C.ink, border: `1px solid ${C.line}` }}
      />

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>MEMBERS ({memberIds.length}/2)</p>
      <div className="max-h-64 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {eligible.map((w) => (
          <label key={w.id} className="flex flex-col gap-1 rounded-md p-2 text-xs cursor-pointer" style={{ backgroundColor: memberIds.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={memberIds.includes(w.id)} onChange={() => toggle(w.id)} />
              <span className="flex-1" style={{ color: C.ink }}>{w.name}</span>
              <GenderBadge gender={w.gender} /> <AlignmentBadge alignment={w.alignment} />
            </div>
            <WrestlerStatLine w={w} />
          </label>
        ))}
        {eligible.length === 0 && <EmptyState text="Every wrestler is already on a team. Disband one first." />}
      </div>

      <PrimaryButton full disabled={!canCreate} onClick={() => onCreate(name.trim(), memberIds)}>Form Team</PrimaryButton>
    </Modal>
  );
}

/* ============================================================
   STABLE BUILDER & DETAIL
   ============================================================ */
function StableBuilderModal({ roster, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [memberIds, setMemberIds] = useState([]);

  function toggle(id) {
    setMemberIds((prev) => {
      if (prev.includes(id)) { if (leaderId === id) setLeaderId(''); return prev.filter((p) => p !== id); }
      if (prev.length >= 7) return prev;
      return [...prev, id];
    });
  }

  const totalMembers = new Set([...memberIds, ...(leaderId ? [leaderId] : [])]).size;
  const canCreate = name.trim().length > 0 && leaderId && totalMembers >= 2;

  return (
    <Modal title="Form a Stable" onClose={onClose} wide>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>STABLE NAME</p>
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Blackwood Syndicate"
        className="w-full rounded-md px-3 py-2.5 mb-4 text-sm outline-none" style={{ backgroundColor: C.canvasAlt, color: C.ink, border: `1px solid ${C.line}` }}
      />

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>MEMBERS (LEADER + UP TO 7)</p>
      <div className="max-h-56 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {roster.map((w) => {
          const inGroup = memberIds.includes(w.id) || leaderId === w.id;
          return (
            <div key={w.id} className="flex items-center gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: inGroup ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
              <input type="checkbox" checked={inGroup} onChange={() => toggle(w.id)} />
              <span className="flex-1" style={{ color: C.ink }}>{w.name}</span>
              {inGroup && (
                <button onClick={() => setLeaderId(w.id)} className="wgm-mono text-[9px] px-2 py-1 rounded-full" style={{ backgroundColor: leaderId === w.id ? C.gold : C.canvas, color: leaderId === w.id ? C.ink : C.inkFaint }}>
                  {leaderId === w.id ? 'LEADER' : 'MAKE LEADER'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <PrimaryButton full disabled={!canCreate} onClick={() => onCreate(name.trim(), leaderId, memberIds)}>Form Stable</PrimaryButton>
    </Modal>
  );
}

function StableDetailModal({ stable, roster, onClose, onUpdate, onDisband }) {
  function toggleMember(id) {
    const inGroup = stable.memberIds.includes(id);
    let nextMembers = inGroup ? stable.memberIds.filter((m) => m !== id) : [...stable.memberIds, id];
    let leaderId = stable.leaderId;
    if (inGroup && leaderId === id) leaderId = nextMembers[0] || '';
    onUpdate(stable.id, nextMembers, leaderId);
  }
  return (
    <Modal title={stable.name} onClose={onClose} wide>
      <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.ink }}>
        <p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>COHESION</p>
        <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.15)' }}>
          <div className="h-full rounded-full" style={{ width: `${stable.cohesion}%`, backgroundColor: C.rope }} />
        </div>
        <p className="wgm-mono text-[10px] mt-1" style={{ color: C.cream }}>{stable.cohesion}/100 — book stablemates together to build it.</p>
      </div>

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>MEMBERS</p>
      <div className="space-y-1.5 mb-5 max-h-64 overflow-y-auto wgm-scrollbar">
        {roster.map((w) => {
          const inGroup = stable.memberIds.includes(w.id);
          if (!inGroup) return null;
          return (
            <div key={w.id} className="flex items-center gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
              {stable.leaderId === w.id ? <Star size={13} color={C.gold} fill={C.gold} /> : <Users size={13} color={C.inkFaint} />}
              <span className="flex-1" style={{ color: C.ink }}>{w.name}</span>
              {stable.leaderId !== w.id && (
                <button onClick={() => onUpdate(stable.id, stable.memberIds, w.id)} className="wgm-mono text-[9px] px-2 py-1 rounded-full" style={{ backgroundColor: C.canvasAlt, color: C.inkFaint }}>MAKE LEADER</button>
              )}
              <button onClick={() => toggleMember(w.id)} className="p-1 rounded" style={{ backgroundColor: C.ropeDark }}><X size={12} color={C.cream} /></button>
            </div>
          );
        })}
        <p className="wgm-mono text-[10px] mb-1 mt-3" style={{ color: C.inkFaint }}>ADD MEMBERS</p>
        {roster.filter((w) => !stable.memberIds.includes(w.id)).map((w) => (
          <button key={w.id} onClick={() => toggleMember(w.id)} className="w-full flex items-center gap-2 rounded-md p-2 text-xs text-left" style={{ border: `1px solid ${C.line}` }}>
            <Plus size={12} color={C.inkFaint} />
            <span style={{ color: C.ink }}>{w.name}</span>
          </button>
        ))}
      </div>

      <GhostButton danger icon={X} onClick={() => onDisband(stable.id)}>Disband Stable</GhostButton>
    </Modal>
  );
}

/* ============================================================
   UPGRADES MODAL
   ============================================================ */
function TierUpgradeCard({ upgradeKey, company, onPurchase }) {
  const def = UPGRADES[upgradeKey];
  const Icon = def.icon;
  const level = upgradeLevel(company, upgradeKey);
  const tier = def.levels[level - 1];
  const nextTier = def.levels[level];
  const maxed = level >= def.levels.length;
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={15} color={C.gold} />
        <p className="text-sm font-bold flex-1" style={{ color: C.ink }}>{def.label}</p>
        <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>LV {level}/{def.levels.length}</span>
      </div>
      <p className="text-[11px] mb-2" style={{ color: C.inkFaint }}>{def.desc}</p>
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.canvasAlt }}>
        <div className="h-full rounded-full" style={{ width: `${(level / def.levels.length) * 100}%`, backgroundColor: C.gold }} />
      </div>
      <div className="flex items-center justify-between">
        <p className="wgm-mono text-[10px]" style={{ color: C.ink }}>Current: {tier.name}</p>
        {maxed ? (
          <Pill bg={C.gold} color={C.ink}>MAXED</Pill>
        ) : (
          <GhostButton onClick={() => onPurchase(upgradeKey)} disabled={company.funds < nextTier.cost}>
            {nextTier.name} ({money(nextTier.cost)})
          </GhostButton>
        )}
      </div>
    </div>
  );
}

function ShopTab({
  company, roster, titles, unlocked, funds, dept, setDept,
  onOpenTitleBuilder, onSelectTitle,
  onPurchaseUpgrade,
  onPurchaseRingShape, onEquipRingShape,
  onAddConcession, onSetConcessionPrice, onRemoveConcession,
  onAddMerch, onSetMerchPrice, onSetMerchWrestler, onRemoveMerch,
  onPurchaseWeaponItem, onStartResearch,
  onSignTv,
}) {
  const DEPTS = [
    { id: 'titles', label: 'Titles', icon: Crown, blurb: `${titles.length} championship${titles.length !== 1 ? 's' : ''}` },
    { id: 'venues', label: 'Venues', icon: MapPin, blurb: `${new Set(unlocked.map((v) => v.tierId)).size}/${VENUE_TIERS.length} tiers` },
    { id: 'ring', label: 'Ring', icon: Shield, blurb: `Lv ${upgradeLevel(company, 'ring')}/5` },
    { id: 'concessions', label: 'Concessions', icon: Coffee, blurb: `${company.concessionsMenu.length} items` },
    { id: 'merch', label: 'Merch', icon: ShoppingBag, blurb: `${company.merchMenu.length} items` },
    { id: 'weapons', label: 'Weapons', icon: Swords, blurb: `${company.weaponsOwned.length}/${WEAPON_ITEMS_CATALOG.length} owned` },
    { id: 'research', label: 'Match Types', icon: Wrench, blurb: company.matchResearch.inProgress ? 'Researching...' : `${company.matchResearch.unlockedTypes.length} unlocked` },
    { id: 'facility', label: 'Facility', icon: Truck, blurb: `Lv ${upgradeLevel(company, 'production')}/${upgradeLevel(company, 'medical')}/${upgradeLevel(company, 'transport')}` },
    { id: 'tv', label: 'TV Deal', icon: Tv, blurb: company.tvDeal ? 'Under contract' : 'No deal' },
  ];

  return (
    <div>
      <div className="wgm-awning -mx-4 px-4 py-3 mb-4 text-center">
        <h2 className="wgm-display text-2xl" style={{ color: C.ink, textShadow: `0 1px 0 rgb(var(--wgm-gold-rgb, 196 146 46) / 0.4)` }}>THE SHOP</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {DEPTS.map((d) => {
          const Icon = d.icon;
          const active = dept === d.id;
          return (
            <button key={d.id} onClick={() => setDept(d.id)} className="rounded-lg p-2.5 flex flex-col items-center text-center gap-1" style={{ backgroundColor: active ? C.ink : C.cream, border: `1px solid ${active ? C.gold : C.line}` }}>
              <Icon size={16} color={active ? C.gold : C.inkFaint} />
              <span className="wgm-mono text-[9px] font-bold" style={{ color: active ? C.gold : C.ink }}>{d.label.toUpperCase()}</span>
              <span className="wgm-mono text-[8px]" style={{ color: active ? 'rgba(246,240,225,0.6)' : C.inkFaint }}>{d.blurb}</span>
            </button>
          );
        })}
      </div>

      {dept === 'titles' && (
        <div>
          <TitlesTab titles={titles} company={company} onOpenBuilder={onOpenTitleBuilder} onSelectTitle={onSelectTitle} funds={funds} />
        </div>
      )}

      {dept === 'venues' && (
        <div>
          <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Venue capacity and rent scale with your reputation. Some venues cater to a specific style of wrestling — a home crowd boosts you, a mismatched one costs you at the gate but can pay off big if you win them over. How many variants show up each week depends on how many promotions are active in your region.</p>
          <div className="space-y-3">
            {VENUE_TIERS.map((tier) => {
              const variants = ALL_VENUES.filter((v) => v.tierId === tier.id);
              const isUnlocked = tier.minRep <= company.reputation;
              return (
                <div key={tier.id}>
                  <p className="wgm-mono text-[9px] mb-1.5" style={{ color: C.inkFaint }}>{tier.name.toUpperCase()} TIER · CAP {tier.capacity.toLocaleString()}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {variants.map((v) => {
                      const leanLabel = v.crowdLean ? (STYLE_CONFIG[v.crowdLean] || {}).label : null;
                      const isHome = v.crowdLean === company.style;
                      return (
                        <div key={v.id} className="wgm-price-tag rounded-lg p-2.5" style={{ backgroundColor: isUnlocked ? C.cream : C.canvasAlt, border: `1px solid ${v.crowdLean ? (isHome ? C.gold : C.rope) : C.line}`, opacity: isUnlocked ? 1 : 0.55 }}>
                          <p className="text-xs font-semibold" style={{ color: C.ink }}>{v.name}</p>
                          <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{money(v.rent)} rent</p>
                          {leanLabel && <p className="wgm-mono text-[9px] mt-0.5" style={{ color: isHome ? C.gold : C.rope }}>{isHome ? 'HOME CROWD' : `${leanLabel.toUpperCase()} CROWD`}</p>}
                          {!isUnlocked && <p className="wgm-mono text-[9px] mt-0.5" style={{ color: C.rope }}>Needs {tier.minRep} rep</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dept === 'ring' && (
        <div className="space-y-3">
          <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>RING SHAPE</p>
          <div className="space-y-2">
            {RING_SHAPES.map((shape) => {
              const owned = company.ringShapesOwned.includes(shape.id);
              const active = company.ringShape === shape.id;
              const synergy = shape.matchesStyles.includes(company.style);
              return (
                <div key={shape.id} className="rounded-lg p-3" style={{ backgroundColor: active ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.12)' : C.cream, border: `1px solid ${active ? C.gold : C.line}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold" style={{ color: C.ink }}>{shape.name}</p>
                    {synergy && <Pill bg={C.gold} color={C.ink}>STYLE MATCH</Pill>}
                  </div>
                  <p className="text-[11px] mb-2" style={{ color: C.inkFaint }}>{shape.desc}</p>
                  <div className="flex items-center justify-end">
                    {active ? (
                      <Pill bg={C.gold} color={C.ink}>EQUIPPED</Pill>
                    ) : owned ? (
                      <GhostButton onClick={() => onEquipRingShape(shape.id)}>Equip</GhostButton>
                    ) : (
                      <GhostButton onClick={() => onPurchaseRingShape(shape.id)} disabled={company.funds < shape.cost}>Buy & Equip ({money(shape.cost)})</GhostButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="wgm-mono text-[10px] pt-2" style={{ color: C.inkFaint }}>RING QUALITY</p>
          <TierUpgradeCard upgradeKey="ring" company={company} onPurchase={onPurchaseUpgrade} />
        </div>
      )}

      {dept === 'concessions' && (
        <MenuBuilder
          catalog={CONCESSION_ITEMS_CATALOG} menu={company.concessionsMenu} funds={company.funds}
          onAdd={onAddConcession} onSetPrice={onSetConcessionPrice} onRemove={onRemoveConcession}
        />
      )}

      {dept === 'merch' && (
        <MenuBuilder
          catalog={MERCH_ITEMS_CATALOG} menu={company.merchMenu} funds={company.funds} roster={roster}
          onAdd={onAddMerch} onSetPrice={onSetMerchPrice} onRemove={onRemoveMerch} onSetWrestler={onSetMerchWrestler}
          isMerch
        />
      )}

      {dept === 'weapons' && (
        <div>
          <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Buy individual pieces of hardcore gear. Owned items combine to raise match quality (and injury risk) in Hardcore, Ladder, and Cage matches.</p>
          <div className="grid grid-cols-2 gap-2">
            {WEAPON_ITEMS_CATALOG.map((item) => {
              const owned = company.weaponsOwned.includes(item.id);
              return (
                <div key={item.id} className="rounded-lg p-3" style={{ backgroundColor: owned ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.1)' : C.cream, border: `1px solid ${C.line}` }}>
                  <p className="text-sm font-bold" style={{ color: C.ink }}>{item.name}</p>
                  <p className="wgm-mono text-[9px] mt-1" style={{ color: C.inkFaint }}>+{Math.round(item.qualityBonus * 100)}% QUALITY · +{Math.round((item.injuryMult - 1) * 100)}% RISK</p>
                  <div className="mt-2">
                    {owned ? (
                      <Pill bg={C.gold} color={C.ink}>OWNED</Pill>
                    ) : (
                      <GhostButton onClick={() => onPurchaseWeaponItem(item.id)} disabled={company.funds < item.cost}>Buy ({money(item.cost)})</GhostButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dept === 'research' && (
        <div>
          <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Research and unlock new match stipulations. Only one project can be in development at a time.</p>
          {company.matchResearch.inProgress && (() => {
            const inProg = RESEARCHABLE_MATCH_TYPES.find((t) => t.id === company.matchResearch.inProgress.typeId);
            const pct = Math.round(((inProg.researchWeeks - company.matchResearch.inProgress.weeksRemaining) / inProg.researchWeeks) * 100);
            return (
              <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: C.ink }}>
                <p className="text-sm font-bold" style={{ color: C.cream }}>Researching: {inProg.label}</p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.15)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: C.gold }} />
                </div>
                <p className="wgm-mono text-[9px] mt-1" style={{ color: 'rgba(246,240,225,0.6)' }}>{company.matchResearch.inProgress.weeksRemaining} WEEK{company.matchResearch.inProgress.weeksRemaining !== 1 ? 'S' : ''} REMAINING</p>
              </div>
            );
          })()}
          <div className="space-y-2">
            {RESEARCHABLE_MATCH_TYPES.map((t) => {
              const unlocked = company.matchResearch.unlockedTypes.includes(t.id);
              const repOk = company.reputation >= t.minRep;
              const weaponsOk = !t.requiresWeapons || t.requiresWeapons.every((w) => company.weaponsOwned.includes(w));
              const canStart = !unlocked && !company.matchResearch.inProgress && repOk && weaponsOk && company.funds >= t.researchCost;
              return (
                <div key={t.id} className="rounded-lg p-3" style={{ backgroundColor: unlocked ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.1)' : C.cream, border: `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold" style={{ color: C.ink }}>{t.label}</p>
                    {unlocked && <Pill bg={C.gold} color={C.ink}>UNLOCKED</Pill>}
                  </div>
                  <p className="text-[11px] mb-1.5" style={{ color: C.inkFaint }}>{t.desc}</p>
                  <p className="wgm-mono text-[9px] mb-2" style={{ color: C.inkFaint }}>
                    {money(t.researchCost)} · {t.researchWeeks}WK · NEEDS {t.minRep} REP{t.requiresWeapons ? ` · NEEDS ${t.requiresWeapons.join(' & ').toUpperCase()}` : ''}
                  </p>
                  {!unlocked && (
                    <>
                      {!repOk && <p className="text-[10px] mb-1" style={{ color: C.rope }}>Reputation too low.</p>}
                      {!weaponsOk && <p className="text-[10px] mb-1" style={{ color: C.rope }}>Missing required weapons.</p>}
                      <GhostButton onClick={() => onStartResearch(t.id)} disabled={!canStart}>Start Research</GhostButton>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dept === 'facility' && (
        <div className="space-y-3">
          <TierUpgradeCard upgradeKey="production" company={company} onPurchase={onPurchaseUpgrade} />
          <TierUpgradeCard upgradeKey="medical" company={company} onPurchase={onPurchaseUpgrade} />
          <TierUpgradeCard upgradeKey="transport" company={company} onPurchase={onPurchaseUpgrade} />
        </div>
      )}

      {dept === 'tv' && (
        <TvDealSection company={company} onSign={onSignTv} />
      )}
    </div>
  );
}

function MenuBuilder({ catalog, menu, funds, roster, onAdd, onSetPrice, onRemove, onSetWrestler, isMerch }) {
  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>
        {isMerch ? `Pick what you sell and set your own prices. Assign it to wrestlers with at least ${MERCH_MIN_POPULARITY} popularity and they'll split a 15% cut — a great way to keep stars happy.` : 'Pick what you sell and set your own prices per show.'}
      </p>
      <div className="space-y-2">
        {catalog.map((item) => {
          const entry = menu.find((e) => e.itemId === item.id);
          const inMenu = !!entry;
          return (
            <div key={item.id} className="rounded-lg p-3" style={{ backgroundColor: inMenu ? 'rgb(var(--wgm-gold-rgb, 196 146 46) / 0.08)' : C.cream, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: C.ink }}>{item.name}{item.isAwareness && <span className="wgm-mono text-[9px] ml-1" style={{ color: C.gold }}>+ BUZZ</span>}</p>
                {!inMenu && <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>Suggested {money(item.suggestedPrice)}</span>}
              </div>
              {!inMenu ? (
                <div className="flex items-center justify-between">
                  <p className="text-[11px]" style={{ color: C.inkFaint }}>Cost {item.baseCost.toFixed(2)}/unit</p>
                  <GhostButton icon={Plus} onClick={() => onAdd(item.id)} disabled={funds < item.unlockCost}>Add ({money(item.unlockCost)})</GhostButton>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="wgm-mono text-[10px] w-14" style={{ color: C.inkFaint }}>{money(entry.price)}</span>
                    <input
                      type="range" min={Math.max(1, Math.round(item.baseCost))} max={Math.round(item.suggestedPrice * 2.5)} step="0.5"
                      value={entry.price} onChange={(e) => onSetPrice(item.id, Number(e.target.value))} className="flex-1"
                    />
                  </div>
                  {isMerch && (
                    <div className="mb-2">
                      <p className="wgm-mono text-[9px] mb-1.5" style={{ color: C.inkFaint }}>ASSIGNED TALENT ({(entry.wrestlerIds || []).length}) — {MERCH_MIN_POPULARITY}+ POP REQUIRED</p>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto wgm-scrollbar">
                        {roster.filter((w) => w.popularity >= MERCH_MIN_POPULARITY).length === 0 && (
                          <p className="text-[10px]" style={{ color: C.inkFaint }}>No one on the roster is popular enough yet.</p>
                        )}
                        {roster.filter((w) => w.popularity >= MERCH_MIN_POPULARITY).map((w) => {
                          const active = (entry.wrestlerIds || []).includes(w.id);
                          return (
                            <button key={w.id} onClick={() => onSetWrestler(item.id, w.id)} className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: active ? C.gold : C.canvasAlt, color: active ? C.ink : C.inkFaint }}>
                              {w.name} · {w.popularity}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <GhostButton danger icon={X} onClick={() => onRemove(item.id)}>Drop Item</GhostButton>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   FEUD BUILDER & DETAIL
   ============================================================ */
function FeudBuilderModal({ roster, writerTierLevel, onClose, onCreate }) {
  const [tagMode, setTagMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const cap = tagMode ? 4 : 2;

  function toggle(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= cap) return prev;
      return [...prev, id];
    });
  }
  function setTag(v) {
    setTagMode(v);
    setSelected((prev) => prev.slice(0, v ? 4 : 2));
  }

  const canCreate = selected.length === cap;

  return (
    <Modal title="Start a Feud" onClose={onClose} wide>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Pick your rivals. Book them in the same match or promo and heat builds on its own — no need to track it manually.</p>
      {writerTierLevel >= 1 && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTag(false)} className="flex-1 py-1.5 rounded-md text-xs font-semibold" style={{ backgroundColor: !tagMode ? C.ink : C.canvasAlt, color: !tagMode ? C.gold : C.inkFaint }}>Singles Feud</button>
          <button onClick={() => setTag(true)} className="flex-1 py-1.5 rounded-md text-xs font-semibold" style={{ backgroundColor: tagMode ? C.ink : C.canvasAlt, color: tagMode ? C.gold : C.inkFaint }}>Tag Team Feud</button>
        </div>
      )}
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>{tagMode ? 'FIRST 2 PICKED = SIDE A · NEXT 2 = SIDE B' : 'RIVALS'} ({selected.length}/{cap})</p>
      <div className="max-h-64 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {roster.map((w) => {
          const idx = selected.indexOf(w.id);
          const sideLabel = tagMode && idx !== -1 ? (idx < 2 ? 'SIDE A' : 'SIDE B') : null;
          const disabled = !selected.includes(w.id) && selected.length >= cap;
          return (
            <label key={w.id} className="flex flex-col gap-1 rounded-md p-2 text-xs cursor-pointer" style={{ backgroundColor: selected.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}`, opacity: disabled ? 0.5 : 1 }}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} disabled={disabled} />
                <span className="flex-1" style={{ color: C.ink }}>{w.name} <span className="italic" style={{ color: C.inkFaint }}>"{w.gimmick}"</span></span>
                {sideLabel && <Pill bg={idx < 2 ? C.gold : C.rope} color={idx < 2 ? C.ink : C.cream}>{sideLabel}</Pill>}
                <GenderBadge gender={w.gender} /> <AlignmentBadge alignment={w.alignment} />
              </div>
              <WrestlerStatLine w={w} />
            </label>
          );
        })}
      </div>
      <PrimaryButton full disabled={!canCreate} onClick={() => onCreate(selected[0], tagMode ? selected[2] : selected[1], tagMode ? selected[1] : null, tagMode ? selected[3] : null)}>Start Feud</PrimaryButton>
    </Modal>
  );
}

function RelationshipBuilderModal({ roster, onClose, onCreate }) {
  const [selected, setSelected] = useState([]);
  const [type, setType] = useState('friends');

  function toggle(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  const canCreate = selected.length === 2;

  return (
    <Modal title="Declare a Relationship" onClose={onClose} wide>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>These are personal connections, separate from anything you book — real friendships, family, spouses, or backstage friction. Booking them together plays into it.</p>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>TYPE</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {RELATIONSHIP_TYPES.map((t) => (
          <button key={t.id} onClick={() => setType(t.id)} className="rounded-md p-2 text-xs font-semibold" style={{ backgroundColor: type === t.id ? C.ink : C.canvasAlt, color: type === t.id ? C.gold : C.inkFaint }}>{t.label}</button>
        ))}
      </div>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>WHO ({selected.length}/2)</p>
      <div className="max-h-56 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {roster.map((w) => (
          <label key={w.id} className="flex flex-col gap-1 rounded-md p-2 text-xs cursor-pointer" style={{ backgroundColor: selected.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} />
              <span className="flex-1" style={{ color: C.ink }}>{w.name}</span>
              <GenderBadge gender={w.gender} /> <AlignmentBadge alignment={w.alignment} />
            </div>
          </label>
        ))}
      </div>
      <PrimaryButton full disabled={!canCreate} onClick={() => onCreate(selected[0], selected[1], type)}>Declare Relationship</PrimaryButton>
    </Modal>
  );
}


function FeudDetailModal({ feud, onClose, onEnd }) {
  const { aFull, bFull } = feudDisplayNames(feud);
  return (
    <Modal title={`${aFull} vs ${bFull}`} onClose={onClose} wide>
      {feud.isTag && <Pill bg={C.steel}>TAG TEAM FEUD</Pill>}
      {feud.hook && (
        <div className="flex items-center gap-2 mb-3 mt-2">
          <Flame size={13} color={C.rope} />
          <p className="text-xs italic" style={{ color: C.inkFaint }}>{feud.hook}</p>
        </div>
      )}
      <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.ink }}>
        <p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>HEAT</p>
        <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.15)' }}>
          <div className="h-full rounded-full" style={{ width: `${feud.heat}%`, backgroundColor: feud.heat >= 70 ? C.rope : C.gold }} />
        </div>
        <p className="wgm-mono text-[10px] mt-1" style={{ color: C.cream }}>
          {feud.heat}/100{feud.heat >= 70 ? ' — ready for a blow-off' : ' — keep building'} · {feud.matchCount} match{feud.matchCount !== 1 ? 'es' : ''}
        </p>
      </div>

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>STORYLINE LOG</p>
      <div className="space-y-1.5 mb-5 max-h-64 overflow-y-auto wgm-scrollbar">
        {[...feud.log].reverse().map((entry, i) => (
          <div key={i} className="rounded-md p-2.5 flex items-start gap-2" style={{ backgroundColor: entry.blowOff ? 'rgb(var(--wgm-rope-rgb, 172 58 44) / 0.1)' : C.cream, border: `1px solid ${C.line}` }}>
            {entry.blowOff && <Flame size={13} color={C.rope} className="mt-0.5 shrink-0" />}
            <div>
              <p className="text-xs" style={{ color: C.ink }}>{entry.text}</p>
              <p className="wgm-mono text-[9px] mt-0.5" style={{ color: C.inkFaint }}>Week {entry.week}, Year {entry.year}</p>
            </div>
          </div>
        ))}
        {feud.log.length === 0 && <EmptyState text="Nothing has happened yet." />}
      </div>

      {feud.status !== 'ended' && <GhostButton danger icon={X} onClick={() => onEnd(feud.id)}>End Feud</GhostButton>}
    </Modal>
  );
}

/* ============================================================
   TV DEAL SECTION (Shop)
   ============================================================ */
function TvDealSection({ company, onSign }) {
  const [pendingNetworkId, setPendingNetworkId] = useState(null);
  if (company.tvDeal) {
    const network = TV_NETWORKS.find((n) => n.id === company.tvDeal.networkId);
    return (
      <div>
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: C.ink }}>
          <div className="flex items-center gap-2 mb-2">
            <Tv size={16} color={C.gold} />
            <p className="wgm-display text-lg" style={{ color: C.cream }}>{network.name}</p>
          </div>
          <p className="wgm-mono text-[10px] mb-2" style={{ color: C.goldSoft }}>{company.tvDeal.timeSlotLabel || 'Time slot unset'}</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div><p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>WEEKLY FEE</p><p className="wgm-mono text-sm" style={{ color: C.good }}>{money(network.weeklyFee)}</p></div>
            <div><p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>WEEKS LEFT</p><p className="wgm-mono text-sm" style={{ color: C.cream }}>{company.tvDeal.weeksRemaining}/{company.tvDeal.totalWeeks}</p></div>
          </div>
          <div className="mt-3">
            <p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>RATING REQUIREMENT: {network.ratingReq.toFixed(1)}★ AVG</p>
            <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.15)' }}>
              <div className="h-full rounded-full" style={{ width: `${(company.tvDeal.strikes / TV_STRIKE_LIMIT) * 100}%`, backgroundColor: C.rope }} />
            </div>
            <p className="wgm-mono text-[9px] mt-1" style={{ color: C.rope }}>{company.tvDeal.strikes}/{TV_STRIKE_LIMIT} STRIKES — {TV_STRIKE_LIMIT - company.tvDeal.strikes} more and they cancel</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: C.inkFaint }}>Keep your average show rating at or above {network.ratingReq.toFixed(1)}★ to avoid strikes. When the deal ends, new offers will be available here.</p>
      </div>
    );
  }

  const pendingNetwork = pendingNetworkId ? TV_NETWORKS.find((n) => n.id === pendingNetworkId) : null;
  if (pendingNetwork) {
    return (
      <div>
        <button onClick={() => setPendingNetworkId(null)} className="wgm-mono text-[10px] mb-3" style={{ color: C.inkFaint }}>← BACK TO NETWORKS</button>
        <p className="text-sm font-bold mb-1" style={{ color: C.ink }}>{pendingNetwork.name}</p>
        <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Pick your time slot. Longer slots mean more airtime to fill, but a bigger stage.</p>
        <div className="space-y-2">
          {pendingNetwork.timeSlots.map((slot) => (
            <button key={slot.id} onClick={() => onSign(pendingNetwork.id, slot.id)} className="w-full rounded-lg p-3 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>{slot.label}</p>
              <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{slot.hours} HOUR{slot.hours !== 1 ? 'S' : ''} OF AIRTIME TO FILL</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Sign with a network for a guaranteed weekly rights fee, plus a boost to attendance from the exposure. Falling below the rating requirement too often gets you canceled.</p>
      <div className="space-y-2">
        {TV_NETWORKS.map((n) => {
          const unlocked = company.reputation >= n.minRep;
          return (
            <div key={n.id} className="rounded-lg p-3" style={{ backgroundColor: unlocked ? C.cream : C.canvasAlt, border: `1px solid ${C.line}`, opacity: unlocked ? 1 : 0.55 }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: C.ink }}>{n.name}</p>
                {!unlocked && <span className="wgm-mono text-[9px]" style={{ color: C.rope }}>NEEDS {n.minRep} REP</span>}
              </div>
              <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>
                {money(n.weeklyFee)}/wk · {n.ratingReq.toFixed(1)}★ req · {n.weeks} wk deal · +{Math.round(n.fillBonus * 100)}% attendance · {n.timeSlots.length} time slot{n.timeSlots.length !== 1 ? 's' : ''}
              </p>
              {unlocked && <GhostButton onClick={() => setPendingNetworkId(n.id)}>Choose Time Slot</GhostButton>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   RIVAL PROMOTIONS MODAL
   ============================================================ */
function DevLogModal({ devLog, onClose }) {
  const CATEGORY_COLOR = { finance: C.good, reputation: C.gold, journalist: C.steel };
  return (
    <Modal title="Developer Log" onClose={onClose} wide>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>The raw reasoning behind recent simulation results — for spotting bugs, not for playing the game. Most recent first.</p>
      {devLog.length === 0 && <EmptyState text="No log entries yet. Run a show to generate some." />}
      <div className="space-y-1.5 max-h-96 overflow-y-auto wgm-scrollbar">
        {devLog.map((d, i) => (
          <div key={i} className="rounded-md p-2" style={{ backgroundColor: C.canvasAlt, borderLeft: `3px solid ${CATEGORY_COLOR[d.category] || C.inkFaint}` }}>
            <p className="wgm-mono text-[8px] font-bold mb-0.5" style={{ color: C.inkFaint }}>WEEK {d.week}, YEAR {d.year} · {d.category.toUpperCase()}</p>
            <p className="wgm-mono text-[10px]" style={{ color: C.ink }}>{d.message}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function PartnerModal({ partner, onClose }) {
  if (!partner) return null;
  const rel = partner.relationship || {};
  return (
    <Modal title={partner.name} onClose={onClose}>
      <p className="wgm-mono text-[10px] mb-3" style={{ color: C.inkFaint }}>{partner.label.toUpperCase()}</p>
      <p className="text-xs italic mb-4" style={{ color: C.inkFaint }}>{partner.dream}</p>

      <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.canvasAlt }}>
        <p className="wgm-mono text-[10px] mb-1.5" style={{ color: C.inkFaint }}>WHERE THINGS STAND</p>
        <p className="text-sm" style={{ color: C.ink }}>{partnerRelationshipReadout(rel)}</p>
      </div>

      {rel.history && rel.history.length > 0 && (
        <div>
          <p className="wgm-mono text-[10px] mb-1.5" style={{ color: C.inkFaint }}>RELATIONSHIP HISTORY</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto wgm-scrollbar">
            {[...rel.history].reverse().map((h, i) => (
              <div key={i} className="rounded-md p-2" style={{ backgroundColor: C.canvasAlt }}>
                <p className="wgm-mono text-[8px] mb-0.5" style={{ color: C.inkFaint }}>WEEK {h.week}, YEAR {h.year}</p>
                <p className="text-[11px]" style={{ color: C.ink }}>{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function InboxModal({ inbox, company, onClose, onRespond }) {
  return (
    <Modal title="Inbox" onClose={onClose} wide>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Real proposals from the other promotions in the world — not just news. Offers expire if you sit on them too long.</p>
      {inbox.length === 0 && <EmptyState text="Nothing pending right now. Check back soon." />}
      <div className="space-y-2">
        {inbox.map((o) => {
          const weeksLeft = (o.expiresYear - company.year) * 52 + (o.expiresWeek - company.week);
          return (
            <div key={o.id} className="rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: C.ink }}>{o.rivalName}</p>
                <Pill bg={o.type === 'buy_offer' ? C.rope : C.gold} color={o.type === 'buy_offer' ? C.cream : C.ink}>{o.type === 'buy_offer' ? 'BUY OFFER' : 'ALLIANCE PROPOSAL'}</Pill>
              </div>
              <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{o.text}</p>
              <p className="wgm-mono text-[9px] mb-2" style={{ color: C.inkFaint }}>EXPIRES IN {Math.max(0, weeksLeft)} WEEK{weeksLeft !== 1 ? 'S' : ''}</p>
              <div className="flex gap-2">
                <GhostButton onClick={() => onRespond(o.id, true)}>Accept</GhostButton>
                <GhostButton danger onClick={() => onRespond(o.id, false)}>Decline</GhostButton>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function PoachModal({ wrestler, rival, company, onClose, onPoach }) {
  const [termId, setTermId] = useState('standard');
  const [bonusPct, setBonusPct] = useState(1);
  const [wagePct, setWagePct] = useState(1);
  const [contractWeeks, setContractWeeks] = useState(18);
  const term = CONTRACT_TERMS.find((t) => t.id === termId) || CONTRACT_TERMS[0];
  const cost = Math.round(wrestler.salary * 2.5 * term.bonusMult * bonusPct);
  const weeklyWage = Math.round(wrestler.salary * wagePct * 1.1);
  const offerQuality = (bonusPct + wagePct) / 2;
  const chance = poachSuccessChance(wrestler, rival, company, termId, offerQuality, contractWeeks);
  const chanceLabel = chance >= 0.6 ? 'Good odds' : chance >= 0.3 ? 'A real shot' : 'A long shot';
  const chanceColor = chance >= 0.6 ? C.good : chance >= 0.3 ? C.gold : C.rope;
  return (
    <Modal title={`Approach ${wrestler.name}`} onClose={onClose}>
      <p className="text-xs mb-1" style={{ color: C.inkFaint }}>Currently with {rival.name}</p>
      <p className="wgm-mono text-[10px] mb-4" style={{ color: C.inkFaint }}>{wrestler.contractWeeksLeft} WEEKS LEFT ON CONTRACT · {wrestler.rivalHappiness < 35 ? 'UNHAPPY THERE' : wrestler.rivalHappiness >= 70 ? 'CONTENT THERE' : 'STEADY THERE'}</p>

      {wrestler.character && (
        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.canvasAlt }}>
          <p className="text-[12px]" style={{ color: C.ink }}>{characterReadout(wrestler.character)}</p>
        </div>
      )}

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>YOUR OFFER</p>
      <div className="space-y-2 mb-4">
        {CONTRACT_TERMS.map((t) => (
          <button key={t.id} onClick={() => setTermId(t.id)} className="w-full rounded-lg p-2.5 text-left" style={{ backgroundColor: termId === t.id ? C.gold : C.canvasAlt, border: `1px solid ${C.line}` }}>
            <p className="text-xs font-bold" style={{ color: C.ink }}>{t.label}</p>
            <p className="text-[10px]" style={{ color: termId === t.id ? C.inkSoft : C.inkFaint }}>{t.blurb}</p>
          </button>
        ))}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>SIGNING BONUS</span>
          <span className="wgm-mono text-[10px]" style={{ color: C.ink }}>{money(cost)} ({Math.round(bonusPct * 100)}%)</span>
        </div>
        <input type="range" min="0.5" max="1.5" step="0.05" value={bonusPct} onChange={(e) => setBonusPct(Number(e.target.value))} className="w-full" />
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>WEEKLY WAGE</span>
          <span className="wgm-mono text-[10px]" style={{ color: C.ink }}>{money(weeklyWage)}/wk ({Math.round(wagePct * 100)}%)</span>
        </div>
        <input type="range" min="0.8" max="1.3" step="0.05" value={wagePct} onChange={(e) => setWagePct(Number(e.target.value))} className="w-full" />
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>CONTRACT LENGTH</span>
          <span className="wgm-mono text-[10px]" style={{ color: C.ink }}>{contractWeeks} weeks</span>
        </div>
        <input type="range" min="8" max="40" step="2" value={contractWeeks} onChange={(e) => setContractWeeks(Number(e.target.value))} className="w-full" />
      </div>

      <div className="flex items-center justify-between mb-4 rounded-lg p-3" style={{ backgroundColor: C.canvasAlt }}>
        <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>ESTIMATED ODDS</span>
        <span className="wgm-display text-sm" style={{ color: chanceColor }}>{chanceLabel}</span>
      </div>
      <p className="text-[11px] mb-4" style={{ color: C.inkFaint }}>Funds are only spent if they say yes. Poaching a promotion's talent won't do your relationship with them any favors.</p>

      <PrimaryButton full icon={UserPlus} onClick={() => onPoach(rival.id, wrestler.id, termId, bonusPct, wagePct, contractWeeks)} disabled={company.funds < cost}>Make the Offer ({money(cost)})</PrimaryButton>
    </Modal>
  );
}

function RivalsModal({ rivals, company, onClose, onSetRelationship, onSignPact, onBreakPact, onAcquire, onOpenPoach }) {
  const [expandedRivalId, setExpandedRivalId] = useState(null);
  const ranked = [
    { id: 'player', name: company.name, reputation: company.reputation, isPlayer: true },
    ...rivals.map((r) => ({ id: r.id, name: r.name, reputation: r.reputation, isPlayer: false })),
  ].sort((a, b) => b.reputation - a.reputation);
  const playerRank = ranked.findIndex((r) => r.isPlayer) + 1;

  return (
    <Modal title="Rival Promotions" onClose={onClose} wide>
      <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.ink }}>
        <p className="wgm-mono text-[9px] mb-2" style={{ color: 'rgba(246,240,225,0.55)' }}>POWER RANKINGS · YOU ARE #{playerRank} OF {ranked.length}</p>
        <div className="space-y-1.5">
          {ranked.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2">
              <span className="wgm-mono text-xs font-bold w-5" style={{ color: r.isPlayer ? C.gold : 'rgba(246,240,225,0.5)' }}>{i + 1}</span>
              <span className="text-xs flex-1 truncate" style={{ color: r.isPlayer ? C.gold : C.cream, fontWeight: r.isPlayer ? 700 : 400 }}>{r.name}{r.isPlayer ? ' (You)' : ''}</span>
              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(246,240,225,0.15)' }}>
                <div className="h-full rounded-full" style={{ width: `${r.reputation}%`, backgroundColor: r.isPlayer ? C.gold : C.steel }} />
              </div>
              <span className="wgm-mono text-[10px] w-7 text-right" style={{ color: 'rgba(246,240,225,0.6)' }}>{r.reputation}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>
        {company.acquisitionsCount > 0 ? `${company.acquisitionsCount} promotion${company.acquisitionsCount !== 1 ? 's' : ''} acquired so far. ` : ''}
        Ally for a small edge, sign a territory pact to formally protect each other, or buy a struggling promotion outright. Rivals sometimes consolidate each other too.
      </p>
      <div className="space-y-2">
        {rivals.map((r) => {
          const regionLabel = (REGION_LIST.find((rg) => rg.id === r.region) || REGION_LIST[0]).label;
          const styleLabel = (STYLE_CONFIG[r.style] || STYLE_CONFIG.sports_entertainment).label;
          const winning = r.relationship === 'rival' && company.reputation > r.reputation;
          const inPact = r.relationship === 'pact';
          const acqCost = acquisitionCostFor(r);
          return (
            <div key={r.id} className="rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: C.ink }}>{r.name}</p>
                {r.relationship === 'ally' && <Pill bg={C.gold} color={C.ink}>ALLY</Pill>}
                {r.relationship === 'rival' && <Pill bg={C.rope}>RIVAL{winning ? ' · WINNING' : ''}</Pill>}
                {inPact && <Pill bg={C.steel}>TERRITORY PACT</Pill>}
              </div>
              <p className="text-[11px] mb-2" style={{ color: C.inkFaint }}>{regionLabel} · {styleLabel}</p>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.canvasAlt }}>
                <div className="h-full rounded-full" style={{ width: `${r.reputation}%`, backgroundColor: r.reputation > company.reputation ? C.rope : C.gold }} />
              </div>
              <p className="wgm-mono text-[9px] mb-2" style={{ color: C.inkFaint }}>REPUTATION {r.reputation} (YOURS: {company.reputation})</p>

              {inPact ? (
                <GhostButton danger onClick={() => onBreakPact(r.id)}>Break Pact</GhostButton>
              ) : (
                <>
                  <div className="flex gap-2 mb-2">
                    {['neutral', 'ally', 'rival'].map((rel) => (
                      <button key={rel} onClick={() => onSetRelationship(r.id, rel)} className="flex-1 py-1.5 rounded-md text-xs font-semibold capitalize" style={{ backgroundColor: r.relationship === rel ? C.ink : C.canvasAlt, color: r.relationship === rel ? C.gold : C.inkFaint }}>
                        {rel}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <GhostButton onClick={() => onSignPact(r.id)} disabled={company.funds < TERRITORY_PACT_COST}>Territory Pact ({money(TERRITORY_PACT_COST)})</GhostButton>
                    <GhostButton danger onClick={() => onAcquire(r.id)} disabled={company.funds < acqCost}>Acquire ({money(acqCost)})</GhostButton>
                  </div>
                </>
              )}

              <button onClick={() => setExpandedRivalId(expandedRivalId === r.id ? null : r.id)} className="wgm-mono text-[9px] underline" style={{ color: C.inkFaint }}>
                {expandedRivalId === r.id ? 'HIDE ROSTER' : `VIEW ROSTER (${(r.roster || []).length})`}
              </button>

              {expandedRivalId === r.id && (
                <div className="mt-2 space-y-1.5">
                  {(r.roster || []).length === 0 && <p className="text-[11px]" style={{ color: C.inkFaint }}>No roster on record.</p>}
                  {(r.roster || []).map((w) => {
                    const eligible = !inPact && (w.contractWeeksLeft <= 6 || w.rivalHappiness < 35);
                    return (
                      <div key={w.id} className="rounded-md p-2" style={{ backgroundColor: C.canvasAlt }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <TierBadge tier={w.tier} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: C.ink }}>{w.name}</p>
                              <p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{w.contractWeeksLeft}wk left · {w.rivalHappiness < 35 ? 'unhappy' : w.rivalHappiness >= 70 ? 'content' : 'steady'}</p>
                            </div>
                          </div>
                          {eligible && <GhostButton onClick={() => onOpenPoach(r.id, w.id)}>Approach</GhostButton>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/* ============================================================
   WRESTLING MEDIA MODAL
   ============================================================ */
function MediaModal({ recaps, companyName, onClose }) {
  const [expandedId, setExpandedId] = useState(recaps.length ? recaps[0].id : null);

  return (
    <Modal title="Wrestling Media" onClose={onClose} wide>
      {recaps.length === 0 && <EmptyState text="No issues published yet. Run shows for four weeks to see your first monthly recap." />}
      <div className="space-y-2">
        {recaps.map((r) => {
          const expanded = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
              <button onClick={() => setExpandedId(expanded ? null : r.id)} className="w-full p-3 flex items-center justify-between text-left" style={{ backgroundColor: C.ink }}>
                <div>
                  <p className="wgm-display text-base" style={{ color: C.cream }}>Month {r.month}, Year {r.year}</p>
                  <p className="wgm-mono text-[9px]" style={{ color: 'rgba(246,240,225,0.55)' }}>{r.shows} show{r.shows !== 1 ? 's' : ''} · {r.avgStars.toFixed(1)}★ avg</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.grade && <span className="wgm-display text-base" style={{ color: letterGradeColor(r.grade) }}>{r.grade}</span>}
                  <ChevronDown size={16} color={C.cream} style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
                </div>
              </button>
              {expanded && (
                <div className="p-3 space-y-3" style={{ backgroundColor: C.cream }}>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="wgm-mono text-[8px]" style={{ color: C.inkFaint }}>ATTENDANCE</p><p className="wgm-mono text-xs font-bold" style={{ color: C.ink }}>{r.totalAttendance.toLocaleString()}</p></div>
                    <div><p className="wgm-mono text-[8px]" style={{ color: C.inkFaint }}>REVENUE</p><p className="wgm-mono text-xs font-bold" style={{ color: C.good }}>{money(r.totalRevenue)}</p></div>
                    <div><p className="wgm-mono text-[8px]" style={{ color: C.inkFaint }}>PROFIT</p><p className="wgm-mono text-xs font-bold" style={{ color: r.totalProfit >= 0 ? C.good : C.rope }}>{money(r.totalProfit)}</p></div>
                  </div>

                  {r.topMatch && (
                    <div>
                      <p className="wgm-mono text-[9px] mb-1" style={{ color: C.inkFaint }}>MATCH OF THE MONTH</p>
                      <div className="rounded-md p-2" style={{ backgroundColor: C.canvasAlt }}>
                        <p className="text-xs font-semibold" style={{ color: C.ink }}>{r.topMatch.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRow value={r.topMatch.stars} size={11} />
                          <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>Week {r.topMatch.week}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {r.titleChanges.length > 0 && (
                    <div>
                      <p className="wgm-mono text-[9px] mb-1" style={{ color: C.inkFaint }}>TITLE CHANGES</p>
                      <div className="space-y-1">
                        {r.titleChanges.map((tc, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-md p-2" style={{ backgroundColor: C.canvasAlt }}>
                            <Crown size={12} color={C.gold} fill={C.gold} />
                            <p className="text-[11px]" style={{ color: C.ink }}>{tc.winner} won the {tc.titleName} — Week {tc.week}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="wgm-mono text-[9px] mb-1" style={{ color: C.inkFaint }}>POWER RANKINGS · INDUSTRY-WIDE</p>
                    <div className="space-y-1">
                      {r.powerRankings.map((w, i) => (
                        <div key={w.id || `${w.name}-${i}`} className="flex items-center gap-2 rounded-md p-2" style={{ backgroundColor: C.canvasAlt }}>
                          <span className="wgm-mono text-xs font-bold w-4" style={{ color: C.gold }}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold truncate" style={{ color: C.ink }}>{w.name}</p>
                            <p className="text-[9px] italic truncate" style={{ color: C.inkFaint }}>{w.promotion ? w.promotion : `"${w.gimmick}"`}</p>
                          </div>
                          <span className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>POP {w.popularity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {r.press && r.press.length > 0 && (
                    <div>
                      <p className="wgm-mono text-[9px] mb-1" style={{ color: C.inkFaint }}>THE PRESS WEIGHS IN</p>
                      <div className="space-y-1.5">
                        {r.press.map((p, i) => (
                          <div key={i} className="rounded-md p-2" style={{ backgroundColor: C.canvasAlt, borderLeft: `2px solid ${C.gold}` }}>
                            <p className="wgm-mono text-[8px] font-bold mb-0.5" style={{ color: C.inkFaint }}>{p.name.toUpperCase()} · {p.title.toUpperCase()}</p>
                            <p className="text-[11px] italic" style={{ color: C.ink }}>"{p.take}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
