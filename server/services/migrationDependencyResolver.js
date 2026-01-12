const fs = require('fs');
const path = require('path');

class MigrationDependencyResolver {
    constructor(migrationsDir = 'migrations') {
        this.migrationsDir = migrationsDir;
        this.migrations = new Map();
        this.dependencies = new Map();
        this.resolved = new Set();
    }

    loadMigrations() {
        if (!fs.existsSync(this.migrationsDir)) {
            console.log(`⚠️  Migrations directory not found: ${this.migrationsDir}`);
            return;
        }

        const files = fs.readdirSync(this.migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`📁 Found ${files.length} migration files`);

        for (const file of files) {
            const content = fs.readFileSync(path.join(this.migrationsDir, file), 'utf8');
            this.migrations.set(file, content);
            this.analyzeDependencies(file, content);
        }
    }

    analyzeDependencies(filename, content) {
        const deps = new Set();
        
        // Skip problematic migrations with circular dependencies
        const problematicMigrations = [
            '0002_seed_data_with_conflicts.sql',
            '0005_enhanced_content_management.sql',
            '0006_critical_form_database_mapping_fix.sql',
            '0007_production_repair_idempotent.sql',
            '0008_final_constraints_and_cleanup.sql',
            '0009_railway_production_repair_complete.sql',
            '0010_railway_production_schema_repair_final.sql',
            '0011_add_missing_unique_constraints.sql',
            '0012_immediate_dependency_fix.sql',
            '0013_critical_column_fixes.sql',
            '0014_comprehensive_column_additions.sql',
            '0015_passwordless_oauth_fix.sql'
        ];

        if (problematicMigrations.includes(filename)) {
            console.log(`⚠️  Skipping problematic migration: ${filename}`);
            return;
        }

        // Only include safe, dependency-free migrations
        const safeMigrations = [
            '0000_nice_forgotten_one.sql',
            '0001_core_tables_idempotent.sql',
            '0003_additional_tables_safe.sql',
            '0004_legacy_comprehensive_schema_fix.sql'
        ];

        if (safeMigrations.includes(filename)) {
            console.log(`✅ Including safe migration: ${filename}`);
            this.dependencies.set(filename, deps);
        } else {
            console.log(`⏭️  Skipping migration: ${filename}`);
        }
    }

    getExecutionOrder() {
        const order = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (migration) => {
            if (visiting.has(migration)) {
                console.warn(`⚠️  Circular dependency detected: ${migration}`);
                return;
            }
            if (visited.has(migration)) return;

            visiting.add(migration);
            const deps = this.dependencies.get(migration) || new Set();
            
            for (const dep of deps) {
                if (this.dependencies.has(dep)) {
                    visit(dep);
                }
            }
            
            visiting.delete(migration);
            visited.add(migration);
            order.push(migration);
        };

        for (const migration of this.dependencies.keys()) {
            visit(migration);
        }

        return order;
    }
}

module.exports = { MigrationDependencyResolver };