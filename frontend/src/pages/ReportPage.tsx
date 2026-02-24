import { useLocation, useNavigate } from 'react-router-dom'
import { RideReport } from '../components/ride-report'
import type { RideReport as RideReportType } from '../components/ride-report/types'
import type { RideInput } from '../components/ride-planner/types'
import { products as sampleProducts, shops, disclosure } from '../data/sample-products'

// Sample report data used until a real weather API is wired up
const sampleReport: RideReportType = {
  id: 'report-001',
  rideName: 'Lake Constance Loop',
  startLocation: 'Konstanz',
  ridingStyle: 'Touring',
  totalDistance: 180,
  distanceUnit: 'km',
  overallCondition: 'good',
  shareUrl: '',
  days: [
    {
      id: 'day-001',
      date: '2026-03-15',
      dayLabel: 'Day 1',
      location: 'Konstanz',
      condition: 'ideal',
      weather: {
        tempMin: 8,
        tempMax: 16,
        tempFeelsLike: 14,
        tempUnit: '°C',
        precipitation: 5,
        precipitationUnit: '%',
        windSpeed: 12,
        windUnit: 'km/h',
        windDirection: 'SW',
        humidity: 55,
        uvIndex: 4,
        sunrise: '06:42',
        sunset: '18:31',
        icon: 'sun',
        description: 'Sunny with light clouds in the afternoon',
      },
      clothingItems: [
        { id: 'c-001', name: 'Light Headband', icon: 'headband', reason: 'Protects ears and forehead from the cool riding wind in the morning at 8°C.' },
        { id: 'c-002', name: 'Sports Sunglasses', icon: 'sunglasses', reason: 'UV index 4 — protects your eyes from glare and insects.' },
        { id: 'c-003', name: 'Moisture-wicking Base Layer', icon: 'base-layer', reason: 'Moves sweat away from your skin to keep you dry.' },
        {
          id: 'c-004', name: 'Long-sleeve Cycling Jersey', icon: 'jersey-long',
          reason: 'Provides warmth at 8–16°C transitional temperatures without overheating.',
          alternatives: [{ id: 'c-004a', name: 'Short-sleeve Jersey + Arm Warmers', icon: 'arm-warmers' }],
        },
        {
          id: 'c-005', name: 'Light Wind Vest', icon: 'vest',
          reason: 'Keeps wind off your core, especially useful on descents.',
          alternatives: [{ id: 'c-005a', name: 'Packable Wind Jacket', icon: 'jacket' }],
        },
        {
          id: 'c-006', name: 'Long Padded Cycling Tights', icon: 'pants-long',
          reason: 'Padding for comfort over 60km, long legs against the morning chill.',
          alternatives: [{ id: 'c-006a', name: 'Short Bib Shorts + Leg Warmers', icon: 'leg-warmers' }],
        },
        { id: 'c-007', name: 'Light Cycling Gloves', icon: 'gloves-light', reason: 'Better grip and cushioning on the handlebars for longer rides.' },
        { id: 'c-008', name: 'Breathable Cycling Shoes', icon: 'shoes', reason: 'Good ventilation at sunny 16°C, stiff sole for efficient power transfer.' },
        { id: 'c-009', name: 'Thin Merino Socks', icon: 'socks', reason: 'Temperature regulation and odour neutrality for the whole stage.' },
      ],
      equipment: [
        { id: 'eq-001', name: 'Sunscreen SPF 30+', reason: 'UV index 4 — sun protection recommended for multi-hour rides' },
        { id: 'eq-002', name: 'Water Bottle 750ml', reason: 'Enough fluids at 16°C and 60km distance' },
        { id: 'eq-003', name: 'Bike Lights (front + rear)', reason: 'Sunset at 18:31 — needed if returning later' },
        { id: 'eq-004', name: 'Puncture Repair Kit', reason: 'Essential kit for any ride over 30km' },
      ],
    },
    {
      id: 'day-002',
      date: '2026-03-16',
      dayLabel: 'Day 2',
      location: 'Überlingen',
      condition: 'caution',
      weather: {
        tempMin: 5,
        tempMax: 11,
        tempFeelsLike: 7,
        tempUnit: '°C',
        precipitation: 65,
        precipitationUnit: '%',
        windSpeed: 28,
        windUnit: 'km/h',
        windDirection: 'NW',
        humidity: 82,
        uvIndex: 1,
        sunrise: '06:40',
        sunset: '18:32',
        icon: 'rain',
        description: 'Rain showers from midday, gusty wind from the northwest',
      },
      clothingItems: [
        { id: 'c-010', name: 'Waterproof Helmet Cover', icon: 'helmet-cover', reason: 'Keeps your head dry and warm at 65% chance of rain.' },
        { id: 'c-011', name: 'Clear Cycling Glasses', icon: 'glasses', reason: 'Protects eyes from spray and raindrops.' },
        { id: 'c-012', name: 'Merino Base Layer', icon: 'base-layer', reason: 'Insulates even when wet and regulates body heat at 5–11°C.' },
        { id: 'c-013', name: 'Thermal Long-sleeve Jersey', icon: 'jersey-long', reason: 'Insulating mid-layer against the 7°C feels-like temperature.' },
        { id: 'c-014', name: 'Waterproof Cycling Jacket', icon: 'rain-jacket', reason: 'Essential at 65% rain — sealed seams keep you dry.' },
        {
          id: 'c-015', name: 'Thermal Cycling Tights', icon: 'pants-long',
          reason: 'Warm legs at 5°C minimum, wind-resistant on open stretches.',
          alternatives: [{ id: 'c-015a', name: 'Long Cycling Tights + Leg Warmers', icon: 'leg-warmers' }],
        },
        { id: 'c-016', name: 'Waterproof Overpants', icon: 'overpants', reason: 'Additional rain protection for your legs in heavy showers.' },
        { id: 'c-017', name: 'Waterproof Winter Gloves', icon: 'gloves-waterproof', reason: 'Wet hands + 28 km/h wind = rapid heat loss. Waterproof is a must.' },
        { id: 'c-018', name: 'Waterproof Overshoes', icon: 'shoe-covers', reason: 'Keeps feet dry and warm in rain and puddles.' },
        { id: 'c-019', name: 'Warm Merino Socks', icon: 'socks', reason: 'Stays warm even when damp and prevents cold feet all day.' },
      ],
      equipment: [
        { id: 'eq-005', name: 'Packable Rain Poncho', reason: '65% chance of precipitation — extra rain protection as backup' },
        { id: 'eq-006', name: 'Mudguards', reason: 'Wet roads — spray protection for rider and gear' },
        { id: 'eq-007', name: 'Water Bottle 750ml', reason: 'Stay hydrated even in cool weather' },
        { id: 'eq-008', name: 'Bike Lights (front + rear)', reason: 'Poor visibility in rain — keep them on throughout' },
        { id: 'eq-009', name: 'Puncture Repair Kit', reason: 'Essential kit for any ride over 30km' },
        { id: 'eq-010', name: 'Dry Bag for Valuables', reason: 'Protect phone and wallet in heavy rain' },
      ],
    },
    {
      id: 'day-003',
      date: '2026-03-17',
      dayLabel: 'Day 3',
      location: 'Friedrichshafen',
      condition: 'good',
      weather: {
        tempMin: 6,
        tempMax: 13,
        tempFeelsLike: 11,
        tempUnit: '°C',
        precipitation: 15,
        precipitationUnit: '%',
        windSpeed: 8,
        windUnit: 'km/h',
        windDirection: 'E',
        humidity: 62,
        uvIndex: 3,
        sunrise: '06:38',
        sunset: '18:34',
        icon: 'cloud-sun',
        description: 'Partly cloudy, dry, light wind',
      },
      clothingItems: [
        { id: 'c-020', name: 'Light Headband', icon: 'headband', reason: 'Keeps ears warm for the cool morning start at 6°C.' },
        { id: 'c-021', name: 'Moisture-wicking Base Layer', icon: 'base-layer', reason: 'Moisture transport as a foundation for changeable weather.' },
        {
          id: 'c-022', name: 'Long-sleeve Cycling Jersey', icon: 'jersey-long',
          reason: 'Good warmth at 6–13°C, can be rolled up flexibly.',
          alternatives: [{ id: 'c-022a', name: 'Short-sleeve Jersey + Arm Warmers', icon: 'arm-warmers' }],
        },
        {
          id: 'c-023', name: 'Packable Wind Jacket', icon: 'jacket',
          reason: 'Light wind protection to carry along — quick on and off.',
          alternatives: [{ id: 'c-023a', name: 'Light Wind Vest', icon: 'vest' }],
        },
        {
          id: 'c-024', name: 'Long Padded Cycling Tights', icon: 'pants-long',
          reason: 'Final day — padding for tired legs, long cut against the chill.',
          alternatives: [{ id: 'c-024a', name: 'Short Bib Shorts + Leg Warmers', icon: 'leg-warmers' }],
        },
        { id: 'c-025', name: 'Light Cycling Gloves', icon: 'gloves-light', reason: 'Light protection at 8 km/h wind, good grip on the handlebars.' },
        { id: 'c-026', name: 'Breathable Cycling Shoes', icon: 'shoes', reason: 'Dry weather expected — use the ventilation for comfort.' },
        { id: 'c-027', name: 'Mid-weight Socks', icon: 'socks', reason: 'A bit warmer than thin at 6°C start, without overheating in the afternoon.' },
      ],
      equipment: [
        { id: 'eq-011', name: 'Water Bottle 750ml', reason: 'Stay hydrated even in cooler temperatures' },
        { id: 'eq-012', name: 'Puncture Repair Kit', reason: 'Essential kit for any ride over 30km' },
        { id: 'eq-013', name: 'Energy Bars', reason: 'Final day — energy reserves for the return to Konstanz' },
      ],
    },
  ],
}

