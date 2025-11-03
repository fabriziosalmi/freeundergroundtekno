/**
 * RAVE FRAMEWORK - Component Manager
 * Manages all visual components and their lifecycle
 */

class ComponentManager {
    constructor(container) {
        this.container = container || document.body;
        this.components = new Map();
        this.componentTypes = new Map();
        this.updateOrder = [];
        this.nextId = 0;
        
        // Performance tracking
        this.stats = {
            componentCount: 0,
            updateTime: 0,
            renderTime: 0
        };
    }
    
    /**
     * Register a component type (class)
     */
    registerType(typeName, ComponentClass) {
        this.componentTypes.set(typeName, ComponentClass);
        console.log(`📦 Registered component type: ${typeName}`);
    }
    
    /**
     * Create and add a component
     */
    addComponent(typeName, config = {}) {
        const ComponentClass = this.componentTypes.get(typeName);
        
        if (!ComponentClass) {
            console.error(`❌ Component type not found: ${typeName}`);
            return null;
        }
        
        const id = config.id || `${typeName}_${this.nextId++}`;
        const component = new ComponentClass(id, config);
        
        // Initialize component
        if (component.init) {
            component.init(this.container);
        }
        
        this.components.set(id, component);
        this.updateOrder.push(id);
        this.stats.componentCount++;
        
        console.log(`✅ Added component: ${id} (${typeName})`);
        return component;
    }
    
    /**
     * Remove a component
     */
    removeComponent(id) {
        const component = this.components.get(id);
        
        if (!component) {
            console.warn(`⚠️ Component not found: ${id}`);
            return false;
        }
        
        // Cleanup
        if (component.destroy) {
            component.destroy();
        }
        
        this.components.delete(id);
        this.updateOrder = this.updateOrder.filter(cid => cid !== id);
        this.stats.componentCount--;
        
        console.log(`🗑️ Removed component: ${id}`);
        return true;
    }
    
    /**
     * Get component by ID
     */
    getComponent(id) {
        return this.components.get(id);
    }
    
    /**
     * Get all components of a type
     */
    getComponentsByType(typeName) {
        const results = [];
        this.components.forEach((component, id) => {
            if (component.type === typeName) {
                results.push(component);
            }
        });
        return results;
    }
    
    /**
     * Update all components
     */
    update(audioData, deltaTime) {
        const startTime = performance.now();
        
        this.updateOrder.forEach(id => {
            const component = this.components.get(id);
            if (component && component.enabled && component.update) {
                try {
                    component.update(audioData, deltaTime);
                } catch (error) {
                    console.error(`❌ Error updating component ${id}:`, error);
                }
            }
        });
        
        this.stats.updateTime = performance.now() - startTime;
    }
    
    /**
     * Render all components
     */
    render(audioData) {
        const startTime = performance.now();
        
        this.updateOrder.forEach(id => {
            const component = this.components.get(id);
            if (component && component.visible && component.render) {
                try {
                    component.render(audioData);
                } catch (error) {
                    console.error(`❌ Error rendering component ${id}:`, error);
                }
            }
        });
        
        this.stats.renderTime = performance.now() - startTime;
    }
    
    /**
     * Set component update order
     */
    setUpdateOrder(order) {
        // Validate that all IDs exist
        const valid = order.every(id => this.components.has(id));
        
        if (valid) {
            this.updateOrder = [...order];
            console.log('✅ Update order changed');
        } else {
            console.error('❌ Invalid update order: some component IDs not found');
        }
    }
    
    /**
     * Enable/disable component
     */
    setComponentEnabled(id, enabled) {
        const component = this.components.get(id);
        if (component) {
            component.enabled = enabled;
        }
    }
    
    /**
     * Show/hide component
     */
    setComponentVisible(id, visible) {
        const component = this.components.get(id);
        if (component) {
            component.visible = visible;
        }
    }
    
    /**
     * Clear all components
     */
    clear() {
        this.components.forEach((component, id) => {
            if (component.destroy) {
                component.destroy();
            }
        });
        
        this.components.clear();
        this.updateOrder = [];
        this.stats.componentCount = 0;
        
        console.log('🧹 All components cleared');
    }
    
    /**
     * Get performance stats
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Export current component configuration
     */
    exportConfig() {
        const config = {
            components: [],
            updateOrder: this.updateOrder
        };
        
        this.components.forEach((component, id) => {
            config.components.push({
                id: id,
                type: component.type,
                config: component.exportConfig ? component.exportConfig() : {}
            });
        });
        
        return config;
    }
    
    /**
     * Import component configuration
     */
    importConfig(config) {
        this.clear();
        
        // Add components
        config.components.forEach(componentData => {
            this.addComponent(componentData.type, {
                id: componentData.id,
                ...componentData.config
            });
        });
        
        // Set update order
        if (config.updateOrder) {
            this.setUpdateOrder(config.updateOrder);
        }
        
        console.log('📥 Configuration imported');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentManager;
}
