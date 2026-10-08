// src/hooks/useFormPersistence.js
import { useState, useEffect, useCallback } from 'react'

/**
 * Persists form state to sessionStorage so it survives refresh,
 * but clears when the tab is closed.
 *
 * Handles objects and arrays. Objects are merged with defaults;
 * arrays are returned as-is (they don't have meaningful "defaults to merge").
 *
 * @param {string} storageKey - Unique key to identify this form
 * @param {object|array} initialData - Default form data
 * @returns {[object|array, function, function, function]} - [formData, setFormData, clearSavedForm, hasSavedData]
 */
export function useFormPersistence(storageKey, initialData) {
  const [formData, setFormDataState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`form_${storageKey}`)
      if (saved) {
        const parsed = JSON.parse(saved)

        // Arrays: return as-is (no spread — spreading arrays gives an object
        // with numeric keys, which breaks .map and other array methods)
        if (Array.isArray(initialData)) {
          return Array.isArray(parsed) ? parsed : initialData
        }

        // Plain objects: merge defaults with saved so new fields get defaults
        if (
          initialData &&
          typeof initialData === 'object' &&
          !Array.isArray(initialData)
        ) {
          return { ...initialData, ...parsed }
        }

        // Primitives (string, number, boolean): return saved directly
        return parsed
      }
    } catch (err) {
      console.error(`Failed to load saved form for "${storageKey}":`, err)
    }
    return initialData
  })

  // Save to sessionStorage whenever formData changes
  useEffect(() => {
    try {
      sessionStorage.setItem(`form_${storageKey}`, JSON.stringify(formData))
    } catch (err) {
      console.error(`Failed to save form for "${storageKey}":`, err)
    }
  }, [storageKey, formData])

  // Set form data (supports both direct value and updater function)
  const setFormData = useCallback((updater) => {
    setFormDataState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }, [])

  // Clear saved data (call after successful submission)
  const clearSavedForm = useCallback(() => {
    try {
      sessionStorage.removeItem(`form_${storageKey}`)
      setFormDataState(initialData)
    } catch (err) {
      console.error(`Failed to clear saved form for "${storageKey}":`, err)
    }
  }, [storageKey, initialData])

  // Check if there's saved data (useful for showing "Resume" or "Continue" buttons)
  const hasSavedData = useCallback(() => {
    try {
      return sessionStorage.getItem(`form_${storageKey}`) !== null
    } catch {
      return false
    }
  }, [storageKey])

  return [formData, setFormData, clearSavedForm, hasSavedData]
}