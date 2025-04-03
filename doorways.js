/**
 * Doorways Module
 * Handles rendering and interaction with doorways between rooms
 */

import { scenes } from './sceneData.js';
import { getSceneManager } from './sceneIntegration.js';
import { isometricRenderer } from './isometricRenderer.js';

class Doorway {
    /**
     * Constructor for a new Doorway
     * @param {string} direction - Direction of the doorway ('north', 'south', 'east', 'west')
     * @param {string} targetScene - ID of the scene this doorway leads to
     * @param {number} x - X position of the doorway in screen coordinates
     * @param {number} y - Y position of the doorway in screen coordinates
     */
    constructor(direction, targetScene, x, y) {
        this.direction = direction;
        this.targetScene = targetScene;
        this.x = x;
        this.y = y;
        this.isOpen = false;
        this.opened = false; // Track if the door has been opened
        this.closed = false; // Track if the door has been closed
        this.activationCooldown = 0;
        this.isWallDoorway = false; // Indicates if this is a wall doorway or a floor portal
        this.wallSide = null;       // 'north' or 'west'
        this.gridX = 0;             // Grid X position (used for wall doorways)
        this.gridY = 0;             // Grid Y position (used for wall doorways)
        this.showDebugInfo = true;  // Always show debug info for doorways
        
        // Entity properties for spatial grid registration
        this.entityType = 'door';   // Type for identification
        this.width = 64;            // Width in pixels
        this.height = 64;           // Height in pixels
        this.zHeight = 2.0;         // Height for Z-axis system (doors are full height)
        this.z = 0;                 // Base Z position
    }
    
    /**
     * Register this doorway in the spatial grid
     * @param {SpatialGrid} spatialGrid - The spatial grid to register in
     */
    registerInSpatialGrid(spatialGrid) {
        if (!spatialGrid) return;
        
        if (this.isWallDoorway) {
            // For wall doorways, use their grid position
            if (this.wallSide === 'north') {
                // Convert grid coordinates to world coordinates for spatial grid
                const worldX = this.gridX * spatialGrid.cellSize;
                const worldY = 0; // North wall is at y=0
                spatialGrid.addEntity(this, worldX, worldY);
                console.log(`Registered north door at grid (${this.gridX},${this.gridY}) in spatial grid at world (${worldX},${worldY})`);
            } else if (this.wallSide === 'west') {
                // Convert grid coordinates to world coordinates for spatial grid
                const worldX = 0; // West wall is at x=0
                const worldY = this.gridY * spatialGrid.cellSize;
                spatialGrid.addEntity(this, worldX, worldY);
                console.log(`Registered west door at grid (${this.gridX},${this.gridY}) in spatial grid at world (${worldX},${worldY})`);
            }
        } else {
            // For regular doorways/portals, use their screen position
            // Convert screen coordinates to world coordinates
            const worldX = this.x; 
            const worldY = this.y;
            spatialGrid.addEntity(this, worldX, worldY);
            console.log(`Registered portal doorway in spatial grid at (${worldX},${worldY})`);
        }
    }
    
    setAppearance() {
        // Set color based on direction
        switch(this.direction) {
            case 'north':
                this.color = '#00ffcc';
                this.icon = '↑';
                break;
            case 'south':
                this.color = '#00ccff';
                this.icon = '↓';
                break;
            case 'east':
                this.color = '#ff00cc';
                this.icon = '→';
                break;
            case 'west':
                this.color = '#ffcc00';
                this.icon = '←';
                break;
            default:
                this.color = '#ffffff';
                this.icon = '⊕';
                break;
        }
    }
    
