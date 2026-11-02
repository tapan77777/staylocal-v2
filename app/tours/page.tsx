import DiscoveryLanding from '@/components/DiscoveryLanding'
import { discoveryMetadata } from '@/lib/discovery-metadata'
export const dynamic = 'force-dynamic'
export const metadata = discoveryMetadata('Domestic tours & holidays in India', 'Explore Indian holiday packages, private tours and trips with your people. Clear itineraries, INR pricing and personal support from StayLocal.', '/tours', '/images/island-shore.jpg')
export default function ToursPage() { return <DiscoveryLanding kind="tours" /> }