/** Build a basic report from ride input, overlaying sample data */
function buildReportFromInput(input: RideInput): RideReportType {
  const bikeLabels: Record<string, string> = {
    rennrad: 'Road bike',
    gravel: 'Gravel',
    mtb: 'MTB',
    city: 'City',
  }
  const intensityLabels: Record<string, string> = {
    gemuetlich: 'Relaxed',
    moderat: 'Moderate',
    sportlich: 'Sporty',
  }

  return {
    ...sampleReport,
    rideName: `${input.location?.address ?? 'Unknown'} Ride`,
    startLocation: input.location?.address ?? 'Unknown',
    ridingStyle: `${bikeLabels[input.bikeType] ?? input.bikeType} · ${intensityLabels[input.intensity] ?? input.intensity}`,
    totalDistance: input.distanceKm ?? sampleReport.totalDistance,
    days: input.isMultiDay && input.dayStops.length > 0
      ? sampleReport.days.slice(0, input.dayStops.length + 1)
      : [sampleReport.days[0]],
  }
}

export default function ReportPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const rideInput = (location.state as { rideInput?: RideInput } | null)?.rideInput

  // If no ride input, show a message with link back to planner
  if (!rideInput) {
    return (
      <div className="text-center py-20">
        <h1
          className="text-2xl font-semibold text-stone-800 dark:text-stone-200"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          No ride data
        </h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">
          Plan a ride first to see your weather report.
        </p>
        <button
          onClick={() => navigate('/planner')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          Go to Planner
        </button>
      </div>
    )
  }

  const report = buildReportFromInput(rideInput)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: report.rideName, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
  }

  const handleSaveRoute = () => {
    // TODO: Implement save route (requires auth / My Routes)
  }

  const handleSwapClothingItem = (_dayId: string, _itemId: string, _alternativeId: string) => {
    // TODO: Implement swap logic — replace item in report state
  }

  const handleProductClick = (productId: string) => {
    const product = sampleProducts.find((p) => p.id === productId)
    if (product) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <RideReport
      report={report}
      onShare={handleShare}
      onSaveRoute={handleSaveRoute}
      onSwapClothingItem={handleSwapClothingItem}
      products={sampleProducts}
      shops={shops}
      disclosure={disclosure}
      onProductClick={handleProductClick}
    />
  )
}
