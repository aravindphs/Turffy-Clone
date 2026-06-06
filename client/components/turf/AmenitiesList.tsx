import { TurfAmenity } from '@/types'
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import WcIcon from '@mui/icons-material/Wc'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import CoffeeIcon from '@mui/icons-material/Coffee'
import SportsIcon from '@mui/icons-material/Sports'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import WifiIcon from '@mui/icons-material/Wifi'
import SecurityIcon from '@mui/icons-material/Security'
import SchoolIcon from '@mui/icons-material/School'
import CheckroomIcon from '@mui/icons-material/Checkroom'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const amenityConfig: Record<TurfAmenity, { label: string; icon: React.ReactNode }> = {
  parking: { label: 'Parking', icon: <LocalParkingIcon fontSize="small" /> },
  changing_room: { label: 'Changing Room', icon: <CheckroomIcon fontSize="small" /> },
  washroom: { label: 'Washroom', icon: <WcIcon fontSize="small" /> },
  floodlight: { label: 'Floodlight', icon: <LightbulbIcon fontSize="small" /> },
  drinking_water: { label: 'Drinking Water', icon: <WaterDropIcon fontSize="small" /> },
  first_aid: { label: 'First Aid', icon: <LocalHospitalIcon fontSize="small" /> },
  cafeteria: { label: 'Cafeteria', icon: <CoffeeIcon fontSize="small" /> },
  equipment_rental: { label: 'Equipment Rental', icon: <SportsIcon fontSize="small" /> },
  ac: { label: 'Air Conditioning', icon: <AcUnitIcon fontSize="small" /> },
  wifi: { label: 'WiFi', icon: <WifiIcon fontSize="small" /> },
  security: { label: 'Security', icon: <SecurityIcon fontSize="small" /> },
  coaching: { label: 'Coaching', icon: <SchoolIcon fontSize="small" /> },
}

interface AmenitiesListProps {
  amenities: TurfAmenity[]
}

export function AmenitiesList({ amenities }: AmenitiesListProps) {
  if (amenities.length === 0) {
    return <p className="text-sm text-slate-500">No amenities listed.</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {amenities.map((amenity) => {
        const config = amenityConfig[amenity]
        if (!config) return null
        return (
          <div
            key={amenity}
            className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div className="text-brand-600">{config.icon}</div>
            <span className="text-sm text-slate-700 font-medium">{config.label}</span>
          </div>
        )
      })}
    </div>
  )
}
