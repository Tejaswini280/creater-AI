#!/usr/bin/env node

/**
 * Comprehensive Backend Integration Test
 * Tests all major components' connectivity to backend and database
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3,
  user: {