    /**
     * Update doorway animation
     * @param {number} deltaTime - Time elapsed since last update
     * @param {boolean} isPlayerNear - Whether player is near the doorway
     */
    update(deltaTime, isPlayerNear) {
        // Update pulse animation
        this.pulseTime += deltaTime;
        
        // Open/close door based on player proximity (only for wall doorways)
        if (this.isWallDoorway) {
            // Door state transition - with immediate response for better gameplay feel
            if (isPlayerNear && !this.isOpen) {
                // Open door immediately when player approaches
                this.isOpen = true;
                
                // Reset any pending close timer
                if (this.closeTimeout) {
                    clearTimeout(this.closeTimeout);
                    this.closeTimeout = null;
                }
                
                // Add an opening sound effect here if desired
                // this.playDoorSound('open');
            } else if (!isPlayerNear && this.isOpen) {
                // Close the door with a slight delay for smoother gameplay
                if (!this.closeTimeout) {
                    this.closeTimeout = setTimeout(() => {
                        this.isOpen = false;
                        this.closeTimeout = null;
                        
                        // Add a closing sound effect here if desired
                        // this.playDoorSound('close');
                    }, 800); // 800ms delay for door closing
                }
            }
        }
    }
    
    render(ctx, camera) {
        // Skip doorway rendering if it's a wall doorway (handled by isometric renderer)
        if (this.isWallDoorway) {
            return;
        }
        
        // Convert grid coordinates to screen coordinates
        const screenX = (this.x - camera.x) * camera.zoom + ctx.canvas.width / 2;
        const screenY = (this.y - camera.y) * camera.zoom + ctx.canvas.height / 2;
        
        // Calculate pulse intensity (0.5 to 1.0)
        const pulse = 0.5 + (Math.sin(this.pulseTime * 3) + 1) / 4;
        
        // Get canvas dimensions
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Draw doorway
        ctx.save();
        
        // Draw glow (larger radius for visibility)
        const glowRadius = this.glowRadius + 10 * pulse;
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, glowRadius
        );
        gradient.addColorStop(0, this.color + 'CC'); // More opaque in center 
        gradient.addColorStop(1, this.color + '00'); // Transparent at edge
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw portal frame (rounded rectangle)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 + 2 * pulse;
        ctx.globalAlpha = 0.8 + 0.2 * pulse;
        
        // Draw rounded rectangle frame
        this.roundRect(
            ctx, 
            screenX - this.width/2, 
            screenY - this.height, 
            this.width, 
            this.height, 
            10
        );
        ctx.stroke();
        
        // Draw direction icon (larger for visibility)
        ctx.fillStyle = this.color;
        ctx.font = 'bold 26px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8 + 0.2 * pulse;
        ctx.fillText(this.icon, screenX, screenY - this.height/2);
        
        // Draw target room name
        ctx.font = '14px Arial';
        ctx.fillText(this.targetScene, screenX, screenY - this.height/2 + 25);
        
        ctx.restore();
    }
    
    // Helper method to draw rounded rectangles
    roundRect(ctx, x, y, width, height, radius) {
        if (width < 2 * radius) radius = width/2;
        if (height < 2 * radius) radius = height/2;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    }
    
    // Check if player is colliding with this doorway
    isPlayerColliding(playerX, playerY, cellWidth, cellHeight) {
        // Simple, direct distance-based check using grid coordinates
        const dx = Math.abs(this.gridX - playerX);
        const dy = Math.abs(this.gridY - playerY);
        const distance = Math.sqrt(dx*dx + dy*dy);
        const proximityThreshold = 3.0; // Generous radius in grid units
        
        // For edge doorways, add additional constraints
        if (this.isWallDoorway) {
            if (this.wallSide === 'north' && playerY > 5) return false;
            if (this.wallSide === 'west' && playerX > 5) return false;
        }
        
        return distance < proximityThreshold;
    }
}

class DoorwayManager {
    constructor() {
        this.doorwaysByScene = {};
        this.activeDoorways = [];
        this.transitionCooldown = 0;
        this.debug = true;
        
        this.initDoorways();
    }
    
