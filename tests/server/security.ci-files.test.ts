import fs from 'fs';
import path from 'path';

describe('security CI configuration presence', () => {
  const root = path.resolve(__dirname, '..', '..');
  const wfDir = path.join(root, '.github', 'workflows');

  it('has CodeQL workflow configured', () => {
    const p = path.join(wfDir, 'codeql.yml');
    expect(fs.existsSync(p)).toBe(true);
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toMatch(/codeql-action\/init/);
  });

  it('has Dependency Review workflow configured', () => {
    const p = path.join(wfDir, 'dependency-review.yml');
    expect(fs.existsSync(p)).toBe(true);
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toMatch(/dependency-review-action/);
  });

  it('has OWASP ZAP DAST baseline workflow configured with rules', () => {
    const p = path.join(wfDir, 'zap-dast.yml');
    expect(fs.existsSync(p)).toBe(true);
    const rules = path.join(root, '.zap', 'rules.tsv');
    expect(fs.existsSync(rules)).toBe(true);
  });
});


