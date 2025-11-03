/**
 * RAVE FRAMEWORK - Layer Manager
 * Organize components in layers/groups with z-index control
 */

class LayerManager {
    constructor() {
        this.layers = new Map();
        this.layerOrder = [];
        this.nextLayerId = 0;
    }
    
    /**
     * Create a new layer
     */
    createLayer(name, config = {}) {
        const id = config.id || `layer_${this.nextLayerId++}`;
        
        const layer = {
            id: id,
            name: name || id,
            zIndex: config.zIndex || this.layerOrder.length,
            visible: config.visible !== undefined ? config.visible : true,
            locked: config.locked || false,
            opacity: config.opacity !== undefined ? config.opacity : 1,
            components: [],
            blendMode: config.blendMode || 'normal',
            color: config.color || '#ffffff'
        };
        
        this.layers.set(id, layer);
        this.layerOrder.push(id);
        this._updateZIndices();
        
        console.log(`📂 Layer created: ${name} (${id})`);
        return id;
    }
    
    /**
     * Delete a layer
     */
    deleteLayer(layerId) {
        if (!this.layers.has(layerId)) return false;
        
        const layer = this.layers.get(layerId);
        
        // Remove all components from this layer
        layer.components.forEach(componentId => {
            const element = document.getElementById(componentId);
            if (element) {
                element.style.zIndex = '';
            }
        });
        
        this.layers.delete(layerId);
        this.layerOrder = this.layerOrder.filter(id => id !== layerId);
        this._updateZIndices();
        
        console.log(`🗑️ Layer deleted: ${layerId}`);
        return true;
    }
    
    /**
     * Add component to layer
     */
    addComponentToLayer(componentId, layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) {
            console.error(`Layer not found: ${layerId}`);
            return false;
        }
        
        if (!layer.components.includes(componentId)) {
            layer.components.push(componentId);
            this._updateComponentStyle(componentId, layer);
            console.log(`✅ Component ${componentId} added to layer ${layerId}`);
        }
        
        return true;
    }
    
    /**
     * Remove component from layer
     */
    removeComponentFromLayer(componentId, layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;
        
        layer.components = layer.components.filter(id => id !== componentId);
        
        const element = document.getElementById(componentId);
        if (element) {
            element.style.zIndex = '';
            element.style.opacity = '';
        }
        
        return true;
    }
    
    /**
     * Move layer in z-order
     */
    moveLayer(layerId, newIndex) {
        const currentIndex = this.layerOrder.indexOf(layerId);
        if (currentIndex === -1) return false;
        
        this.layerOrder.splice(currentIndex, 1);
        this.layerOrder.splice(newIndex, 0, layerId);
        this._updateZIndices();
        
        console.log(`↕️ Layer ${layerId} moved to index ${newIndex}`);
        return true;
    }
    
    /**
     * Set layer visibility
     */
    setLayerVisible(layerId, visible) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;
        
        layer.visible = visible;
        layer.components.forEach(componentId => {
            const element = document.getElementById(componentId);
            if (element) {
                element.style.display = visible ? '' : 'none';
            }
        });
        
        console.log(`👁️ Layer ${layerId} visibility: ${visible}`);
        return true;
    }
    
    /**
     * Set layer locked state
     */
    setLayerLocked(layerId, locked) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;
        
        layer.locked = locked;
        layer.components.forEach(componentId => {
            const element = document.getElementById(componentId);
            if (element) {
                element.style.pointerEvents = locked ? 'none' : '';
            }
        });
        
        console.log(`🔒 Layer ${layerId} locked: ${locked}`);
        return true;
    }
    
    /**
     * Set layer opacity
     */
    setLayerOpacity(layerId, opacity) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;
        
        layer.opacity = Math.max(0, Math.min(1, opacity));
        layer.components.forEach(componentId => {
            this._updateComponentStyle(componentId, layer);
        });
        
        return true;
    }
    
    /**
     * Get layer by ID
     */
    getLayer(layerId) {
        return this.layers.get(layerId);
    }
    
    /**
     * Get all layers
     */
    getAllLayers() {
        return this.layerOrder.map(id => this.layers.get(id));
    }
    
    /**
     * Get component's layer
     */
    getComponentLayer(componentId) {
        for (const [layerId, layer] of this.layers) {
            if (layer.components.includes(componentId)) {
                return layerId;
            }
        }
        return null;
    }
    
    /**
     * Update z-indices for all layers
     */
    _updateZIndices() {
        this.layerOrder.forEach((layerId, index) => {
            const layer = this.layers.get(layerId);
            layer.zIndex = index * 100;
            
            layer.components.forEach(componentId => {
                this._updateComponentStyle(componentId, layer);
            });
        });
    }
    
    /**
     * Update component style based on layer
     */
    _updateComponentStyle(componentId, layer) {
        const element = document.getElementById(componentId);
        if (!element) return;
        
        element.style.zIndex = layer.zIndex;
        element.style.opacity = layer.opacity;
        element.style.display = layer.visible ? '' : 'none';
        element.style.pointerEvents = layer.locked ? 'none' : '';
        element.style.mixBlendMode = layer.blendMode;
    }
    
    /**
     * Export layer configuration
     */
    exportConfig() {
        return {
            layers: Array.from(this.layers.values()).map(layer => ({
                id: layer.id,
                name: layer.name,
                zIndex: layer.zIndex,
                visible: layer.visible,
                locked: layer.locked,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                color: layer.color,
                components: [...layer.components]
            })),
            layerOrder: [...this.layerOrder]
        };
    }
    
    /**
     * Import layer configuration
     */
    importConfig(config) {
        this.layers.clear();
        this.layerOrder = [];
        
        config.layers.forEach(layerData => {
            const layer = { ...layerData };
            this.layers.set(layer.id, layer);
        });
        
        this.layerOrder = [...config.layerOrder];
        this._updateZIndices();
        
        console.log('📥 Layer configuration imported');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayerManager;
}
