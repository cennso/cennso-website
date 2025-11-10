/**
 * LocalBusiness Schema Generator
 *
 * Generates Schema.org LocalBusiness structured data for location-based search.
 * Used on contact page for local search results and Google Maps integration.
 */

import type {
  LocalBusinessSchema,
  PostalAddress,
  GeoCoordinates,
  ContactPoint,
} from './types'
import { toAbsoluteUrl } from './utils'

export interface LocalBusinessData {
  name: string
  telephone: string
  address: {
    streetAddress: string
    addressLocality: string
    addressRegion?: string
    postalCode: string
    addressCountry: string
  }
  geo?: {
    latitude: number
    longitude: number
  }
  openingHours?: string[]
  email?: string
  image?: string
}

/**
 * Generates LocalBusiness schema for company location
 * @param data - Local business data from contact-page.yaml
 * @returns LocalBusinessSchema object for JSON-LD embedding
 */
export function generateLocalBusinessSchema(
  data: LocalBusinessData
): LocalBusinessSchema {
  const postalAddress: PostalAddress = {
    '@type': 'PostalAddress',
    streetAddress: data.address.streetAddress,
    addressLocality: data.address.addressLocality,
    postalCode: data.address.postalCode,
    addressCountry: data.address.addressCountry,
  }

  if (data.address.addressRegion) {
    postalAddress.addressRegion = data.address.addressRegion
  }

  const schema: LocalBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name,
    url: toAbsoluteUrl('/'),
    logo: toAbsoluteUrl('/assets/logo.png'),
    telephone: data.telephone,
    address: postalAddress,
  }

  // Add optional properties
  if (data.geo) {
    const geoCoordinates: GeoCoordinates = {
      '@type': 'GeoCoordinates',
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    }
    schema.geo = geoCoordinates
  }

  if (data.openingHours && data.openingHours.length > 0) {
    schema.openingHours = data.openingHours
  }

  if (data.image) {
    schema.image = toAbsoluteUrl(data.image)
  }

  // Add contact point with email if provided
  if (data.email) {
    const contactPoint: ContactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: data.telephone,
      email: data.email,
    }
    schema.contactPoint = contactPoint
  }

  schema.description =
    'Mobile core network solutions provider specializing in cloud-native telecommunications infrastructure and rapid deployment services.'

  // Add same social links as Organization
  schema.sameAs = [
    'https://www.linkedin.com/company/cennso',
    'https://github.com/cennso',
  ]

  return schema
}
