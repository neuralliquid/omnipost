/**
 * Platform Adapters Index
 * Exports all platform adapters for engagement automation
 */

export { BasePlatformAdapter, type BaseAdapterConfig } from './base-adapter';
export { TwitterAdapter, getTwitterAdapter } from './twitter';
export { FacebookAdapter, getFacebookAdapter } from './facebook';
