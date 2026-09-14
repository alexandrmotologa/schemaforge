import { SchemaState } from '../engine/types';
import { ecommerceSample } from './ecommerce';
import { saasAuthSample } from './saasAuth';
import { fintechSample } from './fintech';

export interface SampleDefinition {
  id: string;
  name: string;
  description: string;
  tableCount: number;
  data: SchemaState;
}

export const SAMPLES: SampleDefinition[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce Platform',
    description: 'Relational store architecture with orders, products, inventory, payments, and reviews.',
    tableCount: ecommerceSample.tables.length,
    data: ecommerceSample,
  },
  {
    id: 'saas_auth',
    name: 'Multi-Tenant SaaS RBAC',
    description: 'B2B organization tenancy, role-based access control, permissions, and audit trails.',
    tableCount: saasAuthSample.tables.length,
    data: saasAuthSample,
  },
  {
    id: 'fintech',
    name: 'Double-Entry Ledger',
    description: 'Financial accounting engine with transactional ledger entries and multi-currency accounts.',
    tableCount: fintechSample.tables.length,
    data: fintechSample,
  },
];
