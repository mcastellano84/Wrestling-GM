import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Users, Calendar, Trophy, Megaphone,
  Star, AlertTriangle, Plus, X, ChevronRight, ChevronUp, ChevronDown,
  Activity, Shield, Mic, Radio, Heart, Zap, RefreshCw, Home,
  UserPlus, UserMinus, Award, Flame, Clock, MapPin, Ticket, Loader2, Check,
  Crown, Globe, Truck, Coffee, ShoppingBag, Swords, Wrench, Tv, Building2
} from 'lucide-react';

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
  rope: '#AC3A2C',
  ropeDark: '#832A20',
  gold: '#C4922E',
  goldSoft: '#E2C377',
  cream: '#F6F0E1',
  steel: '#4A5A5C',
  good: '#5C7A48',
  bad: '#AC3A2C',
  line: 'rgba(27,23,18,0.14)',
};

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
`;

/* ============================================================
   DATA TABLES
   ============================================================ */
const FIRST_NAMES = ['Marcus','Dante','Jax','Silas','Rocco','Diesel','Cole','Bishop','Axel','Gideon','Tanner','Wade','Bram','Kade','Orion','Rafe','Sully','Griff','Ezra','Duke','Vance','Cruz','Ronan','Slate','Hutch','Beau','Cash','Mace','Reyes','Talon','Vivica','Serena','Roxie','Nadia','Harlow','Piper','Zara','Athena','Ivy','Raven','Cleo','Skye','Delilah','Selene','Priya','Faye','Georgia','Blair','Marisol','Tempest'];
const LAST_NAMES = ['Steele','Cross','Kane','Voss','Sterling','Rourke','Blackwood','Cade','Draven','Marek','Storm','Reilly','Hendrix','Castillo','Frost','Griffin','Solomon','Kessler','Vargas','Wolfe','Sharpe','Callahan','Duarte','Nash','Okafor','Petrov','Diallo','Yamada','Alvarez','Bishop'];
const GIMMICK_ADJ = ['Iron','Savage','Golden','Wild','Silent','Crimson','Atomic','Midnight','Thunder','Vicious','Righteous','Ruthless','Untamed','Notorious','Merciless','Electric','Rogue','Fearless'];
const GIMMICK_NOUN = ['Wolf','Hammer','Reaper','Machine','Saint','Outlaw','Phantom','Titan','Viper','Renegade','Bull','Storm','Ghost','Predator','Warden','Comet','Maverick','Executioner'];

const TIER_CONFIG = {
  Rookie: { statRange: [28, 52], popRange: [3, 18], salaryRange: [120, 280], ageRange: [20, 26] },
  'Mid-Card': { statRange: [42, 68], popRange: [16, 42], salaryRange: [280, 650], ageRange: [24, 34] },
  Star: { statRange: [62, 86], popRange: [40, 72], salaryRange: [650, 1600], ageRange: [27, 38] },
  Legend: { statRange: [80, 97], popRange: [70, 97], salaryRange: [1600, 3800], ageRange: [35, 48] },
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

const MATCH_TYPES = [
  { id: 'singles', label: 'Singles Match', minP: 2, maxP: 2, beatsRange: [6, 9], riskMult: 1.0, weight: { strike: 1, grapple: 1, aerial: 0.8, submission: 0.8, power: 0.8 } },
  { id: 'tag', label: 'Tag Team Match', minP: 4, maxP: 4, beatsRange: [7, 10], riskMult: 1.0, weight: { strike: 1, grapple: 1, aerial: 1, submission: 0.6, power: 1 } },
  { id: 'triple', label: 'Triple Threat', minP: 3, maxP: 3, beatsRange: [7, 10], riskMult: 1.1, weight: { strike: 1.1, grapple: 0.8, aerial: 1, submission: 0.6, power: 1 } },
  { id: 'ladder', label: 'Ladder Match', minP: 2, maxP: 4, beatsRange: [8, 12], riskMult: 1.6, weight: { strike: 0.6, grapple: 0.4, aerial: 1.6, submission: 0.1, power: 1.3 } },
  { id: 'cage', label: 'Steel Cage Match', minP: 2, maxP: 2, beatsRange: [7, 10], riskMult: 1.4, weight: { strike: 1.3, grapple: 1, aerial: 0.6, submission: 0.7, power: 1.2 } },
  { id: 'submission', label: 'Submission Match', minP: 2, maxP: 2, beatsRange: [6, 9], riskMult: 0.9, weight: { strike: 0.5, grapple: 1, aerial: 0.3, submission: 1.8, power: 0.6 } },
  { id: 'hardcore', label: 'Hardcore / No DQ', minP: 2, maxP: 3, beatsRange: [7, 11], riskMult: 1.5, weight: { strike: 1.5, grapple: 0.8, aerial: 1, submission: 0.4, power: 1.4 } },
];

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
  usa: { first: FIRST_NAMES, last: LAST_NAMES },
  mexico: { first: ['Alejandro', 'Diego', 'Emiliano', 'Javier', 'Rodrigo', 'Salvador', 'Mateo', 'Andres', 'Ricardo', 'Fernando', 'Luz', 'Ximena', 'Camila', 'Valentina', 'Guadalupe', 'Renata'], last: ['Hernandez', 'Garcia', 'Morales', 'Reyes', 'Jimenez', 'Flores', 'Cruz', 'Guerrero', 'Rivas', 'Salazar', 'Aguilar', 'Mendoza'] },
  japan: { first: ['Kenji', 'Hiroshi', 'Takashi', 'Ryota', 'Shinji', 'Daisuke', 'Kazuki', 'Naoki', 'Yuto', 'Sora', 'Aiko', 'Emi', 'Sakura', 'Yui', 'Haruka', 'Nozomi'], last: ['Tanaka', 'Yamamoto', 'Sato', 'Suzuki', 'Watanabe', 'Kobayashi', 'Nakamura', 'Ito', 'Kimura', 'Saito', 'Hasegawa', 'Fujita'] },
  uk: { first: ['Oliver', 'Jack', 'Harry', 'George', 'Charlie', 'Alfie', 'Freddie', 'Archie', 'Reggie', 'Stanley', 'Poppy', 'Amelia', 'Isla', 'Freya', 'Daisy', 'Ruby'], last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Thomas', 'Roberts', 'Walker', 'Wright', 'Baker', 'Hughes'] },
  australia: { first: ['Jack', 'Cooper', 'Levi', 'Hunter', 'Mason', 'Riley', 'Tyson', 'Bailey', 'Zac', 'Dusty', 'Chloe', 'Matilda', 'Sienna', 'Mackenzie', 'Charlotte', 'Grace'], last: ['Anderson', 'Mitchell', 'Clarke', 'Kelly', 'White', 'Hall', 'Turner', 'Cooper', 'Ward', 'Fraser', 'Bishop', 'Marsh'] },
  germany: { first: ['Lukas', 'Felix', 'Jonas', 'Maximilian', 'Sebastian', 'Florian', 'Niklas', 'Dominik', 'Matthias', 'Stefan', 'Greta', 'Hanna', 'Lena', 'Frieda', 'Ilse', 'Katrin'], last: ['Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter', 'Klein'] },
};

const STYLE_CONFIG = {
  sports_entertainment: { label: 'Sports Entertainment', blurb: 'Larger-than-life characters, big-match storytelling.', statBias: { charisma: 8 }, preferredTypes: ['singles', 'tag', 'ladder', 'hardcore'], adj: GIMMICK_ADJ, noun: GIMMICK_NOUN, prefix: 'The' },
  lucha: { label: 'Lucha Libre', blurb: 'Masked high-flyers, trios warfare, honor on the line.', statBias: { aerial: 10, charisma: 4 }, preferredTypes: ['triple', 'tag', 'singles'], adj: ['Rojo', 'Dorado', 'Fantasma', 'Sagrado', 'Diablo', 'Angel', 'Furia', 'Relampago'], noun: ['Aguila', 'Tigre', 'Lobo', 'Serpiente', 'Demonio', 'Jaguar', 'Fenix', 'Sombra'], prefix: 'El' },
  strong_style: { label: 'Japanese Strong Style', blurb: 'Stiff strikes and fighting spirit, mat-based intensity.', statBias: { strength: 6, technical: 8 }, preferredTypes: ['singles', 'submission', 'cage'], adj: ['Crimson', 'Iron', 'Silent', 'Steel', 'Burning', 'Dark'], noun: ['Dragon', 'Emperor', 'Samurai', 'Oni', 'Ronin', 'Kaiju'], prefix: 'The' },
  british: { label: 'British Strong Style', blurb: 'Technical grappling and hard-hitting scientific wrestling.', statBias: { technical: 10 }, preferredTypes: ['singles', 'submission', 'tag'], adj: ['Iron', 'Royal', 'Grim', 'Relentless', 'Steel', 'Working-Class'], noun: ['Lion', 'Bulldog', 'Gentleman', 'Brawler', 'Grappler', 'Guv\u2019nor'], prefix: 'The' },
  deathmatch: { label: 'Deathmatch / Hardcore', blurb: 'Weapons, blood, and no rules.', statBias: { strength: 6, stamina: 6 }, preferredTypes: ['hardcore', 'ladder', 'cage'], adj: ['Bloody', 'Barbed', 'Savage', 'Feral', 'Rotten', 'Unhinged'], noun: ['Butcher', 'Maniac', 'Reaper', 'Psycho', 'Junkyard', 'Wretch'], prefix: 'The' },
};
const STYLE_LIST = Object.keys(STYLE_CONFIG).map((id) => ({ id, ...STYLE_CONFIG[id] }));

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
  (company.concessionsMenu || []).forEach((entry) => {
    const item = CONCESSION_ITEMS_CATALOG.find((i) => i.id === entry.itemId);
    if (!item) return;
    const qty = Math.round(attendance * sellRateFor(item, entry.price));
    net += qty * (Number(entry.price) - item.baseCost);
  });
  return Math.max(0, Math.round(net));
}
function computeMerchResult(company, roster, attendance) {
  let net = 0;
  const royalties = {};
  let tapesActive = false;
  (company.merchMenu || []).forEach((entry) => {
    const item = MERCH_ITEMS_CATALOG.find((i) => i.id === entry.itemId);
    if (!item) return;
    if (item.id === 'tapes') tapesActive = true;
    const wrestler = entry.wrestlerId ? roster.find((r) => r.id === entry.wrestlerId) : null;
    const popMult = wrestler ? 1 + wrestler.popularity / 150 : 1;
    const qty = Math.round(attendance * sellRateFor(item, entry.price) * popMult);
    const grossProfit = qty * (Number(entry.price) - item.baseCost);
    let itemNet = grossProfit;
    if (wrestler && grossProfit > 0) {
      const royalty = Math.round(grossProfit * MERCH_ROYALTY_RATE);
      itemNet -= royalty;
      royalties[wrestler.id] = (royalties[wrestler.id] || 0) + royalty;
    }
    net += Math.max(0, itemNet);
  });
  return { net: Math.max(0, Math.round(net)), royalties, tapesActive };
}
function weaponsEffectFor(matchTypeId, weaponsOwned) {
  if (!WEAPONS_MATCH_TYPES.includes(matchTypeId) || !weaponsOwned || !weaponsOwned.length) return { qualityBonus: 0, injuryMult: 1 };
  const items = WEAPON_ITEMS_CATALOG.filter((w) => weaponsOwned.includes(w.id));
  const qualityBonus = clamp(sum(items.map((i) => i.qualityBonus)), 0, 0.6);
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
  { id: 'golden_voice', label: 'Golden Voice', polarity: 'positive', mod: 12 },
  { id: 'showstopper', label: 'Showstopper', polarity: 'positive', mod: 8 },
  { id: 'camera_shy', label: 'Camera Shy', polarity: 'negative', mod: -10 },
  { id: 'burnt_out', label: 'Burnt Out', polarity: 'negative', mod: -8 },
];
const assignStaffTrait = () => (Math.random() < 0.4 ? pick(STAFF_TRAITS).id : null);
function staffEffectiveQuality(s) {
  const t = STAFF_TRAITS.find((x) => x.id === s.trait);
  return clamp(s.quality + (t ? t.mod : 0), 1, 100);
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

/* ============================================================
   WRESTLER / STAFF GENERATION
   ============================================================ */
function generateWrestler(tier, regionId = 'usa', styleId = 'sports_entertainment') {
  const cfg = TIER_CONFIG[tier];
  const style = STYLE_CONFIG[styleId] || STYLE_CONFIG.sports_entertainment;
  const names = REGION_NAMES[regionId] || REGION_NAMES.usa;
  const stats = {
    strength: randInt(cfg.statRange[0], cfg.statRange[1]),
    technical: randInt(cfg.statRange[0], cfg.statRange[1]),
    aerial: randInt(cfg.statRange[0], cfg.statRange[1]),
    charisma: randInt(cfg.statRange[0], cfg.statRange[1]),
    stamina: randInt(cfg.statRange[0], cfg.statRange[1]),
  };
  Object.keys(style.statBias || {}).forEach((k) => { stats[k] = clamp(stats[k] + style.statBias[k], 5, 99); });
  const alignRoll = Math.random();
  const alignment = alignRoll < 0.45 ? 'face' : alignRoll < 0.9 ? 'heel' : 'tweener';
  return {
    id: uid(),
    name: `${pick(names.first)} ${pick(names.last)}`,
    gimmick: `${style.prefix} ${pick(style.adj)} ${pick(style.noun)}`,
    alignment, tier, stats,
    popularity: randInt(cfg.popRange[0], cfg.popRange[1]),
    morale: randInt(55, 85),
    condition: 100,
    injury: null,
    salary: randInt(cfg.salaryRange[0], cfg.salaryRange[1]),
    contractWeeksLeft: randInt(12, 30),
    traits: assignTraits(),
    age: randInt(cfg.ageRange[0], cfg.ageRange[1]),
  };
}

function generateStaff(role) {
  const quality = randInt(35, 92);
  return { id: uid(), name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, role, quality, salary: Math.round(80 + quality * 4.2), trait: assignStaffTrait() };
}

function generateFreeAgentPool(regionId = 'usa', styleId = 'sports_entertainment') {
  const roll = () => { const r = Math.random(); return r < 0.55 ? 'Mid-Card' : r < 0.82 ? 'Rookie' : r < 0.96 ? 'Star' : 'Legend'; };
  return Array.from({ length: 6 }, () => generateWrestler(roll(), regionId, styleId));
}

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

function createFeudObject(aId, aName, bId, bName, week, year) {
  return {
    id: uid(), aId, aName, bId, bName, heat: 15, status: 'active', matchCount: 0,
    startWeek: week, startYear: year,
    log: [{ week, year, text: `${aName} and ${bName} start a rivalry.` }],
  };
}
function feudPairPresent(feud, participantIds) {
  return participantIds.includes(feud.aId) && participantIds.includes(feud.bId);
}
function computeFeudMatchHeatGain(finalStars, finishId) {
  let gain = 8 + finalStars * 3;
  if (finishId === 'screwjob') gain += 10;
  else if (finishId === 'dq') gain += 5;
  else if (finishId === 'countout') gain += 3;
  return Math.round(gain);
}
function advanceFeudFromMatch(feud, finalStars, finishId, isBlowOff, week, year) {
  const gain = computeFeudMatchHeatGain(finalStars, finishId);
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
function advanceFeudFromPromo(feud, purpose, week, year) {
  const gain = FEUD_PROMO_HEAT[purpose] || 5;
  const heat = clamp(feud.heat + gain, 0, 100);
  const log = [...feud.log, { week, year, text: `${feud.aName} and ${feud.bName} trade words in a ${purpose.toLowerCase()} segment.` }];
  return { ...feud, heat, log: log.slice(-14) };
}

/* ---------- TV deals ---------- */
const TV_NETWORKS = [
  { id: 'access', name: 'Public Access', minRep: 0, weeklyFee: 200, ratingReq: 0, weeks: 12, fillBonus: 0.01 },
  { id: 'regional', name: 'Regional Cable', minRep: 20, weeklyFee: 800, ratingReq: 2.0, weeks: 16, fillBonus: 0.03 },
  { id: 'national', name: 'National Cable', minRep: 40, weeklyFee: 3000, ratingReq: 2.75, weeks: 20, fillBonus: 0.06 },
  { id: 'premium', name: 'Premium Network', minRep: 65, weeklyFee: 9000, ratingReq: 3.25, weeks: 26, fillBonus: 0.1 },
  { id: 'global', name: 'Global Streaming', minRep: 85, weeklyFee: 25000, ratingReq: 3.5, weeks: 30, fillBonus: 0.15 },
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

function generateRivalPromotions(count = 5) {
  const usedNames = new Set();
  return Array.from({ length: count }, () => {
    let name = generatePromotionName();
    while (usedNames.has(name)) name = generatePromotionName();
    usedNames.add(name);
    return {
      id: uid(),
      name,
      region: pick(REGION_LIST).id,
      style: pick(STYLE_LIST).id,
      reputation: randInt(10, 55),
      momentum: randInt(-1, 1),
      relationship: 'neutral',
    };
  });
}
function tickRivalPromotion(rival) {
  const drift = randInt(-3, 4) + rival.momentum;
  const reputation = clamp(rival.reputation + drift, 2, 98);
  const momentum = clamp(rival.momentum + randInt(-1, 1), -2, 2);
  return { ...rival, reputation, momentum };
}
function rivalPoachChance(rival) {
  return clamp(0.1 + rival.reputation / 500 + (rival.relationship === 'rival' ? 0.08 : rival.relationship === 'ally' ? -0.05 : 0), 0.02, 0.35);
}
const RIVAL_FLAVOR_UP = ['drew a strong crowd this week', 'is building buzz with a new storyline', 'signed a promising rookie'];
const RIVAL_FLAVOR_DOWN = ['is struggling to fill seats', 'lost a top star to injury', 'is facing backstage turmoil'];

/* ---------- Retirement ---------- */
function retirementChance(age) {
  if (age < 38) return 0;
  return clamp((age - 37) * 0.05, 0, 0.65);
}

/* ============================================================
   MATCH ENGINE
   ============================================================ */
function simulateMatch(match, wrestlerLookup, tagTeams = [], upgrades = {}, feuds = []) {
  const participants = match.participantIds.map((id) => wrestlerLookup[id]).filter(Boolean);
  const matchType = MATCH_TYPES.find((m) => m.id === match.typeId) || MATCH_TYPES[0];
  const ringTier = UPGRADES.ring.levels[(upgrades.ring || 1) - 1];
  const ringShapeBonus = upgrades.ringShapeBonus || 0;
  const weaponsFx = weaponsEffectFor(matchType.id, upgrades.weaponsOwned);
  const weaponsMatch = weaponsFx.qualityBonus > 0;
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
    const opponents = participants.filter((p) => p.id !== performer.id);
    const opponent = weightedPick(opponents, (o) => Math.max(5, o.stats.technical));
    const spot = weightedPick(SPOT_TYPES, (s) => (matchType.weight[s.id] || 0.5) * statScore(performer, s.statWeight));
    const performerScore = statScore(performer, spot.statWeight) * (performer.condition / 100) * (1 + momentum * 0.15);
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

  qualityPoints += ringTier.qualityBonus + ringShapeBonus;
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

function computePromoPop(promo, wrestlerLookup) {
  const parts = promo.participantIds.map((id) => wrestlerLookup[id]).filter(Boolean);
  if (!parts.length) return 50;
  const avgCharisma = average(parts.map((p) => p.stats.charisma));
  const avgPop = average(parts.map((p) => p.popularity));
  return clamp(Math.round(avgCharisma * 0.6 + avgPop * 0.3 + randInt(-8, 8)), 5, 100);
}

function computeFillFactors(draftShow, game) {
  const venue = VENUE_TIERS.find((v) => v.id === draftShow.venueId) || VENUE_TIERS[0];
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
  const fillRate = clamp(0.25 + repFactor + popFactor + marketingFactor + staffFactor + productionBonus + tvBonus - priceFactor, 0.08, 0.99);
  const attendance = Math.round(venue.capacity * fillRate);
  const effectiveRent = Math.round(venue.rent * (1 - currentTier(game.company, 'transport').rentDiscount));
  const payroll = sum(game.roster.map((w) => w.salary)) + sum(staffAll.map((s) => s.salary));
  return { venue, fillRate, attendance, payroll, rosterPopAvg, effectiveRent };
}

function estimateShow(draftShow, game) {
  const { venue, fillRate, attendance, payroll, effectiveRent } = computeFillFactors(draftShow, game);
  const concessions = computeConcessionsRevenue(game.company, attendance);
  const merch = computeMerchResult(game.company, game.roster, attendance).net;
  const tvNetwork = tvNetworkFor(game.company);
  const tv = tvNetwork ? tvNetwork.weeklyFee : 0;
  const revenue = attendance * draftShow.ticketPrice + concessions + merch + tv;
  const expenses = effectiveRent + draftShow.marketingBudget + payroll;
  return { attendance, capacity: venue.capacity, revenue, expenses, profit: revenue - expenses, fillRate, venue };
}

function simulateShow(draftShow, game) {
  const { venue, fillRate, attendance, payroll, effectiveRent } = computeFillFactors(draftShow, game);
  const wrestlerLookup = {};
  game.roster.forEach((w) => { wrestlerLookup[w.id] = w; });

  const matchUpgrades = {
    ring: game.company.upgrades.ring,
    ringShapeBonus: ringShapeBonusFor(game.company),
    weaponsOwned: game.company.weaponsOwned || [],
  };
  const matchResults = draftShow.card.filter((s) => s.kind === 'match').map((m) => ({ ...m, result: simulateMatch(m, wrestlerLookup, game.tagTeams, matchUpgrades, game.feuds) }));
  const promoResults = draftShow.card.filter((s) => s.kind === 'promo').map((p) => ({ ...p, pop: computePromoPop(p, wrestlerLookup) }));

  const ticketRevenue = attendance * draftShow.ticketPrice;
  const concessionsRevenue = computeConcessionsRevenue(game.company, attendance);
  const merchResult = computeMerchResult(game.company, game.roster, attendance);
  const merchRevenue = merchResult.net;
  const tvNetwork = tvNetworkFor(game.company);
  const tvRevenue = tvNetwork ? tvNetwork.weeklyFee : 0;
  const revenue = ticketRevenue + concessionsRevenue + merchRevenue + tvRevenue;
  const expenses = effectiveRent + draftShow.marketingBudget + payroll;
  const netProfit = revenue - expenses;

  const avgStars = matchResults.length ? average(matchResults.map((m) => m.result.finalStars)) : 2.5;
  const avgPromoPop = promoResults.length ? average(promoResults.map((p) => p.pop)) : 50;
  let repDelta = clamp(Math.round((avgStars - 2.75) * 3 + (fillRate - 0.5) * 8 + (avgPromoPop - 50) / 20), -8, 14);
  if (merchResult.tapesActive) repDelta = clamp(repDelta + 1, -8, 15);

  return { venue, matchResults, promoResults, attendance, ticketRevenue, concessionsRevenue, merchRevenue, tvRevenue, merchRoyalties: merchResult.royalties, revenue, expenses, payroll, netProfit, avgStars, avgPromoPop, repDelta, fillRate };
}

/* ============================================================
   GAME STATE FACTORY
   ============================================================ */
const STORAGE_KEY = 'wgm-save-v1';

function makeEmptyDraft() {
  return { venueId: 'gym', ticketPrice: 20, marketingBudget: 0, card: [] };
}

function createNewGame(name, regionId, styleId) {
  const region = regionId || 'usa';
  const style = styleId || 'sports_entertainment';
  const styleLabel = (STYLE_CONFIG[style] || STYLE_CONFIG.sports_entertainment).label;
  const regionLabel = (REGION_LIST.find((r) => r.id === region) || REGION_LIST[0]).label;
  return {
    company: {
      name: name || 'Independent Wrestling', funds: 15000, reputation: 5, week: 1, year: 1, region, style,
      upgrades: { ...DEFAULT_UPGRADES },
      ringShape: DEFAULT_RING_SHAPE,
      ringShapesOwned: [DEFAULT_RING_SHAPE],
      concessionsMenu: [],
      merchMenu: [],
      weaponsOwned: [],
      tvDeal: null,
    },
    roster: [
      ...Array.from({ length: 3 }, () => generateWrestler('Rookie', region, style)),
      ...Array.from({ length: 3 }, () => generateWrestler('Mid-Card', region, style)),
    ],
    freeAgents: generateFreeAgentPool(region, style),
    staff: { announcers: [generateStaff('Announcer')], commentators: [generateStaff('Commentator')] },
    staffPool: { announcers: Array.from({ length: 3 }, () => generateStaff('Announcer')), commentators: Array.from({ length: 3 }, () => generateStaff('Commentator')) },
    titles: [],
    tagTeams: [],
    stables: [],
    feuds: [],
    rivals: generateRivalPromotions(),
    history: [],
    news: [`Welcome to ${regionLabel}. Booking in the ${styleLabel} tradition — book your first show to get the doors open.`],
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
  const fixWrestler = (w) => ({ ...w, traits: w.traits || [], age: w.age || randInt(24, 36) });
  const fixStaff = (s) => ({ ...s, trait: s.trait !== undefined ? s.trait : null });
  const loadedCompany = loaded.company || {};
  const oldUpgrades = loadedCompany.upgrades || {};
  const migratedWeapons = loadedCompany.weaponsOwned || (oldUpgrades.weapons ? ['chairs', 'tables'] : []);
  return {
    ...loaded,
    company: {
      region: 'usa', style: 'sports_entertainment',
      ...loadedCompany,
      upgrades: { ring: oldUpgrades.ring || 1, production: oldUpgrades.production || 1, medical: oldUpgrades.medical || 1, transport: oldUpgrades.transport || 1 },
      ringShape: loadedCompany.ringShape || DEFAULT_RING_SHAPE,
      ringShapesOwned: loadedCompany.ringShapesOwned || [DEFAULT_RING_SHAPE],
      concessionsMenu: loadedCompany.concessionsMenu || [],
      merchMenu: loadedCompany.merchMenu || [],
      weaponsOwned: migratedWeapons,
      tvDeal: loadedCompany.tvDeal || null,
    },
    titles: loaded.titles || [],
    tagTeams: loaded.tagTeams || [],
    stables: loaded.stables || [],
    feuds: loaded.feuds || [],
    rivals: loaded.rivals || generateRivalPromotions(),
    roster: (loaded.roster || []).map(fixWrestler),
    freeAgents: (loaded.freeAgents || []).map(fixWrestler),
    staff: {
      announcers: (loaded.staff?.announcers || []).map(fixStaff),
      commentators: (loaded.staff?.commentators || []).map(fixStaff),
    },
    staffPool: {
      announcers: (loaded.staffPool?.announcers || []).map(fixStaff),
      commentators: (loaded.staffPool?.commentators || []).map(fixStaff),
    },
    draftShow: loaded.draftShow ? { ...loaded.draftShow, card: fixCard(loaded.draftShow.card) } : makeEmptyDraft(),
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
  const [setupName, setSetupName] = useState('');
  const [setupRegion, setSetupRegion] = useState('');
  const [setupStyle, setSetupStyle] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [rosterSubTab, setRosterSubTab] = useState('active');
  const [selectedWrestler, setSelectedWrestler] = useState(null);
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
  const [upgradesModalOpen, setUpgradesModalOpen] = useState(false);
  const [tvModalOpen, setTvModalOpen] = useState(false);
  const [rivalsModalOpen, setRivalsModalOpen] = useState(false);
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
    const g = createNewGame(setupName.trim(), setupRegion, setupStyle);
    setGame(g); persist(g); setNeedsSetup(false);
  }

  function resetGame() {
    setGame(null); setConfirmAction(null); setTab('dashboard');
    setSetupName(''); setSetupRegion(''); setSetupStyle('');
    setNeedsSetup(true);
  }

  /* ---------- Roster actions ---------- */
  function setAlignment(id, alignment) {
    updateGame((g) => ({ ...g, roster: g.roster.map((w) => (w.id === id ? { ...w, alignment } : w)) }));
  }
  function releaseWrestler(id) {
    updateGame((g) => ({
      ...g,
      roster: g.roster.filter((w) => w.id !== id),
      tagTeams: g.tagTeams.filter((t) => !t.memberIds.includes(id)),
      stables: g.stables
        .map((s) => ({ ...s, memberIds: s.memberIds.filter((m) => m !== id), leaderId: s.leaderId === id ? (s.memberIds.find((m) => m !== id) || null) : s.leaderId }))
        .filter((s) => s.memberIds.length >= 2),
      feuds: g.feuds.map((f) => (f.aId === id || f.bId === id) ? { ...f, status: 'ended' } : f),
    }));
    setSelectedWrestler(null); setConfirmAction(null);
    showToast('Wrestler released.');
  }
  function renewContract(id) {
    updateGame((g) => {
      const w = g.roster.find((r) => r.id === id);
      if (!w) return g;
      let bonus = Math.round(w.salary);
      if (hasTrait(w, 'difficult')) bonus = Math.round(bonus * 1.3);
      if (hasTrait(w, 'company_man')) bonus = Math.round(bonus * 0.8);
      if (g.company.funds < bonus) { showToast('Not enough funds to renew.'); return g; }
      return {
        ...g,
        company: { ...g.company, funds: g.company.funds - bonus },
        roster: g.roster.map((r) => (r.id === id ? { ...r, contractWeeksLeft: randInt(12, 30), salary: Math.round(r.salary * (1 + randInt(5, 20) / 100)) } : r)),
      };
    });
    showToast('Contract renewed.');
  }
  function signFreeAgent(id) {
    updateGame((g) => {
      const w = g.freeAgents.find((f) => f.id === id);
      if (!w) return g;
      let bonus = w.salary * 2;
      if (hasTrait(w, 'difficult')) bonus = Math.round(bonus * 1.3);
      if (hasTrait(w, 'company_man')) bonus = Math.round(bonus * 0.8);
      if (g.company.funds < bonus) { showToast('Not enough funds for the signing bonus.'); return g; }
      return {
        ...g,
        company: { ...g.company, funds: g.company.funds - bonus },
        roster: [...g.roster, { ...w, contractWeeksLeft: randInt(12, 26) }],
        freeAgents: g.freeAgents.filter((f) => f.id !== id),
      };
    });
    showToast('Wrestler signed.');
  }
  function scoutTalent() {
    updateGame((g) => {
      if (g.company.funds < 500) { showToast('Need $500 to scout new talent.'); return g; }
      return { ...g, company: { ...g.company, funds: g.company.funds - 500 }, freeAgents: generateFreeAgentPool(g.company.region, g.company.style) };
    });
  }

  /* ---------- Title actions ---------- */
  function createTitle(name, division, isTag, holderIds) {
    updateGame((g) => {
      if (g.company.funds < TITLE_CREATION_COST) { showToast(`Need ${money(TITLE_CREATION_COST)} to commission a title.`); return g; }
      const holderNames = holderIds.map((id) => (g.roster.find((r) => r.id === id) || {}).name || '???');
      const title = createTitleObject(name, division, isTag, holderIds, holderNames, g.company.week, g.company.year);
      return {
        ...g,
        company: { ...g.company, funds: g.company.funds - TITLE_CREATION_COST },
        titles: [...g.titles, title],
        news: [`The ${name} has been introduced${holderIds.length ? ` — ${holderNames.join(' & ')} crowned inaugural champion${holderIds.length > 1 ? 's' : ''}.` : ', currently vacant.'}`, ...g.news].slice(0, 30),
      };
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
    updateGame((g) => ({ ...g, tagTeams: [...g.tagTeams, createTagTeamObject(name, memberIds, g.company.week, g.company.year)] }));
    setTeamBuilderOpen(false);
    showToast('Tag team formed.');
  }
  function disbandTeam(id) {
    updateGame((g) => ({ ...g, tagTeams: g.tagTeams.filter((t) => t.id !== id) }));
    showToast('Tag team disbanded.');
  }
  function createStable(name, leaderId, memberIds) {
    updateGame((g) => {
      const allMembers = memberIds.includes(leaderId) ? memberIds : [leaderId, ...memberIds];
      return { ...g, stables: [...g.stables, createStableObject(name, leaderId, allMembers, g.company.week, g.company.year)] };
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
  function createFeud(aId, bId) {
    updateGame((g) => {
      const a = g.roster.find((r) => r.id === aId);
      const b = g.roster.find((r) => r.id === bId);
      if (!a || !b) return g;
      return { ...g, feuds: [...g.feuds, createFeudObject(a.id, a.name, b.id, b.name, g.company.week, g.company.year)] };
    });
    setFeudBuilderOpen(false);
    showToast('Feud started.');
  }
  function endFeud(id) {
    updateGame((g) => ({ ...g, feuds: g.feuds.map((f) => (f.id === id ? { ...f, status: 'ended' } : f)) }));
    setSelectedFeud(null);
    showToast('Feud ended.');
  }

  /* ---------- TV deal actions ---------- */
  function signTVDeal(networkId) {
    updateGame((g) => {
      if (g.company.tvDeal) { showToast('Already under a TV deal.'); return g; }
      const network = TV_NETWORKS.find((n) => n.id === networkId);
      if (!network || g.company.reputation < network.minRep) return g;
      return {
        ...g,
        company: { ...g.company, tvDeal: { networkId, weeksRemaining: network.weeks, totalWeeks: network.weeks, strikes: 0, signedWeek: g.company.week, signedYear: g.company.year } },
        news: [`Signed a TV deal with ${network.name}!`, ...g.news].slice(0, 30),
      };
    });
    setTvModalOpen(false);
    showToast('TV deal signed.');
  }

  /* ---------- Rival promotion actions ---------- */
  function setRivalRelationship(rivalId, relationship) {
    updateGame((g) => ({ ...g, rivals: g.rivals.map((r) => (r.id === rivalId ? { ...r, relationship } : r)) }));
  }

  /* ---------- Upgrade actions ---------- */
  function purchaseUpgrade(key) {
    updateGame((g) => {
      const currentLevel = upgradeLevel(g.company, key);
      const def = UPGRADES[key];
      if (currentLevel >= def.levels.length) { showToast('Already at max level.'); return g; }
      const nextTier = def.levels[currentLevel];
      if (g.company.funds < nextTier.cost) { showToast('Not enough funds for this upgrade.'); return g; }
      return {
        ...g,
        company: { ...g.company, funds: g.company.funds - nextTier.cost, upgrades: { ...g.company.upgrades, [key]: currentLevel + 1 } },
        news: [`Upgraded ${def.label} to "${nextTier.name}."`, ...g.news].slice(0, 30),
      };
    });
    showToast('Upgrade purchased.');
  }

  /* ---------- Ring shape ---------- */
  function purchaseRingShape(id) {
    updateGame((g) => {
      const shape = RING_SHAPES.find((s) => s.id === id);
      if (!shape || g.company.ringShapesOwned.includes(id)) return g;
      if (g.company.funds < shape.cost) { showToast('Not enough funds for this ring.'); return g; }
      return {
        ...g,
        company: { ...g.company, funds: g.company.funds - shape.cost, ringShapesOwned: [...g.company.ringShapesOwned, id], ringShape: id },
        news: [`Commissioned a new ${shape.name} for the promotion.`, ...g.news].slice(0, 30),
      };
    });
    showToast('Ring acquired and equipped.');
  }
  function equipRingShape(id) {
    updateGame((g) => (g.company.ringShapesOwned.includes(id) ? { ...g, company: { ...g.company, ringShape: id } } : g));
  }

  /* ---------- Concessions ---------- */
  function addConcessionItem(itemId) {
    updateGame((g) => {
      const item = CONCESSION_ITEMS_CATALOG.find((i) => i.id === itemId);
      if (!item || g.company.concessionsMenu.some((e) => e.itemId === itemId)) return g;
      if (g.company.funds < item.unlockCost) { showToast('Not enough funds.'); return g; }
      return {
        ...g,
        company: { ...g.company, funds: g.company.funds - item.unlockCost, concessionsMenu: [...g.company.concessionsMenu, { itemId, price: item.suggestedPrice }] },
      };
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
      const item = MERCH_ITEMS_CATALOG.find((i) => i.id === itemId);
      if (!item || g.company.merchMenu.some((e) => e.itemId === itemId)) return g;
      if (g.company.funds < item.unlockCost) { showToast('Not enough funds.'); return g; }
      return {
        ...g,
        company: { ...g.company, funds: g.company.funds - item.unlockCost, merchMenu: [...g.company.merchMenu, { itemId, price: item.suggestedPrice, wrestlerId: null }] },
      };
    });
    showToast('Added to merch menu.');
  }
  function setMerchPrice(itemId, price) {
    updateGame((g) => ({ ...g, company: { ...g.company, merchMenu: g.company.merchMenu.map((e) => (e.itemId === itemId ? { ...e, price } : e)) } }));
  }
  function setMerchWrestler(itemId, wrestlerId) {
    updateGame((g) => ({ ...g, company: { ...g.company, merchMenu: g.company.merchMenu.map((e) => (e.itemId === itemId ? { ...e, wrestlerId: wrestlerId || null } : e)) } }));
  }
  function removeMerchItem(itemId) {
    updateGame((g) => ({ ...g, company: { ...g.company, merchMenu: g.company.merchMenu.filter((e) => e.itemId !== itemId) } }));
  }

  /* ---------- Weapons shopping ---------- */
  function purchaseWeaponItem(itemId) {
    updateGame((g) => {
      const item = WEAPON_ITEMS_CATALOG.find((i) => i.id === itemId);
      if (!item || g.company.weaponsOwned.includes(itemId)) return g;
      if (g.company.funds < item.cost) { showToast('Not enough funds.'); return g; }
      return { ...g, company: { ...g.company, funds: g.company.funds - item.cost, weaponsOwned: [...g.company.weaponsOwned, itemId] } };
    });
    showToast('Added to the weapons stash.');
  }

  /* ---------- Staff actions ---------- */
  function hireStaff(role, id) {
    const key = role === 'Announcer' ? 'announcers' : 'commentators';
    updateGame((g) => {
      if (g.staff[key].length >= 3) { showToast(`You already have 3 ${role.toLowerCase()}s.`); return g; }
      const candidate = g.staffPool[key].find((s) => s.id === id);
      if (!candidate) return g;
      const bonus = Math.round(candidate.salary * 1.5);
      if (g.company.funds < bonus) { showToast('Not enough funds to hire.'); return g; }
      return {
        ...g,
        company: { ...g.company, funds: g.company.funds - bonus },
        staff: { ...g.staff, [key]: [...g.staff[key], candidate] },
        staffPool: { ...g.staffPool, [key]: [...g.staffPool[key].filter((s) => s.id !== id), generateStaff(role)] },
      };
    });
  }
  function fireStaff(role, id) {
    const key = role === 'Announcer' ? 'announcers' : 'commentators';
    updateGame((g) => ({ ...g, staff: { ...g.staff, [key]: g.staff[key].filter((s) => s.id !== id) } }));
    showToast(`${role} let go.`);
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

  function runShow() {
    if (!game.draftShow.card.length) { showToast('Add at least one segment to the card first.'); return; }
    const result = simulateShow(game.draftShow, game);
    const wrestlerUpdates = {};

    result.matchResults.forEach((m) => {
      m.participantIds.forEach((pid) => {
        const w = game.roster.find((r) => r.id === pid);
        const perf = m.result.perfTracker[pid] || { points: 0 };
        const isWinner = m.winnerIds.includes(pid);
        let popGain = Math.round(2 + perf.points * 4 + (isWinner ? 3 : 0) + m.result.finalStars * 1.5);
        if (hasTrait(w, 'natural')) popGain = Math.round(popGain * 1.3);
        if (!wrestlerUpdates[pid]) wrestlerUpdates[pid] = { popDelta: 0, moraleDelta: 0 };
        wrestlerUpdates[pid].popDelta += popGain;
        let moraleDelta = isWinner ? 4 : (m.result.finalStars >= 3 ? 1 : -3);
        if (!isWinner && hasTrait(w, 'prima_donna')) moraleDelta -= 3;
        wrestlerUpdates[pid].moraleDelta += moraleDelta;
      });
      m.result.injuries.forEach((inj) => {
        if (!wrestlerUpdates[inj.wrestlerId]) wrestlerUpdates[inj.wrestlerId] = { popDelta: 0, moraleDelta: 0 };
        const injuredWrestler = game.roster.find((r) => r.id === inj.wrestlerId);
        const healMult = currentTier(game.company, 'medical').healMult * (hasTrait(injuredWrestler, 'iron_constitution') ? 0.6 : 1);
        const weeksLeft = Math.max(1, Math.round(inj.weeksLeft * healMult));
        wrestlerUpdates[inj.wrestlerId].injury = { label: inj.label, weeksLeft };
      });
    });
    result.promoResults.forEach((p) => {
      p.participantIds.forEach((pid) => {
        if (!wrestlerUpdates[pid]) wrestlerUpdates[pid] = { popDelta: 0, moraleDelta: 0 };
        wrestlerUpdates[pid].popDelta += Math.round(p.pop / 12);
        wrestlerUpdates[pid].moraleDelta += 1;
      });
    });
    Object.entries(result.merchRoyalties || {}).forEach(([wid, amount]) => {
      if (!wrestlerUpdates[wid]) wrestlerUpdates[wid] = { popDelta: 0, moraleDelta: 0 };
      wrestlerUpdates[wid].moraleDelta += clamp(Math.round(amount / 150), 0, 5);
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
      if (injury) {
        const weeksLeft = injury.weeksLeft - 1;
        injury = weeksLeft <= 0 ? null : { ...injury, weeksLeft };
      }
      if (upd && upd.injury) injury = upd.injury;
      const contractWeeksLeft = Math.max(0, w.contractWeeksLeft - 1);
      return {
        ...w,
        popularity: clamp(w.popularity + (upd ? upd.popDelta : 0), 0, 100),
        morale: clamp(w.morale + (upd ? upd.moraleDelta : 0) + passiveMorale - (contractWeeksLeft === 0 ? 5 : 0), 0, 100),
        condition, injury, contractWeeksLeft,
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
    const nextRivals = game.rivals.map((rival) => {
      const ticked = tickRivalPromotion(rival);
      if (freeAgents.length && Math.random() < rivalPoachChance(ticked)) {
        const target = pick(freeAgents);
        freeAgents = freeAgents.filter((w) => w.id !== target.id);
        rivalNews.push(`${ticked.name} signed free agent ${target.name}.`);
      } else if (Math.random() < 0.2) {
        const flavor = ticked.momentum >= 0 ? pick(RIVAL_FLAVOR_UP) : pick(RIVAL_FLAVOR_DOWN);
        rivalNews.push(`${ticked.name} ${flavor}.`);
      }
      return ticked;
    });

    const nextTagTeams = game.tagTeams
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
    const nextStables = game.stables
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
    const nextFeuds = game.feuds.map((feud) => {
      if (feud.status === 'ended') return feud;
      if (!stillRoster.some((r) => r.id === feud.aId) || !stillRoster.some((r) => r.id === feud.bId)) return { ...feud, status: 'ended' };
      let updated = feud;
      let touched = false;
      result.matchResults.forEach((m) => {
        if (feudPairPresent(feud, m.participantIds)) {
          const isBlowOff = m.feudBlowOffId === feud.id;
          if (isBlowOff) {
            feudRepBonus += clamp(Math.round(updated.heat / 40), 1, 4);
            feudNews.push(`${feud.aName} and ${feud.bName} finally settle their feud in the blow-off match!`);
          }
          updated = advanceFeudFromMatch(updated, m.result.finalStars, m.finishId, isBlowOff, game.company.week, game.company.year);
          touched = true;
        }
      });
      result.promoResults.forEach((p) => {
        if (feudPairPresent(feud, p.participantIds)) {
          updated = advanceFeudFromPromo(updated, p.purpose, game.company.week, game.company.year);
          touched = true;
        }
      });
      if (!touched) updated = { ...updated, heat: clamp(updated.heat - FEUD_HEAT_DECAY, 0, 100) };
      return updated;
    });

    const titleNews = [];
    const nextTitles = game.titles.map((title) => {
      const titleMatch = result.matchResults.find((m) => m.titleId === title.id);
      if (!titleMatch) return title;
      const winnerIds = titleMatch.winnerIds;
      const winnerNames = winnerIds.map((id) => (game.roster.find((r) => r.id === id) || {}).name || '???');
      const { title: nextTitle, changed } = resolveTitleMatch(title, winnerIds, winnerNames, titleMatch.finishId, game.company.week, game.company.year);
      if (changed) {
        titleNews.push(title.holderIds.length ? `${winnerNames.join(' & ')} defeated the champion to win the ${title.name}!` : `${winnerNames.join(' & ')} won the vacant ${title.name}!`);
      } else if (titleMatch.finishId === 'dq' || titleMatch.finishId === 'countout') {
        titleNews.push(`The ${title.name} does not change hands on a ${FINISH_TYPES.find((f) => f.id === titleMatch.finishId).label.toLowerCase()}.`);
      }
      return nextTitle;
    });

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
    newsEntries.push(result.netProfit >= 0 ? `The show turned a profit of ${money(result.netProfit)}.` : `The show lost ${money(Math.abs(result.netProfit))}.`);

    const historyEntry = {
      week: game.company.week, year: game.company.year, venueName: result.venue.name,
      attendance: result.attendance, capacity: result.venue.capacity, avgStars: Number(result.avgStars.toFixed(2)),
      netProfit: result.netProfit, revenue: result.revenue, expenses: result.expenses, repDelta: result.repDelta,
      matches: result.matchResults.map((m) => ({
        label: m.participantIds.map((id) => (game.roster.find((r) => r.id === id) || {}).name || '???').join(' vs '),
        stars: m.result.finalStars,
        winner: m.winnerIds.map((id) => (game.roster.find((r) => r.id === id) || {}).name || '???').join(' & '),
        titleName: m.titleId ? (game.titles.find((t) => t.id === m.titleId) || {}).name : null,
        blowOff: !!(m.feudBlowOffId && game.feuds.find((f) => f.id === m.feudBlowOffId)),
      })),
    };

    const nextGame = {
      ...game,
      company: {
        ...game.company,
        funds: game.company.funds + result.netProfit,
        reputation: clamp(game.company.reputation + result.repDelta + stableRepBonus + feudRepBonus, 0, 100),
        week: nextWeek, year: nextYear,
        tvDeal,
      },
      roster: stillRoster,
      freeAgents,
      titles: nextTitles,
      tagTeams: nextTagTeams,
      stables: nextStables,
      feuds: nextFeuds,
      rivals: nextRivals,
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
    return (
      <div className="wgm-root min-h-screen p-6" style={{ backgroundColor: C.ink }}>
        <style>{FONT_STYLE}</style>
        <div className="w-full max-w-sm mx-auto text-center pb-10">
          <Trophy size={36} color={C.gold} className="mx-auto mb-2" />
          <h1 className="wgm-display text-4xl mb-1" style={{ color: C.cream }}>BOOKED</h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(246,240,225,0.6)' }}>Build a wrestling promotion from a folding-chair territory into a global powerhouse.</p>

          <div className="flex items-center gap-2 mb-2">
            <Globe size={14} color={C.gold} />
            <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>1. CHOOSE YOUR REGION</p>
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
                <p className="wgm-mono text-[11px] tracking-widest" style={{ color: C.goldSoft }}>2. CHOOSE YOUR STYLE</p>
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

          {setupRegion && setupStyle && (
            <div className="wgm-pop">
              <p className="wgm-mono text-[11px] tracking-widest mb-2" style={{ color: C.goldSoft }}>3. NAME YOUR PROMOTION</p>
              <input
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="Name your promotion"
                className="w-full rounded-md px-4 py-3 mb-3 text-sm outline-none"
                style={{ backgroundColor: C.inkSoft, color: C.cream, border: `1px solid ${C.inkFaint}` }}
              />
              <PrimaryButton full onClick={startNewGame}>Open For Business</PrimaryButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { company, roster, freeAgents, staff, staffPool, titles, tagTeams, stables, feuds, rivals, history, news, draftShow } = game;
  const healthyRoster = roster.filter((w) => !w.injury);
  const estimate = estimateShow(draftShow, game);
  const draftVenue = VENUE_TIERS.find((v) => v.id === draftShow.venueId);
  const unlocked = VENUE_TIERS.filter((v) => v.minRep <= company.reputation);
  const nextVenue = nextLockedVenue(company.reputation);

  const TABS = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'roster', label: 'Roster', icon: Users },
    { id: 'titles', label: 'Titles', icon: Crown },
    { id: 'staff', label: 'Staff', icon: Mic },
    { id: 'book', label: 'Book', icon: Calendar },
    { id: 'history', label: 'History', icon: Trophy },
  ];

  return (
    <div className="wgm-root min-h-screen pb-20" style={{ backgroundColor: C.canvas }}>
      <style>{FONT_STYLE}</style>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ backgroundColor: C.ink }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="wgm-mono text-[10px] tracking-widest" style={{ color: C.goldSoft }}>{repTierLabel(company.reputation).toUpperCase()}</p>
            <h1 className="wgm-display text-xl leading-tight" style={{ color: C.cream }}>{company.name}</h1>
          </div>
          <div className="text-right">
            <p className="wgm-mono text-[10px]" style={{ color: 'rgba(246,240,225,0.55)' }}>WEEK {company.week} · YR {company.year}</p>
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
            onOpenUpgrades={() => setUpgradesModalOpen(true)}
            onOpenTv={() => setTvModalOpen(true)}
            onOpenRivals={() => setRivalsModalOpen(true)}
          />
        )}
        {tab === 'roster' && (
          <RosterTab
            roster={roster} freeAgents={freeAgents} titles={titles} tagTeams={tagTeams} stables={stables} feuds={feuds}
            subTab={rosterSubTab} setSubTab={setRosterSubTab}
            onSelect={setSelectedWrestler} onSign={signFreeAgent} onScout={scoutTalent} funds={company.funds}
            onOpenTeamBuilder={() => setTeamBuilderOpen(true)} onDisbandTeam={disbandTeam}
            onOpenStableBuilder={() => setStableBuilderOpen(true)} onSelectStable={setSelectedStable}
            onOpenFeudBuilder={() => setFeudBuilderOpen(true)} onSelectFeud={setSelectedFeud}
          />
        )}
        {tab === 'titles' && (
          <TitlesTab titles={titles} company={company} onOpenBuilder={() => setTitleBuilderOpen(true)} onSelectTitle={setSelectedTitle} funds={company.funds} />
        )}
        {tab === 'staff' && (
          <StaffTab staff={staff} staffPool={staffPool} funds={company.funds} onHire={hireStaff} onFire={(role, id) => setConfirmAction({ type: 'fireStaff', role, id })} />
        )}
        {tab === 'book' && (
          <BookShowTab
            draftShow={draftShow} draftVenue={draftVenue} unlocked={unlocked} estimate={estimate}
            roster={roster} healthyRoster={healthyRoster} titles={titles} feuds={feuds} funds={company.funds}
            onUpdateDraft={updateDraft} onOpenMatchBuilder={() => setMatchBuilderOpen(true)}
            onOpenPromoBuilder={() => setPromoBuilderOpen(true)} onRemove={removeCardItem} onMove={moveCardItem}
            onRun={runShow}
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
          wrestler={selectedWrestler} titles={titles} tagTeams={tagTeams} stables={stables} onClose={() => setSelectedWrestler(null)}
          onAlign={setAlignment} onRelease={(id) => setConfirmAction({ type: 'release', id })}
          onRenew={renewContract} funds={company.funds}
        />
      )}

      {/* Match builder */}
      {matchBuilderOpen && (
        <MatchBuilderModal
          roster={healthyRoster} titles={titles} tagTeams={tagTeams} feuds={feuds} style={company.style} onClose={() => setMatchBuilderOpen(false)}
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
        <FeudBuilderModal roster={roster} onClose={() => setFeudBuilderOpen(false)} onCreate={createFeud} />
      )}

      {/* Feud detail */}
      {selectedFeud && (
        <FeudDetailModal feud={feuds.find((f) => f.id === selectedFeud.id) || selectedFeud} onClose={() => setSelectedFeud(null)} onEnd={endFeud} />
      )}

      {/* Upgrades */}
      {upgradesModalOpen && (
        <BusinessModal
          company={company} roster={roster} onClose={() => setUpgradesModalOpen(false)}
          onPurchaseUpgrade={purchaseUpgrade}
          onPurchaseRingShape={purchaseRingShape} onEquipRingShape={equipRingShape}
          onAddConcession={addConcessionItem} onSetConcessionPrice={setConcessionPrice} onRemoveConcession={removeConcessionItem}
          onAddMerch={addMerchItem} onSetMerchPrice={setMerchPrice} onSetMerchWrestler={setMerchWrestler} onRemoveMerch={removeMerchItem}
          onPurchaseWeaponItem={purchaseWeaponItem}
        />
      )}

      {/* TV deal */}
      {tvModalOpen && (
        <TvDealModal company={company} onClose={() => setTvModalOpen(false)} onSign={signTVDeal} />
      )}

      {/* Rival promotions */}
      {rivalsModalOpen && (
        <RivalsModal rivals={rivals} company={company} onClose={() => setRivalsModalOpen(false)} onSetRelationship={setRivalRelationship} />
      )}

      {/* Promo builder */}
      {promoBuilderOpen && (
        <PromoBuilderModal
          roster={roster} onClose={() => setPromoBuilderOpen(false)}
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
function DashboardTab({ game, news, draftShow, draftVenue, onGoBook, unlocked, onNewGame, onOpenUpgrades, onOpenTv, onOpenRivals }) {
  const { company, roster } = game;
  const injured = roster.filter((w) => w.injury);
  const avgPop = Math.round(average(roster.map((w) => w.popularity)));
  const regionLabel = (REGION_LIST.find((r) => r.id === company.region) || REGION_LIST[0]).label;
  const styleLabel = (STYLE_CONFIG[company.style] || STYLE_CONFIG.sports_entertainment).label;
  const upgradeKeys = Object.keys(UPGRADES);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 -mt-1">
        <Globe size={11} color={C.inkFaint} />
        <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>{regionLabel} · {styleLabel}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat icon={Users} label="Roster" value={roster.length} />
        <MiniStat icon={TrendingUp} label="Avg Pop." value={avgPop} />
        <MiniStat icon={AlertTriangle} label="Injured" value={injured.length} warn={injured.length > 0} />
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

      <button onClick={onOpenUpgrades} className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle icon={Wrench}>Business & Upgrades</SectionTitle>
          <ChevronRight size={16} color={C.inkFaint} />
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-2">
          {upgradeKeys.map((key) => {
            const def = UPGRADES[key];
            const Icon = def.icon;
            const level = upgradeLevel(company, key);
            return (
              <div key={key} className="flex items-center gap-1.5">
                <Icon size={13} color={C.gold} />
                <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>{def.label.split(' ')[0].toUpperCase()} {level}/5</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={13} color={company.merchMenu.length ? C.gold : C.inkFaint} />
            <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>MERCH {company.merchMenu.length} ITEMS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coffee size={13} color={company.concessionsMenu.length ? C.gold : C.inkFaint} />
            <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>FOOD {company.concessionsMenu.length} ITEMS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Swords size={13} color={company.weaponsOwned.length ? C.gold : C.inkFaint} />
            <span className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>GEAR {company.weaponsOwned.length}/{WEAPON_ITEMS_CATALOG.length}</span>
          </div>
        </div>
      </button>

      <button onClick={onOpenTv} className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle icon={Tv}>TV Deal</SectionTitle>
          <ChevronRight size={16} color={C.inkFaint} />
        </div>
        {company.tvDeal ? (
          (() => {
            const net = TV_NETWORKS.find((n) => n.id === company.tvDeal.networkId);
            return <p className="text-xs" style={{ color: C.inkFaint }}>{net.name} · {company.tvDeal.weeksRemaining} wks left · {company.tvDeal.strikes}/{TV_STRIKE_LIMIT} strikes</p>;
          })()
        ) : (
          <p className="text-xs" style={{ color: C.inkFaint }}>No network deal — explore offers to unlock weekly rights fees.</p>
        )}
      </button>

      <button onClick={onOpenRivals} className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle icon={Building2}>Rival Promotions</SectionTitle>
          <ChevronRight size={16} color={C.inkFaint} />
        </div>
        <p className="text-xs" style={{ color: C.inkFaint }}>
          {game.rivals.length} promotions competing with you · {game.rivals.filter((r) => r.relationship === 'ally').length} allies · {game.rivals.filter((r) => r.relationship === 'rival').length} rivals
        </p>
      </button>

      <div>
        <SectionTitle icon={Megaphone}>Latest News</SectionTitle>
        <div className="space-y-2">
          {news.slice(0, 6).map((n, i) => (
            <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: C.canvasAlt, color: C.inkSoft, borderLeft: `3px solid ${C.gold}` }}>{n}</div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle icon={MapPin} sub={`${unlocked.length}/${VENUE_TIERS.length} unlocked`}>Venues</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {VENUE_TIERS.map((v) => {
            const isUnlocked = v.minRep <= game.company.reputation;
            return (
              <div key={v.id} className="rounded-lg p-2.5" style={{ backgroundColor: isUnlocked ? C.cream : C.canvasAlt, border: `1px solid ${C.line}`, opacity: isUnlocked ? 1 : 0.55 }}>
                <p className="text-xs font-semibold" style={{ color: C.ink }}>{v.name}</p>
                <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>Cap. {v.capacity.toLocaleString()}</p>
                {!isUnlocked && <p className="wgm-mono text-[9px] mt-0.5" style={{ color: C.rope }}>Needs {v.minRep} rep</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 text-center">
        <button onClick={onNewGame} className="wgm-mono text-[10px] underline" style={{ color: C.inkFaint }}>Start a New Promotion</button>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, warn }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: warn ? 'rgba(172,58,44,0.1)' : C.cream, border: `1px solid ${warn ? C.rope : C.line}` }}>
      <Icon size={16} color={warn ? C.rope : C.gold} className="mx-auto mb-1" />
      <p className="wgm-display text-lg leading-none" style={{ color: C.ink }}>{value}</p>
      <p className="wgm-mono text-[9px] mt-1" style={{ color: C.inkFaint }}>{label.toUpperCase()}</p>
    </div>
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
function RosterTab({ roster, freeAgents, titles, tagTeams, stables, feuds, subTab, setSubTab, onSelect, onSign, onScout, funds, onOpenTeamBuilder, onDisbandTeam, onOpenStableBuilder, onSelectStable, onOpenFeudBuilder, onSelectFeud }) {
  const activeFeuds = feuds.filter((f) => f.status !== 'ended');
  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto wgm-scrollbar pb-1">
        <PillTab active={subTab === 'active'} onClick={() => setSubTab('active')}>Roster ({roster.length})</PillTab>
        <PillTab active={subTab === 'free'} onClick={() => setSubTab('free')}>Free Agents ({freeAgents.length})</PillTab>
        <PillTab active={subTab === 'teams'} onClick={() => setSubTab('teams')}>Teams ({tagTeams.length})</PillTab>
        <PillTab active={subTab === 'stables'} onClick={() => setSubTab('stables')}>Stables ({stables.length})</PillTab>
        <PillTab active={subTab === 'feuds'} onClick={() => setSubTab('feuds')}>Feuds ({activeFeuds.length})</PillTab>
      </div>

      {subTab === 'active' && (
        <div className="space-y-2">
          {roster.length === 0 && <EmptyState text="No wrestlers signed. Head to Free Agents to build your roster." />}
          {roster.map((w) => <WrestlerRow key={w.id} w={w} titles={titles} onClick={() => onSelect(w)} funds={funds} />)}
        </div>
      )}

      {subTab === 'free' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: C.inkFaint }}>Sign new talent for a 2x salary bonus.</p>
            <GhostButton icon={RefreshCw} onClick={onScout}>Scout ($500)</GhostButton>
          </div>
          <div className="space-y-2">
            {freeAgents.map((w) => (
              <div key={w.id} className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
                <TierBadge tier={w.tier} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{w.name}</p>
                  <p className="text-[11px] truncate" style={{ color: C.inkFaint }}>"{w.gimmick}" · {money(w.salary)}/wk</p>
                  <TraitBadges traits={w.traits} />
                </div>
                <GhostButton icon={UserPlus} onClick={() => onSign(w.id)} disabled={funds < w.salary * 2}>Sign ({money(w.salary * 2)})</GhostButton>
              </div>
            ))}
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
                    <p className="text-sm font-bold" style={{ color: C.ink }}>{f.aName} <span style={{ color: C.rope }}>vs</span> {f.bName}</p>
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
  const colors = { Rookie: C.steel, 'Mid-Card': '#7A6A3E', Star: C.gold, Legend: C.rope };
  return <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: colors[tier] }}><span className="wgm-mono text-[9px] font-bold text-white">{tier === 'Mid-Card' ? 'MC' : tier.slice(0, 2).toUpperCase()}</span></div>;
}

function championTitlesFor(titles, wrestlerId) {
  return (titles || []).filter((t) => t.holderIds.includes(wrestlerId));
}

function TraitBadges({ traits, max = 2 }) {
  if (!traits || !traits.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {traits.slice(0, max).map((id) => {
        const t = traitInfo(id);
        if (!t) return null;
        return <span key={id} className="wgm-mono text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: t.polarity === 'positive' ? 'rgba(196,146,46,0.18)' : 'rgba(172,58,44,0.14)', color: t.polarity === 'positive' ? C.gold : C.rope }}>{t.label}</span>;
      })}
    </div>
  );
}

function WrestlerRow({ w, titles, onClick }) {
  const champTitles = championTitlesFor(titles, w.id);
  return (
    <button onClick={onClick} className="w-full rounded-lg p-3 flex items-center gap-3 text-left" style={{ backgroundColor: C.cream, border: `1px solid ${w.injury ? C.rope : champTitles.length ? C.gold : C.line}` }}>
      <TierBadge tier={w.tier} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{w.name}</p>
          <AlignmentBadge alignment={w.alignment} />
          {champTitles.length > 0 && <Crown size={12} color={C.gold} fill={C.gold} />}
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

function WrestlerModal({ wrestler, titles, tagTeams, stables, onClose, onAlign, onRelease, onRenew, funds }) {
  const champTitles = championTitlesFor(titles, wrestler.id);
  const team = (tagTeams || []).find((t) => t.memberIds.includes(wrestler.id));
  const stable = (stables || []).find((s) => s.memberIds.includes(wrestler.id));
  return (
    <Modal title={wrestler.name} onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <TierBadge tier={wrestler.tier} />
        <div>
          <p className="text-xs italic" style={{ color: C.inkFaint }}>"{wrestler.gimmick}" · Age {wrestler.age}</p>
          <AlignmentBadge alignment={wrestler.alignment} />
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
                <div key={id} className="flex items-center gap-2 rounded-md p-2" style={{ backgroundColor: t.polarity === 'positive' ? 'rgba(196,146,46,0.1)' : 'rgba(172,58,44,0.08)' }}>
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
        <div className="rounded-lg p-2.5 mb-4 flex items-center gap-2" style={{ backgroundColor: 'rgba(196,146,46,0.14)' }}>
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
        <div className="rounded-lg p-2.5 mb-4 flex items-center gap-2" style={{ backgroundColor: 'rgba(172,58,44,0.1)' }}>
          <AlertTriangle size={14} color={C.rope} />
          <p className="text-xs" style={{ color: C.rope }}>{wrestler.injury.label} — {wrestler.injury.weeksLeft} week{wrestler.injury.weeksLeft > 1 ? 's' : ''} remaining</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs mb-4" style={{ color: C.inkFaint }}>
        <span>Salary: <span className="wgm-mono" style={{ color: C.ink }}>{money(wrestler.salary)}/wk</span></span>
        <span>Contract: <span className="wgm-mono" style={{ color: wrestler.contractWeeksLeft <= 4 ? C.rope : C.ink }}>{wrestler.contractWeeksLeft}wk</span></span>
      </div>

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

/* ============================================================
   STAFF TAB
   ============================================================ */
function StaffTab({ staff, staffPool, funds, onHire, onFire }) {
  return (
    <div className="space-y-6">
      <StaffGroup title="Announcers" icon={Radio} role="Announcer" current={staff.announcers} pool={staffPool.announcers} funds={funds} onHire={onHire} onFire={onFire} />
      <StaffGroup title="Commentators" icon={Mic} role="Commentator" current={staff.commentators} pool={staffPool.commentators} funds={funds} onHire={onHire} onFire={onFire} />
    </div>
  );
}

function StaffGroup({ title, icon, role, current, pool, funds, onHire, onFire }) {
  return (
    <div>
      <SectionTitle icon={icon} sub={`${current.length}/3 hired`}>{title}</SectionTitle>
      <div className="space-y-2 mb-3">
        {current.length === 0 && <EmptyState text={`No ${title.toLowerCase()} hired — shows will feel flat.`} />}
        {current.map((s) => (
          <div key={s.id} className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: C.ink }}>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: C.cream }}>{s.name}</p>
              <p className="wgm-mono text-[10px]" style={{ color: C.goldSoft }}>QUALITY {s.quality} · {money(s.salary)}/wk</p>
              {s.trait && <StaffTraitBadge id={s.trait} />}
            </div>
            <GhostButton danger onClick={() => onFire(role, s.id)}>Fire</GhostButton>
          </div>
        ))}
      </div>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>AVAILABLE</p>
      <div className="space-y-2">
        {pool.map((s) => (
          <div key={s.id} className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: C.ink }}>{s.name}</p>
              <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>QUALITY {s.quality} · {money(s.salary)}/wk</p>
              {s.trait && <StaffTraitBadge id={s.trait} />}
            </div>
            <GhostButton icon={UserPlus} onClick={() => onHire(role, s.id)} disabled={funds < s.salary * 1.5}>Hire ({money(s.salary * 1.5)})</GhostButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffTraitBadge({ id }) {
  const t = STAFF_TRAITS.find((x) => x.id === id);
  if (!t) return null;
  return <span className="wgm-mono text-[9px] px-1.5 py-0.5 rounded inline-block mt-1" style={{ backgroundColor: t.polarity === 'positive' ? 'rgba(196,146,46,0.18)' : 'rgba(172,58,44,0.14)', color: t.polarity === 'positive' ? C.gold : C.rope }}>{t.label}</span>;
}

/* ============================================================
   BOOK SHOW TAB
   ============================================================ */
function BookShowTab({ draftShow, draftVenue, unlocked, estimate, roster, healthyRoster, titles, feuds, funds, onUpdateDraft, onOpenMatchBuilder, onOpenPromoBuilder, onRemove, onMove, onRun }) {
  const wrestlerName = (id) => (roster.find((r) => r.id === id) || {}).name || '???';
  return (
    <div className="space-y-4">
      <div>
        <SectionTitle icon={MapPin}>Venue</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {unlocked.map((v) => (
            <button key={v.id} onClick={() => onUpdateDraft({ venueId: v.id })} className="rounded-lg p-2.5 text-left" style={{ backgroundColor: draftShow.venueId === v.id ? C.ink : C.cream, border: `1px solid ${C.line}` }}>
              <p className="text-xs font-semibold" style={{ color: draftShow.venueId === v.id ? C.gold : C.ink }}>{v.name}</p>
              <p className="wgm-mono text-[9px]" style={{ color: draftShow.venueId === v.id ? 'rgba(246,240,225,0.6)' : C.inkFaint }}>Cap {v.capacity.toLocaleString()} · {money(v.rent)} rent</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle icon={Ticket} sub={money(draftShow.ticketPrice)}>Ticket Price</SectionTitle>
        <input type="range" min="5" max="150" step="5" value={draftShow.ticketPrice} onChange={(e) => onUpdateDraft({ ticketPrice: Number(e.target.value) })} className="w-full" />
      </div>

      <div>
        <SectionTitle icon={Megaphone} sub={money(draftShow.marketingBudget)}>Marketing Budget</SectionTitle>
        <input type="range" min="0" max="10000" step="250" value={draftShow.marketingBudget} onChange={(e) => onUpdateDraft({ marketingBudget: Number(e.target.value) })} className="w-full" />
      </div>

      <div className="rounded-lg p-3 grid grid-cols-3 gap-2 text-center" style={{ backgroundColor: C.canvasAlt }}>
        <div><p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>EST. FANS</p><p className="wgm-display text-base" style={{ color: C.ink }}>{estimate.attendance.toLocaleString()}</p></div>
        <div><p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>REVENUE</p><p className="wgm-display text-base" style={{ color: C.good }}>{money(estimate.revenue)}</p></div>
        <div><p className="wgm-mono text-[9px]" style={{ color: C.inkFaint }}>EST. PROFIT</p><p className="wgm-display text-base" style={{ color: estimate.profit >= 0 ? C.good : C.rope }}>{money(estimate.profit)}</p></div>
      </div>

      <div>
        <SectionTitle icon={Calendar}>Card ({draftShow.card.length})</SectionTitle>
        <div className="space-y-2 mb-3">
          {draftShow.card.length === 0 && <EmptyState text="Add matches and promos to build your show." />}
          {draftShow.card.map((item, i) => (
            <div key={item.id} className="wgm-ticket rounded-lg p-3" style={{ backgroundColor: C.ink }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {item.kind === 'match' ? (
                    <>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Pill bg={C.gold} color={C.ink}>{MATCH_TYPES.find((m) => m.id === item.typeId).label}</Pill>
                        {item.titleId && <Pill bg={C.rope}>{(titles.find((t) => t.id === item.titleId) || {}).name || 'TITLE'}</Pill>}
                        {item.feudBlowOffId && <Pill bg={C.rope}>BLOW-OFF: {(feuds.find((f) => f.id === item.feudBlowOffId) || {}).aName || 'FEUD'}</Pill>}
                      </div>
                      <p className="text-sm font-semibold mt-1.5" style={{ color: C.cream }}>{item.participantIds.map(wrestlerName).join(' vs ')}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(246,240,225,0.55)' }}>Winner: {item.winnerIds.map(wrestlerName).join(' & ')} · {FINISH_TYPES.find((f) => f.id === item.finishId).label}</p>
                    </>
                  ) : (
                    <>
                      <Pill bg={C.steel}>PROMO · {item.purpose}</Pill>
                      <p className="text-sm font-semibold mt-1.5" style={{ color: C.cream }}>{item.participantIds.map(wrestlerName).join(' & ')}</p>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => onMove(i, -1)} disabled={i === 0} className="p-1 rounded disabled:opacity-30"><ChevronUp size={14} color={C.cream} /></button>
                  <button onClick={() => onMove(i, 1)} disabled={i === draftShow.card.length - 1} className="p-1 rounded disabled:opacity-30"><ChevronDown size={14} color={C.cream} /></button>
                </div>
                <button onClick={() => onRemove(i)} className="p-1 rounded shrink-0" style={{ backgroundColor: C.ropeDark }}><X size={14} color={C.cream} /></button>
              </div>
            </div>
          ))}
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
function MatchBuilderModal({ roster, titles, tagTeams, feuds, style, onClose, onAdd }) {
  const styleTypes = style && STYLE_CONFIG[style]
    ? [...MATCH_TYPES].sort((a, b) => {
        const pref = STYLE_CONFIG[style].preferredTypes;
        const ia = pref.indexOf(a.id); const ib = pref.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
    : MATCH_TYPES;
  const [typeId, setTypeId] = useState(styleTypes[0].id);
  const [selected, setSelected] = useState([]);
  const [winnerIds, setWinnerIds] = useState([]);
  const [finishId, setFinishId] = useState('clean');
  const [titleId, setTitleId] = useState('');
  const [feudBlowOffId, setFeudBlowOffId] = useState('');
  const type = MATCH_TYPES.find((m) => m.id === typeId);
  const selectedTitle = titles.find((t) => t.id === titleId);
  const winnersNeeded = selectedTitle && selectedTitle.isTag ? 2 : 1;
  const eligibleFeuds = (feuds || []).filter((f) => f.status !== 'ended' && feudPairPresent(f, selected));

  function toggle(id) {
    setSelected((prev) => {
      if (prev.includes(id)) { const next = prev.filter((p) => p !== id); setWinnerIds((w) => w.filter((x) => x !== id)); return next; }
      if (prev.length >= type.maxP) return prev;
      return [...prev, id];
    });
  }
  function toggleWinner(id) {
    setWinnerIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= winnersNeeded) return winnersNeeded === 1 ? [id] : prev;
      return [...prev, id];
    });
  }

  const canAdd = selected.length >= type.minP && selected.length <= type.maxP && winnerIds.length === winnersNeeded;
  const activeFeudBlowOffId = eligibleFeuds.some((f) => f.id === feudBlowOffId) ? feudBlowOffId : '';

  return (
    <Modal title="Add Match" onClose={onClose} wide>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>MATCH TYPE</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {styleTypes.map((m) => (
          <button key={m.id} onClick={() => { setTypeId(m.id); setSelected([]); setWinnerIds([]); }} className="rounded-md p-2 text-xs font-semibold text-left" style={{ backgroundColor: typeId === m.id ? C.ink : C.canvasAlt, color: typeId === m.id ? C.gold : C.inkFaint }}>
            {m.label}<br /><span className="wgm-mono text-[9px] opacity-70">{m.minP === m.maxP ? `${m.minP} wrestlers` : `${m.minP}–${m.maxP} wrestlers`}</span>
          </button>
        ))}
      </div>

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>PARTICIPANTS ({selected.length}/{type.maxP})</p>
      <div className="max-h-40 overflow-y-auto wgm-scrollbar space-y-1.5 mb-4">
        {roster.map((w) => {
          const team = (tagTeams || []).find((t) => t.memberIds.includes(w.id));
          return (
            <label key={w.id} className="flex items-center gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: selected.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
              <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} />
              <span className="flex-1" style={{ color: C.ink }}>{w.name} <span style={{ color: C.inkFaint }}>({w.tier})</span></span>
              {team && <Pill bg={C.gold} color={C.ink}>{team.name}</Pill>}
              <AlignmentBadge alignment={w.alignment} />
            </label>
          );
        })}
      </div>

      {titles.length > 0 && (
        <>
          <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>TITLE ON THE LINE</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => { setTitleId(''); setWinnerIds([]); }} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: titleId === '' ? C.ink : C.canvasAlt, color: titleId === '' ? C.gold : C.inkFaint }}>No Title</button>
            {titles.map((t) => (
              <button key={t.id} onClick={() => { setTitleId(t.id); setWinnerIds([]); }} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: titleId === t.id ? C.gold : C.canvasAlt, color: titleId === t.id ? C.ink : C.inkFaint }}>{t.name}{t.isTag ? ' (Tag)' : ''}</button>
            ))}
          </div>
        </>
      )}

      {selected.length >= type.minP && (
        <>
          <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>{winnersNeeded === 2 ? 'WINNING TEAM (PICK 2)' : 'WINNER'}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map((id) => {
              const w = roster.find((r) => r.id === id);
              return <button key={id} onClick={() => toggleWinner(id)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: winnerIds.includes(id) ? C.gold : C.canvasAlt, color: winnerIds.includes(id) ? C.ink : C.inkFaint }}>{w.name}</button>;
            })}
          </div>
        </>
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

      <PrimaryButton full disabled={!canAdd} onClick={() => onAdd({ kind: 'match', id: uid(), typeId, participantIds: selected, winnerIds, finishId, titleId: titleId || null, feudBlowOffId: activeFeudBlowOffId || null })}>Add to Card</PrimaryButton>
    </Modal>
  );
}

/* ============================================================
   PROMO BUILDER MODAL
   ============================================================ */
function PromoBuilderModal({ roster, onClose, onAdd }) {
  const [selected, setSelected] = useState([]);
  const [purpose, setPurpose] = useState(PROMO_PURPOSES[0]);

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

      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>PARTICIPANTS ({selected.length}/3)</p>
      <div className="max-h-48 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {roster.map((w) => (
          <label key={w.id} className="flex items-center gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: selected.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
            <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} disabled={!!w.injury} />
            <span className="flex-1" style={{ color: w.injury ? C.inkFaint : C.ink }}>{w.name} {w.injury && '(injured)'}</span>
            <AlignmentBadge alignment={w.alignment} />
          </label>
        ))}
      </div>

      <PrimaryButton full disabled={selected.length === 0} onClick={() => onAdd({ kind: 'promo', id: uid(), participantIds: selected, purpose })}>Add to Card</PrimaryButton>
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
    <div className="space-y-2">
      {history.map((h, i) => (
        <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold" style={{ color: C.ink }}>Week {h.week}, Year {h.year} — {h.venueName}</p>
            <StarRow value={h.avgStars} size={12} />
          </div>
          <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: C.inkFaint }}>
            <span>{h.attendance.toLocaleString()} / {h.capacity.toLocaleString()} fans</span>
            <span style={{ color: h.netProfit >= 0 ? C.good : C.rope, fontWeight: 700 }}>{h.netProfit >= 0 ? '+' : ''}{money(h.netProfit)}</span>
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
      ))}
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
            <AlignmentBadge alignment={w.alignment} />
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
      <div className="max-h-56 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {eligible.map((w) => (
          <label key={w.id} className="flex items-center gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: memberIds.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
            <input type="checkbox" checked={memberIds.includes(w.id)} onChange={() => toggle(w.id)} />
            <span className="flex-1" style={{ color: C.ink }}>{w.name}</span>
            <AlignmentBadge alignment={w.alignment} />
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

function BusinessModal({
  company, roster, onClose, onPurchaseUpgrade,
  onPurchaseRingShape, onEquipRingShape,
  onAddConcession, onSetConcessionPrice, onRemoveConcession,
  onAddMerch, onSetMerchPrice, onSetMerchWrestler, onRemoveMerch,
  onPurchaseWeaponItem,
}) {
  const [section, setSection] = useState('ring');
  const SECTIONS = [
    { id: 'ring', label: 'Ring' },
    { id: 'concessions', label: 'Concessions' },
    { id: 'merch', label: 'Merch' },
    { id: 'weapons', label: 'Weapons' },
    { id: 'facility', label: 'Facility' },
  ];

  return (
    <Modal title="Business & Upgrades" onClose={onClose} wide>
      <div className="flex gap-2 mb-4 overflow-x-auto wgm-scrollbar pb-1">
        {SECTIONS.map((s) => <PillTab key={s.id} active={section === s.id} onClick={() => setSection(s.id)}>{s.label}</PillTab>)}
      </div>

      {section === 'ring' && (
        <div className="space-y-3">
          <p className="wgm-mono text-[10px]" style={{ color: C.inkFaint }}>RING SHAPE</p>
          <div className="space-y-2">
            {RING_SHAPES.map((shape) => {
              const owned = company.ringShapesOwned.includes(shape.id);
              const active = company.ringShape === shape.id;
              const synergy = shape.matchesStyles.includes(company.style);
              return (
                <div key={shape.id} className="rounded-lg p-3" style={{ backgroundColor: active ? 'rgba(196,146,46,0.12)' : C.cream, border: `1px solid ${active ? C.gold : C.line}` }}>
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

      {section === 'concessions' && (
        <MenuBuilder
          catalog={CONCESSION_ITEMS_CATALOG} menu={company.concessionsMenu} funds={company.funds}
          onAdd={onAddConcession} onSetPrice={onSetConcessionPrice} onRemove={onRemoveConcession}
        />
      )}

      {section === 'merch' && (
        <MenuBuilder
          catalog={MERCH_ITEMS_CATALOG} menu={company.merchMenu} funds={company.funds} roster={roster}
          onAdd={onAddMerch} onSetPrice={onSetMerchPrice} onRemove={onRemoveMerch} onSetWrestler={onSetMerchWrestler}
          isMerch
        />
      )}

      {section === 'weapons' && (
        <div>
          <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Buy individual pieces of hardcore gear. Owned items combine to raise match quality (and injury risk) in Hardcore, Ladder, and Cage matches.</p>
          <div className="grid grid-cols-2 gap-2">
            {WEAPON_ITEMS_CATALOG.map((item) => {
              const owned = company.weaponsOwned.includes(item.id);
              return (
                <div key={item.id} className="rounded-lg p-3" style={{ backgroundColor: owned ? 'rgba(196,146,46,0.1)' : C.cream, border: `1px solid ${C.line}` }}>
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

      {section === 'facility' && (
        <div className="space-y-3">
          <TierUpgradeCard upgradeKey="production" company={company} onPurchase={onPurchaseUpgrade} />
          <TierUpgradeCard upgradeKey="medical" company={company} onPurchase={onPurchaseUpgrade} />
          <TierUpgradeCard upgradeKey="transport" company={company} onPurchase={onPurchaseUpgrade} />
        </div>
      )}
    </Modal>
  );
}

function MenuBuilder({ catalog, menu, funds, roster, onAdd, onSetPrice, onRemove, onSetWrestler, isMerch }) {
  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>
        {isMerch ? "Pick what you sell and set your own prices. Assign a wrestler to an item and they'll earn a 15% cut — great for keeping stars happy." : 'Pick what you sell and set your own prices per show.'}
      </p>
      <div className="space-y-2">
        {catalog.map((item) => {
          const entry = menu.find((e) => e.itemId === item.id);
          const inMenu = !!entry;
          return (
            <div key={item.id} className="rounded-lg p-3" style={{ backgroundColor: inMenu ? 'rgba(196,146,46,0.08)' : C.cream, border: `1px solid ${C.line}` }}>
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
                      <select
                        value={entry.wrestlerId || ''} onChange={(e) => onSetWrestler(item.id, e.target.value)}
                        className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={{ backgroundColor: C.canvasAlt, color: C.ink, border: `1px solid ${C.line}` }}
                      >
                        <option value="">General merch (no talent cut)</option>
                        {roster.map((w) => <option key={w.id} value={w.id}>{w.name}'s {item.name}</option>)}
                      </select>
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
function FeudBuilderModal({ roster, onClose, onCreate }) {
  const [selected, setSelected] = useState([]);

  function toggle(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  const canCreate = selected.length === 2;

  return (
    <Modal title="Start a Feud" onClose={onClose} wide>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>Pick two rivals. Book them in the same match or promo and heat builds on its own — no need to track it manually.</p>
      <p className="wgm-mono text-[10px] mb-2" style={{ color: C.inkFaint }}>RIVALS ({selected.length}/2)</p>
      <div className="max-h-64 overflow-y-auto wgm-scrollbar space-y-1.5 mb-5">
        {roster.map((w) => (
          <label key={w.id} className="flex items-center gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: selected.includes(w.id) ? C.canvasAlt : 'transparent', border: `1px solid ${C.line}` }}>
            <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} />
            <span className="flex-1" style={{ color: C.ink }}>{w.name}</span>
            <AlignmentBadge alignment={w.alignment} />
          </label>
        ))}
      </div>
      <PrimaryButton full disabled={!canCreate} onClick={() => onCreate(selected[0], selected[1])}>Start Feud</PrimaryButton>
    </Modal>
  );
}

function FeudDetailModal({ feud, onClose, onEnd }) {
  return (
    <Modal title={`${feud.aName} vs ${feud.bName}`} onClose={onClose} wide>
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
          <div key={i} className="rounded-md p-2.5 flex items-start gap-2" style={{ backgroundColor: entry.blowOff ? 'rgba(172,58,44,0.1)' : C.cream, border: `1px solid ${C.line}` }}>
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
   TV DEAL MODAL
   ============================================================ */
function TvDealModal({ company, onClose, onSign }) {
  if (company.tvDeal) {
    const network = TV_NETWORKS.find((n) => n.id === company.tvDeal.networkId);
    return (
      <Modal title="TV Deal" onClose={onClose}>
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: C.ink }}>
          <div className="flex items-center gap-2 mb-2">
            <Tv size={16} color={C.gold} />
            <p className="wgm-display text-lg" style={{ color: C.cream }}>{network.name}</p>
          </div>
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
      </Modal>
    );
  }

  return (
    <Modal title="TV Deal Offers" onClose={onClose} wide>
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
                {money(n.weeklyFee)}/wk · {n.ratingReq.toFixed(1)}★ req · {n.weeks} wk deal · +{Math.round(n.fillBonus * 100)}% attendance
              </p>
              {unlocked && <GhostButton onClick={() => onSign(n.id)}>Sign Deal</GhostButton>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/* ============================================================
   RIVAL PROMOTIONS MODAL
   ============================================================ */
function RivalsModal({ rivals, company, onClose, onSetRelationship }) {
  return (
    <Modal title="Rival Promotions" onClose={onClose} wide>
      <p className="text-xs mb-3" style={{ color: C.inkFaint }}>These promotions run their own shows and sign their own talent every week, whether you're watching or not. Ally with one for a small reputation trickle, or declare rivalry and try to outgrow them.</p>
      <div className="space-y-2">
        {rivals.map((r) => {
          const regionLabel = (REGION_LIST.find((rg) => rg.id === r.region) || REGION_LIST[0]).label;
          const styleLabel = (STYLE_CONFIG[r.style] || STYLE_CONFIG.sports_entertainment).label;
          const winning = r.relationship === 'rival' && company.reputation > r.reputation;
          return (
            <div key={r.id} className="rounded-lg p-3" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: C.ink }}>{r.name}</p>
                {r.relationship === 'ally' && <Pill bg={C.gold} color={C.ink}>ALLY</Pill>}
                {r.relationship === 'rival' && <Pill bg={C.rope}>RIVAL{winning ? ' · WINNING' : ''}</Pill>}
              </div>
              <p className="text-[11px] mb-2" style={{ color: C.inkFaint }}>{regionLabel} · {styleLabel}</p>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.canvasAlt }}>
                <div className="h-full rounded-full" style={{ width: `${r.reputation}%`, backgroundColor: r.reputation > company.reputation ? C.rope : C.gold }} />
              </div>
              <p className="wgm-mono text-[9px] mb-2" style={{ color: C.inkFaint }}>REPUTATION {r.reputation} (YOURS: {company.reputation})</p>
              <div className="flex gap-2">
                {['neutral', 'ally', 'rival'].map((rel) => (
                  <button key={rel} onClick={() => onSetRelationship(r.id, rel)} className="flex-1 py-1.5 rounded-md text-xs font-semibold capitalize" style={{ backgroundColor: r.relationship === rel ? C.ink : C.canvasAlt, color: r.relationship === rel ? C.gold : C.inkFaint }}>
                    {rel}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
