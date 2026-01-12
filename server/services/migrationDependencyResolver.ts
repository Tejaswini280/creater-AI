/**
 * Migration Dependency Resolver
 * 
 * Analyzes SQL migration files to identify dependencies and determine safe execution order.
 * This prevents circular dependency issues like the "column project_id does not exist" error.
 */

export interface MigrationFile {
  filename: string;
  filepath: string;
  content: string;
  checksum: string;
  dependencies: string[];
  creates: string[];
  references: string[];
  order: number;
}

export interface DependencyGraph {
  nodes: Map<string, MigrationFile>;
  edges: Map<string, Set<string>>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  circularDependencies: string[][];
}

export class MigrationDependencyResolver {
  private sqlParser: SQLParser;

  constructor() {
    this.sqlParser = new SQLParser();
  }

  /**
   * Analyzes migration files to build a dependency graph
   */
  analyzeMigrations(migrationFiles: MigrationFile[]): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: new Map()
    };

    // First pass: analyze each migration file
    for (const migration of migrationFiles) {
      const analysis = this.sqlParser.analyzeMigration(migration.content);
      
      migration.creates = analysis.creates;
      migration.references = analysis.references;
      migration.dependencies = this.calculateDependencies(migration, migrationFiles);
      
      graph.nodes.set(migration.filename, migration);
      graph.edges.set(migration.filename, new Set(migration.dependencies));
    }

    return graph;
  }

  /**
   * Resolves dependencies and returns migrations in safe execution order
   */
  resolveDependencies(graph: DependencyGraph): MigrationFile[] {
    const resolved: MigrationFile[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (filename: string): void => {
      if (visited.has(filename)) return;
      if (visiting.has(filename)) {
        throw new Error(`Circular dependency detected involving: ${filename}`);
      }

      visiting.add(filename);
      
      const dependencies = graph.edges.get(filename) || new Set();
      for (const dep of Array.from(dependencies)) {
        visit(dep);
      }
      
      visiting.delete(filename);
      visited.add(filename);
      
      const migration = graph.nodes.get(filename);
      if (migration) {
        migration.order = resolved.length;
        resolved.push(migration);
      }
    };

    // Visit all nodes
    for (const filename of Array.from(graph.nodes.keys())) {
      visit(filename);
    }

    return resolved;
  }

  /**
   * Validates the dependency graph for issues
   */
  validateDependencies(migrations: MigrationFile[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      circularDependencies: []
    };

    try {
      const graph = this.analyzeMigrations(migrations);
      this.resolveDependencies(graph);
    } catch (error) {
      result.isValid = false;
      if (error instanceof Error) {
        result.errors.push(error.message);
        
        // Check for circular dependencies
        if (error.message.includes('Circular dependency')) {
          result.circularDependencies.push([error.message]);
        }
      }
    }

    // Additional validations
    this.validateColumnReferences(migrations, result);
    this.validateTableCreationOrder(migrations, result);

    return result;
  }

  /**
   * Calculate dependencies for a migration based on what it references
   */
  private calculateDependencies(migration: MigrationFile, allMigrations: MigrationFile[]): string[] {
    const dependencies: string[] = [];
    
    // Find migrations that create tables/columns this migration references
    for (const other of allMigrations) {
      if (other.filename === migration.filename) continue;
      if (other.filename > migration.filename) continue; // Only depend on earlier migrations
      
      const otherAnalysis = this.sqlParser.analyzeMigration(other.content);
      
      // Check if this migration references something the other creates
      for (const reference of migration.references) {
        if (otherAnalysis.creates.includes(reference)) {
          dependencies.push(other.filename);
          break;
        }
      }
    }

    return dependencies;
  }

  /**
   * Validate that column references are valid
   */
  private validateColumnReferences(migrations: MigrationFile[], result: ValidationResult): void {
    const createdTables = new Set<string>();
    const createdColumns = new Map<string, Set<string>>();

    for (const migration of migrations.sort((a, b) => a.filename.localeCompare(b.filename))) {
      const analysis = this.sqlParser.analyzeMigration(migration.content);
      
      // Check references before adding creates
      for (const reference of analysis.references) {
        const [table, column] = reference.split('.');
        
        if (column && !createdColumns.get(table)?.has(column)) {
          result.warnings.push(
            `Migration ${migration.filename} references column ${reference} which may not exist yet`
          );
        } else if (!column && !createdTables.has(table)) {
          result.warnings.push(
            `Migration ${migration.filename} references table ${reference} which may not exist yet`
          );
        }
      }
      
      // Add creates for next iteration
      for (const create of analysis.creates) {
        if (create.includes('.')) {
          const [table, column] = create.split('.');
          if (!createdColumns.has(table)) {
            createdColumns.set(table, new Set());
          }
          createdColumns.get(table)!.add(column);
        } else {
          createdTables.add(create);
        }
      }
    }
  }

  /**
   * Validate table creation order
   */
  private validateTableCreationOrder(migrations: MigrationFile[], result: ValidationResult): void {
    // Check for common problematic patterns
    for (const migration of migrations) {
      const content = migration.content.toLowerCase();
      
      // Check for index creation on potentially missing columns
      if (content.includes('create index') && content.includes('project_id')) {
        const hasProjectTable = migration.content.toLowerCase().includes('create table') && 
                               migration.content.toLowerCase().includes('projects');
        const hasContentTable = migration.content.toLowerCase().includes('create table') && 
                               migration.content.toLowerCase().includes('content');
        
        if (!hasProjectTable || !hasContentTable) {
          result.warnings.push(
            `Migration ${migration.filename} creates indexes on project_id but may not create required tables first`
          );
        }
      }
    }
  }
}