    /**
     * Initialize doorways from scene data
     */
    initDoorways() {
        // Get the spatial grid for registration
        const sceneManager = getSceneManager();
        const spatialGrid = sceneManager.currentScene?.spatialGrid;
        
        // Loop through all scenes
        Object.keys(scenes).forEach(sceneName => {
            const scene = scenes[sceneName];
            
            // Create doorways array for this scene
            this.doorwaysByScene[sceneName] = [];
            
            // Process specific scene exits from scene data
            if (scene.exits && Array.isArray(scene.exits)) {
                scene.exits.forEach(exit => {
                    const direction = exit.direction;
                    const targetScene = exit.to;
                    const position = exit.position || {};
                    const gridX = exit.gridX !== undefined ? exit.gridX : (position.x / scene.width * 16);
                    const gridY = exit.gridY !== undefined ? exit.gridY : (position.y / scene.height * 16);
                    
                    // Create a doorway for this exit
                    const doorway = new Doorway(
                        direction, 
                        targetScene, 
                        position.x || 0, 
                        position.y || 0
                    );
                    
                    // Set grid coordinates for this doorway
                    doorway.gridX = gridX;
                    doorway.gridY = gridY;
                    
                    // Configure as a wall doorway if it's on the edge of the grid
                    if (direction === 'north' || direction === 'south' || direction === 'east' || direction === 'west') {
                        doorway.isWallDoorway = true;
                        
                        // Set wall side based on direction
                        if (direction === 'north' || direction === 'south') {
                            doorway.wallSide = 'north';
                        } else if (direction === 'east' || direction === 'west') {
                            doorway.wallSide = 'west';
                        }
                    }
                    
                    // Special case for startRoom east door to match (0.0, 5.3)
                    if (sceneName === 'startRoom' && direction === 'east') {
                        doorway.wallSide = 'west';
                        doorway.gridX = 0;
                        doorway.gridY = 5.3; // Position at (0.0, 5.3) as desired
                        console.log(`Special positioning for startRoom east door: (${doorway.gridX}, ${doorway.gridY})`);
                    }
                    
                    // Special case for neonPhylactery west door - ensure it's properly positioned at (14.0, 6.3)
                    if (sceneName === 'neonPhylactery' && direction === 'west') {
                        doorway.wallSide = 'west';
                        doorway.gridX = 14.0;
                        doorway.gridY = 6.3;
                        console.log(`Special positioning for neonPhylactery west door: (${doorway.gridX}, ${doorway.gridY})`);
                    }
                    
                    // Add this doorway to the scene
                    this.doorwaysByScene[sceneName].push(doorway);
                    
                    // Register this doorway in the spatial grid
                    if (spatialGrid) {
                        doorway.registerInSpatialGrid(spatialGrid);
                    }
                });
            }
            
            if (this.debug) {
                console.log('Doorways initialized:', this.doorwaysByScene);
            }
        });
    }
    
    /**
     * Process and apply doorway to the scene
     * @param {string} sceneName - Scene name
     * @param {object} doorway - Doorway object
     */
    processDoorway(sceneName, doorway) {
        // Ensure doorways collection for this scene exists
        if (!this.doorwaysByScene[sceneName]) {
            this.doorwaysByScene[sceneName] = [];
        }
        
        // Set the ID if not provided
        if (!doorway.id) {
            doorway.id = `doorway_${sceneName}_${this.doorwaysByScene[sceneName].length}`;
        }
        
        // Extract direction, target scene, visibility settings
        const { direction, to, isVisible = true, isWallDoorway = false } = doorway;
        
        // Store the target scene name for rendering labels
        doorway.targetScene = to;
        
        // Log the doorway for debugging
        console.log(`Processing doorway: ${JSON.stringify(doorway)}`);
        
        // Add doorway
        this.doorwaysByScene[sceneName].push(doorway);
    }
    
    /**
     * Get active doorways for a specific scene
     * @param {string} sceneId - Scene ID to get doorways for
     * @returns {Array} Array of doorway objects for the scene
     */
    getActiveDoorsForScene(sceneId) {
        if (!sceneId) return [];
        
        // Return doorways for the specified scene or an empty array if none
        return this.doorwaysByScene[sceneId] || [];
    }
    
