import Phaser from 'phaser';
import { seededRandom } from '../utils/seededRandom.js';
import { noise2D } from '../utils/noise2D.js';
import { BIOMES, getBiome, getTileDesc } from '../data/biomes.js';
import {
  hexCorners,
  hexAxialToPixel,
  getHexagonTiles,
  axialDistance,
  shadeColor,
} from '../utils/hex.js';
import { MAP_SEED, HEX_SIZE, HEX_W, HEX_H, HEX_MAP_RADIUS, DEBUG_NO_FOG } from '../constants.js';

export class HexMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HexMapScene' });
  }

  preload() {}

  setupPinchZoom() {
    // Attach to game container so we get touches regardless of Phaser's internal DOM (canvas vs wrapper).
    const parentId = this.sys.game.config.parent;
    const container =
      typeof parentId === 'string'
        ? document.getElementById(parentId)
        : parentId;
    const el = container || this.sys.game.canvas;
    if (!el) return;

    const getTouchDistance = (touches) => {
      const a = touches[0];
      const b = touches[1];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };

    this._pinchTouchStart = (e) => {
      if (e.touches.length === 2) {
        this.isPinching = true;
        this.isDragging = false;
        const dist = getTouchDistance(e.touches);
        this.initialPinchDistance = Math.max(dist, 1); // avoid divide-by-zero
        this.initialPinchScale = this.worldContainer.scale;
      }
    };

    this._pinchTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDist = getTouchDistance(e.touches);
        if (this.initialPinchDistance < 1) return;
        const scaleFactor = currentDist / this.initialPinchDistance;
        const newScale = this.initialPinchScale * scaleFactor;
        this.applyZoomCenteredOnCurrentHex(newScale);
      }
    };

    this._pinchTouchEnd = (e) => {
      if (e.touches.length < 2) {
        this.isPinching = false;
      }
    };

    const opts = { capture: true };
    el.addEventListener('touchstart', this._pinchTouchStart, { ...opts, passive: true });
    el.addEventListener('touchmove', this._pinchTouchMove, { ...opts, passive: false });
    el.addEventListener('touchend', this._pinchTouchEnd, { ...opts, passive: true });
    el.addEventListener('touchcancel', this._pinchTouchEnd, { ...opts, passive: true });
    this._pinchEl = el;
  }

  /**
   * Apply a new scale while keeping the player's current hex at the same screen position.
   */
  applyZoomCenteredOnCurrentHex(newScale) {
    const oldScale = this.worldContainer.scale;
    const newScaleClamped = Phaser.Math.Clamp(newScale, 0.08, 2.2);
    if (newScaleClamped === oldScale) return;

    const playerTile = this.hexData.find(
      (t) => t.q === this.playerHome.q && t.r === this.playerHome.r
    );
    const wx = playerTile ? playerTile.x : 0;
    const wy = playerTile ? playerTile.y : 0;

    // Screen position of the hex before scale change
    const hexScreenX = this.worldContainer.x + wx * oldScale;
    const hexScreenY = this.worldContainer.y + wy * oldScale;

    this.worldContainer.setScale(newScaleClamped);
    this.worldContainer.x = hexScreenX - wx * newScaleClamped;
    this.worldContainer.y = hexScreenY - wy * newScaleClamped;
  }

  shutdown() {
    const el = this._pinchEl;
    if (el && this._pinchTouchStart) {
      const capture = true;
      el.removeEventListener('touchstart', this._pinchTouchStart, capture);
      el.removeEventListener('touchmove', this._pinchTouchMove, capture);
      el.removeEventListener('touchend', this._pinchTouchEnd, capture);
      el.removeEventListener('touchcancel', this._pinchTouchEnd, capture);
    }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const R = HEX_MAP_RADIUS;

    const elevNoise = noise2D(seededRandom(MAP_SEED + 1), 5);
    const moistNoise = noise2D(seededRandom(MAP_SEED + 3), 4);
    const ruinNoise = noise2D(seededRandom(MAP_SEED + 5), 3);

    this.HEX_SIZE = HEX_SIZE;

    this.worldContainer = this.add.container(W / 2, H / 2);
    this.worldContainer.setScale(0.35);

    this.hexData = [];
    const hexGraphics = this.add.graphics();
    const hexOverlay = this.add.graphics();
    this.worldContainer.add(hexGraphics);
    this.worldContainer.add(hexOverlay);
    this.hexOverlay = hexOverlay;
    this.hexGraphics = hexGraphics;
    this.settlements = [];

    const hexagonTiles = getHexagonTiles(R);
    const extent = 2 * R;

    for (const { q, r } of hexagonTiles) {
      const { x, y } = hexAxialToPixel(q, r);
      const nx = ((q + R) / extent) * 3.5;
      const ny = ((r + R) / extent) * 3.5;
      const elev = elevNoise(nx, ny);
      const moist = moistNoise(nx + 100, ny + 100);
      const ruin = ruinNoise(nx + 200, ny + 200) * 0.5 + 0.5;
      const tileRng = seededRandom(q * 31337 + r * 99991 + MAP_SEED);
      const biomeKey = getBiome(elev, moist, ruin, () => tileRng());
      const biome = BIOMES[biomeKey];

      if (biomeKey === 'SETTLEMENT') {
        this.settlements.push({ q, r });
      }

      const corners = hexCorners(x, y, HEX_SIZE - 1);

      this.hexData.push({
        q,
        r,
        x,
        y,
        biomeKey,
        corners,
        elev,
        moist,
        axial: { q, r },
        visibility: 'unexplored',
      });
    }

    const center = { q: 0, r: 0 };
    let playerSettlement = this.settlements[0];
    let minDist = Infinity;

    for (const settlement of this.settlements) {
      const dist = axialDistance(center, settlement);
      if (dist < minDist) {
        minDist = dist;
        playerSettlement = settlement;
      }
    }

    this.playerHome = { ...playerSettlement };
    this.originalSettlement = { ...playerSettlement };

    for (const tile of this.hexData) {
      if (DEBUG_NO_FOG) {
        tile.visibility = 'explored';
      } else {
        const dist = axialDistance(this.playerHome, tile.axial);
        if (dist === 0) tile.visibility = 'explored';
        else if (dist <= 1) tile.visibility = 'explored';
        else if (dist === 2) tile.visibility = 'visible';
      }
    }

    this.drawHexes(hexGraphics);

    this.playerHomeMarker = this.add.graphics();
    this.worldContainer.add(this.playerHomeMarker);

    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => this.updatePlayerMarker(),
    });

    this.hexZones = [];
    for (const tile of this.hexData) {
      const zone = this.add
        .zone(0, 0, HEX_W, HEX_H * 0.85)
        .setInteractive()
        .setPosition(tile.x, tile.y);
      this.worldContainer.add(zone);
      zone.tileData = tile;
      zone.on('pointerover', () => this.onHover(tile));
      zone.on('pointerout', () => this.clearHover());
      zone.on('pointerdown', () => this.onSelect(tile));
      this.hexZones.push(zone);
    }

    this.hoveredTile = null;
    this.selectedTile = null;

    const playerHomeTile = this.hexData.find(
      (t) => t.q === this.playerHome.q && t.r === this.playerHome.r
    );
    if (playerHomeTile) {
      this.worldContainer.x = W / 2 - playerHomeTile.x * this.worldContainer.scale;
      this.worldContainer.y = H / 2 - playerHomeTile.y * this.worldContainer.scale;
    }

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.containerStart = { x: 0, y: 0 };

    // Pinch-to-zoom state (mobile); pan is skipped while two fingers are down
    this.isPinching = false;
    this.initialPinchDistance = 0;
    this.initialPinchScale = 1;
    this.setupPinchZoom();

    this.input.on('pointerdown', (p) => {
      if (this.isPinching) return;
      this.isDragging = true;
      this.dragStart = { x: p.x, y: p.y };
      this.containerStart = { x: this.worldContainer.x, y: this.worldContainer.y };
    });

    this.input.on('pointermove', (p) => {
      if (this.isPinching) return;
      if (!this.isDragging) return;
      const dx = p.x - this.dragStart.x;
      const dy = p.y - this.dragStart.y;
      this.worldContainer.x = this.containerStart.x + dx;
      this.worldContainer.y = this.containerStart.y + dy;
    });

    this.input.on('pointerup', () => {
      if (!this.isPinching) this.isDragging = false;
    });

    // Wheel zoom: centered on current hex; trackpad/Chrome often use opposite deltaY
    this.input.on('wheel', (pointer, objs, dx, dy) => {
      const delta = dy !== 0 ? dy : dx;
      if (delta === 0) return;
      const factor = delta > 0 ? 1.09 : 0.92;
      const newScale = this.worldContainer.scale * factor;
      this.applyZoomCenteredOnCurrentHex(newScale);
    });

    const starGfx = this.add.graphics();
    const starRng = seededRandom(MAP_SEED + 99);
    for (let i = 0; i < 200; i++) {
      const sx = starRng() * W;
      const sy = starRng() * H;
      const sz = starRng() * 1.2 + 0.2;
      const alpha = starRng() * 0.4 + 0.1;
      starGfx.fillStyle(0xc8b89a, alpha);
      starGfx.fillCircle(sx, sy, sz);
    }
    this.children.sendToBack(starGfx);

    const vigGfx = this.add.graphics();
    vigGfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    vigGfx.fillRect(0, 0, W, H / 3);
    vigGfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.7, 0.7);
    vigGfx.fillRect(0, H * 0.67, W, H / 3);
    vigGfx.setDepth(5);
  }

  updatePlayerMarker() {
    if (!this.playerHome) return;

    const playerHomeTile = this.hexData.find(
      (t) => t.q === this.playerHome.q && t.r === this.playerHome.r
    );
    if (!playerHomeTile) return;

    const { x, y } = playerHomeTile;
    const time = this.time.now / 1000;
    const pulse = Math.sin(time * 2.5) * 0.5 + 0.5;

    this.playerHomeMarker.clear();

    const outerSize = this.HEX_SIZE + 2 + pulse * 4;
    const outerCorners = hexCorners(x, y, outerSize);
    this.playerHomeMarker.lineStyle(3, 0xffd780, 0.6 + pulse * 0.4);
    this.playerHomeMarker.beginPath();
    this.playerHomeMarker.moveTo(outerCorners[0][0], outerCorners[0][1]);
    for (let i = 1; i < 6; i++)
      this.playerHomeMarker.lineTo(outerCorners[i][0], outerCorners[i][1]);
    this.playerHomeMarker.closePath();
    this.playerHomeMarker.strokePath();

    const innerCorners = hexCorners(x, y, this.HEX_SIZE - 1);
    this.playerHomeMarker.lineStyle(2.5, 0xffe8a0, 0.9);
    this.playerHomeMarker.beginPath();
    this.playerHomeMarker.moveTo(innerCorners[0][0], innerCorners[0][1]);
    for (let i = 1; i < 6; i++)
      this.playerHomeMarker.lineTo(innerCorners[i][0], innerCorners[i][1]);
    this.playerHomeMarker.closePath();
    this.playerHomeMarker.strokePath();

    this.playerHomeMarker.fillStyle(0xffd780, 0.08 + pulse * 0.08);
    this.playerHomeMarker.beginPath();
    this.playerHomeMarker.moveTo(innerCorners[0][0], innerCorners[0][1]);
    for (let i = 1; i < 6; i++)
      this.playerHomeMarker.lineTo(innerCorners[i][0], innerCorners[i][1]);
    this.playerHomeMarker.closePath();
    this.playerHomeMarker.fillPath();

    const symbolSize = 6 + pulse * 2;
    this.playerHomeMarker.fillStyle(0xffe8a0, 0.95);
    this.playerHomeMarker.fillCircle(x, y, symbolSize);
    this.playerHomeMarker.lineStyle(1.5, 0xc8882a, 1.0);
    this.playerHomeMarker.strokeCircle(x, y, symbolSize);
  }

  drawHexes(graphics) {
    graphics.clear();

    for (const tile of this.hexData) {
      const biome = BIOMES[tile.biomeKey];
      const corners = hexCorners(tile.x, tile.y, this.HEX_SIZE - 1);
      const visibility = DEBUG_NO_FOG ? 'explored' : tile.visibility;

      if (visibility === 'unexplored') {
        graphics.fillStyle(0x0a0805, 1.0);
        graphics.beginPath();
        graphics.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) graphics.lineTo(corners[i][0], corners[i][1]);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(0.5, 0x1a1510, 0.3);
        graphics.beginPath();
        graphics.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) graphics.lineTo(corners[i][0], corners[i][1]);
        graphics.closePath();
        graphics.strokePath();
      } else if (visibility === 'visible') {
        const tileRng = seededRandom(
          tile.q * 31337 + tile.r * 99991 + MAP_SEED
        );
        const shade = 0.85 + tileRng() * 0.3;
        const fillColor = shadeColor(biome.color, shade * 0.4);
        graphics.fillStyle(fillColor, 1.0);
        graphics.beginPath();
        graphics.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) graphics.lineTo(corners[i][0], corners[i][1]);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(0.8, biome.border, 0.25);
        graphics.beginPath();
        graphics.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) graphics.lineTo(corners[i][0], corners[i][1]);
        graphics.closePath();
        graphics.strokePath();
      } else if (visibility === 'explored') {
        const tileRng = seededRandom(
          tile.q * 31337 + tile.r * 99991 + MAP_SEED
        );
        const shade = 0.85 + tileRng() * 0.3;
        const fillColor = shadeColor(biome.color, shade);
        graphics.fillStyle(fillColor, 1.0);
        graphics.beginPath();
        graphics.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) graphics.lineTo(corners[i][0], corners[i][1]);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(0.8, biome.border, 0.5);
        graphics.beginPath();
        graphics.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) graphics.lineTo(corners[i][0], corners[i][1]);
        graphics.closePath();
        graphics.strokePath();
        if (tile.biomeKey === 'SETTLEMENT') {
          graphics.fillStyle(0xe8b84a, 0.18);
          graphics.beginPath();
          graphics.moveTo(corners[0][0], corners[0][1]);
          for (let i = 1; i < 6; i++)
            graphics.lineTo(corners[i][0], corners[i][1]);
          graphics.closePath();
          graphics.fillPath();
        }
      }
    }
  }

  onHover(tile) {
    if (this.hoveredTile === tile) return;
    this.hoveredTile = tile;
    const isAdjacent = this.isAdjacentToExplored(tile);
    const isCurrentPosition =
      tile.q === this.playerHome.q && tile.r === this.playerHome.r;
    if (isAdjacent && !isCurrentPosition) {
      this.input.setDefaultCursor('pointer');
    } else {
      this.input.setDefaultCursor('default');
    }
    this.redrawOverlay();
  }

  clearHover() {
    this.hoveredTile = null;
    this.input.setDefaultCursor('default');
    this.redrawOverlay();
  }

  onSelect(tile) {
    const isAdjacent = this.isAdjacentToExplored(tile);
    const isCurrentPosition =
      tile.q === this.playerHome.q && tile.r === this.playerHome.r;
    if (isAdjacent && !isCurrentPosition) {
      this.moveTo(tile);
    }
    this.selectedTile = tile;
    this.redrawOverlay();
    this.updateInfoPanel(tile);
  }

  moveTo(tile) {
    this.playerHome = { q: tile.q, r: tile.r };
    if (tile.visibility !== 'explored') tile.visibility = 'explored';
    const neighbors = this.getNeighbors(tile);
    for (const neighbor of neighbors) {
      if (neighbor.visibility === 'unexplored') neighbor.visibility = 'visible';
    }
    this.drawHexes(this.hexGraphics);
  }

  isAdjacentToExplored(tile) {
    const playerTile = this.hexData.find(
      (t) => t.q === this.playerHome.q && t.r === this.playerHome.r
    );
    if (!playerTile) return false;
    const neighbors = this.getNeighbors(playerTile);
    return neighbors.some((n) => n.q === tile.q && n.r === tile.r);
  }

  getNeighbors(tile) {
    const { q, r } = tile;
    const axialOffsets = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];
    const neighbors = [];
    for (const [dq, dr] of axialOffsets) {
      const neighborTile = this.hexData.find(
        (t) => t.q === q + dq && t.r === r + dr
      );
      if (neighborTile) neighbors.push(neighborTile);
    }
    return neighbors;
  }

  redrawOverlay() {
    this.hexOverlay.clear();
    const size = this.HEX_SIZE - 1;

    const playerTile = this.hexData.find(
      (t) => t.q === this.playerHome.q && t.r === this.playerHome.r
    );
    if (playerTile) {
      const neighbors = this.getNeighbors(playerTile);
      for (const neighbor of neighbors) {
        const corners = hexCorners(neighbor.x, neighbor.y, size);
        this.hexOverlay.lineStyle(1.5, 0xe8b84a, 0.3);
        this.hexOverlay.beginPath();
        this.hexOverlay.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++)
          this.hexOverlay.lineTo(corners[i][0], corners[i][1]);
        this.hexOverlay.closePath();
        this.hexOverlay.strokePath();
      }
    }

    if (this.hoveredTile) {
      const { x, y } = this.hoveredTile;
      const corners = hexCorners(x, y, size);
      const isAdjacent = this.isAdjacentToExplored(this.hoveredTile);
      const isCurrentPosition =
        this.hoveredTile.q === this.playerHome.q &&
        this.hoveredTile.r === this.playerHome.r;
      const isMovable = isAdjacent && !isCurrentPosition;

      if (isMovable) {
        this.hexOverlay.lineStyle(2.5, 0xe8b84a, 0.9);
        this.hexOverlay.beginPath();
        this.hexOverlay.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++)
          this.hexOverlay.lineTo(corners[i][0], corners[i][1]);
        this.hexOverlay.closePath();
        this.hexOverlay.strokePath();
        this.hexOverlay.fillStyle(0xe8b84a, 0.15);
        this.hexOverlay.beginPath();
        this.hexOverlay.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++)
          this.hexOverlay.lineTo(corners[i][0], corners[i][1]);
        this.hexOverlay.closePath();
        this.hexOverlay.fillPath();
      } else {
        this.hexOverlay.lineStyle(2, 0xe8b84a, 0.7);
        this.hexOverlay.beginPath();
        this.hexOverlay.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++)
          this.hexOverlay.lineTo(corners[i][0], corners[i][1]);
        this.hexOverlay.closePath();
        this.hexOverlay.strokePath();
        this.hexOverlay.fillStyle(0xe8b84a, 0.08);
        this.hexOverlay.beginPath();
        this.hexOverlay.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++)
          this.hexOverlay.lineTo(corners[i][0], corners[i][1]);
        this.hexOverlay.closePath();
        this.hexOverlay.fillPath();
      }
    }

    if (this.selectedTile) {
      const { x, y } = this.selectedTile;
      const corners = hexCorners(x, y, size);
      this.hexOverlay.lineStyle(2.5, 0xffd780, 1.0);
      this.hexOverlay.beginPath();
      this.hexOverlay.moveTo(corners[0][0], corners[0][1]);
      for (let i = 1; i < 6; i++)
        this.hexOverlay.lineTo(corners[i][0], corners[i][1]);
      this.hexOverlay.closePath();
      this.hexOverlay.strokePath();
    }
  }

  updateInfoPanel(tile) {
    const biome = BIOMES[tile.biomeKey];
    const visibility = DEBUG_NO_FOG ? 'explored' : tile.visibility;

    if (visibility === 'unexplored') {
      const canExplore = this.isAdjacentToExplored(tile);
      document.getElementById('tile-name').textContent = 'Unexplored';
      if (canExplore) {
        document.getElementById('tile-details').innerHTML = `
          <p class="empty" style="color:rgba(200,136,42,0.6)">Click to move here and explore.</p>
        `;
      } else {
        document.getElementById('tile-details').innerHTML = `
          <p class="empty">This region is too far from your current position. Move closer to explore.</p>
        `;
      }
      return;
    }

    if (visibility === 'visible') {
      const canExplore = this.isAdjacentToExplored(tile);
      document.getElementById('tile-name').textContent = biome.name;
      if (canExplore) {
        document.getElementById('tile-details').innerHTML = `
          <p style="font-style:italic; font-size:12px; color:rgba(200,184,154,0.5); margin-bottom:8px; line-height:1.5;">Biome identified via orbital scan.</p>
          <div class="stat-row"><span>Grid Position</span><span>${tile.q}, ${tile.r}</span></div>
          <div class="stat-row"><span>Status</span><span style="color:rgba(200,136,42,0.8)">Click to Move & Survey</span></div>
        `;
      } else {
        document.getElementById('tile-details').innerHTML = `
          <p style="font-style:italic; font-size:12px; color:rgba(200,184,154,0.5); margin-bottom:8px; line-height:1.5;">Biome identified via orbital scan.</p>
          <div class="stat-row"><span>Grid Position</span><span>${tile.q}, ${tile.r}</span></div>
          <div class="stat-row"><span>Status</span><span style="color:rgba(200,136,42,0.5)">Out of Range</span></div>
        `;
      }
      return;
    }

    const isAtPlayerPosition =
      tile.q === this.playerHome.q && tile.r === this.playerHome.r;
    const isOriginalSettlement =
      tile.q === this.originalSettlement.q &&
      tile.r === this.originalSettlement.r &&
      isAtPlayerPosition;
    const isAdjacent = this.isAdjacentToExplored(tile);

    let desc;
    if (isOriginalSettlement) {
      desc =
        "Your tribe's home. Generations have adapted to this land. The orbital AI watches, calculating, waiting for signs of unsustainable expansion.";
    } else if (isAtPlayerPosition) {
      desc =
        'Current expedition position. Your scouts have surveyed this area and established temporary camp.';
    } else {
      desc = getTileDesc(tile.biomeKey);
    }

    const elevPct = Math.round(((tile.elev + 1) / 2) * 100);
    const moistPct = Math.round(((tile.moist + 1) / 2) * 100);

    document.getElementById('tile-name').textContent = isAtPlayerPosition
      ? '⬢ Current Position'
      : biome.name;

    const detailEl = document.getElementById('tile-details');
    const moveHint =
      !isAtPlayerPosition && isAdjacent
        ? `<div class="stat-row" style="border-top:1px solid rgba(200,136,42,0.15); margin-top:4px; padding-top:4px;"><span style="color:rgba(200,136,42,0.6)">Click to move here</span></div>`
        : '';

    detailEl.innerHTML = `
      <p style="font-style:italic; font-size:12px; color:rgba(200,184,154,0.6); margin-bottom:8px; line-height:1.5;">${desc}</p>
      <div class="stat-row"><span>Grid Position</span><span>${tile.q}, ${tile.r}</span></div>
      <div class="stat-row"><span>Elevation Index</span><span>${elevPct}%</span></div>
      <div class="stat-row"><span>Moisture Index</span><span>${moistPct}%</span></div>
      <div class="stat-row"><span>AI Threat Level</span><span style="color:${isAtPlayerPosition || tile.biomeKey === 'SETTLEMENT' ? '#e8b84a' : '#8aaa6a'}">${isAtPlayerPosition || tile.biomeKey === 'SETTLEMENT' ? 'Monitoring' : 'Nominal'}</span></div>
      ${moveHint}
    `;
  }
}