/**
 * SQL Parser for extracting table/column information from migration files
 */
class SQLParser {
  /**
   * Analyze a migration file to extract creates and references
   */
  analyzeMigration(content: string): { creates: string[], references: string[] } {
    const creates: string[] = [];
    const references: string[] = [];

    // Normalize content
    const normalizedContent = content
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .toLowerCase();

    // Extract table creations
    const tableCreations = this.extractTableCreations(normalizedContent);
    creates.push(...tableCreations.tables);
    creates.push(...tableCreations.columns);

    // Extract index creations (these reference columns)
    const indexReferences = this.extractIndexReferences(normalizedContent);
    references.push(...indexReferences);

    // Extract foreign key references
    const fkReferences = this.extractForeignKeyReferences(normalizedContent);
    references.push(...fkReferences);

    // Extract column references in WHERE clauses, etc.
    const columnReferences = this.extractColumnReferences(normalizedContent);
    references.push(...columnReferences);

    return { creates, references };
  }

  private extractTableCreations(content: string): { tables: string[], columns: string[] } {
    const tables: string[] = [];
    const columns: string[] = [];

    // Match CREATE TABLE statements
    const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)\s*\(/gi;
    let match;

    while ((match = tableRegex.exec(content)) !== null) {
      const tableName = match[1];
      tables.push(tableName);

      // Extract columns for this table
      const tableStart = match.index + match[0].length;
      const tableEnd = this.findMatchingParen(content, tableStart - 1);
      const tableDefinition = content.substring(tableStart, tableEnd);

      const columnMatches = tableDefinition.match(/(\w+)\s+(?:varchar|text|integer|serial|boolean|timestamp|numeric|decimal)/gi);
      if (columnMatches) {
        for (const columnMatch of columnMatches) {
          const columnName = columnMatch.split(/\s+/)[0];
          columns.push(`${tableName}.${columnName}`);
        }
      }
    }

    return { tables, columns };
  }

  private extractIndexReferences(content: string): string[] {
    const references: string[] = [];

    // Match CREATE INDEX statements
    const indexRegex = /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?[\w_]+\s+on\s+(\w+)\s*\(\s*([^)]+)\s*\)/gi;
    let match;

    while ((match = indexRegex.exec(content)) !== null) {
      const tableName = match[1];
      const columnList = match[2];

      // Parse column list
      const columns = columnList.split(',').map(col => {
        const cleanCol = col.trim().split(/\s+/)[0]; // Remove ASC/DESC, etc.
        return `${tableName}.${cleanCol}`;
      });

      references.push(...columns);
    }

    return references;
  }

  private extractForeignKeyReferences(content: string): string[] {
    const references: string[] = [];

    // Match FOREIGN KEY constraints
    const fkRegex = /foreign\s+key\s*\(\s*(\w+)\s*\)\s+references\s+(\w+)\s*\(\s*(\w+)\s*\)/gi;
    let match;

    while ((match = fkRegex.exec(content)) !== null) {
      const referencedTable = match[2];
      const referencedColumn = match[3];
      references.push(`${referencedTable}.${referencedColumn}`);
    }

    return references;
  }

  private extractColumnReferences(content: string): string[] {
    const references: string[] = [];

    // Look for explicit column references like table.column
    const columnRefRegex = /(\w+)\.(\w+)/g;
    let match;

    while ((match = columnRefRegex.exec(content)) !== null) {
      const tableName = match[1];
      const columnName = match[2];
      
      // Skip common SQL keywords
      if (!['information_schema', 'pg_catalog', 'public'].includes(tableName)) {
        references.push(`${tableName}.${columnName}`);
      }
    }

    return references;
  }

  private findMatchingParen(content: string, startIndex: number): number {
    let depth = 1;
    let index = startIndex + 1;

    while (index < content.length && depth > 0) {
      if (content[index] === '(') depth++;
      else if (content[index] === ')') depth--;
      index++;
    }

    return index - 1;
  }
}