    update(deltaTime, playerX, playerY, scene) {
        // Decrease cooldown
        if (this.transitionCooldown > 0) {
            this.transitionCooldown -= deltaTime;
        }
        
        // Get current scene
        const sceneManager = getSceneManager();
        const currentScene = sceneManager.getCurrentScene();
        
        if (!currentScene) return;
        
        // Get doorways for current scene
        this.activeDoorways = this.doorwaysByScene[currentScene.id] || [];
        
        // DEBUG: Show player position clearly in relation to doors
        console.log(`Player position: (${playerX.toFixed(2)}, ${playerY.toFixed(2)})`);
        
        // Update doorways and check collisions
        this.activeDoorways.forEach(doorway => {
            // Check if player is near the door using the updated isPlayerColliding method
            const isPlayerNear = doorway.isPlayerColliding(playerX, playerY, scene.cellWidth, scene.cellHeight);
            
            // DEBUG: Always log door states
            if (doorway.isWallDoorway) {
                console.log(`Door ${doorway.wallSide} at pos ${doorway.wallSide === 'north' ? doorway.gridX : doorway.gridY}: ` + 
                           `${isPlayerNear ? 'PLAYER NEAR' : 'player far'}, ` +
                           `current state: ${doorway.isOpen ? 'OPEN' : 'CLOSED'}`);
            }
            
            // Update the doorway with the calculated proximity
            doorway.update(deltaTime, isPlayerNear);
            
            // Only check for scene transitions with non-wall doorways (portals)
            if (this.transitionCooldown <= 0 && isPlayerNear && !doorway.isWallDoorway) {
                if (this.debug) {
                    console.log(`Player collided with doorway to ${doorway.targetScene}`);
                }
                
                // Load target scene
                sceneManager.loadScene(doorway.targetScene);
                
                // Set cooldown to prevent rapid transitions
                this.transitionCooldown = 0.5; // Seconds
            }
        });
    }
    
    /**
     * Render all doorways for a specific scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context 
     * @param {Camera} camera - Camera to render through
     * @param {Object} scene - The current scene
     */
    render(ctx, camera, scene) {
        // Get doorways for current scene
        const currentScene = getSceneManager().getCurrentScene();
        if (!currentScene) return;
        
        const doorways = this.doorwaysByScene[currentScene.id] || [];
        const sceneName = currentScene.id;
        
        // Render each doorway
        doorways.forEach(doorway => {
            doorway.render(ctx, camera);
            
            // Always add door labels in startRoom regardless of door type
            if (sceneName === 'startRoom') {
                // Calculate screen position
                const screenX = doorway.screenX;
                const screenY = doorway.screenY;
                
                if (!isNaN(screenX) && !isNaN(screenY)) {
                    this.renderDoorLabel(ctx, screenX, screenY, doorway, sceneName);
                }
            }
        });
    }
    
    /**
     * Render a wall door at the given position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {string} wallSide - Side of the wall (north, east, south, west)
     * @param {number} position - Position along the wall
     * @param {object} sceneData - Current scene data
     */
    renderWallDoor(ctx, wallSide, position, sceneData) {
        // Make sure we have doors data
        if (!this.doors || !this.doors.length) return;
        
        // Find all doors that match this wall and position
        const matchingDoors = this.doors.filter(door => 
            door.isWallDoorway && 
            door.wallSide === wallSide && 
            (wallSide === 'north' ? door.gridX === position : door.gridY === position)
        );
        
        if (!matchingDoors.length) return;
        
        // Calculate the screen position based on the isometric grid
        const currentSceneId = window.location.hash.substring(1) || game?.currentScene || 'startRoom';
        
        // Render each door at this position
        matchingDoors.forEach(door => {
            const originX = door.screenX;
            const originY = door.screenY;
            
            // Render the door
            this.renderDoorAtPosition(ctx, originX, originY, door, currentSceneId);
            
            // Add cyberpunk-style room name label above the door
            this.renderDoorLabel(ctx, originX, originY, door, currentSceneId);
        });
    }
    
