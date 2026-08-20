import { useLocation } from 'react-router-dom'

// Reads the perk passed from PerksLanding via router state.
// Returns the raw backend perk document or null when not provided.
export default function usePerk() {
  return useLocation().state?.perk || null
}

// Resolve the current perk's display values, falling back to provided defaults.
export function perkValues(perk, defaults = {}) {
  const contentType = (perk?.contentType || '').toLowerCase()
  return {
    name: perk?.perkName || defaults.name || 'Exclusive Perk',
    description: perk?.description || defaults.description || 'Exclusive content unlocked for this piece.',
    url: perk?.fileUrl || null,
    contentType,
  }
}
