/**
 * TrophyEntity.js - Interactive trophy for AI Alchemist's Lair
 * Implements an interactive trophy object with glow effects and enter key interaction
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { input } from './input.js'; // Corrected to use named import
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

export class TrophyEntity extends Entity {
    /**
     * Create a new trophy entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {Object} options - Additional options for the trophy
     */
    constructor(x, y, z = 0, options = {}) {
        // Create a properly sized entity for the trophy
        const width = options.width || 1.5;
        const height = options.height || 1.5;
        super(x, y, width, height);
        
        // Set z position and height
        this.z = z;
        this.zHeight = 1.0; // Standard height for decorative objects
        
        // Set static properties (non-moving decorative element)
        this.isStatic = true;
        this.velocityX = 0;
        this.velocityY = 0;
        this.collidable = true; // Allow collision detection
        
        // Trophy-specific properties
        this.trophyId = options.id || 'trophy1';
        this.targetUrl = options.targetUrl || 'https://jam.pieter.com/'; // Updated default target URL
        this.glowColor = options.glowColor || '#FFD700'; // Gold glow
        this.glowIntensity = 0.6; // Initial glow intensity (0-1)
        this.glowDirection = 1; // Direction of glow animation (1 = increasing, -1 = decreasing)
        this.glowSpeed = 0.03; // Speed of pulsing glow effect - increased for more noticeable pulsing
        this.maxGlowIntensity = 1.0;
        this.minGlowIntensity = 0.3;
        this.interactionDistance = options.interactionDistance || 3.0; // Increased to 3 grid units
        
        // Interaction state
        this.isPlayerNearby = false;
        this.showPrompt = false;
        this.interactionEnabled = true;
        this.interactionPromptAlpha = 0; // For fade in/out effect like TV/jukebox
        this.wasEnterPressed = false;
        
        // Animation properties
        this.animationTime = 0;
        this.pulseSpeed = 0.03;
        
        // Attempt to load trophy image
        this.loadTrophyImage();
        
        debug('TrophyEntity: Created new trophy at', { x, y, z });
    }
    
    /**
     * Load the trophy image
     */
    loadTrophyImage() {
        // Try to load the trophy image from the decor folder
        if (!assetLoader.assets[this.trophyId]) {
            debug(`TrophyEntity: Loading trophy image for ${this.trophyId}`);
            
            const trophyImage = new Image();
            trophyImage.onload = () => {
                debug(`TrophyEntity: Successfully loaded trophy image for ${this.trophyId}`);
                assetLoader.assets[this.trophyId] = trophyImage;
            };
            
            trophyImage.onerror = (e) => {
                console.error(`TrophyEntity: Failed to load trophy image for ${this.trophyId}`, e);
            };
            
            // Set the image source with proper path resolution for GitHub Pages compatibility
            const exactPath = './assets/decor/Trophy_1.png';
            const resolvedPath = getAssetPath(exactPath);
            trophyImage.src = resolvedPath;
            console.log(`TrophyEntity: Attempting to load image from resolved path: ${resolvedPath} (original: ${exactPath})`);
        } else {
            debug(`TrophyEntity: Trophy image for ${this.trophyId} already loaded`);
        }
    }
    
    /**
     * Update trophy state - called each frame
     * @param {number} deltaTime - Time since last update
     * @param {Entity} player - Player entity for proximity detection
     */
    update(deltaTime, player) {
        // Skip physics updates for static trophy
        if (this.isStatic) {
            // No need to update position/velocity for static objects
        }
        
        // Update animation time
        this.animationTime += deltaTime * 0.001; // Convert to seconds
        
        // Check if player is nearby for interaction
        this.updatePlayerProximity(player);
        
        // Update glow effect - explicit call to updateGlowEffect
        this.updateGlowEffect(deltaTime);
        
        // Check for interaction (Enter key press)
        this.checkForInteraction();
        
        // Debug logging every 60 frames
        if (Math.round(this.animationTime * 10) % 60 === 0) {
            console.log(`Trophy update: animTime=${this.animationTime.toFixed(2)}, glow=${this.glowIntensity.toFixed(2)}, isNearby=${this.isPlayerNearby}`);
        }
    }
    
    /**
     * Update player proximity status
     * @param {Entity} player - Player entity
     */
    updatePlayerProximity(player) {
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Track previous state for transition logging
            const wasNearby = this.isPlayerNearby;
            
            // Update proximity state
            this.isPlayerNearby = distance <= this.interactionDistance;
            
            // Log state changes
            if (!wasNearby && this.isPlayerNearby) {
                console.log(`TrophyEntity: Player entered interaction range (${distance.toFixed(2)} units)`);
            } else if (wasNearby && !this.isPlayerNearby) {
                console.log(`TrophyEntity: Player left interaction range (${distance.toFixed(2)} units)`);
            }
            
            // Handle interaction prompt fade (similar to TV and jukebox)
            if (this.isPlayerNearby) {
                // Fade in prompt
                this.interactionPromptAlpha = Math.min(1, this.interactionPromptAlpha + 0.05);
                this.showPrompt = true;
            } else {
                // Fade out prompt
                this.interactionPromptAlpha = Math.max(0, this.interactionPromptAlpha - 0.05);
                if (this.interactionPromptAlpha <= 0) {
                    this.showPrompt = false;
                }
            }
        } else {
            // No player reference, assume not nearby
            this.isPlayerNearby = false;
            this.showPrompt = false;
            this.interactionPromptAlpha = 0;
        }
    }
    
    /**
     * Update glow intensity based on animation time and player proximity
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateGlowEffect(deltaTime) {
        // IMPORTANT: The TV and Jukebox don't use deltaTime for their glow animation
        // This ensures consistent animation speed regardless of frame rate
        this.glowIntensity += this.glowDirection * this.glowSpeed;
        
        // Reverse direction when reaching min/max values
        if (this.glowIntensity > this.maxGlowIntensity) {
            this.glowIntensity = this.maxGlowIntensity;
            this.glowDirection = -1;
        } else if (this.glowIntensity < this.minGlowIntensity) {
            this.glowIntensity = this.minGlowIntensity;
            this.glowDirection = 1;
        }
        
        // Enhance glow when player is nearby
        this.proximityBoost = this.isPlayerNearby ? 1.5 : 1.0;
        
        // Debug logging more frequently during development
        if (Math.random() < 0.01) {
            console.log(`Trophy glow: intensity=${this.glowIntensity.toFixed(2)}, direction=${this.glowDirection}, proximityBoost=${this.proximityBoost}`);
        }
    }
    
    /**
     * Check for user interaction with the trophy
     */
    checkForInteraction() {
        // Only check for interaction if player is nearby and interaction is enabled
        if (this.isPlayerNearby && this.interactionEnabled) {
            // Use the enhanced input system with all possible Enter key detection methods
            const isEnterPressed = input.enterKeyPressed || 
                                  input.numpadEnterPressed || 
                                  input.keys['Enter'] || 
                                  input.keys['NumpadEnter'] || 
                                  input.isKeyPressed('Enter') || 
                                  input.isKeyPressed('NumpadEnter');
            
            // Specific Enter key press detection (not just held down)
            const isNewEnterPress = isEnterPressed && !this.wasEnterPressed;
            
            // Aggressive logging to debug the issue
            console.log(`Trophy interaction check:`, {
                isPlayerNearby: this.isPlayerNearby,
                isEnterPressed: isEnterPressed,
                wasEnterPressed: this.wasEnterPressed,
                isNewEnterPress: isNewEnterPress,
                enterFlag: input.enterKeyPressed,
                numpadEnterFlag: input.numpadEnterPressed,
                enterKey: input.keys['Enter'],
                numpadEnterKey: input.keys['NumpadEnter'],
                time: new Date().toISOString(),
                position: `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`
            });
            
            // Only detect a new press (not holding)
            if (isNewEnterPress) {
                console.log('TrophyEntity: NEW Enter key press detected, navigating to URL!');
                // Force this to run async to avoid any race conditions
                setTimeout(() => this.interact(), 50);
            }
            
            // Update previous state
            this.wasEnterPressed = isEnterPressed;
        }
    }
    
    /**
     * Handle trophy interaction (navigate to URL)
     */
    interact() {
        if (!this.interactionEnabled) return;
        
        console.log(`TrophyEntity: Navigating to ${this.targetUrl}`);
        
        // Create a transition effect before opening URL
        this.createTransitionEffect();
        
        // Open URL in a new tab
        window.open(this.targetUrl, '_blank');
    }
    
    /**
     * Create visual transition effect for interaction
     */
    createTransitionEffect() {
        // Flash the trophy with enhanced glow
        this.glowIntensity = 1.0;
        
        // Create a fullscreen flash effect
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = `rgba(255, 204, 0, 0)`;
        overlay.style.transition = 'background-color 0.5s ease-in-out';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'none';
        
        document.body.appendChild(overlay);
        
        // Trigger flash effect
        setTimeout(() => {
            overlay.style.backgroundColor = `rgba(255, 204, 0, 0.3)`;
            
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease-in-out';
                
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 300);
            }, 200);
        }, 50);
    }
    
    /**
     * Draw the trophy entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X position to draw at
     * @param {number} screenY - Screen Y position to draw at
     * @param {number} width - Width to draw
     * @param {number} height - Height to draw
     * @param {number} zOffset - Z-axis offset
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        // Calculate adjusted position with proper grounding
        const groundingFactor = 1.8; // Adjust to make trophy appear at right height
        const adjustedScreenY = screenY - height * (1 - groundingFactor);
        
        // Apply vertical offset based on z position
        const drawY = adjustedScreenY - (this.z * 2);
        
        // Debug log drawing occasionally
        if (Math.random() < 0.005) {
            console.log(`Trophy draw: screenX=${screenX}, screenY=${screenY}, glow=${this.glowIntensity.toFixed(2)}`);
            console.log(`Trophy image loaded: ${!!assetLoader.assets[this.trophyId]}`);
        }
        
        // Save the current context state
        ctx.save();
        
        // Check if trophy image is loaded
        if (assetLoader.assets[this.trophyId]) {
            // Calculate scale factor to fit in the desired width/height
            const img = assetLoader.assets[this.trophyId];
            const scale = Math.min(width * 3 / img.width, height * 3 / img.height);
            
            // Calculate centered position
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const drawX = screenX - drawWidth / 2;
            
            // Apply gold glow effect with shadow - DIRECTLY on the image like TV and jukebox
            if (this.glowIntensity > 0.1) {
                // Set to pure gold color (no transparency variation) like the TV/Jukebox do
                ctx.shadowColor = this.glowColor;
                // Apply proximity boost to make glow more intense when player is nearby
                const boostFactor = this.proximityBoost || 1.0;
                ctx.shadowBlur = (15 + (this.glowIntensity * 15)) * boostFactor;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            
            // Draw the trophy image WITH the shadow effect applied
            ctx.drawImage(img, drawX, drawY - drawHeight, drawWidth, drawHeight);
        } else {
            // Fallback rendering if image isn't loaded
            ctx.fillStyle = '#FFD700'; // Gold color
            
            // Draw a trophy-like shape
            const trophyWidth = width * 0.8;
            const trophyHeight = height * 1.5;
            const trophyX = screenX - trophyWidth / 2;
            const trophyY = drawY - trophyHeight;
            
            // Apply gold glow to the fallback trophy
            if (this.glowIntensity > 0.1) {
                ctx.shadowColor = this.glowColor;
                // Apply same proximity boost as with the image
                const boostFactor = this.proximityBoost || 1.0;
                ctx.shadowBlur = (15 + (this.glowIntensity * 15)) * boostFactor;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            
            // Draw base
            ctx.fillRect(trophyX - width * 0.2, trophyY + trophyHeight - height * 0.3, trophyWidth * 1.4, height * 0.3);
            
            // Draw stem
            ctx.fillRect(trophyX + trophyWidth * 0.3, trophyY + trophyHeight * 0.5, trophyWidth * 0.4, trophyHeight * 0.5);
            
            // Draw cup
            ctx.beginPath();
            ctx.moveTo(trophyX, trophyY + trophyHeight * 0.5);
            ctx.lineTo(trophyX, trophyY);
            ctx.lineTo(trophyX + trophyWidth, trophyY);
            ctx.lineTo(trophyX + trophyWidth, trophyY + trophyHeight * 0.5);
            ctx.lineTo(trophyX + trophyWidth * 0.8, trophyY + trophyHeight * 0.5);
            ctx.lineTo(trophyX + trophyWidth * 0.7, trophyY + trophyHeight * 0.3);
            ctx.lineTo(trophyX + trophyWidth * 0.3, trophyY + trophyHeight * 0.3);
            ctx.lineTo(trophyX + trophyWidth * 0.2, trophyY + trophyHeight * 0.5);
            ctx.closePath();
            ctx.fill();
        }
        
        // Reset shadow after drawing main trophy
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        
        // Draw interaction prompt if player is nearby
        if (this.showPrompt) {
            this.drawInteractionPrompt(ctx, screenX, drawY - height * 4);
        }
        
        // Draw debug info if enabled
        if (window.DEBUG_MODE) {
            this.drawDebugInfo(ctx, screenX, drawY, width, height);
        }
        
        // Restore the context state
        ctx.restore();
    }
    
    /**
     * Draw interaction prompt above the trophy
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position for the prompt
     * @param {number} y - Y position for the prompt
     */
    drawInteractionPrompt(ctx, x, y) {
        ctx.save();
        
        // Set up text style with larger font
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Enhanced glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255, 215, 0, ${this.interactionPromptAlpha})`;
        
        // Draw text with background for better visibility
        const text = 'Press ENTER to Visit Site';
        const textWidth = ctx.measureText(text).width;
        
        // Draw background
        ctx.fillStyle = `rgba(0, 0, 0, ${this.interactionPromptAlpha * 0.7})`;
        ctx.fillRect(x - textWidth/2 - 10, y - 30, textWidth + 20, 60);
        
        // Draw border
        ctx.strokeStyle = `rgba(255, 215, 0, ${this.interactionPromptAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - textWidth/2 - 10, y - 30, textWidth + 20, 60);
        
        // Draw text
        ctx.fillStyle = `rgba(255, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText(text, x, y - 10);
        
        // Draw key indicator
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = `rgba(255, 215, 0, ${this.interactionPromptAlpha})`;
        ctx.fillText('[ ENTER ]', x, y + 15);
        
        ctx.restore();
    }
    
    /**
     * Draw debug information
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Entity width
     * @param {number} height - Entity height
     */
    drawDebugInfo(ctx, x, y, width, height) {
        // Draw collision box
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            x - width / 2,
            y - height / 2,
            width,
            height
        );
        
        // Draw interaction radius
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, this.interactionDistance * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw trophy info
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Trophy(${this.x.toFixed(1)},${this.y.toFixed(1)})`, x, y - height / 2 - 10);
        
        // Draw interaction status
        const statusY = y + height / 2 + 15;
        ctx.fillStyle = this.isPlayerNearby ? 'lime' : 'red';
        ctx.fillText(this.isPlayerNearby ? 'IN RANGE' : 'OUT OF RANGE', x, statusY);
        
        // Draw glow status
        ctx.fillStyle = 'white';
        ctx.fillText(`Glow: ${this.glowIntensity.toFixed(2)}`, x, statusY + 15);
    }
    
    /**
     * Helper method to convert hex color to RGBA
     * @param {string} hex - Hex color string
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} - RGBA color string
     */
    hexToRgba(hex, alpha) {
        // Remove the hash if present
        hex = hex.replace(/^#/, '');
        
        // Parse the hex values
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        
        // Return rgba string
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
