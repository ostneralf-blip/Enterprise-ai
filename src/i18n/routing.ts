import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['de', 'en'] as const,
  defaultLocale: 'de',
  // D1: 'de' ohne Präfix (Default), 'en' erhält /en/... Präfix
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