    /**
     * Render a door at a specific screen position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context 
     * @param {number} x - X position on screen
     * @param {number} y - Y position on screen
     * @param {object} door - Door object data
     * @param {string} currentSceneId - Current scene ID
     */
    renderDoorAtPosition(ctx, x, y, door, currentSceneId) {
        // Safety check
        if (!door || !ctx) return;
        
        // Get direction based on wall side
        let direction = 'N'; // Default
        
        switch (door.wallSide) {
            case 'north': direction = 'S'; break;
            case 'east': direction = 'W'; break;
            case 'south': direction = 'N'; break;
            case 'west': direction = 'E'; break;
        }
        
        // Combine for style - e.g., 'NE', 'SW', etc.
        // Special case - if in neonPhylactery and on SE wall, use NW style
        // if in neonPhylactery and on SW wall, use NE style
        let style = '';
        
        if (currentSceneId === 'neonPhylactery') {
            if (door.gridX === 14.0 && Math.abs(door.gridY - 5.5) < 0.1) {
                style = 'NW'; // Override for SE wall in neonPhylactery
            } else if (Math.abs(door.gridX - 7.5) < 0.1 && door.gridY === 14.0) {
                style = 'NE'; // Override for SW wall in neonPhylactery
            } else {
                style = direction;
            }
        } else {
            style = direction;
        }
        
        // Render the doorway
        isometricRenderer.renderDoorway(
            ctx, 
            x, 
            y, 
            64, // width
            32, // height
            style,
            door.isOpen,
            door.doubleHeight || false
        );
    }
    
    /**
     * Render cyberpunk-style label above the door
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position on screen
     * @param {number} y - Y position on screen
     * @param {object} door - Door object data
     * @param {string} currentSceneId - Current scene ID
     */
    renderDoorLabel(ctx, x, y, door, currentSceneId) {
        // Get destination room name
        let destinationId = door.to || door.targetScene;
        
        // Log the door info to help with debugging
        console.log('Rendering door label for door:', door);
        
        // Skip if we don't have a valid destination
        if (!destinationId) {
            console.warn('Door missing destination ID:', door);
            return;
        }
        
        let labelText = '';
        let glowColor = '';
        
        // Map scene IDs to display names and assign glow colors
        switch (destinationId) {
            case 'startRoom':
                labelText = 'NEXUS CORE';
                glowColor = '#ffd700'; // Gold glow for start room
                break;
            case 'neonPhylactery':
                labelText = 'NEON PHYLACTERY';
                glowColor = '#00ffff'; // Cyan glow
                break;
            case 'circuitSanctum':
                labelText = 'CIRCUIT SANCTUM';
                glowColor = '#ff00ff'; // Magenta glow
                break;
            default:
                labelText = destinationId.toUpperCase();
                glowColor = '#00ffff'; // Default cyan glow
                break;
        }
        
        // Only proceed if we have a label
        if (!labelText) return;
        
        // Save context
        ctx.save();
        
        // Position label above the door
        const labelX = x;
        const labelY = y - 50; // Position above the door
        
        // Text style - cyberpunk/synthwave aesthetic
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Multi-layer glow effect for cyberpunk appearance
        // Outer glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#000000';
        ctx.fillText(labelText, labelX, labelY + 1);
        
        // Inner glow
        ctx.shadowBlur = 5;
        ctx.fillStyle = glowColor;
        ctx.fillText(labelText, labelX, labelY);
        
        // Core text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, labelX, labelY);
        
        console.log(`Drew "${labelText}" label at ${labelX},${labelY}`);
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Force a specific door to open
     * This is a debugging helper to verify door rendering works properly
     * @param {string} sceneId - Scene ID
     * @param {string} wallSide - Wall side ('north' or 'west')
     * @param {number} doorPosition - Door position on that wall
     * @param {boolean} open - Whether to open or close the door
     */
    forceDoorState(sceneId, wallSide, doorPosition, open) {
        const doorways = this.doorwaysByScene[sceneId] || [];
        
        // Find the matching door
        doorways.forEach(doorway => {
            if (doorway.isWallDoorway && doorway.wallSide === wallSide) {
                // For north walls, match on gridX
                if (wallSide === 'north' && doorway.gridX === doorPosition) {
                    doorway.isOpen = open;
                    console.log(`DEBUG: Forced ${sceneId} north door at position ${doorPosition} ${open ? 'OPEN' : 'CLOSED'}`);
                }
                // For west walls, match on gridY
                else if (wallSide === 'west' && doorway.gridY === doorPosition) {
                    doorway.isOpen = open;
                    console.log(`DEBUG: Forced ${sceneId} west door at position ${doorPosition} ${open ? 'OPEN' : 'CLOSED'}`);
                }
            }
        });
    }
}

// Create singleton instance
const doorwayManager = new DoorwayManager();

// Export both the instance and the class
export default doorwayManager;
export { DoorwayManager };
