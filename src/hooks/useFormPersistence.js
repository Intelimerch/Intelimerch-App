// src/hooks/useFormPersistence.js
import { useState, useEffect, useCallback } from 'react'

/**
 * Persists form state to sessionStorage so it survives refresh,
 * but clears when the tab is closed.
 * 
 * @param {string} storageKey - Unique key to identify this form
 * @param {object} initialData - Default form data
 * @returns {[object, function, function]} - [formData, setFormData, clearSavedForm]
 */
export function useFormPersistence(storageKey, initialData) {
  const [formData, setFormDataState] = useState(() => {
    // Try to load from sessionStorage (survives refresh, but not new tabs)
    try {
      const saved = sessionStorage.getItem(`form_${storageKey}`)
      if (saved) {
        return { ...initialData, ...JSON.parse(saved) }
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
    setFormDataState(prev => {
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