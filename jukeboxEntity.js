/**
 * Jukebox Entity for AI Alchemist's Lair
 * Handles loading and rendering of jukebox entities in the game world
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';
import { input } from './input.js';
import { getAssetPath } from './pathResolver.js';

class JukeboxEntity extends Entity {
    /**
     * Create a new jukebox entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position 
     * @param {number} width - Width in grid units
     * @param {number} height - Height in grid units
     * @param {string} jukeboxKey - Key for the jukebox asset in the asset loader
     */
    constructor(x, y, width = 1.5, height = 1.5, jukeboxKey = 'jukebox1') {
        super(x, y, width, height);
        
        console.log(`JukeboxEntity: Creating new jukebox at (${x}, ${y}) with key ${jukeboxKey}`);
        
        // Jukebox specific properties
        this.jukeboxKey = jukeboxKey;    // Key for the jukebox asset
        this.zHeight = 1.0;              // Taller height for jukebox
        this.z = 0;                      // Base z position (on the ground)
        this.jukeboxImage = null;        // Will hold the loaded image
        this.loadAttempts = 0;           // Track loading attempts
        this.maxLoadAttempts = 3;        // Maximum loading attempts
        
        // Ensure jukebox has no velocity - it's a static object
        this.velocityX = 0;
        this.velocityY = 0;
        this.isStatic = true;            // Make jukebox static so it doesn't move
        
        // Apply a +1 positional offset to fix grid alignment
        // This corrects the issue where the jukebox appears at grid (-1,-1) instead of (0,0)
        this.x += -1.5;
        this.y += -1.25;
        
        // Decorative glow effect state
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.glowSpeed = 0.02;
        
        // Interactive properties
        this.interactionDistance = 4;   // Distance within which player can interact with jukebox
        this.isPlayerNearby = false;      // Tracks if player is close enough to interact
        this.isActive = false;            // Tracks if music player is currently active
        this.wasEnterPressed = false;     // Tracks enter key state to detect press
        this.soundCloudPlayer = null;     // Will hold the soundcloud player element
        this.interactionPromptAlpha = 0;  // Transparency for interaction prompt
        
        // Add a direct Enter key event listener
        this.handleKeyDown = (event) => {
            if (event.key === 'Enter' && this.isPlayerNearby && !this.isActive) {
                console.log('JukeboxEntity: Direct Enter key event detected - toggling jukebox');
                this.toggleJukebox();
            }
        };
        
        // Register the event listener
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Debug console log about jukebox placement
        console.log(`JukeboxEntity: Final adjusted position: (${this.x}, ${this.y})`);
        
        // Check asset loader first
        const existingAsset = assetLoader.getAsset(jukeboxKey);
        if (existingAsset) {
            console.log(`JukeboxEntity: Found existing asset for ${jukeboxKey} in asset loader`);
            this.jukeboxImage = existingAsset;
        } else {
            console.log(`JukeboxEntity: No existing asset found for ${jukeboxKey}, will load directly`);
        }
        
        // Directly try to load the jukebox image
        this.directLoadJukeboxImage();
        
        // Initialize the SoundCloud iframe HTML
        this.soundCloudIframeHTML = `
            <iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay" 
                src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1886380535&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true">
            </iframe>
            <div style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space: nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;">
                <a href="https://soundcloud.com/vanitas_euphony" title="Vanitas" target="_blank" style="color: #cccccc; text-decoration: none;">Vanitas</a> · 
                <a href="https://soundcloud.com/vanitas_euphony/sets/vanitas-essential-tracks" title="Vanitas Essential Tracks" target="_blank" style="color: #cccccc; text-decoration: none;">Vanitas Essential Tracks</a>
            </div>
        `;
    }
    
    /**
     * Directly load the jukebox image without relying on asset loader
     */
    directLoadJukeboxImage() {
        if (this.jukeboxImage) {
            console.log(`JukeboxEntity: Jukebox image already loaded, skipping direct load`);
            return;
        }
        
        console.log(`JukeboxEntity: Directly loading jukebox image (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            console.log(`JukeboxEntity: Successfully loaded jukebox image directly (${img.width}x${img.height})`);
            this.jukeboxImage = img;
            
            // Also store in asset loader for other components
            assetLoader.assets[this.jukeboxKey] = img;
            console.log(`JukeboxEntity: Stored jukebox image in asset loader with key ${this.jukeboxKey}`);
        };
        
        img.onerror = (err) => {
            console.log(`JukeboxEntity: Failed to load jukebox image directly`, err);
            console.log(`JukeboxEntity: Failed path was: assets/decor/Jukebox_1.png`);
            
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`JukeboxEntity: Will try alternative path (attempt ${this.loadAttempts + 1})`);
                // Try again with a slightly different path
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                console.log(`JukeboxEntity: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        // Use exact path with proper path resolution for GitHub Pages compatibility
        const exactPath = 'assets/decor/Jukebox_1.png';
        const resolvedPath = getAssetPath(exactPath);
        console.log(`JukeboxEntity: Setting image src to resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try loading from alternative paths
     */
    tryAlternativePath() {
        console.log(`JukeboxEntity: Trying alternative path (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        const paths = [
            'assets/decor/Jukebox1.png',
            './assets/decor/Jukebox_1.png',
            './assets/decor/Jukebox1.png'
        ];
        
        const pathIndex = (this.loadAttempts - 1) % paths.length;
        const path = paths[pathIndex];
        
        console.log(`JukeboxEntity: Selected path ${pathIndex+1}/${paths.length}: ${path}`);
        
        const img = new Image();
        
        img.onload = () => {
            console.log(`JukeboxEntity: Successfully loaded jukebox from alternative path: ${path} (${img.width}x${img.height})`);
            this.jukeboxImage = img;
            assetLoader.assets[this.jukeboxKey] = img;
        };
        
        img.onerror = (err) => {
            console.log(`JukeboxEntity: Failed to load jukebox from alternative path: ${path}`, err);
            
            // Try next attempt if we haven't reached the maximum
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`JukeboxEntity: Will try next alternative path (attempt ${this.loadAttempts + 1})`);
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                console.log('JukeboxEntity: All jukebox loading attempts failed. Using fallback.');
                // Create a fallback canvas-based image
                this.createFallbackImage();
            }
        };
        
        // Resolve path for GitHub Pages compatibility
        const resolvedPath = getAssetPath(path);
        console.log(`JukeboxEntity: Setting alternative image src to resolved path: ${resolvedPath} (original: ${path})`);
        img.src = resolvedPath;
    }
    
    /**
     * Create a fallback canvas-based image for the jukebox
     */
    createFallbackImage() {
        console.log('JukeboxEntity: Creating fallback canvas image');
        
        // Create a canvas to generate an image
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw a medieval-cyberpunk style jukebox
        
        // Base of the jukebox (dark metal)
        ctx.fillStyle = '#232323';
        ctx.fillRect(24, 40, 80, 80);
        
        // Top rounded part
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.ellipse(64, 40, 40, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Screen area
        ctx.fillStyle = '#000';
        ctx.fillRect(34, 50, 60, 30);
        
        // Cyan screen glow
        ctx.fillStyle = '#00ffff';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(34, 50, 60, 30);
        ctx.globalAlpha = 1.0;
        
        // Control panel area
        ctx.fillStyle = '#444';
        ctx.fillRect(34, 90, 60, 20);
        
        // Cyan neon trim
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        
        // Outline the jukebox
        ctx.beginPath();
        ctx.moveTo(24, 40);
        ctx.lineTo(24, 120);
        ctx.lineTo(104, 120);
        ctx.lineTo(104, 40);
        ctx.stroke();
        
        // Top curve outline
        ctx.beginPath();
        ctx.ellipse(64, 40, 40, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Screen outline
        ctx.strokeRect(34, 50, 60, 30);
        
        // Control buttons
        ctx.shadowBlur = 5;
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#ffff00';
            ctx.beginPath();
            ctx.arc(44 + i * 15, 100, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // Sound wave icon on screen
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 65);
        ctx.quadraticCurveTo(50, 55, 60, 65);
        ctx.quadraticCurveTo(70, 75, 80, 65);
        ctx.stroke();
        
        // Convert the canvas to an image
        const image = new Image();
        image.src = canvas.toDataURL();
        
        console.log('JukeboxEntity: Fallback image created successfully');
        
        // Store the fallback image
        image.onload = () => {
            console.log(`JukeboxEntity: Fallback canvas image loaded with size ${image.width}x${image.height}`);
            this.jukeboxImage = image;
            assetLoader.assets[this.jukeboxKey] = image;
        };
    }
    
    /**
     * Update method for animation effects
     * @param {number} deltaTime - Time since last frame
     * @param {Object} player - Player entity for interaction checks
     */
    update(deltaTime, player) {
        // Skip physics update as jukebox is static
        if (this.isStatic) {
            // Don't update position or apply velocity
        } else {
            // Basic entity physics update (for non-static entities)
            // Implement basic movement for non-static entities
            this.x += this.velocityX * deltaTime;
            this.y += this.velocityY * deltaTime;
        }
        
        // Update glow effect animation
        this.glowIntensity += this.glowDirection * this.glowSpeed;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
        
        // Check for player proximity if player is provided
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Track previous state for transition
            const wasNearby = this.isPlayerNearby;
            
            // Update proximity state
            this.isPlayerNearby = distance <= this.interactionDistance;
            
            // Debug output only when state changes
            if (wasNearby !== this.isPlayerNearby) {
                console.log(`JukeboxEntity: Player proximity changed to ${this.isPlayerNearby ? 'NEARBY' : 'FAR'} (distance: ${distance.toFixed(2)})`);
            }
            
            // Handle interaction prompt fade
            if (this.isPlayerNearby) {
                // Only show prompt if jukebox is inactive
                if (!this.isActive) {
                    // Fade in prompt
                    this.interactionPromptAlpha = Math.min(1, this.interactionPromptAlpha + 0.05);
                } else {
                    // Keep prompt hidden while active
                    this.interactionPromptAlpha = 0;
                }
            } else {
                // Fade out prompt when player moves away
                this.interactionPromptAlpha = Math.max(0, this.interactionPromptAlpha - 0.05);
            }
            
            // Check for Enter key press - only toggle when player is nearby and Enter is newly pressed
            // We check Input.keys.Enter directly from the input system
            const isEnterPressed = window.input && window.input.keys && window.input.keys['Enter'];
            
            // Only detect a new press (not holding)
            if (isEnterPressed && !this.wasEnterPressed && this.isPlayerNearby && !this.isActive) {
                console.log('JukeboxEntity: Enter key newly pressed, toggling jukebox ON');
                this.toggleJukebox();
            } 
            // Handle closing with Enter if already active
            else if (isEnterPressed && !this.wasEnterPressed && this.isActive) {
                console.log('JukeboxEntity: Enter key newly pressed while active, toggling jukebox OFF');
                this.toggleJukebox();
            }
            
            // Update previous key state
            this.wasEnterPressed = isEnterPressed;
        }
    }
    
    /**
     * Toggle the jukebox player on/off
     */
    toggleJukebox() {
        this.isActive = !this.isActive;
        
        console.log(`JukeboxEntity: Toggling jukebox state to ${this.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        
        if (this.isActive) {
            this.showSoundCloudPlayer();
            
            // Temporarily disable the direct Enter key event listener while player is active
            // This prevents it from immediately closing due to key repeat
            document.removeEventListener('keydown', this.handleKeyDown);
            
            // Reset the wasEnterPressed state to prevent immediate toggling
            this.wasEnterPressed = true;
            
            // Add a slight delay before accepting new Enter key presses
            setTimeout(() => {
                this.wasEnterPressed = false;
            }, 500);
        } else {
            this.hideSoundCloudPlayer();
            
            // Re-enable the direct Enter key event listener after player is closed
            document.addEventListener('keydown', this.handleKeyDown);
            
            // Reset the wasEnterPressed state to prevent immediate toggling
            this.wasEnterPressed = true;
            
            // Add a slight delay before accepting new Enter key presses
            setTimeout(() => {
                this.wasEnterPressed = false;
            }, 500);
        }
    }
    
    /**
     * Create and show the SoundCloud player
     */
    showSoundCloudPlayer() {
        console.log('JukeboxEntity: Showing SoundCloud player');
        
        // Create container if it doesn't exist
        if (!this.soundCloudPlayer) {
            console.log('JukeboxEntity: Creating SoundCloud player container');
            
            // Create container for the SoundCloud player
            this.soundCloudPlayer = document.createElement('div');
            this.soundCloudPlayer.id = 'soundCloudPlayerModal';
            this.soundCloudPlayer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 800px;
                height: 400px;
                background-color: rgba(0, 0, 0, 0.9);
                border: 4px solid #ff00a5;
                box-shadow: 0 0 20px #ff00a5, inset 0 0 10px #ff00a5;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                opacity: 0;
                transition: opacity 0.3s ease;
                overflow: hidden;
                padding: 20px;
                color: white;
                font-family: monospace;
            `;
            
            // Create a header with title and close button
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #ff00a5;
            `;
            
            // Add title
            const title = document.createElement('h2');
            title.textContent = 'AI Alchemist\'s Jukebox';
            title.style.cssText = `
                margin: 0;
                color: #ff00a5;
                text-shadow: 0 0 5px #ff00a5;
            `;
            header.appendChild(title);
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.cssText = `
                background-color: transparent;
                border: 2px solid #ff00a5;
                color: #ff00a5;
                font-weight: bold;
                font-size: 18px;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                box-shadow: 0 0 10px rgba(255, 0, 165, 0.5);
            `;
            
            // Close button hover effect
            closeButton.onmouseover = () => {
                closeButton.style.backgroundColor = 'rgba(255, 0, 165, 0.2)';
            };
            closeButton.onmouseout = () => {
                closeButton.style.backgroundColor = 'transparent';
            };
            
            // Close button click handler with specific callback function to prevent issues
            this.closePlayerHandler = () => {
                console.log('JukeboxEntity: Close button clicked, toggling player off');
                this.toggleJukebox();
            };
            closeButton.addEventListener('click', this.closePlayerHandler);
            
            header.appendChild(closeButton);
            this.soundCloudPlayer.appendChild(header);
            
            // Create player container
            const playerContainer = document.createElement('div');
            playerContainer.style.cssText = `
                flex: 1;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            `;
            
            // Add SoundCloud iframe
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.frameBorder = 'no';
            iframe.allow = 'autoplay';
            iframe.src = 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1886380535&color=%23ff00a5&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true';
            playerContainer.appendChild(iframe);
            
            // Add attribution div
            const attribution = document.createElement('div');
            attribution.style.cssText = `
                font-size: 10px;
                color: #cccccc;
                line-break: anywhere;
                word-break: normal;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;
                font-weight: 100;
                margin-top: 5px;
                text-align: center;
            `;
            attribution.innerHTML = '<a href="https://soundcloud.com/vanitas_euphony" title="Vanitas" target="_blank" style="color: #cccccc; text-decoration: none;">Vanitas</a> · <a href="https://soundcloud.com/vanitas_euphony/sets/vanitas-essential-tracks" title="Vanitas Essential Tracks" target="_blank" style="color: #cccccc; text-decoration: none;">Vanitas Essential Tracks</a>';
            playerContainer.appendChild(attribution);
            
            // Add instruction text
            const instructions = document.createElement('p');
            instructions.textContent = 'Press ESC key or click X to close the player';
            instructions.style.cssText = `
                color: rgba(255, 0, 165, 0.8);
                margin-top: 15px;
                text-align: center;
                font-size: 12px;
            `;
            playerContainer.appendChild(instructions);
            
            this.soundCloudPlayer.appendChild(playerContainer);
            
            // Add to DOM
            document.body.appendChild(this.soundCloudPlayer);
            
            // Setup keydown event to close with Escape key
            this.keydownHandler = (event) => {
                if (event.key === 'Escape') {
                    this.toggleJukebox();
                }
            };
            document.addEventListener('keydown', this.keydownHandler);
            
            // Prevent clicks on the player from propagating to game canvas
            this.soundCloudPlayer.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            
            // Small delay to allow DOM to update before transitioning opacity
            setTimeout(() => {
                this.soundCloudPlayer.style.opacity = '1';
            }, 50);
        } else {
            // Just show existing player
            document.body.appendChild(this.soundCloudPlayer);
            
            // Setup keydown event to close with Escape key
            this.keydownHandler = (event) => {
                if (event.key === 'Escape') {
                    this.toggleJukebox();
                }
            };
            document.addEventListener('keydown', this.keydownHandler);
            
            // Small delay to allow DOM to update before transitioning opacity
            setTimeout(() => {
                this.soundCloudPlayer.style.opacity = '1';
            }, 50);
        }
    }
    
    /**
     * Hide the SoundCloud player
     */
    hideSoundCloudPlayer() {
        console.log('JukeboxEntity: Hiding SoundCloud player');
        
        if (this.soundCloudPlayer) {
            // Fade out
            this.soundCloudPlayer.style.opacity = '0';
            
            // Clean up event listeners explicitly
            if (this.keydownHandler) {
                document.removeEventListener('keydown', this.keydownHandler);
                this.keydownHandler = null;
            }
            
            // Remove after transition
            setTimeout(() => {
                // Remove from DOM but keep reference
                if (this.soundCloudPlayer && this.soundCloudPlayer.parentNode) {
                    this.soundCloudPlayer.parentNode.removeChild(this.soundCloudPlayer);
                    console.log('JukeboxEntity: Player element removed from DOM');
                }
            }, 300);
        }
    }
    
    /**
     * Clean up event listeners when entity is removed
     * This prevents memory leaks
     */
    cleanup() {
        console.log('JukeboxEntity: Cleaning up event listeners');
        // Remove the direct keydown event listener
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Hide and remove player if active
        if (this.isActive) {
            this.hideSoundCloudPlayer();
        }
    }
    
    /**
     * Draw the jukebox with appropriate glow effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {number} width - Render width
     * @param {number} height - Render height
     * @param {number} zOffset - Z offset for rendering height
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        console.log(`JukeboxEntity: Drawing jukebox at (${this.x}, ${this.y}) -> screen (${screenX}, ${screenY})`);
        
        try {
            // Get jukebox image - either from our direct loading or asset loader as fallback
            const jukeboxImage = this.jukeboxImage || assetLoader.getAsset(this.jukeboxKey);
            
            if (jukeboxImage) {
                console.log(`JukeboxEntity: Image found (${jukeboxImage.width}x${jukeboxImage.height}), drawing actual jukebox`);
                
                // Draw jukebox image
                const jukeboxWidth = width * 1.1;
                const jukeboxHeight = height * 1.8;
                
                // Position jukebox so it appears grounded at the correct isometric position
                // Subtract half the width to center horizontally
                const jukeboxX = screenX - jukeboxWidth / 2;
                
                // Key change: Properly use height and zOffset to position vertically
                // This ensures the jukebox is properly grounded on the isometric plane
                // Move the jukebox base to the ground level by adding a fixed offset
                // A lower multiplier means higher on the grid (0.2-0.3 is good for a "standing on the ground" effect)
                const groundingFactor = 0.3;
                const jukeboxY = screenY - (jukeboxHeight * groundingFactor);
                
                // Draw glow effect
                ctx.save();
                
                // Enhanced glow when player is nearby
                if (this.isPlayerNearby) {
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 25 * this.glowIntensity;
                } else {
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 15 * this.glowIntensity;
                }
                
                // Draw the jukebox
                ctx.drawImage(
                    jukeboxImage,
                    jukeboxX,
                    jukeboxY,
                    jukeboxWidth,
                    jukeboxHeight
                );
                
                ctx.restore();
                
                // Draw interaction prompt when player is nearby
                if (this.interactionPromptAlpha > 0) {
                    this.drawInteractionPrompt(ctx, screenX, screenY - jukeboxHeight * 0.8);
                }
                
                console.log(`JukeboxEntity: Jukebox image drawn successfully`);
            } else {
                console.log(`JukeboxEntity: No image available, drawing fallback`);
                
                // If no image is loaded yet, try loading again if we haven't exceeded attempts
                if (this.loadAttempts < this.maxLoadAttempts) {
                    console.log(`JukeboxEntity: Retrying image load, current attempts: ${this.loadAttempts}`);
                    this.directLoadJukeboxImage();
                } else {
                    console.log(`JukeboxEntity: Max load attempts (${this.maxLoadAttempts}) reached, using fallback only`);
                }
                
                // Draw fallback while loading or if loading failed
                this.drawFallbackJukebox(ctx, screenX, screenY, width, height, zOffset);
            }
        } catch (err) {
            console.error(`JukeboxEntity: Error drawing jukebox:`, err);
            this.drawFallbackJukebox(ctx, screenX, screenY, width, height, zOffset);
        }
    }
    
    /**
     * Draw interaction prompt above the jukebox
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
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        
        // Draw text with background for better visibility
        const text = 'Press ENTER to Play Music';
        const textWidth = ctx.measureText(text).width;
        
        // Draw background
        ctx.fillStyle = `rgba(0, 0, 0, ${this.interactionPromptAlpha * 0.7})`;
        ctx.fillRect(x - textWidth/2 - 10, y - 30, textWidth + 20, 60);
        
        // Draw border
        ctx.strokeStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - textWidth/2 - 10, y - 30, textWidth + 20, 60);
        
        // Draw text
        ctx.fillStyle = `rgba(255, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText(text, x, y - 10);
        
        // Draw key indicator
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText('[ ENTER ]', x, y + 15);
        
        ctx.restore();
    }
    
    /**
     * Draw a fallback jukebox when the image fails to load
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {number} width - Render width
     * @param {number} height - Render height
     * @param {number} zOffset - Z offset for rendering height
     */
    drawFallbackJukebox(ctx, screenX, screenY, width, height, zOffset) {
        console.log(`JukeboxEntity: Drawing fallback jukebox at (${screenX}, ${screenY})`);
        
        // Save context for transformations
        ctx.save();
        
        // Calculate dimensions for the jukebox
        const jukeboxWidth = width * 1.1;
        const jukeboxHeight = height * 1.8;
        
        // Position jukebox so it appears grounded at the correct isometric position
        // Subtract half the width to center horizontally
        const jukeboxX = screenX - jukeboxWidth / 2;
        
        // Apply same positioning as the main draw method for consistency
        const groundingFactor = 0.3;
        const jukeboxY = screenY - (jukeboxHeight * groundingFactor);
        
        // Add neon glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15 * this.glowIntensity;
        
        // Base of the jukebox (dark metal)
        ctx.fillStyle = '#232323';
        ctx.fillRect(jukeboxX, jukeboxY + jukeboxHeight * 0.3, jukeboxWidth, jukeboxHeight * 0.7);
        
        // Top rounded part
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.ellipse(
            jukeboxX + jukeboxWidth/2, 
            jukeboxY + jukeboxHeight * 0.3, 
            jukeboxWidth/2, 
            jukeboxHeight * 0.15, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Screen area
        ctx.fillStyle = '#000';
        ctx.fillRect(
            jukeboxX + jukeboxWidth * 0.15, 
            jukeboxY + jukeboxHeight * 0.35, 
            jukeboxWidth * 0.7, 
            jukeboxHeight * 0.3
        );
        
        // Cyan screen glow
        ctx.fillStyle = '#00ffff';
        ctx.globalAlpha = 0.3 * this.glowIntensity;
        ctx.fillRect(
            jukeboxX + jukeboxWidth * 0.15, 
            jukeboxY + jukeboxHeight * 0.35, 
            jukeboxWidth * 0.7, 
            jukeboxHeight * 0.3
        );
        ctx.globalAlpha = 1.0;
        
        // Control panel area
        ctx.fillStyle = '#444';
        ctx.fillRect(
            jukeboxX + jukeboxWidth * 0.15, 
            jukeboxY + jukeboxHeight * 0.75, 
            jukeboxWidth * 0.7, 
            jukeboxHeight * 0.15
        );
        
        // Cyan neon trim
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        
        // Outline the jukebox
        ctx.beginPath();
        ctx.moveTo(jukeboxX, jukeboxY + jukeboxHeight * 0.3);
        ctx.lineTo(jukeboxX, jukeboxY + jukeboxHeight);
        ctx.lineTo(jukeboxX + jukeboxWidth, jukeboxY + jukeboxHeight);
        ctx.lineTo(jukeboxX + jukeboxWidth, jukeboxY + jukeboxHeight * 0.3);
        ctx.stroke();
        
        // Top curve outline
        ctx.beginPath();
        ctx.ellipse(
            jukeboxX + jukeboxWidth/2, 
            jukeboxY + jukeboxHeight * 0.3, 
            jukeboxWidth/2, 
            jukeboxHeight * 0.15, 
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Screen outline
        ctx.strokeRect(
            jukeboxX + jukeboxWidth * 0.15, 
            jukeboxY + jukeboxHeight * 0.35, 
            jukeboxWidth * 0.7, 
            jukeboxHeight * 0.3
        );
        
        // Control buttons
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#ffff00';
            ctx.beginPath();
            ctx.arc(
                jukeboxX + jukeboxWidth * 0.25 + i * (jukeboxWidth * 0.15), 
                jukeboxY + jukeboxHeight * 0.82, 
                jukeboxWidth * 0.05, 
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
        }
        
        // Sound wave icon on screen
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(jukeboxX + jukeboxWidth * 0.2, jukeboxY + jukeboxHeight * 0.5);
        ctx.quadraticCurveTo(
            jukeboxX + jukeboxWidth * 0.35, 
            jukeboxY + jukeboxHeight * 0.4,
            jukeboxX + jukeboxWidth * 0.5, 
            jukeboxY + jukeboxHeight * 0.5
        );
        ctx.quadraticCurveTo(
            jukeboxX + jukeboxWidth * 0.65, 
            jukeboxY + jukeboxHeight * 0.6,
            jukeboxX + jukeboxWidth * 0.8, 
            jukeboxY + jukeboxHeight * 0.5
        );
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Restore context
        ctx.restore();
    }
}

export { JukeboxEntity };
