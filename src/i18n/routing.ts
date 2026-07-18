import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['de', 'en'] as const,
  defaultLocale: 'de',
  // D1: 'de' ohne Präfix (Default), 'en' erhält /en/... Präfix
  localePrefix: 'as-needed',
  // SEO: keine automatische Umleitung anhand Accept-Language/Cookie.
  // Googlebot crawlt mit en-US und würde sonst von allen DE-URLs
  // auf /en/... umgeleitet — DE-Seiten wären nicht indexierbar.
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]
