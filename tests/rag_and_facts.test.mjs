import test from 'node:test';
import assert from 'node:assert/strict';
import { RAGManager } from '../lib/rag/RAGManager.ts';
import { XAIVON_APPROVED_FACTS } from '../lib/knowledge/XAIVON_APPROVED_FACTS.ts';
import { knowledgeBase } from '../lib/knowledge-base.ts';

test('XAIVON Approved Facts - Core Business Identity', () => {
  assert.equal(XAIVON_APPROVED_FACTS.brandName, 'XAIVON');
  assert.equal(XAIVON_APPROVED_FACTS.legalEntity, 'ADABHRA GROUP');
  assert.equal(XAIVON_APPROVED_FACTS.founder, 'Raja Babu');
  assert.equal(XAIVON_APPROVED_FACTS.founderTitle, 'Founder & CEO');
  assert.equal(XAIVON_APPROVED_FACTS.email, 'raja@xaivon.com');
  assert.equal(XAIVON_APPROVED_FACTS.phone, '+91-95211-90205');
  assert.ok(XAIVON_APPROVED_FACTS.geographiesServed.includes('India'));
  assert.ok(XAIVON_APPROVED_FACTS.geographiesServed.includes('United States'));
});

test('Fact Reconciliation - All 6 categories and verified starting tiers', () => {
  assert.equal(XAIVON_APPROVED_FACTS.services.length, 6, 'Must contain all 6 service categories from xaivon.com');

  // Verify all categories and their starting tiers
  const categories = XAIVON_APPROVED_FACTS.services.map(s => s.category);
  assert.ok(categories.includes('Workflow & Automation'));
  assert.ok(categories.includes('AI Agents'));
  assert.ok(categories.includes('Voice AI'));
  assert.ok(categories.includes('Chatbot & Customer Support'));
  assert.ok(categories.includes('CRM, Lead & Data Automation'));
  assert.ok(categories.includes('Document & Business Process Automation'));

  for (const s of XAIVON_APPROVED_FACTS.services) {
    assert.ok(s.startingTiers.length >= 3, `Service ${s.id} must have Starter, Plus, and Premium tiers`);
    assert.ok(s.startingTiers[0].price.USD.startsWith('$'), 'Tier must define USD price');
    assert.ok(s.startingTiers[0].price.INR.startsWith('₹'), 'Tier must define INR price');
  }

  // Ensure knowledgeBase JSON company matches approved facts
  assert.equal(knowledgeBase.company.name, XAIVON_APPROVED_FACTS.brandName);
  assert.equal(knowledgeBase.company.founder, XAIVON_APPROVED_FACTS.founder);
  assert.equal(knowledgeBase.company.email, XAIVON_APPROVED_FACTS.email);
});

test('RAG Manager - Deterministic Keyword and Context Retrieval', async () => {
  const rag = RAGManager.getInstance();

  // Test 1: Querying logistics automation
  const logisticsResults = await rag.retrieveContext('What do you offer for freight dispatch automation?', 3, 0.1);
  assert.ok(logisticsResults.length > 0, 'Should return matching logistics context');
  assert.ok(
    logisticsResults.some(r => r.text.toLowerCase().includes('logistics') || r.text.toLowerCase().includes('dispatch')),
    'Results must include logistics and dispatch keywords'
  );

  // Test 2: Querying founder & company identity
  const companyResults = await rag.retrieveContext('Who founded XAIVON and who is the CEO?', 3, 0.1);
  assert.ok(companyResults.length > 0, 'Should return company facts');
  assert.ok(
    companyResults.some(r => r.text.includes('Raja Babu') && r.text.includes('ADABHRA GROUP')),
    'Results must include verified founder and legal entity'
  );

  // Test 3: Querying pricing philosophy
  const pricingResults = await rag.retrieveContext('How much does XAIVON cost or price automation?', 3, 0.1);
  assert.ok(pricingResults.length > 0, 'Should return pricing guidance');
  assert.ok(
    pricingResults.some(r => r.text.toLowerCase().includes('pricing') || r.text.toLowerCase().includes('scope')),
    'Results must reflect scoped pricing guidance'
  );

  // Test 4: Empty query should return empty array without errors
  const emptyResults = await rag.retrieveContext('', 3, 0.1);
  assert.deepEqual(emptyResults, []);
});
